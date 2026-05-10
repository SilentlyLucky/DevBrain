'use client'
import { X, CalendarIcon, Clock, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Schedule } from '@/types'

interface Props {
  date: Date | null
  events: Schedule[]
  onClose: () => void
  onEventClick: (evt: Schedule) => void
  onCreateEvent: () => void
}

function parseCategory(desc: string | null | undefined): string | null {
  if (!desc) return null
  const m = desc.match(/^\[([^\]]+)\]/)
  return m ? m[1].trim() : null
}

const STATUS_DOT: Record<string, string> = {
  Completed: 'bg-green-400',
  Upcoming:  'bg-blue-400',
  Missed:    'bg-red-400',
}

const STATUS_BADGE: Record<string, string> = {
  Completed: 'bg-green-400/15 text-green-400 border-green-400/30',
  Upcoming:  'bg-blue-400/15 text-blue-400 border-blue-400/30',
  Missed:    'bg-red-400/15 text-red-400 border-red-400/30',
}

export function DayEventsPanel({ date, events, onClose, onEventClick, onCreateEvent }: Props) {
  if (!date) return null

  const isToday = date.toDateString() === new Date().toDateString()
  const sorted  = events.slice().sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div
        className="fixed top-0 right-0 h-full w-[380px] z-50 flex flex-col"
        style={{ background: 'oklch(0.145 0.018 228)', borderLeft: '1px solid oklch(0.26 0.020 225 / 0.6)' }}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: 'oklch(0.24 0.018 225 / 0.5)' }}>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold" style={{ color: 'oklch(0.93 0.008 228)' }}>
                {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'long' })}
              </h2>
              {isToday && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'oklch(0.72 0.18 195 / 0.2)', color: 'oklch(0.72 0.18 195)' }}>
                  Today
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'oklch(0.50 0.015 228)' }}>
              {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              {' · '}
              <span style={{ color: 'oklch(0.62 0.015 228)' }}>
                {events.length} session{events.length !== 1 ? 's' : ''}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'oklch(0.50 0.015 228)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'oklch(0.22 0.018 228)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Event list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'oklch(0.20 0.018 228)', border: '1px solid oklch(0.28 0.020 220 / 0.5)' }}>
                <CalendarIcon className="w-5 h-5" style={{ color: 'oklch(0.45 0.012 228)' }} />
              </div>
              <p className="text-sm" style={{ color: 'oklch(0.52 0.015 228)' }}>No sessions on this day</p>
              <p className="text-xs" style={{ color: 'oklch(0.38 0.010 228)' }}>Tap "Add Event" to schedule something</p>
            </div>
          ) : (
            sorted.map(evt => {
              const cat = parseCategory(evt.description)
              return (
                <button
                  key={evt.id}
                  onClick={() => onEventClick(evt)}
                  className="w-full rounded-xl p-4 text-left transition-all active:scale-[0.99]"
                  style={{ background: 'oklch(0.18 0.020 228)', border: '1px solid oklch(0.26 0.018 225 / 0.5)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'oklch(0.22 0.020 228)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'oklch(0.18 0.020 228)')}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', STATUS_DOT[evt.status])} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug" style={{ color: 'oklch(0.88 0.008 228)' }}>
                        {evt.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Clock className="w-3 h-3 shrink-0" style={{ color: 'oklch(0.50 0.015 228)' }} />
                        <span className="text-xs" style={{ color: 'oklch(0.55 0.012 228)' }}>
                          {fmtTime(evt.start_time)} - {fmtTime(evt.end_time)}
                        </span>
                      </div>
                      {cat && (
                        <span className="inline-block mt-1.5 text-[11px] px-2 py-0.5 rounded-full"
                          style={{ background: 'oklch(0.72 0.18 195 / 0.12)', color: 'oklch(0.72 0.18 195)' }}>
                          {cat}
                        </span>
                      )}
                    </div>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0', STATUS_BADGE[evt.status])}>
                      {evt.status}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t" style={{ borderColor: 'oklch(0.24 0.018 225 / 0.5)' }}>
          <button
            onClick={() => { onClose(); onCreateEvent() }}
            className="w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(90deg, oklch(0.72 0.18 195), oklch(0.60 0.22 280))',
              boxShadow: '0 4px 20px oklch(0.72 0.18 195 / 0.30)',
              color: '#fff',
            }}
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>
    </>
  )
}
