'use client'

import { useMemo } from 'react'

function formatLocalTime(iso: string): string {
  const d = new Date(iso)
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(d)
}

export function LocalTimeRange({ start, end }: { start: string; end: string }) {
  const label = useMemo(() => {
    if (!start || !end) return ''
    return `${formatLocalTime(start)} - ${formatLocalTime(end)}`
  }, [start, end])

  if (!label) return <span className="text-xs text-muted-foreground">--:-- - --:--</span>

  return <span className="text-xs text-muted-foreground">{label}</span>
}
