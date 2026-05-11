'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, ArrowRight, Calendar as CalendarIcon, } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Schedule, CalView } from '@/types'
import { useToast } from '@/components/ui/toast-notification'
import { CreateEventPanel } from './CreateEventPanel'
import { DayEventsPanel } from './DayEventsPanel'
import { EventDetailModal } from './EventDetailModal'
import { updateScheduleGcalId, importSchedulesFromGcal } from '@/actions/schedules'
import { createClient } from '@/lib/supabase/client'

const GoogleIcon = () => (
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

function getEventDotClass(title: string) {
  const t = title.toLowerCase()
  if (t.includes('docker')) return "text-blue-500"
  if (t.includes('next.js')) return "text-cyan-400"
  if (t.includes('prisma')) return "text-blue-600"
  if (t.includes('system design')) return "text-purple-500"
  if (t.includes('typescript')) return "text-green-500"
  if (t.includes('jwt') || t.includes('auth')) return "text-green-600"
  return "text-orange-400"
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export function ScheduleDashboard({ schedules }: { schedules: Schedule[] }) {
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const prevMonthDays = getDaysInMonth(year, month - 1)

  const [today, setToday] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setToday(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const calendarCells = useMemo(() => {
    const cells = []
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      })
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      })
    }
    const remaining = 35 - cells.length
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      })
    }
    return cells
  }, [year, month, daysInMonth, firstDay, prevMonthDays])

  const router = useRouter()
  const toast = useToast()
  const [syncing, setSyncing] = useState(false)
  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [calendarView, setCalendarView] = useState<CalView>('month')
  const [showAllUpcoming, setShowAllUpcoming] = useState(false)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState(year)
  const [selectedDay, setSelectedDay]     = useState<Date | null>(null)
  const [manualSelectedEvent, setManualSelectedEvent] = useState<Schedule | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const selectedEvent = useMemo(() => {
    const eventId = searchParams.get('eventId')
    if (eventId) return schedules.find(s => s.id === eventId) ?? null
    return manualSelectedEvent
  }, [searchParams, schedules, manualSelectedEvent])

  // Close month picker on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowMonthPicker(false)
      }
    }
    if (showMonthPicker) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [showMonthPicker])

  // Auto-refresh when NotificationContext marks a schedule as Missed
  useEffect(() => {
    function onStatusChanged() { router.refresh() }
    window.addEventListener('schedule-status-changed', onStatusChanged)
    return () => window.removeEventListener('schedule-status-changed', onStatusChanged)
  }, [router])

  // Week view: 7 days starting from Sunday of current week
  const weekDays = useMemo(() => {
    const start = new Date(today)
    start.setDate(today.getDate() - today.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [today])

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const goToday = () => setCurrentDate(new Date())

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  const displayMonthYear = `${monthNames[month]} ${year}`

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  // Today's Agenda derived data
  const todayStr = today.toDateString()
  const todaySchedules = schedules
    .filter(s => new Date(s.start_time).toDateString() === todayStr)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  const AGENDA_COLORS = ['text-cyan-400', 'text-purple-500', 'text-orange-400', 'text-blue-500']

  // Upcoming This Week derived data
  const upcomingWeek = useMemo(() => {
  const nowMs = today.getTime()
  const weekFromNow = nowMs + 7 * 24 * 60 * 60 * 1000

  return schedules
    .filter(s => {
      const t = new Date(s.start_time).getTime()

      return (
        s.status === 'Upcoming' &&
        t >= nowMs &&
        (showAllUpcoming || t <= weekFromNow)
      )
    })
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() -
        new Date(b.start_time).getTime()
    )
  }, [schedules, showAllUpcoming, today])

  async function handleSync() {
    setSyncing(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const provider_token = session?.provider_token ?? null

      if (!provider_token) {
        toast.error('Connect your Google account in Settings to enable calendar sync.')
        return
      }

      const unsynced = schedules.filter(s => s.status === 'Upcoming' && !s.gcal_event_id)

      const [pushResults, pullRes] = await Promise.all([
        Promise.allSettled(
          unsynced.map(async (s) => {
            const res = await fetch('/api/calendar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: s.title, start_time: s.start_time, end_time: s.end_time, provider_token }),
            })
            if (!res.ok) throw new Error('Push failed')
            const { gcal_event_id } = await res.json()
            if (gcal_event_id) await updateScheduleGcalId(s.id, gcal_event_id)
          })
        ),
        fetch(`/api/calendar?provider_token=${provider_token}`).then(r => r.json()),
      ])

      const pushed = pushResults.filter(r => r.status === 'fulfilled').length
      const failed = pushResults.filter(r => r.status === 'rejected').length
      const pulled = await importSchedulesFromGcal(pullRes.events ?? [])

      let msg = ''
      if (pushed > 0) msg += `Synced ${pushed} event${pushed !== 1 ? 's' : ''} to Google. `
      if (pulled  > 0) msg += `Imported ${pulled} new event${pulled !== 1 ? 's' : ''}.`
      if (!msg)        msg = 'Already up to date.'
      if (failed  > 0) msg += ` ${failed} event${failed !== 1 ? 's' : ''} failed.`

      failed > 0 ? toast.warning(msg) : toast.success(msg)
      router.refresh()
    } catch {
      toast.error('Calendar sync failed.')
    } finally {
      setSyncing(false)
    }
  }

  const getEventsForDate = (date: Date): Schedule[] =>
    schedules.filter(s => {
      const d = new Date(s.start_time)
      return d.getFullYear() === date.getFullYear() &&
             d.getMonth()    === date.getMonth()    &&
             d.getDate()     === date.getDate()
    })

  const statCompleted = schedules.filter(s => s.status === 'Completed').length
  const statUpcoming  = schedules.filter(s => s.status === 'Upcoming').length
  const statMissed    = schedules.filter(s => s.status === 'Missed').length

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Schedule</h1>
          <p className="text-foreground/70 mt-1 font-medium">Manage your daily tasks and sync to Google Calendar.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-11 px-5 rounded-xl border backdrop-blur-xl transition-all duration-300 flex items-center justify-center font-semibold text-white bg-[#0B1220]/95 border-cyan-500/40 hover:bg-[#0B1220] hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(0,217,255,0.15)]"
            onClick={handleSync}
            disabled={syncing}
          >
            <GoogleIcon />
            {syncing ? 'Syncing…' : 'Sync with Google Calendar'}
          </Button>
          <Button
            className="h-11 px-5 rounded-xl backdrop-blur-xl transition-all duration-300 flex items-center justify-center font-semibold text-white hover:brightness-125"
            style={{ 
              background: 'linear-gradient(#0B1220, #0B1220) padding-box, linear-gradient(90deg, #A855F7, #00E5FF) border-box',
              border: '1.5px solid transparent',
              boxShadow: '0 0 12px rgba(168,85,247,0.12), 0 0 12px rgba(0,229,255,0.12)'
            }}
            onClick={() => setShowCreatePanel(true)}
          >
            <Plus className="w-4 h-4 mr-2 text-[#00E5FF]" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Completed', value: statCompleted, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
          { label: 'Upcoming',  value: statUpcoming,  color: 'text-blue-400',  bg: 'bg-blue-400/10',  border: 'border-blue-400/20'  },
          { label: 'Missed',    value: statMissed,    color: 'text-red-400',   bg: 'bg-red-400/10',   border: 'border-red-400/20'   },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className={`rounded-2xl border ${border} ${bg} p-4 flex items-center gap-4`}>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Main Calendar View */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="flex bg-surface border border-muted rounded-xl p-1">
                {(['day', 'week', 'month'] as CalView[]).map(v => (
                  <Button
                    key={v}
                    variant="ghost"
                    onClick={() => setCalendarView(v)}
                    className={cn(
                      'h-8 px-4 text-xs font-medium capitalize transition-colors',
                      calendarView === v
                        ? 'bg-muted/50 text-foreground rounded-lg'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </Button>
                ))}
              </div>
              <Button variant="outline" onClick={goToday} className="h-10 px-4 bg-surface border-muted rounded-xl text-sm font-medium">
                Today
              </Button>
              {calendarView === 'month' && (
                <div className="flex items-center bg-surface border border-muted rounded-xl">
                  <Button variant="ghost" onClick={prevMonth} className="h-10 w-10 p-0 rounded-none border-r border-muted"><ChevronLeft className="w-4 h-4" /></Button>
                  <Button variant="ghost" onClick={nextMonth} className="h-10 w-10 p-0 rounded-none"><ChevronRight className="w-4 h-4" /></Button>
                </div>
              )}
            </div>

            {/* Month/Year picker - only in month view */}
            {calendarView === 'month' && (
              <div className="relative" ref={pickerRef}>
                <button
                  onClick={() => { setShowMonthPicker(v => !v); setPickerYear(year) }}
                  className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors"
                >
                  {displayMonthYear}
                  <ChevronRight className="w-4 h-4 rotate-90 text-muted-foreground" />
                </button>
                {showMonthPicker && (
                  <div className="absolute right-0 top-9 z-50 w-60 rounded-2xl border border-muted bg-surface-2 shadow-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <button onClick={() => setPickerYear(y => y - 1)} className="p-1 hover:text-primary rounded transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                      <span className="text-sm font-semibold">{pickerYear}</span>
                      <button onClick={() => setPickerYear(y => y + 1)} className="p-1 hover:text-primary rounded transition-colors"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {monthNames.map((name, i) => (
                        <button
                          key={i}
                          onClick={() => { setCurrentDate(new Date(pickerYear, i, 1)); setShowMonthPicker(false) }}
                          className={cn(
                            'py-1.5 text-xs rounded-lg transition-colors',
                            year === pickerYear && month === i
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'hover:bg-muted text-foreground'
                          )}
                        >
                          {name.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {calendarView !== 'month' && (
              <span className="text-sm font-medium text-muted-foreground">
                {calendarView === 'week'
                  ? `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                }
              </span>
            )}
          </div>

          {/* Week View */}
          {calendarView === 'week' && (
            <div className="space-y-2">
              {weekDays.map(day => {
                const dayEvts = getEventsForDate(day)
                const isTod = day.toDateString() === today.toDateString()
                return (
                  <div key={day.toString()} className={cn(
                    'rounded-xl p-3 border transition-colors',
                    isTod ? 'border-primary/40 bg-primary/5' : 'border-muted bg-surface-2/60'
                  )}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn('text-xs font-semibold', isTod ? 'text-primary' : 'text-muted-foreground')}>
                        {day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      {isTod && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">Today</span>}
                    </div>
                    {dayEvts.length === 0
                      ? <p className="text-xs text-muted-foreground/60 italic">No sessions</p>
                      : dayEvts.map(evt => (
                          <button key={evt.id} onClick={e => { e.stopPropagation(); setManualSelectedEvent(evt) }}
                            className="flex items-center gap-2 py-0.5 w-full text-left hover:opacity-75 transition-opacity">
                            <span className={cn('text-[10px] shrink-0', getEventDotClass(evt.title))}>●</span>
                            <span className="text-xs text-muted-foreground shrink-0">{formatTime(evt.start_time)}</span>
                            <span className="text-xs font-medium truncate">{evt.title}</span>
                          </button>
                        ))
                    }
                  </div>
                )
              })}
            </div>
          )}

          {/* Day View */}
          {calendarView === 'day' && (() => {
            const dayEvts = getEventsForDate(today)
            return dayEvts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No sessions today.</p>
            ) : (
              <div className="space-y-2">
                {dayEvts.map(evt => (
                  <button key={evt.id} onClick={() => setManualSelectedEvent(evt)}
                    className="rounded-xl p-4 border border-muted bg-surface-2/60 flex items-start gap-3 w-full text-left hover:bg-muted/40 transition-colors">
                    <div className="text-xs text-muted-foreground pt-0.5 w-12 shrink-0 font-mono">{formatTime(evt.start_time)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{evt.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatTime(evt.start_time)} - {formatTime(evt.end_time)}</p>
                    </div>
                    <Badge variant="outline" className={cn(
                      'rounded-md text-[10px] h-5 px-2 shrink-0',
                      evt.status === 'Completed' ? 'bg-green-400/10 text-green-400 border-none' : 'bg-surface border-muted text-muted-foreground'
                    )}>{evt.status}</Badge>
                  </button>
                ))}
              </div>
            )
          })()}

          {/* Calendar Grid - Month view only */}
          {calendarView === 'month' && <Card className="border-muted/80 bg-surface-2/80 hover:bg-muted/40 transition-colors rounded-2xl overflow-hidden shadow-sm">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-muted/80">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-3 text-center text-sm font-semibold text-foreground/80">
                  {day}
                </div>
              ))}
            </div>
            {/* Days Grid */}
            <div className="grid grid-cols-7 auto-rows-[110px]">
              {calendarCells.map((cell, i) => {
                const events = getEventsForDate(cell.date)
                const isToday =
                  cell.isCurrentMonth &&
                  cell.date.getDate() === today.getDate() &&
                  cell.date.getMonth() === today.getMonth() &&
                  cell.date.getFullYear() === today.getFullYear()
                
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDay(cell.date)}
                    className={cn(
                      "p-2 border-r border-b border-muted/50 hover:bg-muted/30 transition-colors cursor-pointer",
                      !cell.isCurrentMonth && "opacity-40",
                      i % 7 === 6 && "border-r-0",
                      i >= 28 && "border-b-0"
                    )}
                  >
                    <div className="flex items-center justify-start mb-1">
                      <span className={cn(
                        "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                        isToday ? "bg-cyan-400 text-black" : "text-foreground"
                      )}>
                        {cell.date.getDate()}
                      </span>
                    </div>
                    <div className="space-y-1 mt-2">
                      {events.map((evt, idx) => {
                        const words = evt.title.split(' ')
                        const line1 = words.slice(0, 2).join(' ')
                        const line2 = words.slice(2).join(' ')
                        return (
                          <div key={idx} className="text-xs">
                            <div className="flex items-center gap-1.5 text-foreground/70 font-medium mb-0.5">
                              <span className={cn("text-[10px] pb-1", getEventDotClass(evt.title))}>●</span>
                              <span>{formatTime(evt.start_time)}</span>
                            </div>
                            <div className="text-foreground font-semibold leading-tight pl-3">
                              {line1}<br/>{line2}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>}

          {/* Upcoming This Week */}
          <div className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Upcoming This Week</h3>
              <Button
                variant="ghost"
                className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
                onClick={() => setShowAllUpcoming(v => !v)}
              >
                {showAllUpcoming ? 'Show Less' : 'View All'} <ArrowRight className={cn('w-3 h-3 ml-1 transition-transform', showAllUpcoming && 'rotate-90')} />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {upcomingWeek.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-4 text-center py-4">No upcoming sessions this week.</p>
              ) : (
                (showAllUpcoming ? upcomingWeek : upcomingWeek.slice(0, 4)).map(s => (
                  <Card key={s.id} onClick={() => setManualSelectedEvent(s)}
                    className="border-muted/80 bg-surface-2/80 hover:bg-muted/40 transition-colors rounded-2xl shadow-sm cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
                          <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                          {new Date(s.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-xs font-medium text-foreground/70">{formatTime(s.start_time)}</div>
                      </div>
                      <p className="font-semibold text-sm text-foreground">{s.title}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Today's Agenda */}
          <Card className="border-muted/80 bg-surface-2/80 hover:bg-muted/40 transition-colors rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold">Today's Agenda</CardTitle>
              <CardDescription className="text-xs">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {todaySchedules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No sessions today.</p>
              ) : (
                <div className="relative pl-4 border-l border-muted/30 space-y-6">
                  {todaySchedules.map((s, idx) => (
                    <div key={s.id} className="relative">
                      <div className={cn(
                        'absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-[3px] border-surface',
                        s.status === 'Completed' ? 'bg-green-400' : AGENDA_COLORS[idx % AGENDA_COLORS.length].replace('text-', 'bg-')
                      )} />
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className={cn('text-xs mb-1', AGENDA_COLORS[idx % AGENDA_COLORS.length])}>
                            {formatTime(s.start_time)} - {formatTime(s.end_time)}
                          </div>
                          <div className="text-sm font-medium">{s.title}</div>
                        </div>
                        <Badge variant="outline" className={cn(
                          'rounded-md text-[10px] h-6 px-2 font-medium',
                          s.status === 'Completed'
                            ? 'bg-green-400/10 text-green-400 border-none'
                            : 'bg-surface border-muted text-muted-foreground'
                        )}>
                          {s.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      <CreateEventPanel open={showCreatePanel} onClose={() => setShowCreatePanel(false)} />

      <DayEventsPanel
        date={selectedDay}
        events={selectedDay ? getEventsForDate(selectedDay) : []}
        onClose={() => setSelectedDay(null)}
        onEventClick={evt => setManualSelectedEvent(evt)}
        onCreateEvent={() => setShowCreatePanel(true)}
      />

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setManualSelectedEvent(null)}
      />
    </div>
  )
}
