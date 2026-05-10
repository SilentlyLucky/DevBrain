import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { embedQuery } from '@/lib/embeddings'
import type { Document, Folder, Schedule, ChatMessage } from '@/types'

export const getDocuments = cache(async (): Promise<Document[]> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('documents')
    .select('id, user_id, title, source_type, file_extension, file_url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  return (data as Document[]) ?? []
})

export async function getDocumentById(id: string): Promise<Document | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  return (data as Document) ?? null
}

export const getSchedules = cache(async (): Promise<Schedule[]> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: true })
  return (data as Schedule[]) ?? []
})

export const getChatMessages = cache(async (): Promise<ChatMessage[]> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(50)
  return (data as ChatMessage[]) ?? []
})

export type RelevantChunk = {
  content: string
  document_title: string
  rrf_score: number
}

export async function retrieveRelevantChunks(
  query: string,
  matchCount = 15,
): Promise<RelevantChunk[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let embedding: number[]
  try {
    embedding = await embedQuery(query)
  } catch (err) {
    console.error('[rag] embedQuery failed', err)
    return []
  }

  const { data, error } = await supabase.rpc('match_chunks_hybrid', {
    query_embedding: embedding,
    query_text: query,
    match_user_id: user.id,
    match_count: matchCount,
    rrf_k: 60,
  })

  if (error) {
    console.error('[rag] match_chunks_hybrid error', error)
    return []
  }

  return (data as RelevantChunk[]) ?? []
}

export const getFolders = cache(async (): Promise<Folder[]> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  return (data as Folder[]) ?? []
})

export const getDocumentsWithFolders = cache(async (): Promise<Document[]> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: docs } = await supabase
    .from('documents')
    .select('id, user_id, title, source_type, file_extension, file_url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!docs || docs.length === 0) return []

  const docIds = docs.map(d => d.id)
  const { data: memberships } = await supabase
    .from('document_folders')
    .select('document_id, folders(id, user_id, name, color, created_at)')
    .in('document_id', docIds)

  type MembershipRow = { document_id: string; folders: Folder | Folder[] | null }
  const folderMap = new Map<string, Folder[]>()
  for (const m of ((memberships ?? []) as MembershipRow[])) {
    if (!m.folders) continue
    const folder = Array.isArray(m.folders) ? m.folders[0] : m.folders
    if (!folder) continue
    if (!folderMap.has(m.document_id)) folderMap.set(m.document_id, [])
    folderMap.get(m.document_id)!.push(folder)
  }

  return docs.map(d => ({ ...d, folders: folderMap.get(d.id) ?? [] })) as Document[]
})
