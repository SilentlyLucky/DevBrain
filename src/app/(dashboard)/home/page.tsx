import { createClient } from '@/lib/supabase/server'
import { getDocuments, getSchedules } from '@/lib/dal'
import {
  FileText, CalendarIcon,
  BookOpen, CheckCircle2, ChevronRight,
  FileCode, Globe, Table2, Code, AlignLeft, Tag,
  CloudUpload, Brain, MessageSquare, Clock,
} from 'lucide-react'
import Link from 'next/link'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { LocalTimeRange } from '@/components/schedule/LocalTimeRange'
import { formatDistanceToNow } from '@/lib/utils'
import type { ActivityItem, Document, Schedule, Tone } from '@/types'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const fullName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User'
  const firstName = fullName.split(' ')[0]

  const [documents, schedules] = await Promise.all([
    getDocuments(),
    getSchedules(),
  ])

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const todayStr = now.toDateString()
  const upcoming = schedules.filter(s => s.status === 'Upcoming')
  const completed = schedules.filter(s => s.status === 'Completed')

  const todaySchedules = schedules
    .filter(s => new Date(s.start_time).toDateString() === todayStr)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  const nextUpcoming = upcoming
    .filter(s => new Date(s.start_time) > now)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 3)

  const focusSessions = todaySchedules.length > 0 ? todaySchedules.slice(0, 3) : nextUpcoming

  const recentDocs = documents.slice(0, 5)
  const recentActivity = buildActivity(documents, schedules).slice(0, 5)

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting}, {firstName}! <span className="inline-block animate-float-soft">👋</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          value={documents.length}
          label="Documents"
          sub="in Knowledge Base"
          color="text-primary"
          bg="bg-primary/10"
          href="/knowledge"
        />
        <StatCard
          icon={<CalendarIcon className="w-5 h-5" />}
          value={upcoming.length}
          label="Upcoming"
          sub="sessions scheduled"
          color="text-blue-400"
          bg="bg-blue-400/10"
          href="/schedule"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          value={completed.length}
          label="Completed"
          sub="sessions done"
          color="text-green-400"
          bg="bg-green-400/10"
          href="/tasks"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base">
                {todaySchedules.length > 0 ? "Today's Sessions" : "Upcoming Sessions"}
              </h2>
              <Link href="/schedule" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {focusSessions.length === 0 ? (
              <EmptyState
                icon={<CalendarIcon className="w-5 h-5" />}
                text="No sessions scheduled yet."
                action={{ label: 'Create one', href: '/schedule' }}
              />
            ) : (
              <div className="space-y-2">
                {focusSessions.map(s => <ScheduleRow key={s.id} schedule={s} />)}
              </div>
            )}
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 pointer-events-none" />
            <div className="relative">
              <h2 className="font-semibold text-base mb-6">How DevBrain Works</h2>
              <div className="flex items-start gap-2">
                <Step
                  number={1} tone="teal"
                  icon={<CloudUpload className="w-7 h-7" />}
                  title="Upload Documents/Schedule"
                  description="Upload your materials and create your schedule sessions."
                  pulseDelay="0s"
                />
                <AnimatedConnector dotDelay="0.4s" />
                <Step
                  number={2} tone="indigo"
                  icon={<Brain className="w-7 h-7" />}
                  title="AI Reads & Understands"
                  description="AI analyzes, understands, and stores information in the Vector Database."
                  pulseDelay="2.0s"
                />
                <AnimatedConnector dotDelay="2.4s" />
                <Step
                  number={3} tone="violet"
                  icon={<MessageSquare className="w-7 h-7" />}
                  title="Ask Anything"
                  description="Ask any question and get the most relevant answers from your content."
                  pulseDelay="4.0s"
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base">Recent Documents</h2>
              <Link href="/knowledge" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {recentDocs.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-5 h-5" />}
                text="No documents yet."
                action={{ label: 'Upload your first document', href: '/knowledge' }}
              />
            ) : (
              <div className="divide-y divide-muted/40">
                {recentDocs.map(d => <DocumentRow key={d.id} doc={d} />)}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">

          <Card>
            <h2 className="font-semibold text-base mb-4">Quick Actions</h2>
            <QuickActions />
          </Card>

          {recentActivity.length > 0 && (
            <Card>
              <h2 className="font-semibold text-base mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {recentActivity.map((a, i) => <ActivityRow key={i} activity={a} />)}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}


function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border border-muted bg-surface-2 p-5 ${className}`}>
      {children}
    </div>
  )
}

function StatCard({ icon, value, label, sub, color, bg, href }: {
  icon: React.ReactNode; value: number | string; label: string
  sub: string; color: string; bg: string; href: string
}) {
  return (
    <Link href={href} className="rounded-2xl border border-muted bg-surface-2 p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors group">
      <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-sm font-medium text-foreground/80">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </Link>
  )
}

function parseCategory(desc: string | null | undefined) {
  if (!desc) return null
  const m = desc.match(/^\[([^\]]+)\]/)
  return m ? m[1].trim() : null
}

function ScheduleRow({ schedule: s }: { schedule: Schedule }) {
  const cat = parseCategory(s.description)
  const STATUS_COLOR: Record<string, string> = {
    Upcoming: 'bg-blue-400/15 text-blue-400',
    Completed: 'bg-green-400/15 text-green-400',
    Missed: 'bg-red-400/15 text-red-400',
  }
  return (
    <Link
      href={`/schedule?eventId=${s.id}`}
      className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-muted/30 transition-colors"
    >
      <div className={`w-2 h-2 rounded-full shrink-0 ${s.status === 'Completed' ? 'bg-green-400' :
        s.status === 'Missed' ? 'bg-red-400' : 'bg-blue-400'
        }`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{s.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <LocalTimeRange start={s.start_time} end={s.end_time} />
          </span>
          {cat && (
            <span className="text-[11px] flex items-center gap-1 text-muted-foreground">
              <Tag className="w-2.5 h-2.5" /> {cat}
            </span>
          )}
        </div>
      </div>
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${STATUS_COLOR[s.status]}`}>
        {s.status}
      </span>
    </Link>
  )
}

