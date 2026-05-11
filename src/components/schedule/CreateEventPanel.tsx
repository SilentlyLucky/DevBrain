'use client'
import { useState, useEffect, useRef } from 'react'
import { CalendarIcon, Clock, X, Tag, Lock, ChevronDown, Plus, Check, BookOpen, FileText, Globe, Table, Code } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createSchedule } from '@/actions/schedules'
import { updateScheduleGcalId } from '@/actions/schedules'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-notification'
import { cn } from '@/lib/utils'

interface Category { id: string; name: string; color: string }
interface DocOption { id: string; title: string; file_extension: string | null; source_type: string }

const CODE_EXTS = new Set(['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.go', '.rs'])

function DocIcon({ ext, type }: { ext: string | null; type: string }) {
  if (type === 'URL') return <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: '#A855F7' }} />
  if (ext === '.pdf') return <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: '#EF4444' }} />
  if (ext === '.csv') return <Table className="w-3.5 h-3.5 shrink-0" style={{ color: '#10B981' }} />
  if (ext === '.md' || ext === '.txt') return <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: '#60A5FA' }} />
  if (ext && CODE_EXTS.has(ext)) return <Code className="w-3.5 h-3.5 shrink-0" style={{ color: '#F59E0B' }} />
  return <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: 'oklch(0.55 0.015 228)' }} />
}

const PRESET_COLORS = [
  '#3B82F6', '#06B6D4', '#8B5CF6', '#EC4899',
  '#10B981', '#F59E0B', '#EF4444', '#F97316',
]

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'personal', name: 'Personal', color: '#3B82F6' },
  { id: 'work', name: 'Work', color: '#10B981' },
]

