import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { AiWidget } from '@/components/ai-widget/AiWidget'
import { AiChatProvider } from '@/lib/context/AiChatContext'
import { ToastProvider } from '@/components/ui/toast-notification'
import { StorageProvider } from '@/lib/context/StorageContext'
import { getChatMessages } from '@/lib/dal'
import { NotificationProvider } from '@/lib/context/NotificationContext'
import type { UserProfile } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile: UserProfile = {
    id: user.id,
    email: user.email ?? '',
    name: user.user_metadata?.full_name ?? user.email ?? 'User',
    avatar_url: user.user_metadata?.avatar_url ?? null,
  }

  const initialMessages = await getChatMessages()

  return (
    <AiChatProvider initialMessages={initialMessages}>
    <StorageProvider>
    <ToastProvider>
  <NotificationProvider>
      <div className="flex h-screen overflow-hidden bg-surface">
        <Sidebar user={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
        <AiWidget />
      </div>
  </NotificationProvider>
    </ToastProvider>
    </StorageProvider>
    </AiChatProvider>
  )
}
