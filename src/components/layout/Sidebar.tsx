'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home, BookOpen, Calendar, MessageSquare, Settings,
  LogOut, Brain, TrendingUp, FileText, CalendarClock, MessageCircle, ListTodo,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useStorage } from '@/lib/context/StorageContext'
import { useAiChat } from '@/lib/context/AiChatContext'
import type { UserProfile } from '@/types'
import { NotificationBell } from '@/components/layout/NotificationBell'

const mainNav = [
  { href: '/home',         label: 'Home',           icon: Home },
  { href: '/knowledge',    label: 'Knowledge Base', icon: BookOpen },
  { href: '/schedule',     label: 'Schedule',       icon: Calendar },
  { href: '/tasks',        label: 'Tasks',          icon: ListTodo },
  { href: '/chat-history', label: 'Chat History',   icon: MessageSquare },
  { href: '/settings',     label: 'Settings',       icon: Settings },
]

const aiNav = [
  { href: '/knowledge', label: 'RAG Note-taking', icon: FileText, prompt: 'Please summarize the document [your document] in my knowledge base, and tell me what I can ask about them.' },
  { href: '/schedule', label: 'Smart Scheduling', icon: CalendarClock, prompt: 'Help me create a schedule for [your activity] this week focusing on [description].' },
  { href: '/chat-history', label: 'Ask Anything', icon: MessageCircle, prompt: 'Can I ask you about [your question]' },
]

const STORAGE_TOTAL_BYTES = parseFloat(process.env.NEXT_PUBLIC_STORAGE_LIMIT_GB ?? '1') * 1_073_741_824

function formatBytes(bytes: number): string {
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(1)} KB`
  if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} MB`
  return `${(bytes / 1_073_741_824).toFixed(2)} GB`
}

export function Sidebar({ user }: { user: UserProfile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const { storageUsedBytes: storageUsed } = useStorage()
  const { openWithPrompt } = useAiChat()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const limitLabel = `${process.env.NEXT_PUBLIC_STORAGE_LIMIT_GB ?? '1'} GB`
  const pct = storageUsed !== null ? Math.min(100, (storageUsed / STORAGE_TOTAL_BYTES) * 100) : 0

  return (
    <aside
      className="w-64 flex-shrink-0 h-screen flex flex-col sticky top-0 overflow-hidden"
      style={{
        background: '#07111F',
        borderRight: '1px solid #132238',
      }}
    >
      {/* ── Logo ── */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid #132238' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(0,229,255,0.25), rgba(37,99,235,0.18))',
              border: '1.5px solid rgba(0,229,255,0.55)',
              boxShadow: '0 0 18px rgba(0,229,255,0.28)',
              color: '#00E5FF',
            }}
          >
            <Brain className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <span
            className="font-bold text-[1.15rem] tracking-tight"
            style={{ color: '#FFFFFF' }}
          >
            DevBrain
          </span>
          <NotificationBell />
        </div>
      </div>

      {/* ── Nav (scrollable) ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-5 scrollbar-hide">

        {/* MAIN */}
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.12em] px-3 mb-2"
            style={{ color: '#3A4A5C' }}
          >
            Main
          </p>
          <div className="space-y-0.5">
            {mainNav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative"
                  style={active ? {
                    background: 'linear-gradient(135deg, rgba(0,229,255,0.10), rgba(0,229,255,0.04))',
                    color: '#00E5FF',
                    borderLeft: '2px solid #00E5FF',
                    paddingLeft: '10px',
                    boxShadow: 'inset 0 0 20px rgba(0,229,255,0.04)',
                  } : {
                    color: '#7E8A9A',
                    borderLeft: '2px solid transparent',
                    paddingLeft: '10px',
                  }}
                >
                  <Icon
                    className="w-4 h-4 shrink-0 transition-colors"
                    style={{ color: active ? '#00E5FF' : undefined }}
                  />
                  <span>{label}</span>
                  {/* hover glow layer */}
                  {!active && (
                    <span
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                    />
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#132238' }} />

        {/* AI TOOLS */}
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.12em] px-3 mb-2"
            style={{ color: '#3A4A5C' }}
          >
            AI Tools
          </p>
          <div className="space-y-0.5">
            {aiNav.map(({ href, label, icon: Icon, prompt }) => {
              const active = pathname === href
              return (
                <Link
                  key={label}
                  href={href}
                  onClick={() => openWithPrompt(prompt)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative"
                  style={{ color: '#7E8A9A', borderLeft: '2px solid transparent', paddingLeft: '10px' }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {/* AI Badge */}
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                    style={{
                      background: 'rgba(168,85,247,0.18)',
                      color: '#A855F7',
                      border: '1px solid rgba(168,85,247,0.25)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    AI
                  </span>
                  {/* hover glow */}
                  <span
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  />
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* ── User / Footer area ── */}
      <div
        className="px-3 py-4 space-y-4"
        style={{ borderTop: '1px solid #132238', background: '#07111F' }}
      >
        {/* Profile card */}
        <div
          className="flex items-center gap-3 px-3 py-3 rounded-2xl"
          style={{
            background: '#0B1324',
            border: '1px solid #132238',
          }}
        >
          <Link href="/settings" className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,229,255,0.20), rgba(37,99,235,0.18))',
                  color: '#00E5FF',
                  border: '1px solid rgba(0,229,255,0.3)',
                }}
              >
                {user.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: '#FFFFFF' }}>{user.name}</p>
              <p className="text-[11px] truncate" style={{ color: '#5F6B7A' }}>{user.email}</p>
            </div>
          </Link>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="shrink-0 transition-colors hover:opacity-80"
            style={{ color: '#EF4444' }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Storage bar */}
        <div className="px-1">
          <div className="flex justify-between mb-2 text-[11px]">
            <span style={{ color: '#5F6B7A' }}>Storage</span>
            <span style={{ color: '#7E8A9A' }}>
              {storageUsed === null ? '…' : formatBytes(storageUsed)} / {limitLabel}
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: '#132238' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: pct > 80
                  ? 'linear-gradient(90deg, #EF4444, #F59E0B)'
                  : 'linear-gradient(90deg, #00E5FF, #A855F7)',
                boxShadow: pct > 0 ? '0 0 6px rgba(0,229,255,0.5)' : 'none',
              }}
            />
          </div>
        </div>

      </div>
    </aside>
  )
}