function loadCategories(): Category[] {
  try {
    if (typeof window === 'undefined') return DEFAULT_CATEGORIES
    const raw = localStorage.getItem('devbrain-categories')
    return raw ? JSON.parse(raw) : DEFAULT_CATEGORIES
  } catch { return DEFAULT_CATEGORIES }
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function combineDateAndTime(date: Date | undefined, time: string): string | null {
  if (!date) return null
  const [h, m] = time.split(':').map(Number)
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface Props { open: boolean; onClose: () => void }

export function CreateEventPanel({ open, onClose }: Props) {
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [startTime, setStartTime] = useState('09:00')
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [endTime, setEndTime] = useState('10:00')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Category
  const initialCategories = typeof window !== 'undefined' ? loadCategories() : DEFAULT_CATEGORIES
  const [categories, setCategories] = useState<Category[]>(initialCategories) 
  const [selectedCat, setSelectedCat] = useState<Category>( initialCategories[0] || DEFAULT_CATEGORIES[0] )
  const [catOpen, setCatOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0])
  const [showNewCat, setShowNewCat] = useState(false)
  const catRef = useRef<HTMLDivElement>(null)

  // Related documents (multi-select)
  const [documents, setDocuments] = useState<DocOption[]>([])
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
  const [docOpen, setDocOpen] = useState(false)
  const docRef = useRef<HTMLDivElement>(null)

  // Google Calendar
  const [hasGoogle, setHasGoogle] = useState(false)
  const [addToGcal, setAddToGcal] = useState(false)

  // Reminder
  const REMINDER_PRESETS = [
    { label: 'No reminder', value: null },
    { label: '15 minutes before', value: 15 },
    { label: '30 minutes before', value: 30 },
    { label: '1 hour before', value: 60 },
    { label: '3 hours before', value: 180 },
    { label: '1 day before', value: 1440 },
    { label: 'Custom…', value: 'custom' as const },
  ] as const

  const [reminderValue, setReminderValue] = useState<number | null | 'custom'>(null)
  const [customAmount, setCustomAmount] = useState('30')
  const [customUnit, setCustomUnit] = useState<'minutes' | 'hours'>('minutes')

  // Persist categories
  useEffect(() => {
      localStorage.setItem('devbrain-categories', JSON.stringify(categories))
  }, [categories])

  // Notify AiWidget to hide when panel is open
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('schedule-panel', { detail: { open } }))
  }, [open])

  // Check Google identity + fetch documents
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      const linked = u?.identities?.some(i => i.provider === 'google') ?? false
      setHasGoogle(linked)
    })
    supabase.from('documents').select('id, title, file_extension, source_type').order('title').then(({ data }) => {
      if (data) setDocuments(data as DocOption[])
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close document dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (docRef.current && !docRef.current.contains(e.target as Node)) setDocOpen(false)
    }
    if (docOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [docOpen])

  // Close cat dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false); setShowNewCat(false)
      }
    }
    if (catOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [catOpen])

  function handleClose() {
    setTitle(''); setDescription(''); setStartDate(undefined); setEndDate(undefined)
    setStartTime('09:00'); setEndTime('10:00'); setError(null)
    setShowNewCat(false); setNewCatName(''); setCatOpen(false)
    setSelectedDocIds([]); setDocOpen(false)
    setReminderValue(null); setCustomAmount('30'); setCustomUnit('minutes')
    onClose()
  }

  function addCategory() {
    const name = newCatName.trim()
    if (!name) return
    const cat: Category = { id: `${Date.now()}`, name, color: newCatColor }
    const next = [...categories, cat]
    setCategories(next)
    setSelectedCat(cat)
    setNewCatName(''); setShowNewCat(false); setCatOpen(false)
  }

  function resolvedReminderMinutes(): number | null {
    if (reminderValue === null) return null
    if (reminderValue === 'custom') {
      const n = parseInt(customAmount, 10)
      if (isNaN(n) || n <= 0) return null
      return customUnit === 'hours' ? n * 60 : n
    }
    return reminderValue
  }

  async function handleSubmit() {
    setError(null)
    if (!title.trim()) { setError('Title is required'); return }
    if (!startDate) { setError('Start date is required'); return }
    if (!endDate) { setError('End date is required'); return }

    const start = combineDateAndTime(startDate, startTime)!
    const end = combineDateAndTime(endDate, endTime)!

    if (new Date(end) <= new Date(start)) {
      setError('End time must be after start time')
      return
    }

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', title.trim())
      const desc = description.trim()
        ? `[${selectedCat.name}] ${description.trim()}`
        : `[${selectedCat.name}]`
      fd.append('description', desc)
      fd.append('start_time', start)
      fd.append('end_time', end)
      selectedDocIds.forEach(id => fd.append('document_ids', id))
      const rm = resolvedReminderMinutes()
      if (rm !== null) fd.append('reminder_minutes', String(rm))
      await createSchedule(fd)

      // Google Calendar sync
      if (addToGcal && hasGoogle) {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.provider_token ?? null
        if (token) {
          const res = await fetch('/api/calendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: title.trim(),
              start_time: new Date(start).toISOString(),
              end_time: new Date(end).toISOString(),
              provider_token: token,
            }),
          })
          if (res.ok) {
            const { gcal_event_id } = await res.json()
            // update gcal_event_id on the newly created schedule
            if (gcal_event_id) {
              const { data: schedules } = await supabase
                .from('schedules')
                .select('id')
                .eq('title', title.trim())
                .order('created_at', { ascending: false })
                .limit(1)
              if (schedules?.[0]) await updateScheduleGcalId(schedules[0].id, gcal_event_id)
            }
          }
        }
      }

      toast.success('Schedule created!')
      handleClose()
      router.refresh()
    } catch {
      toast.error('Failed to create schedule.')
    } finally {
      setSaving(false)
    }
  }

  // Shared input style
  const fieldBase = 'w-full rounded-xl text-sm text-foreground border focus:outline-none focus:ring-1 transition-all duration-150 placeholder:text-muted-foreground/40'
  const fieldStyle = { background: 'oklch(0.14 0.016 233)', borderColor: 'oklch(0.28 0.020 220 / 0.6)' }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40" onClick={handleClose} />}

      <div className={cn(
        'fixed top-0 right-0 h-full w-[440px] z-50 flex flex-col transition-transform duration-300 bg-surface-2 border-l border-muted',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b bg-[#07111F]" style={{ borderColor: 'oklch(0.24 0.018 225 / 0.5)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'oklch(0.22 0.10 195 / 0.5)', border: '1px solid oklch(0.55 0.18 195 / 0.4)' }}>
              <CalendarIcon className="w-5 h-5" style={{ color: 'oklch(0.75 0.18 195)' }} />
            </div>
            <div>
              <h2 className="font-semibold text-base" style={{ color: 'oklch(0.93 0.008 228)' }}>Create A Session</h2>
              <p className="text-xs mt-0.5" style={{ color: 'oklch(0.50 0.015 228)' }}>Plan your activities with DevBrain</p>
            </div>
          </div>
          <button onClick={handleClose} className="transition-colors rounded-lg p-1.5"
            style={{ color: 'oklch(0.50 0.015 228)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'oklch(0.22 0.018 228)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: 'oklch(0.78 0.010 228)' }}>Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Task or event title"
              className={`${fieldBase} h-11 px-4`}
              style={{ ...fieldStyle, '--tw-ring-color': 'oklch(0.72 0.18 195 / 0.3)' } as React.CSSProperties}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: 'oklch(0.78 0.010 228)' }}>Description</label>
            <div className="relative">
              <textarea
                value={description}
                onChange={e => { if (e.target.value.length <= 300) setDescription(e.target.value) }}
                placeholder="Optional description"
                rows={3}
                className={`${fieldBase} px-4 py-3 resize-none focus:ring-1`}
                style={{ ...fieldStyle, '--tw-ring-color': 'oklch(0.72 0.18 195 / 0.3)' } as React.CSSProperties}
              />
              <span className="absolute bottom-2.5 right-3 text-[11px]" style={{ color: 'oklch(0.45 0.012 228)' }}>
                {description.length}/300
              </span>
            </div>
          </div>

          {/* Start + End side by side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Start */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: 'oklch(0.78 0.010 228)' }}>Start *</label>
              <Popover>
                <PopoverTrigger className="w-full h-10 rounded-xl text-sm text-left px-3 flex items-center gap-2 border transition-colors"
                  style={{ ...fieldStyle, color: startDate ? 'oklch(0.85 0.008 228)' : 'oklch(0.45 0.012 228)' }}>
                  <CalendarIcon className="w-3.5 h-3.5 shrink-0" style={{ color: 'oklch(0.55 0.015 228)' }} />
                  <span className="truncate text-xs">{startDate ? formatDate(startDate) : 'Pick date'}</span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                </PopoverContent>
              </Popover>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'oklch(0.50 0.015 228)' }} />
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                  className={`${fieldBase} h-10 pl-9 pr-3`}
                  style={{ ...fieldStyle, '--tw-ring-color': 'oklch(0.72 0.18 195 / 0.3)' } as React.CSSProperties}
                />
              </div>
            </div>

            {/* End */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: 'oklch(0.78 0.010 228)' }}>End *</label>
              <Popover>
                <PopoverTrigger className="w-full h-10 rounded-xl text-sm text-left px-3 flex items-center gap-2 border transition-colors"
                  style={{ ...fieldStyle, color: endDate ? 'oklch(0.85 0.008 228)' : 'oklch(0.45 0.012 228)' }}>
                  <CalendarIcon className="w-3.5 h-3.5 shrink-0" style={{ color: 'oklch(0.55 0.015 228)' }} />
                  <span className="truncate text-xs">{endDate ? formatDate(endDate) : 'Pick date'}</span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                </PopoverContent>
              </Popover>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'oklch(0.50 0.015 228)' }} />
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                  className={`${fieldBase} h-10 pl-9 pr-3`}
                  style={{ ...fieldStyle, '--tw-ring-color': 'oklch(0.72 0.18 195 / 0.3)' } as React.CSSProperties}
                />
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-400 -mt-2">{error}</p>}

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: 'oklch(0.78 0.010 228)' }}>Category</label>
            <div className="relative" ref={catRef}>
              <button
                type="button"
                onClick={() => { setCatOpen(v => !v); setShowNewCat(false) }}
                className="w-full h-11 rounded-xl flex items-center gap-3 px-3 border text-sm transition-colors"
                style={{ ...fieldStyle, color: 'oklch(0.83 0.010 228)' }}
              >
                <Tag className="w-4 h-4 shrink-0" style={{ color: 'oklch(0.55 0.015 228)' }} />
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: selectedCat.color }} />
                <span className="flex-1 text-left text-sm">{selectedCat.name}</span>
                <ChevronDown className={cn('w-4 h-4 shrink-0 transition-transform', catOpen && 'rotate-180')}
                  style={{ color: 'oklch(0.50 0.015 228)' }} />
              </button>

              {catOpen && (
                <div className="absolute left-0 right-0 top-12 z-50 rounded-xl border shadow-2xl overflow-hidden"
                  style={{ background: 'oklch(0.18 0.020 228)', borderColor: 'oklch(0.28 0.020 220 / 0.6)' }}>

                  {/* Existing categories */}
                  <div className="py-1.5 max-h-48 overflow-y-auto">
                    {categories.map(cat => (
                      <button key={cat.id} type="button"
                        onClick={() => { setSelectedCat(cat); setCatOpen(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-white/5 text-left"
                        style={{ color: 'oklch(0.83 0.010 228)' }}
                      >
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color }} />
                        {cat.name}
                        {selectedCat.id === cat.id && <Check className="w-3.5 h-3.5 ml-auto" style={{ color: 'oklch(0.72 0.18 195)' }} />}
                      </button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="h-px mx-3" style={{ background: 'oklch(0.26 0.018 225 / 0.5)' }} />

                  {/* Add new category */}
                  {!showNewCat ? (
                    <button type="button" onClick={() => setShowNewCat(true)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-white/5"
                      style={{ color: 'oklch(0.72 0.18 195)' }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add category
                    </button>
                  ) : (
                    <div className="p-3 space-y-2.5">
                      <input
                        autoFocus
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCategory()}
                        placeholder="Category name"
                        className="w-full h-8 rounded-lg text-xs px-3 border focus:outline-none"
                        style={{ background: 'oklch(0.14 0.016 233)', borderColor: 'oklch(0.28 0.020 220 / 0.6)', color: 'oklch(0.85 0.008 228)' }}
                      />
                      {/* Color picker */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {PRESET_COLORS.map(c => (
                          <button key={c} type="button" onClick={() => setNewCatColor(c)}
                            className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                            style={{ background: c, outline: newCatColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { setShowNewCat(false); setNewCatName('') }}
                          className="flex-1 h-7 rounded-lg text-xs transition-colors hover:bg-white/5"
                          style={{ border: '1px solid oklch(0.28 0.020 220 / 0.5)', color: 'oklch(0.55 0.015 228)' }}>
                          Cancel
                        </button>
                        <button type="button" onClick={addCategory}
                          className="flex-1 h-7 rounded-lg text-xs font-medium transition-colors"
                          style={{ background: 'oklch(0.72 0.18 195)', color: '#000' }}>
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related Documents (multi-select) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: 'oklch(0.78 0.010 228)' }}>
              Related Documents <span style={{ color: 'oklch(0.45 0.012 228)' }}>(optional)</span>
            </label>
            <div className="relative" ref={docRef}>
              <button
                type="button"
                onClick={() => setDocOpen(v => !v)}
                className="w-full min-h-11 rounded-xl flex items-center gap-3 px-3 py-2 border text-sm transition-colors"
                style={{ ...fieldStyle, color: 'oklch(0.83 0.010 228)' }}
              >
                <BookOpen className="w-4 h-4 shrink-0" style={{ color: 'oklch(0.55 0.015 228)' }} />
                <span className="flex-1 text-left text-sm">
                  {selectedDocIds.length === 0
                    ? <span style={{ color: 'oklch(0.45 0.012 228)' }}>No documents linked</span>
                    : <span className="flex flex-wrap gap-1">
                      {selectedDocIds.map(id => {
                        const doc = documents.find(d => d.id === id)
                        return doc ? (
                          <span key={id} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'oklch(0.72 0.18 195 / 0.15)', color: 'oklch(0.72 0.18 195)' }}>
                            <DocIcon ext={doc.file_extension ?? null} type={doc.source_type} />
                            {doc.title}
                          </span>
                        ) : null
                      })}
                    </span>
                  }
                </span>
                <ChevronDown className={cn('w-4 h-4 shrink-0 transition-transform', docOpen && 'rotate-180')}
                  style={{ color: 'oklch(0.50 0.015 228)' }} />
              </button>

              {docOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border shadow-2xl overflow-hidden"
                  style={{ background: 'oklch(0.18 0.020 228)', borderColor: 'oklch(0.28 0.020 220 / 0.6)' }}>
                  {documents.length === 0 ? (
                    <p className="px-3 py-3 text-xs italic text-center" style={{ color: 'oklch(0.45 0.012 228)' }}>
                      No documents uploaded yet
                    </p>
                  ) : (
                    <div className="py-1.5 max-h-52 overflow-y-auto">
                      {documents.map(doc => {
                        const checked = selectedDocIds.includes(doc.id)
                        return (
                          <button key={doc.id} type="button"
                            onClick={() => setSelectedDocIds(prev =>
                              checked ? prev.filter(id => id !== doc.id) : [...prev, doc.id]
                            )}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-white/5 text-left"
                            style={{ color: 'oklch(0.83 0.010 228)' }}
                          >
                            {/* File type icon */}
                            <DocIcon ext={doc.file_extension ?? null} type={doc.source_type} />
                            <span className="flex-1 truncate">{doc.title}</span>
                            {/* Ext badge */}
                            {doc.file_extension && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0"
                                style={{ background: 'oklch(0.24 0.018 228)', color: 'oklch(0.52 0.012 228)' }}>
                                {doc.file_extension.replace('.', '')}
                              </span>
                            )}
                            {doc.source_type === 'URL' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0"
                                style={{ background: 'oklch(0.24 0.018 228)', color: 'oklch(0.52 0.012 228)' }}>
                                url
                              </span>
                            )}
                            {/* Checkbox */}
                            <div className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
                              style={{
                                background: checked ? 'oklch(0.72 0.18 195)' : 'oklch(0.24 0.018 228)',
                                border: checked ? 'none' : '1px solid oklch(0.35 0.018 228)',
                              }}>
                              {checked && <Check className="w-3 h-3 text-black" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {selectedDocIds.length > 0 && (
                    <div className="px-3 py-2 border-t flex items-center justify-between"
                      style={{ borderColor: 'oklch(0.26 0.018 225 / 0.5)' }}>
                      <span className="text-xs" style={{ color: 'oklch(0.55 0.015 228)' }}>
                        {selectedDocIds.length} selected
                      </span>
                      <button type="button" onClick={() => setSelectedDocIds([])}
                        className="text-xs hover:opacity-80 transition-opacity"
                        style={{ color: 'oklch(0.65 0.18 20)' }}>
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Add to Calendar */}
          <div className="rounded-xl p-4 space-y-2.5"
            style={{ background: 'oklch(0.17 0.018 228)', border: '1px solid oklch(0.26 0.018 225 / 0.5)' }}>
            <p className="text-xs font-semibold" style={{ color: 'oklch(0.78 0.010 228)' }}>Add to Calendar</p>

            <div className={cn('flex items-center gap-3', !hasGoogle && 'opacity-40')}>
              {/* Google G icon */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'oklch(0.22 0.018 228)' }}>
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <span className="flex-1 text-sm" style={{ color: 'oklch(0.83 0.010 228)' }}>
                Add to Google Calendar
              </span>
              {/* Toggle switch */}
              <button
                type="button"
                disabled={!hasGoogle}
                onClick={() => hasGoogle && setAddToGcal(v => !v)}
                className={cn('relative w-10 h-5.5 rounded-full transition-all duration-200 shrink-0', !hasGoogle && 'cursor-not-allowed')}
                style={{
                  height: '22px',
                  background: addToGcal && hasGoogle ? 'oklch(0.72 0.18 195)' : 'oklch(0.28 0.018 228)',
                  boxShadow: addToGcal && hasGoogle ? '0 0 8px oklch(0.72 0.18 195 / 0.4)' : 'none',
                }}
              >
                <span className="absolute top-[2px] transition-all duration-200 w-[18px] h-[18px] rounded-full bg-white shadow"
                  style={{ left: addToGcal && hasGoogle ? 'calc(100% - 20px)' : '2px' }} />
              </button>
            </div>

            <p className="text-[11px]" style={{ color: 'oklch(0.45 0.012 228)' }}>
              {hasGoogle
                ? (addToGcal ? 'The session will be added to your Google Calendar.' : 'Toggle to sync with Google Calendar.')
                : 'Connect your Google account in Settings to enable this feature.'
              }
            </p>
          </div>

          {/* Reminder */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: 'oklch(0.78 0.010 228)' }}>
              Reminder <span style={{ color: 'oklch(0.45 0.012 228)' }}>(optional)</span>
            </label>
            <select
              value={reminderValue === null ? 'null' : reminderValue === 'custom' ? 'custom' : String(reminderValue)}
              onChange={e => {
                const v = e.target.value
                if (v === 'null') setReminderValue(null)
                else if (v === 'custom') setReminderValue('custom')
                else setReminderValue(Number(v))
              }}
              className="w-full h-11 rounded-xl text-sm px-3 border focus:outline-none transition-all"
              style={{ background: 'oklch(0.14 0.016 233)', borderColor: 'oklch(0.28 0.020 220 / 0.6)', color: 'oklch(0.83 0.010 228)' }}
            >
              {REMINDER_PRESETS.map(p => (
                <option key={String(p.value)} value={p.value === null ? 'null' : String(p.value)}>
                  {p.label}
                </option>
              ))}
            </select>

            {reminderValue === 'custom' && (
              <div className="flex gap-2 mt-2">
                <input
                  type="number"
                  min={1}
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  className="w-24 h-10 rounded-xl text-sm px-3 border focus:outline-none"
                  style={{ background: 'oklch(0.14 0.016 233)', borderColor: 'oklch(0.28 0.020 220 / 0.6)', color: 'oklch(0.83 0.010 228)' }}
                />
                <select
                  value={customUnit}
                  onChange={e => setCustomUnit(e.target.value as 'minutes' | 'hours')}
                  className="flex-1 h-10 rounded-xl text-sm px-3 border focus:outline-none"
                  style={{ background: 'oklch(0.14 0.016 233)', borderColor: 'oklch(0.28 0.020 220 / 0.6)', color: 'oklch(0.83 0.010 228)' }}
                >
                  <option value="minutes">minutes before</option>
                  <option value="hours">hours before</option>
                </select>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t space-y-3 bg-[#07111F]" style={{ borderColor: 'oklch(0.24 0.018 225 / 0.5)' }}>
          <div className="flex gap-3">
            <button onClick={handleClose} disabled={saving}
              className="flex-1 h-11 rounded-xl text-sm font-medium transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ background: 'oklch(0.20 0.018 228)', border: '1px solid oklch(0.30 0.020 220 / 0.5)', color: 'oklch(0.80 0.010 228)' }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 h-11 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(90deg, oklch(0.72 0.18 195), oklch(0.60 0.22 280))',
                boxShadow: saving ? 'none' : '0 4px 20px oklch(0.72 0.18 195 / 0.35)',
              }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.boxShadow = '0 4px 28px oklch(0.72 0.18 195 / 0.60)' }}
              onMouseLeave={e => { if (!saving) e.currentTarget.style.boxShadow = '0 4px 20px oklch(0.72 0.18 195 / 0.35)' }}
            >
              <CalendarIcon className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Session'}
            </button>
          </div>
          <p className="text-center text-[11px] flex items-center justify-center gap-1.5" style={{ color: 'oklch(0.40 0.010 228)' }}>
            <Lock className="w-3 h-3" /> Your data is private and secure
          </p>
        </div>
      </div>
    </>
  )
}
