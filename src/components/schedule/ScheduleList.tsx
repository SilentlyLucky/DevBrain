'use client'
import { useState } from 'react'
import { Clock, CheckCircle, XCircle, Circle, ExternalLink, Trash2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { updateScheduleStatus, createSchedule, deleteSchedule, updateScheduleGcalId } from '@/actions/schedules'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Schedule } from '@/types'
import { cn } from '@/lib/utils'

function isOverdue(s: Schedule) {
  return s.status === 'Upcoming' && new Date(s.end_time) < new Date()
}

type Filter = 'All' | 'Unfinished' | 'Finished' | 'Overdue'

const FILTERS: Filter[] = ['All', 'Unfinished', 'Finished', 'Overdue']

function applyFilter(schedules: Schedule[], filter: Filter): Schedule[] {
  const now = new Date()
  switch (filter) {
    case 'Unfinished': return schedules.filter(s => s.status === 'Upcoming' && new Date(s.end_time) >= now)
    case 'Finished':   return schedules.filter(s => s.status === 'Completed')
    case 'Overdue':    return schedules.filter(s => s.status === 'Upcoming' && new Date(s.end_time) < now)
    default:           return schedules
  }
}

function ScheduleItem({ s, syncingId, deletingId, onSync, onDelete }: {
  s: Schedule
  syncingId: string | null
  deletingId: string | null
  onSync: (s: Schedule) => void
  onDelete: (s: Schedule) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const overdue = isOverdue(s)

  const statusIcon = overdue
    ? <AlertCircle className="w-5 h-5 flex-shrink-0 text-orange-400" />
    : s.status === 'Completed'
      ? <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-400" />
      : s.status === 'Missed'
        ? <XCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
        : <Circle className="w-5 h-5 flex-shrink-0 text-blue-400" />

  return (
    <div className="rounded-xl border border-muted overflow-hidden">
      {/* Clickable row */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer select-none hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        {statusIcon}

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{s.title}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            {formatDateTime(s.start_time)} - {formatDateTime(s.end_time)}
            {overdue && <span className="ml-1 text-orange-400 font-medium">· Overdue</span>}
          </p>
        </div>

        {/* Actions - stop propagation so clicks don't toggle expand */}
        <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {s.status === 'Upcoming' && (
            <form action={updateScheduleStatus.bind(null, s.id, 'Completed')}>
              <button className="text-xs text-green-400 hover:underline">Mark done</button>
            </form>
          )}
          {!s.gcal_event_id && s.status === 'Upcoming' && (
            <button
              onClick={() => onSync(s)}
              disabled={syncingId === s.id}
              className="text-xs text-primary hover:underline flex items-center gap-0.5"
            >
              <ExternalLink className="w-3 h-3" />
              {syncingId === s.id ? 'Syncing…' : 'Sync'}
            </button>
          )}
          <button
            onClick={() => onDelete(s)}
            disabled={deletingId === s.id}
            title="Delete schedule"
            className="text-muted-foreground hover:text-red-400 transition-colors p-0.5 disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {expanded
          ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        }
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="px-5 pb-4 pt-3 border-t border-muted space-y-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <span>
              <span className="font-medium text-foreground/60">Status: </span>
              <span className={overdue ? 'text-orange-400 font-medium' : ''}>
                {overdue ? 'Overdue' : s.status}
              </span>
            </span>
            {s.gcal_event_id && <span className="text-green-400">✓ Synced to Google Calendar</span>}
          </div>
          {s.description
            ? <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{s.description}</p>
            : <p className="text-xs text-muted-foreground italic">No description provided.</p>
          }
        </div>
      )}
    </div>
  )
}

export function ScheduleList({ schedules }: { schedules: Schedule[] }) {
  const [showForm, setShowForm] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('All')

  async function handleSync(schedule: Schedule) {
    setSyncingId(schedule.id)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const provider_token = session?.provider_token ?? null

      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: schedule.title,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          provider_token,
        }),
      })

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Calendar sync failed' }))
        throw new Error(error ?? 'Calendar sync failed')
      }

      const { gcal_event_id } = await res.json()
      if (gcal_event_id) await updateScheduleGcalId(schedule.id, gcal_event_id)
    } catch (e) {
      console.error('[calendar sync]', e)
      alert((e as Error).message)
    } finally {
      setSyncingId(null)
    }
  }

  async function handleDelete(schedule: Schedule) {
    setDeletingId(schedule.id)
    try {
      if (schedule.gcal_event_id) {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const provider_token = session?.provider_token ?? null
        await fetch('/api/calendar', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gcal_event_id: schedule.gcal_event_id, provider_token }),
        })
      }
      await deleteSchedule(schedule.id)
    } catch (e) {
      console.error('[delete schedule]', e)
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = applyFilter(schedules, filter)

  const counts: Record<Filter, number> = {
    All:        schedules.length,
    Unfinished: applyFilter(schedules, 'Unfinished').length,
    Finished:   applyFilter(schedules, 'Finished').length,
    Overdue:    applyFilter(schedules, 'Overdue').length,
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-medium text-muted-foreground">Your Schedule ({schedules.length})</h2>
        <Button size="sm" onClick={() => setShowForm(s => !s)} variant="outline">+ New Schedule</Button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          action={async (fd) => { await createSchedule(fd); setShowForm(false) }}
          className="p-4 border border-muted rounded-xl space-y-3"
        >
          <Input name="title" placeholder="Task or event title" required />
          <textarea
            name="description"
            placeholder="Description (optional)"
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Start</label>
              <Input name="start_time" type="datetime-local" required />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">End</label>
              <Input name="end_time" type="datetime-local" required />
            </div>
          </div>
          <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90">Save Schedule</Button>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-lg border border-muted w-fit">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-md transition-colors',
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            {f}
            {counts[f] > 0 && (
              <span className={cn(
                'ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                filter === f
                  ? 'bg-white/20 text-inherit'
                  : f === 'Overdue'
                    ? 'bg-orange-400/20 text-orange-400'
                    : 'bg-muted text-muted-foreground'
              )}>
                {counts[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Schedule list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-10 text-sm">
            {schedules.length === 0
              ? 'No schedules yet. Create your first task.'
              : `No ${filter.toLowerCase()} schedules.`}
          </p>
        )}
        {filtered.map(s => (
          <ScheduleItem key={s.id} s={s} syncingId={syncingId} deletingId={deletingId} onSync={handleSync} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  )
}
