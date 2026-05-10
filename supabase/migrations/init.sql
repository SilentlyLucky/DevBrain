CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email      text NOT NULL,
  name       text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.documents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title          text NOT NULL,
  content        text NOT NULL DEFAULT '',
  source_type    text NOT NULL CHECK (source_type IN ('PDF', 'URL', 'FILE')),
  file_url       text,
  file_extension text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own documents" ON public.documents;
CREATE POLICY "Users can manage their own documents"
  ON public.documents FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS documents_user_id_idx ON public.documents (user_id);

CREATE TABLE IF NOT EXISTS public.schedules (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  document_id      uuid REFERENCES public.documents (id) ON DELETE SET NULL,
  document_ids     uuid[] NOT NULL DEFAULT '{}',
  title            text NOT NULL,
  description      text,
  start_time       timestamptz NOT NULL,
  end_time         timestamptz NOT NULL,
  status           text NOT NULL DEFAULT 'Upcoming'
                     CHECK (status IN ('Upcoming', 'Completed', 'Missed')),
  gcal_event_id    text,
  reminder_minutes integer, 
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own schedules" ON public.schedules;
CREATE POLICY "Users can manage their own schedules"
  ON public.schedules FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS schedules_user_id_idx   ON public.schedules (user_id);
CREATE INDEX IF NOT EXISTS schedules_start_time_idx ON public.schedules (start_time);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('user', 'assistant')),
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own chat messages" ON public.chat_messages;
CREATE POLICY "Users can manage their own chat messages"
  ON public.chat_messages FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx    ON public.chat_messages (user_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON public.chat_messages (created_at);

CREATE TABLE IF NOT EXISTS public.document_chunks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents (id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  content     text NOT NULL,
  embedding   vector(768),
  fts         tsvector GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their chunks" ON public.document_chunks;
CREATE POLICY "Users own their chunks"
  ON public.document_chunks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON public.document_chunks USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS document_chunks_fts_idx
  ON public.document_chunks USING gin (fts);

CREATE INDEX IF NOT EXISTS document_chunks_user_doc_idx
  ON public.document_chunks (user_id, document_id);

CREATE TABLE IF NOT EXISTS public.folders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  color      text NOT NULL DEFAULT '#3B82F6',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own folders" ON public.folders;
CREATE POLICY "Users manage own folders"
  ON public.folders FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.document_folders (
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  folder_id   uuid NOT NULL REFERENCES public.folders(id)   ON DELETE CASCADE,
  PRIMARY KEY (document_id, folder_id)
);

ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own document_folders" ON public.document_folders;
CREATE POLICY "Users manage own document_folders"
  ON public.document_folders FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.folders f
            WHERE f.id = folder_id AND f.user_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION match_chunks_hybrid(
  query_embedding vector(768),
  query_text      text,
  match_user_id   uuid,
  match_count     int DEFAULT 5,
  rrf_k           int DEFAULT 60
)
RETURNS TABLE (content text, document_title text, rrf_score double precision)
LANGUAGE sql AS $$
  WITH semantic AS (
    SELECT dc.id, dc.content, dc.document_id,
           ROW_NUMBER() OVER (ORDER BY dc.embedding <=> query_embedding) AS rank
    FROM document_chunks dc
    WHERE dc.user_id = match_user_id
      AND dc.embedding IS NOT NULL
    LIMIT 20
  ),
  keyword AS (
    SELECT dc.id, dc.content, dc.document_id,
           ROW_NUMBER() OVER (
             ORDER BY ts_rank(dc.fts, plainto_tsquery('simple', query_text)) DESC
           ) AS rank
    FROM document_chunks dc
    WHERE dc.user_id = match_user_id
      AND dc.fts @@ plainto_tsquery('simple', query_text)
    LIMIT 20
  ),
  fused AS (
    SELECT
      COALESCE(s.id, k.id)                   AS id,
      COALESCE(s.content, k.content)         AS content,
      COALESCE(s.document_id, k.document_id) AS document_id,
      (COALESCE(1.0 / (rrf_k + s.rank), 0) +
       COALESCE(1.0 / (rrf_k + k.rank), 0))  AS rrf_score
    FROM semantic s
    FULL OUTER JOIN keyword k USING (id)
  )
  SELECT f.content, d.title AS document_title, f.rrf_score
  FROM fused f
  JOIN documents d ON d.id = f.document_id AND d.user_id = match_user_id
  ORDER BY f.rrf_score DESC
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION match_chunks_hybrid(vector, text, uuid, int, int) TO authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own documents" ON storage.objects;
CREATE POLICY "Users upload own documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users read own documents" ON storage.objects;
CREATE POLICY "Users read own documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete own documents" ON storage.objects;
CREATE POLICY "Users delete own documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;