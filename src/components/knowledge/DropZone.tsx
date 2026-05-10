'use client'
import { useState, useRef, useEffect } from 'react'
import { Upload, Loader2, FolderOpen, ChevronDown, Check, Plus, Sparkles } from 'lucide-react'
import { saveDocument } from '@/actions/documents'
import { setDocumentFolders, createFolder } from '@/actions/folders'
import { createClient } from '@/lib/supabase/client'
import { useStorage } from '@/lib/context/StorageContext'
import { cn } from '@/lib/utils'
import type { Folder } from '@/types'

const ACCEPTED_EXTENSIONS = [
  '.pdf', '.docx',
  '.txt', '.md',
  '.csv',
  '.html',
  '.js', '.ts', '.jsx', '.tsx',
  '.py', '.java', '.c', '.cpp', '.go', '.rs',
]

const BINARY_EXTENSIONS = new Set(['.pdf', '.docx'])
const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.join(',')
const EXTENSIONS_DISPLAY = 'pdf · docx · txt · md · csv · html · js · ts · jsx · tsx · py · java · c · cpp · go · rs'

type StatusType = 'loading' | 'success' | 'error'

const PRESET_COLORS = [
  '#3B82F6', '#06B6D4', '#8B5CF6', '#EC4899',
  '#10B981', '#F59E0B', '#EF4444', '#F97316',
]

// ─── Folder Selector Dropdown ─────────────────────────────────────────────────

interface FolderSelectorProps {
  folders: Folder[]
  selectedIds: string[]
  aiSuggestion: string | null
  aiNoMatch?: boolean        // AI ran but found no suitable folder
  onToggle: (id: string) => void
  onCreateFolder: (name: string, color: string) => Promise<void>
}

