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

export interface Schedule {
  id: string
  user_id: string
  document_id: string | null
  document_ids: string[]
  title: string
  description?: string | null
  start_time: string
  end_time: string
  status: 'Upcoming' | 'Completed' | 'Missed'
  gcal_event_id: string | null
  reminder_minutes: number | null
  created_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url: string | null
}
