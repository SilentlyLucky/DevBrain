'use server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { chunkText } from '@/lib/chunker'
import { embedChunks } from '@/lib/embeddings'
import type { SupabaseClient } from '@supabase/supabase-js'

async function indexDocumentChunks(
  supabase: SupabaseClient,
  documentId: string,
  userId: string,
  content: string,
): Promise<void> {
  const chunks = chunkText(content)
  if (chunks.length === 0) return

  const embeddings = await embedChunks(chunks)
  if (embeddings.length !== chunks.length) {
    throw new Error(`Embedding count mismatch: expected ${chunks.length}, got ${embeddings.length}`)
  }

  await supabase.from('document_chunks').delete().eq('document_id', documentId)

  const { error } = await supabase.from('document_chunks').insert(
    chunks.map((c, i) => ({
      document_id: documentId,
      user_id: userId,
      chunk_index: i,
      content: c,
      embedding: embeddings[i],
    }))
  )
  if (error) throw new Error(`DB insert failed: ${error.message} (code: ${error.code})`)
}

const DocumentSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  source_type: z.enum(['PDF', 'URL', 'FILE']),
  file_url: z.string().optional(),
  file_extension: z.string().optional(),
})

export async function saveDocument(formData: FormData): Promise<{ id: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const parsed = DocumentSchema.parse({
    title: formData.get('title'),
    content: formData.get('content'),
    source_type: formData.get('source_type'),
    file_url: formData.get('file_url') ?? undefined,
    file_extension: formData.get('file_extension') ?? undefined,
  })

  const { count } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('title', parsed.title)

  if (count && count > 0) {
    throw new Error(`DUPLICATE: A document named "${parsed.title}" already exists.`)
  }

  const { data: doc, error } = await supabase
    .from('documents')
    .insert({ ...parsed, user_id: user.id })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  if (!doc) throw new Error('Document insert returned no row')

  indexDocumentChunks(supabase, doc.id, user.id, parsed.content).catch(err =>
    console.error('[rag] indexing failed:', err)
  )

  revalidatePath('/knowledge')
  return { id: doc.id }
}

export async function deleteDocument(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { data: doc } = await supabase
    .from('documents')
    .select('file_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  await supabase.from('documents').delete().eq('id', id).eq('user_id', user.id)

  if (doc?.file_url) {
    await supabase.storage.from('documents').remove([doc.file_url])
  }

  revalidatePath('/knowledge')
}

const UpdateDocumentTitleSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
})

export async function updateDocumentTitle(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const parsed = UpdateDocumentTitleSchema.parse({
    id: formData.get('id'),
    title: formData.get('title'),
  })

  const { error } = await supabase
    .from('documents')
    .update({ title: parsed.title })
    .eq('id', parsed.id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/knowledge')
}

export async function getDocumentSignedUrl(docId: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { data: doc } = await supabase
    .from('documents')
    .select('file_url')
    .eq('id', docId)
    .eq('user_id', user.id)
    .single()

  if (!doc?.file_url) throw new Error('No file found')

  const { data } = await supabase.storage
    .from('documents')
    .createSignedUrl(doc.file_url, 3600)

  if (!data?.signedUrl) throw new Error('Failed to generate signed URL')
  return data.signedUrl
}

export async function fetchDocumentContent(id: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('documents')
    .select('content')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  return data?.content ?? null
}
