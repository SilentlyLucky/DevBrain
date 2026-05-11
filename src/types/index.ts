export interface Folder {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Document {
  id: string
  user_id: string
  title: string
  content?: string
  source_type: 'PDF' | 'URL' | 'FILE'
  file_extension?: string | null
  file_url?: string | null
  created_at: string
  folders?: Folder[]
}

export type ScheduleStatus = 'Upcoming' | 'Completed' | 'Missed'

export interface Schedule {
  id: string
  user_id: string
  document_id: string | null
  document_ids: string[]
  title: string
  description?: string | null
  start_time: string
  end_time: string
  status: ScheduleStatus
  gcal_event_id: string | null
  reminder_minutes: number | null
  created_at: string
}

export interface ScheduleUpdatePayload {
  title: string
  description: string | null
  start_time: string
  end_time: string
  reminder_minutes: number | null
  status?: ScheduleStatus
}

export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type ActivityItem = {
  type: 'document' | 'schedule'
  title: string
  subtitle: string
  date: string
}

export type Tone = 'teal' | 'indigo' | 'violet'

export const SUPPORTED_EXTENSIONS = [
  '.pdf', '.docx',
  '.txt', '.md',
  '.csv',
  '.html',
  '.js', '.ts', '.jsx', '.tsx',
  '.py', '.java', '.c', '.cpp', '.go', '.rs',
] as const

export type SupportedExtension = typeof SUPPORTED_EXTENSIONS[number]

export type RelevantChunk = {
  content: string
  document_title: string
  rrf_score: number
}

export type DocumentFolderMembershipRow = {
  document_id: string
  folders: Folder | Folder[] | null
}

export type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export type QuickActionProps = {
  icon: React.ReactNode
  title: string
  description: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url: string | null
}

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export type Filter = 'All' | 'Upcoming' | 'Completed' | 'Missed'

export type CalView = 'month' | 'week' | 'day'