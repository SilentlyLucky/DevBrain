'use client'
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Schedule } from '@/types'

export interface AppNotification {
  id: string
  title: string
  start_time: string
  read: boolean
}

const STORAGE_KEY = 'devbrain_notifications'
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function loadFromStorage(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AppNotification[]
    const cutoff = Date.now() - EXPIRY_MS
    return parsed.filter(n => new Date(n.start_time).getTime() > cutoff)
  } catch {
    return []
  }
}

interface NotificationContextValue {
  notifications: AppNotification[]
  unreadCount: number
  markAllRead: () => void
  dismiss: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  markAllRead: () => {},
  dismiss: () => {},
  clearAll: () => {},
})

export function useNotifications() {
  return useContext(NotificationContext)
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof window === 'undefined') return []
    return loadFromStorage()
  })
  const timers       = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const missedTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const supabaseRef  = useRef(createClient())


  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  }, [notifications])

  const addNotification = useCallback((schedule: Pick<Schedule, 'id' | 'title' | 'start_time'>) => {
    setNotifications(prev => {
      if (prev.some(n => n.id === schedule.id)) return prev
      return [...prev, { id: schedule.id, title: schedule.title, start_time: schedule.start_time, read: false }]
    })
  }, [])

  const registerMissedTimer = useCallback((schedule: Schedule) => {
    const existing = missedTimers.current.get(schedule.id)
    if (existing) clearTimeout(existing)

    const now   = Date.now()
    const endAt = new Date(schedule.end_time).getTime()
    const delay = endAt - now

    async function markMissed() {
      await supabaseRef.current
        .from('schedules')
        .update({ status: 'Missed' })
        .eq('id', schedule.id)
        .eq('status', 'Upcoming')
      window.dispatchEvent(new CustomEvent('schedule-status-changed'))
      missedTimers.current.delete(schedule.id)
    }

    if (delay <= 0) {
      void markMissed()
    } else {
      const t = setTimeout(() => void markMissed(), delay)
      missedTimers.current.set(schedule.id, t)
    }
  }, [])

  const cancelMissedTimer = useCallback((scheduleId: string) => {
    const t = missedTimers.current.get(scheduleId)
    if (t) { clearTimeout(t); missedTimers.current.delete(scheduleId) }
  }, [])

  const registerTimer = useCallback((schedule: Schedule) => {
    if (!schedule.reminder_minutes) return
    const existing = timers.current.get(schedule.id)
    if (existing) clearTimeout(existing)

    const now          = Date.now()
    const reminderAt   = new Date(schedule.start_time).getTime() - schedule.reminder_minutes * 60_000
    const eventStartsAt = new Date(schedule.start_time).getTime()
    const delay        = reminderAt - now

    if (delay <= 0) {
      if (now < eventStartsAt) addNotification(schedule)
      return
    }

    const t = setTimeout(() => {
      addNotification(schedule)
      timers.current.delete(schedule.id)
    }, delay)
    timers.current.set(schedule.id, t)
  }, [addNotification])

  const cancelTimer = useCallback((scheduleId: string) => {
    const t = timers.current.get(scheduleId)
    if (t) { clearTimeout(t); timers.current.delete(scheduleId) }
  }, [])

  useEffect(() => {
    let channel: ReturnType<typeof supabaseRef.current.channel> | null = null

    async function init() {
      const { data: { user } } = await supabaseRef.current.auth.getUser()
      if (!user) return

      const { data } = await supabaseRef.current
        .from('schedules')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'Upcoming')

      if (data) {
        for (const s of data as Schedule[]) {
          registerMissedTimer(s)
          if (s.reminder_minutes) registerTimer(s)
        }
      }

      channel = supabaseRef.current
        .channel(`notification-schedules-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'schedules', filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              const old = payload.old as Schedule
              cancelTimer(old.id)
              cancelMissedTimer(old.id)
              setNotifications(prev => prev.filter(n => n.id !== old.id))
              return
            }
            const s = payload.new as Schedule
            if (s.status === 'Upcoming') {
              registerMissedTimer(s)
              if (s.reminder_minutes) registerTimer(s)
            } else {
              cancelTimer(s.id)
              cancelMissedTimer(s.id)
            }
          }
        )
        .subscribe()
    }

    init().catch(console.error)

    return () => {
      timers.current.forEach(t => clearTimeout(t))
      timers.current.clear()
      missedTimers.current.forEach(t => clearTimeout(t))
      missedTimers.current.clear()
      if (channel) supabaseRef.current.removeChannel(channel)
    }
  }, [registerTimer, cancelTimer, registerMissedTimer, cancelMissedTimer])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = useCallback(() =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true }))), [])

  const dismiss = useCallback((id: string) =>
    setNotifications(prev => prev.filter(n => n.id !== id)), [])

  const clearAll = useCallback(() => setNotifications([]), [])

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, dismiss, clearAll }}>
      {children}
    </NotificationContext.Provider>
  )
}
