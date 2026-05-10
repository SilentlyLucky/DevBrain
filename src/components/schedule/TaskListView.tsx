'use client'
import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, Bell, CheckCircle2, Circle, XCircle, Clock, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Schedule } from '@/types'
import { updateScheduleStatus } from '@/actions/schedules'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-notification'
import { CreateEventPanel } from './CreateEventPanel'
import { EventDetailModal } from './EventDetailModal'

function parseCategory(desc: string | null | undefined): string | null {
  if (!desc) return null
  const m = desc.match(/^\[([^\]]+)\]/)
  return m ? m[1].trim() : null
}

function parseDescription(desc: string | null | undefined): string {
  if (!desc) return ''
  return desc.replace(/^\[[^\]]+\]\s*/, '').trim()
}

function formatDuration(start: string, end: string): string {
  const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000)
  if (diff < 60) return `${diff}m`
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatReminderLabel(minutes: number | null): string | null {
  if (!minutes) return null
  if (minutes < 60) return `${minutes}m`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`
  return `${Math.floor(minutes / 1440)}d`
}

type Group = { label: string; schedules: Schedule[] }

function groupSchedules(schedules: Schedule[]): Group[] {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const weekEnd  = new Date(today); weekEnd.setDate(today.getDate() + 7)

  const groups: Record<string, Schedule[]> = {
    Today:      [],
    Tomorrow:   [],
    'This Week': [],
    Later:      [],
    Past:       [],
  }

  for (const s of schedules) {
    const d = new Date(s.start_time)
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())

    if (day < today) {
      groups['Past'].push(s)
    } else if (day.getTime() === today.getTime()) {
      groups['Today'].push(s)
    } else if (day.getTime() === tomorrow.getTime()) {
      groups['Tomorrow'].push(s)
    } else if (day <= weekEnd) {
      groups['This Week'].push(s)
    } else {
      groups['Later'].push(s)
    }
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, schedules: items }))
}

function TaskItem({
  schedule,
  onToggle,
  onClick,
}: {
  schedule: Schedule
  onToggle: (s: Schedule) => void
  onClick: (s: Schedule) => void
}) {
  const category    = parseCategory(schedule.description)
  const description = parseDescription(schedule.description)
  const reminder    = formatReminderLabel(schedule.reminder_minutes)
  const isCompleted = schedule.status === 'Completed'
  const isMissed    = schedule.status === 'Missed'

  return (
    <div
      className="group flex items-start gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all"
      style={{ background: 'oklch(0.16 0.018 228)', border: '1px solid oklch(0.24 0.018 225 / 0.5)' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'oklch(0.19 0.020 228)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'oklch(0.16 0.018 228)')}
      onClick={() => onClick(schedule)}
    >
      {/* Status toggle */}
      <button
        onClick={e => { e.stopPropagation(); onToggle(schedule) }}
        className="mt-0.5 shrink-0 transition-transform hover:scale-110"
        title={isCompleted ? 'Mark as upcoming' : 'Mark as complete'}
      >
        {isCompleted
          ? <CheckCircle2 className="w-6 h-6" style={{ color: '#4ade80' }} />
          : isMissed
            ? <XCircle className="w-6 h-6" style={{ color: '#f87171' }} />
            : <Circle className="w-6 h-6" style={{ color: 'oklch(0.45 0.012 228)' }} />
        }
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-base font-semibold leading-snug',
            (isCompleted || isMissed) && 'line-through opacity-60'
          )} style={{ color: 'oklch(0.90 0.008 228)' }}>
            {schedule.title}
          </p>

          {/* Right badges */}
          <div className="flex items-center gap-2 shrink-0">
            {reminder && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'oklch(0.72 0.18 195 / 0.12)', color: 'oklch(0.72 0.18 195)' }}>
                <Bell className="w-3 h-3" />
                {reminder}
              </span>
            )}
            <span className="text-xs font-medium" style={{ color: 'oklch(0.50 0.012 228)' }}>
              {formatDuration(schedule.start_time, schedule.end_time)}
            </span>
          </div>
        </div>

        {/* Time + category */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-sm" style={{ color: 'oklch(0.55 0.012 228)' }}>
            <Clock className="w-3.5 h-3.5" />
            {formatTime(schedule.start_time)} – {formatTime(schedule.end_time)}
          </span>
          {category && (
            <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full"
              style={{ background: 'oklch(0.26 0.020 220 / 0.5)', color: 'oklch(0.70 0.012 228)' }}>
              <Tag className="w-3 h-3" />
              {category}
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm mt-1 truncate" style={{ color: 'oklch(0.52 0.010 228)' }}>
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

type FilterStatus = 'All' | 'Upcoming' | 'Completed' | 'Missed'

const FILTERS: FilterStatus[] = ['All', 'Upcoming', 'Completed', 'Missed']

const FILTER_STYLE: Record<FilterStatus, { active: string; dot?: string }> = {
  All:       { active: 'bg-white/10 text-foreground border border-white/20' },
  Upcoming:  { active: 'bg-blue-500/20 text-blue-400 border border-blue-500/40', dot: 'bg-blue-400' },
  Completed: { active: 'bg-green-500/20 text-green-400 border border-green-500/40', dot: 'bg-green-400' },
  Missed:    { active: 'bg-red-500/20 text-red-400 border border-red-500/40', dot: 'bg-red-400' },
}

export function TaskListView({ schedules }: { schedules: Schedule[] }) {
  const router = useRouter()
  const toast  = useToast()

  const [filter, setFilter]           = useState<FilterStatus>('All')
  const [query, setQuery]             = useState('')
  const [showCreate, setShowCreate]   = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Schedule | null>(null)

  // Auto-refresh when NotificationContext marks a schedule as Missed
  useEffect(() => {
    function onStatusChanged() { router.refresh() }
    window.addEventListener('schedule-status-changed', onStatusChanged)
    return () => window.removeEventListener('schedule-status-changed', onStatusChanged)
  }, [router])

  const filtered = useMemo(() => {
    let list = schedules
    if (filter !== 'All') list = list.filter(s => s.status === filter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(s =>
        s.title.toLowerCase().includes(q) ||
        (s.description ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [schedules, filter, query])

  const groups = useMemo(() => groupSchedules(filtered), [filtered])

  const counts = useMemo(() => ({
    Upcoming:  schedules.filter(s => s.status === 'Upcoming').length,
    Completed: schedules.filter(s => s.status === 'Completed').length,
    Missed:    schedules.filter(s => s.status === 'Missed').length,
  }), [schedules])

  async function handleToggle(s: Schedule) {
    const next: 'Upcoming' | 'Completed' = s.status === 'Completed' ? 'Upcoming' : 'Completed'
    try {
      await updateScheduleStatus(s.id, next)
      router.refresh()
    } catch {
      toast.error('Failed to update status.')
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {schedules.length} total · {counts.Upcoming} upcoming
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="h-10 px-4 rounded-xl backdrop-blur-xl transition-all duration-300 flex items-center justify-center font-semibold text-white text-sm hover:brightness-125 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(#0B1220, #0B1220) padding-box, linear-gradient(90deg, #A855F7, #00E5FF) border-box',
            border: '1.5px solid transparent',
            boxShadow: '0 0 12px rgba(168,85,247,0.12), 0 0 12px rgba(0,229,255,0.12)'
          }}
        >
          <Plus className="w-4 h-4 mr-2 text-[#00E5FF]" />
          New Task
        </button>
      </div>

      {/* Search + Filter */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: 'oklch(0.50 0.015 228)' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks…"
            className="w-full h-10 pl-9 pr-4 rounded-xl text-sm border focus:outline-none transition-all"
            style={{
              background: 'oklch(0.14 0.016 233)',
              borderColor: 'oklch(0.28 0.020 220 / 0.6)',
              color: 'oklch(0.85 0.008 228)',
            }}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => {
            const active = filter === f
            const count = f === 'All' ? schedules.length : counts[f as keyof typeof counts]
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'h-9 px-4 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                  active
                    ? FILTER_STYLE[f].active
                    : 'text-muted-foreground hover:text-foreground'
                )}
                style={!active ? { background: 'oklch(0.18 0.018 228)', border: '1px solid oklch(0.26 0.018 225 / 0.4)' } : undefined}
              >
                {f !== 'All' && FILTER_STYLE[f].dot && (
                  <span className={cn('w-1.5 h-1.5 rounded-full', FILTER_STYLE[f].dot)} />
                )}
                {f}
                <span className="opacity-60">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Task list */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'oklch(0.18 0.018 228)', border: '1px solid oklch(0.26 0.020 220 / 0.4)' }}>
            <CheckCircle2 className="w-6 h-6" style={{ color: 'oklch(0.45 0.012 228)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'oklch(0.55 0.015 228)' }}>
            {query ? 'No tasks match your search' : filter === 'All' ? 'No tasks yet' : `No ${filter.toLowerCase()} tasks`}
          </p>
          {!query && (
            <button
              onClick={() => setShowCreate(true)}
              className="text-xs font-medium transition-opacity hover:opacity-70"
              style={{ color: 'oklch(0.72 0.18 195)' }}
            >
              + Create your first task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(group => (
            <div key={group.label}>
              {/* Group header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-bold uppercase tracking-widest"
                  style={{ color: 'oklch(0.55 0.015 228)' }}>
                  {group.label}
                </span>
                <span className="text-sm" style={{ color: 'oklch(0.42 0.010 228)' }}>
                  {group.schedules.length}
                </span>
                <div className="flex-1 h-px" style={{ background: 'oklch(0.22 0.018 225 / 0.5)' }} />
              </div>

              {/* Items */}
              <div className="space-y-2">
                {group.schedules.map(s => (
                  <TaskItem
                    key={s.id}
                    schedule={s}
                    onToggle={handleToggle}
                    onClick={setSelectedEvent}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateEventPanel open={showCreate} onClose={() => setShowCreate(false)} />
      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  )
}
