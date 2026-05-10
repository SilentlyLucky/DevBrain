'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'


export async function createFolder(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const name  = (formData.get('name') as string).trim()
  const color = (formData.get('color') as string) || '#3B82F6'
  if (!name) throw new Error('Folder name is required')

  const { error } = await supabase.from('folders').insert({ user_id: user.id, name, color })
  if (error) throw error
  revalidatePath('/knowledge')
}


export async function renameFolder(id: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('folders')
    .update({ name: name.trim() })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/knowledge')
}


export async function deleteFolder(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/knowledge')
}


export async function addDocumentToFolder(documentId: string, folderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('document_folders')
    .upsert({ document_id: documentId, folder_id: folderId }, { onConflict: 'document_id,folder_id' })
  if (error) throw error
  revalidatePath('/knowledge')
}


export async function removeDocumentFromFolder(documentId: string, folderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('document_folders')
    .delete()
    .eq('document_id', documentId)
    .eq('folder_id', folderId)
  if (error) throw error
  revalidatePath('/knowledge')
}


export async function setDocumentFolders(documentId: string, folderIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase.from('document_folders').delete().eq('document_id', documentId)

  if (folderIds.length > 0) {
    const rows = folderIds.map(fid => ({ document_id: documentId, folder_id: fid }))
    const { error } = await supabase.from('document_folders').insert(rows)
    if (error) throw error
  }
  revalidatePath('/knowledge')
}
