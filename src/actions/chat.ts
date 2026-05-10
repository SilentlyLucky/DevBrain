'use server'
import { createClient } from '@/lib/supabase/server'

const MAX_MESSAGES = 50

export async function saveChatMessage(role: 'user' | 'assistant', content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { count } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (count && count >= MAX_MESSAGES) {
    const toDelete = count - MAX_MESSAGES + 1
    const { data: oldest } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(toDelete)
    if (oldest?.length) {
      await supabase.from('chat_messages').delete().in('id', oldest.map(m => m.id))
    }
  }

  await supabase.from('chat_messages').insert({ user_id: user.id, role, content })
}

export async function deleteChatMessage(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  await supabase.from('chat_messages').delete().eq('id', id).eq('user_id', user.id)
}

export async function deleteChatHistory() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  await supabase.from('chat_messages').delete().eq('user_id', user.id)
}
