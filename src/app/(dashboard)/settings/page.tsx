import { createClient } from '@/lib/supabase/server'
import { SettingsClientSection } from '@/components/settings/SettingsClientSection'
import { formatDateLong } from '@/lib/utils'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <SettingsClientSection
      name={user.user_metadata?.full_name ?? 'User'}
      email={user.email ?? ''}
      memberSince={formatDateLong(user.created_at)}
      avatarUrl={user.user_metadata?.avatar_url ?? null}
    />
  )
}
