'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bell, X } from 'lucide-react'
import { useNotifications } from '@/lib/context/NotificationContext'
import { cn } from '@/lib/utils'

function timeUntil(start_time: string): string {
  const diff = Math.round((new Date(start_time).getTime() - Date.now()) / 60_000)
  if (diff <= 0) return 'Starting now'
  if (diff < 60) return `Starts in ${diff} minute${diff !== 1 ? 's' : ''}`
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return m ? `Starts in ${h}h ${m}min` : `Starts in ${h} hour${h !== 1 ? 's' : ''}`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead, dismiss, clearAll } = useNotifications()
  const [open, setOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      const target = e.target as Node
      const dropdown = document.getElementById('notification-dropdown')
      if (!btnRef.current?.contains(target) && !dropdown?.contains(target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  function handleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropdownPos({
        top:  rect.bottom + 8,
        left: rect.left,   // align left edges; dropdown grows to the right
      })
    }
    setOpen(v => !v)
    if (!open && unreadCount > 0) markAllRead()
  }

  const dropdown = open ? (
    <div
      id="notification-dropdown"
      className="w-80 rounded-2xl shadow-2xl overflow-hidden"
      style={{
        position: 'fixed',
        top:    dropdownPos.top,
        left:   dropdownPos.left,
        zIndex: 9999,
        background: 'oklch(0.145 0.018 228)',
        border: '1px solid oklch(0.26 0.020 225 / 0.6)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'oklch(0.24 0.018 225 / 0.5)' }}>
        <span className="text-sm font-semibold" style={{ color: 'oklch(0.93 0.008 228)' }}>
          Notifications
        </span>
        <button onClick={markAllRead}
          className="text-xs transition-opacity hover:opacity-70"
          style={{ color: 'oklch(0.72 0.18 195)' }}>
          Mark all read
        </button>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-xs text-center py-8" style={{ color: 'oklch(0.50 0.015 228)' }}>
            No notifications
          </p>
        ) : (
          notifications.map(n => (
            <div key={n.id}
              className={cn('flex items-start gap-3 px-4 py-3 border-b transition-colors',
                !n.read && 'bg-white/[0.03]')}
              style={{ borderColor: 'oklch(0.22 0.018 225 / 0.4)' }}
            >
              <Bell className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#00E5FF' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'oklch(0.88 0.008 228)' }}>
                  {n.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.012 228)' }}>
                  {timeUntil(n.start_time)}
                </p>
                <p className="text-xs" style={{ color: 'oklch(0.45 0.010 228)' }}>
                  {formatTime(n.start_time)}
                </p>
              </div>
              <button onClick={() => dismiss(n.id)}
                className="p-0.5 rounded hover:bg-white/10 transition-colors shrink-0"
                style={{ color: 'oklch(0.50 0.015 228)' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t" style={{ borderColor: 'oklch(0.24 0.018 225 / 0.5)' }}>
          <button onClick={() => { clearAll(); setOpen(false) }}
            className="w-full text-xs font-medium text-center transition-opacity hover:opacity-70"
            style={{ color: '#EF4444' }}>
            Clear All
          </button>
        </div>
      )}
    </div>
  ) : null

  return (
    <div className="ml-auto">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="relative p-1.5 rounded-lg transition-colors hover:bg-white/8"
        title="Notifications"
      >
        <Bell className="w-4 h-4" style={{ color: unreadCount > 0 ? '#00E5FF' : '#7E8A9A' }} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: '#EF4444', color: '#fff' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {typeof window !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  )
}