function FolderSelector({ folders, selectedIds, aiSuggestion, aiNoMatch, onToggle, onCreateFolder }: FolderSelectorProps) {
  const [open, setOpen] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [creating, setCreating] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Auto-open create form when AI signals no match
  function openWithCreateForm() {
    setOpen(true)
    setShowNew(true)
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selectedFolders = folders.filter(f => selectedIds.includes(f.id))

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    await onCreateFolder(newName.trim(), newColor)
    setNewName('')
    setShowNew(false)
    setCreating(false)
  }

  return (
    <div className="space-y-2" ref={ref}>
      <div className="relative">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 h-9 px-3 rounded-xl text-sm border transition-all w-full"
          style={{
            background: 'oklch(0.14 0.016 233)',
            borderColor: aiNoMatch && selectedFolders.length === 0
              ? 'oklch(0.72 0.18 195 / 0.5)'
              : 'oklch(0.28 0.020 220 / 0.6)',
            color: 'oklch(0.83 0.010 228)',
          }}
        >
          <FolderOpen className="w-4 h-4 shrink-0 text-primary" />
          <span className="flex-1 text-left truncate">
            {selectedFolders.length === 0
              ? <span style={{ color: 'oklch(0.45 0.012 228)' }}>Add to folder (optional)</span>
              : selectedFolders.map(f => f.name).join(', ')
            }
          </span>
          {aiSuggestion && selectedFolders.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full shrink-0"
              style={{ background: 'oklch(0.72 0.18 195 / 0.15)', color: 'oklch(0.72 0.18 195)' }}>
              <Sparkles className="w-2.5 h-2.5" /> AI
            </span>
          )}
          <ChevronDown className={cn('w-3.5 h-3.5 shrink-0 transition-transform', open && 'rotate-180')} />
        </button>

        {/* AI no-match nudge */}
        {aiNoMatch && selectedFolders.length === 0 && (
          <button
            type="button"
            onClick={openWithCreateForm}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-all hover:brightness-110 mt-1"
            style={{
              background: 'oklch(0.72 0.18 195 / 0.08)',
              border: '1px dashed oklch(0.72 0.18 195 / 0.45)',
              color: 'oklch(0.72 0.18 195)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1 text-left text-xs">
              No matching folder - <strong>create a new one?</strong>
            </span>
            <Plus className="w-3.5 h-3.5 shrink-0 opacity-70" />
          </button>
        )}

        {/* Dropdown */}
        {open && (
          <div
            className="absolute left-0 right-0 top-10 z-50 rounded-xl border border-muted shadow-2xl overflow-hidden"
            style={{ background: 'var(--color-surface-2)' }}
          >
            <p className="text-xs font-semibold px-3 pt-3 pb-1 text-muted-foreground">
              Folders {aiSuggestion && <span className="text-primary ml-1">· AI suggested</span>}
            </p>

            <div className="max-h-44 overflow-y-auto">
              {folders.length === 0 && (
                <p className="text-xs text-muted-foreground px-3 py-2 italic">No folders yet.</p>
              )}
              {folders.map(f => {
                const selected = selectedIds.includes(f.id)
                const isSuggested = f.name === aiSuggestion
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onToggle(f.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-white/5 transition-colors text-left"
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: f.color }} />
                    <span className="flex-1 truncate">{f.name}</span>
                    {isSuggested && !selected && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: 'oklch(0.72 0.18 195 / 0.15)', color: 'oklch(0.72 0.18 195)' }}>
                        ✨ suggested
                      </span>
                    )}
                    {selected && <Check className="w-3.5 h-3.5 shrink-0 text-primary" />}
                  </button>
                )
              })}
            </div>

            <div className="h-px mx-3 bg-muted" />

            {!showNew ? (
              <button
                type="button"
                onClick={() => setShowNew(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-primary hover:bg-white/5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Create new folder
              </button>
            ) : (
              <div className="p-3 space-y-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && void handleCreate()}
                  placeholder="Folder name"
                  className="w-full h-8 rounded-lg text-xs px-3 border border-muted bg-surface focus:outline-none"
                />
                <div className="flex gap-1.5 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setNewColor(c)}
                      className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                      style={{ background: c, outline: newColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setShowNew(false); setNewName('') }}
                    className="flex-1 h-7 rounded-lg text-xs border border-muted text-muted-foreground hover:text-foreground transition-colors">
                    Cancel
                  </button>
                  <button type="button" onClick={() => void handleCreate()}
                    disabled={!newName.trim() || creating}
                    className="flex-1 h-7 rounded-lg text-xs font-medium text-white disabled:opacity-50 transition-colors"
                    style={{ background: newColor }}>
                    {creating ? 'Adding…' : 'Add'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main DropZone ─────────────────────────────────────────────────────────────

      interface Props {
        folders ?: Folder[]
      }

      export function DropZone({folders = []}: Props) {
  const [isDragging, setIsDragging]   = useState(false)
      const [loading, setLoading]         = useState(false)
      const [status, setStatus]           = useState<string | null>(null)
      const [statusType, setStatusType]   = useState<StatusType>('success')
        const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([])
        const [aiSuggestion, setAiSuggestion]           = useState<string | null>(null)
        const [aiNoMatch, setAiNoMatch]                 = useState(false)
        const [localFolders, setLocalFolders]           = useState<Folder[]>(folders)
        const fileRef = useRef<HTMLInputElement>(null)
        const {refreshStorage} = useStorage()

        const [stagedFile, setStagedFile] = useState<{
          title: string
          content: string
          source_type: string
          file_extension: string
          fileUrl?: string
        } | null>(null)
        const [saving, setSaving] = useState(false)

          function toggleFolder(id: string) {
            setSelectedFolderIds(prev =>
              prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            )
          }

          async function handleCreateFolder(name: string, color: string) {
    const supabase = createClient()
          const {data: {user} } = await supabase.auth.getUser()
          if (!user) return
          const {data} = await supabase
          .from('folders')
          .insert({user_id: user.id, name, color })
          .select('*')
          .single()
          if (data) {
      const newFolder = data as Folder
      setLocalFolders(prev => [...prev, newFolder])
      setSelectedFolderIds(prev => [...prev, newFolder.id])
    }
  }

          async function suggestFolder(title: string, contentPreview: string) {
    if (localFolders.length === 0) return
          try {
      const res = await fetch('/api/suggest-folder', {
            method: 'POST',
          headers: {'Content-Type': 'application/json' },
          body: JSON.stringify({title, contentPreview, folderNames: localFolders.map(f => f.name) }),
      })
          if (!res.ok) return
          const {suggestion} = await res.json() as {suggestion: string | null }
          if (suggestion) {
            setAiSuggestion(suggestion)
            setAiNoMatch(false)
        const matched = localFolders.find(f => f.name === suggestion)
        if (matched) setSelectedFolderIds(prev => prev.includes(matched.id) ? prev : [...prev, matched.id])
      } else {
            setAiNoMatch(true)
          }
    } catch { /* non-fatal */}
  }

          async function processFile(file: File) {
    const ext = file.name.includes('.')
          ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
          : ''

          if (!ACCEPTED_EXTENSIONS.includes(ext)) {
            setStatus(`File type "${ext || '(unknown)'}" is not supported.`)
      setStatusType('error')
          return
    }

          setLoading(true)
          setStatusType('loading')
          setStatus(
          ext === '.pdf' ? 'Uploading PDF…'
          : ext === '.docx' ? 'Uploading DOCX…'
          : 'Processing file…'
          )

          try {
      const supabase = createClient()
          const {data: {user} } = await supabase.auth.getUser()
          if (!user) throw new Error('Not authenticated')

          let fileUrl: string | undefined

          if (BINARY_EXTENSIONS.has(ext)) {
        const path = `${user.id}/${crypto.randomUUID()}${ext}`
          const {error: uploadError } = await supabase.storage
          .from('documents')
          .upload(path, file, {contentType: file.type })
          if (uploadError) throw uploadError
          fileUrl = path
      }

          setStatus('Extracting text…')
          const {extractTextFromFile} = await import('@/lib/file-parser')
          let content = await extractTextFromFile(file)

          // For PDFs: detect image-heavy pages and describe them with Gemini Vision
          if (ext === '.pdf') {
        try {
          const {getPdfImagePages} = await import('@/lib/pdf-parser')
          const imagePages = await getPdfImagePages(file)
          if (imagePages.length > 0) {
            setStatus(`Analyzing ${imagePages.length} image page${imagePages.length > 1 ? 's' : ''}…`)
            const res = await fetch('/api/describe-images', {
            method: 'POST',
          headers: {'Content-Type': 'application/json' },
          body: JSON.stringify({pages: imagePages }),
            })
          if (res.ok) {
              const {descriptions} = await res.json() as {
            descriptions: {pageNum: number; description: string }[]
              }
              if (descriptions?.length > 0) {
                const imageText = descriptions
                  .sort((a, b) => a.pageNum - b.pageNum)
                  .map(d => `\n\n[Page ${d.pageNum} – Visual Content]\n${d.description}`)
          .join('')
          content = content + imageText
              }
            }
          }
        } catch (err) {
            console.error('[dropzone] image analysis failed:', err)
          }
      }

          if (!content.trim()) {
            setStatus('Could not extract any content from this file.')
        setStatusType('error')
          return
      }

          const title = file.name.replace(/\.[^/.]+$/, '')
          const source_type = ext === '.pdf' ? 'PDF' : 'FILE'

          // Stage file immediately so UI is responsive
          setStagedFile({ title, content, source_type, file_extension: ext, fileUrl })

          // AI suggestion runs in background - updates folder selector when it arrives
          suggestFolder(title, content.slice(0, 500))
          setStatusType('success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
          if (msg.startsWith('DUPLICATE:')) {
            setStatus(msg.replace('DUPLICATE: ', ''))
          } else if (msg.toLowerCase().includes('parse')) {
            setStatus('Failed to parse file.')
          } else {
            setStatus('Failed to process file.')
          }
          setStatusType('error')
    } finally {
            setLoading(false)
          }
  }

  async function confirmSave() {
    if (!stagedFile) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', stagedFile.title)
      fd.append('content', stagedFile.content)
      fd.append('source_type', stagedFile.source_type)
      fd.append('file_extension', stagedFile.file_extension)
      if (stagedFile.fileUrl) fd.append('file_url', stagedFile.fileUrl)

      const result = await saveDocument(fd) as {id ?: string} | undefined

      if (result?.id && selectedFolderIds.length > 0) {
        await setDocumentFolders(result.id, selectedFolderIds)
      }

      setStatus('Document saved!')
      setStatusType('success')
      setSelectedFolderIds([])
      setAiSuggestion(null)
      setAiNoMatch(false)
      setStagedFile(null)
      refreshStorage()
    } catch {
      setStatus('Failed to save document.')
      setStatusType('error')
    } finally {
      setSaving(false)
    }
  }

  function cancelSave() {
    setStagedFile(null)
    setSelectedFolderIds([])
    setAiSuggestion(null)
    setAiNoMatch(false)
    setStatus(null)
  }

          function handleDrop(e: React.DragEvent) {
            e.preventDefault()
    setIsDragging(false)
          const file = e.dataTransfer.files[0]
          if (file) processFile(file)
  }

          return (
          <div className="space-y-3">
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
                isDragging ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50'
              )}
            >
              <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">Drop file here or click to upload</p>
              <p className="text-xs text-muted-foreground mt-2">{EXTENSIONS_DISPLAY}</p>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT_ATTR}
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f) }}
              />
            </div>

            {/* Staged File UI */}
            {stagedFile && !loading && (
              <div className="p-4 rounded-xl border border-muted bg-surface-2 space-y-4 text-left">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">File Analyzed</h3>
                  <p className="text-xs text-muted-foreground truncate">{stagedFile.title}</p>
                </div>

                <FolderSelector
                  folders={localFolders}
                  selectedIds={selectedFolderIds}
                  aiSuggestion={aiSuggestion}
                  aiNoMatch={aiNoMatch}
                  onToggle={toggleFolder}
                  onCreateFolder={handleCreateFolder}
                />

                <div className="flex gap-2 pt-2">
                  <button onClick={cancelSave} disabled={saving} className="flex-1 py-2 rounded-lg text-xs font-medium border border-muted text-muted-foreground hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => void confirmSave()} disabled={saving} className="flex-1 py-2 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: 'oklch(0.55 0.25 270)' }}>
                    {saving ? 'Saving…' : 'Save Document'}
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {status}
              </div>
            )}
            {!loading && !stagedFile && status && statusType === 'success' && (
              <p className="text-sm text-green-400">{status}</p>
            )}
            {!loading && status && statusType === 'error' && (
              <p className="text-sm text-red-400">{status}</p>
            )}
          </div>
          )
}
