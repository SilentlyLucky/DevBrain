import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// UTC-based — identical output on server and client regardless of timezone/locale
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December']

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr)
  return `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${hh}:${mm}`
}

// Relative time ("2h ago") — coarse enough that SSR/CSR drift doesn't matter
export function formatDistanceToNow(dateStr: string, now: Date = new Date()): string {
  const diffSec = Math.max(0, Math.floor((now.getTime() - new Date(dateStr).getTime()) / 1000))
  if (diffSec < 60)        return 'just now'
  if (diffSec < 3_600)     return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86_400)    return `${Math.floor(diffSec / 3_600)}h ago`
  if (diffSec < 604_800)   return `${Math.floor(diffSec / 86_400)}d ago`
  if (diffSec < 2_592_000) return `${Math.floor(diffSec / 604_800)}w ago`
  return `${Math.floor(diffSec / 2_592_000)}mo ago`
}