const CODE_EXTS = new Set(['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.go', '.rs'])
function getDocIcon(doc: Document) {
  const ext = doc.file_extension ?? null
  if (doc.source_type === 'PDF' || ext === '.pdf') return { Icon: FileText, color: 'text-red-400' }
  if (ext === '.docx') return { Icon: FileText, color: 'text-blue-400' }
  if (ext === '.md') return { Icon: FileCode, color: 'text-purple-400' }
  if (ext === '.csv') return { Icon: Table2, color: 'text-green-400' }
  if (ext && CODE_EXTS.has(ext)) return { Icon: Code, color: 'text-cyan-400' }
  if (doc.source_type === 'URL') return { Icon: Globe, color: 'text-blue-400' }
  return { Icon: AlignLeft, color: 'text-muted-foreground' }
}

function DocumentRow({ doc }: { doc: Document }) {
  const { Icon, color } = getDocIcon(doc)
  return (
    <div className="flex items-center gap-3 py-3">
      <Icon className={`w-4 h-4 shrink-0 ${color}`} />
      <span className="flex-1 text-sm font-medium truncate min-w-0">{doc.title}</span>
      <span className="text-xs text-muted-foreground shrink-0">{formatDistanceToNow(doc.created_at)}</span>
    </div>
  )
}

function ActivityRow({ activity: a }: { activity: ActivityItem }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.type === 'document' ? 'bg-rose-500/10 text-rose-400' : 'bg-primary/10 text-primary'
        }`}>
        {a.type === 'document'
          ? <FileText className="w-4 h-4" />
          : <CalendarIcon className="w-4 h-4" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{a.title}</p>
        <p className="text-xs text-muted-foreground">{a.subtitle}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDistanceToNow(a.date)}</span>
    </div>
  )
}

function EmptyState({ icon, text, action }: {
  icon: React.ReactNode; text: string; action?: { label: string; href: string }
}) {
  return (
    <div className="text-center py-8 space-y-2">
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
        {icon}
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
      {action && (
        <Link href={action.href} className="text-xs text-primary hover:underline">{action.label}</Link>
      )}
    </div>
  )
}

const TONES: Record<Tone, { bg: string; text: string; ring: string; glow: string }> = {
  teal: { bg: 'bg-primary/10', text: 'text-primary', ring: 'bg-primary/40', glow: 'shadow-primary/40' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', ring: 'bg-indigo-400/40', glow: 'shadow-indigo-400/40' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', ring: 'bg-violet-400/40', glow: 'shadow-violet-400/40' },
}

function Step({ number, icon, title, description, tone, pulseDelay }: {
  number: number; icon: React.ReactNode; title: string; description: string; tone: Tone; pulseDelay: string
}) {
  const t = TONES[tone]
  return (
    <div className="flex flex-col items-center text-center px-2 flex-shrink-0 w-[180px]">
      <span className="text-[11px] text-muted-foreground mb-1.5 font-medium">{number}</span>
      <div className="relative w-16 h-16 flex items-center justify-center">
        <span className={`absolute inset-0 rounded-full ${t.ring} animate-pulse-ring`} style={{ animationDelay: pulseDelay }} />
        <span className={`absolute inset-0 rounded-full ${t.bg} blur-md opacity-70`} />
        <div className={`relative z-10 w-16 h-16 rounded-full ${t.bg} ${t.text} flex items-center justify-center border border-current/20 shadow-lg ${t.glow}`}>
          <span className="animate-float-soft" style={{ animationDelay: pulseDelay }}>{icon}</span>
        </div>
      </div>
      <h3 className="font-semibold text-sm mt-4">{title}</h3>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{description}</p>
    </div>
  )
}

function AnimatedConnector({ dotDelay }: { dotDelay: string }) {
  return (
    <div className="flex-1 self-start mt-[60px] relative h-1.5 min-w-[40px]">
      <div className="absolute inset-0 rounded-full opacity-50" style={{
        backgroundImage: 'repeating-linear-gradient(to right, var(--color-primary) 0 4px, transparent 4px 10px)',
        backgroundSize: '10px 1.5px', backgroundPosition: '0 50%', backgroundRepeat: 'repeat-x',
      }} />
      <div className="absolute inset-0 rounded-full animate-line-flow opacity-90" />
      <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_2px] shadow-primary animate-dot-travel"
        style={{ animationDelay: dotDelay }} />
    </div>
  )
}

function buildActivity(documents: Document[], schedules: Schedule[]): ActivityItem[] {
  return [
    ...documents.map(d => ({
      type: 'document' as const,
      title: d.title,
      subtitle: 'Uploaded to Knowledge Base',
      date: d.created_at,
    })),
    ...schedules.filter(s => s.status === 'Completed').map(s => ({
      type: 'schedule' as const,
      title: s.title,
      subtitle: 'Session completed',
      date: s.created_at,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
