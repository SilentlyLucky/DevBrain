'use client'
import { useState } from 'react'
import {
  ChevronDown, ChevronRight, Pencil, Trash2,
  Eye, Download, FileText, Globe, FileCode, Table2, Code, AlignLeft, Loader2,
} from 'lucide-react'
import { removeDocumentFromFolder } from '@/actions/folders'
import { deleteDocument, fetchDocumentContent, getDocumentSignedUrl} from '@/actions/documents'
import { FolderManagerDropdown } from './FolderManagerDropdown'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-notification'
import { useStorage } from '@/lib/context/StorageContext'
import { formatDate } from '@/lib/utils'
import type { Document, Folder } from '@/types'

const CODE_EXTS = new Set(['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.go', '.rs'])

function getDocumentIcon(doc: Document) {
  const ext = doc.file_extension ?? null
  if (doc.source_type === 'PDF' || ext === '.pdf') return { Icon: FileText, color: 'text-red-400' }
  if (ext === '.docx') return { Icon: FileText, color: 'text-blue-400' }
  if (ext === '.md')   return { Icon: FileCode,  color: 'text-purple-400' }
  if (ext === '.csv')  return { Icon: Table2,    color: 'text-green-400' }
  if (ext === '.html') return { Icon: Globe,     color: 'text-orange-400' }
  if (ext && CODE_EXTS.has(ext)) return { Icon: Code, color: 'text-cyan-400' }
  if (doc.source_type === 'URL') return { Icon: Globe, color: 'text-blue-400' }
  return { Icon: AlignLeft, color: 'text-muted-foreground' }
}

interface DocRowProps {
  doc: Document
  allFolders: Folder[]
  onPreview: (doc: Document) => void
  onRenameDoc?: (doc: Document) => void
}

function DocumentRow({ doc, allFolders, onPreview, onRenameDoc }: DocRowProps) {
  const router = useRouter()
  const toast = useToast()
  const { refreshStorage } = useStorage()
  const { Icon, color } = getDocumentIcon(doc)
  const docFolderIds = (doc.folders ?? []).map(f => f.id)

  async function downloadDocument(doc: Document) {
    try {
      const isBinary = doc.source_type === 'PDF' || doc.file_extension === '.docx'
      let blob: Blob
      if (isBinary && doc.file_url) {
        const url = await getDocumentSignedUrl(doc.id)
        const res = await fetch(url)
        blob = await res.blob()
      } else {
        const content = await fetchDocumentContent(doc.id) ?? ''
        blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      }
      const safeTitle = doc.title.replace(/[^a-z0-9\-_. ]/gi, '').replace(/\s+/g, '_').slice(0, 80) || 'document'
      const ext = doc.file_extension ?? '.txt'
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${safeTitle}${ext}`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 100)
    } catch {
      toast.error('Failed to download.')
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
      {/* Icon + Title */}
      <Icon className={`w-4 h-4 shrink-0 ${color}`} />
      <span className="flex-1 text-sm font-medium truncate min-w-0">{doc.title}</span>

      {/* Folder badges */}
      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
        {(doc.folders ?? []).map(f => (
          <span
            key={f.id}
            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: `${f.color}22`, color: f.color, border: `1px solid ${f.color}44` }}
          >
            {f.name}
            <button
              onClick={async () => {
                await removeDocumentFromFolder(doc.id, f.id)
                router.refresh()
              }}
              className="hover:opacity-70 transition-opacity ml-0.5"
              title="Remove from folder"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <FolderManagerDropdown documentId={doc.id} allFolders={allFolders} documentFolderIds={docFolderIds} />
        <button onClick={() => onPreview(doc)} className="text-muted-foreground hover:text-primary transition-colors" title="Preview">
          <Eye className="w-4 h-4" />
        </button>
        {onRenameDoc && (
          <button onClick={() => onRenameDoc(doc)} className="text-muted-foreground hover:text-primary transition-colors" title="Rename document">
            <Pencil className="w-4 h-4" />
          </button>
        )}
        <button onClick={() => void downloadDocument(doc)} className="text-muted-foreground hover:text-primary transition-colors" title="Download">
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={async () => {
            await deleteDocument(doc.id)
            refreshStorage()
            router.refresh()
          }}
          className="text-muted-foreground hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Date */}
      <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{formatDate(doc.created_at)}</span>
    </div>
  )
}

interface FolderSectionProps {
  folder: Folder | null
  documents: Document[]
  allFolders: Folder[]
  onPreview: (doc: Document) => void
  onRename?: (id: string, currentName: string) => void
  onDelete?: (id: string, name: string) => void
  onRenameDoc?: (doc: Document) => void
}

export function FolderSection({ folder, documents, allFolders, onPreview, onRename, onDelete, onRenameDoc }: FolderSectionProps) {
  const storageKey = folder ? `devbrain-folder-open-${folder.id}` : 'devbrain-folder-open-uncategorized'
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem(storageKey)
    return saved === null ? true : saved === 'true'
  })

  function toggle() {
    setOpen(v => {
      localStorage.setItem(storageKey, String(!v))
      return !v
    })
  }

  const isVirtual = folder === null
  const label = isVirtual ? 'Uncategorized' : folder.name
  const dotColor = isVirtual ? '#6b7280' : folder.color

  return (
    <div className="rounded-xl border border-muted">
      {/* Header */}
      <div
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-white/5 transition-colors ${open ? 'rounded-t-xl' : 'rounded-xl'}`}
        style={{ background: 'var(--color-surface-2)' }}
        onClick={toggle}
      >
        <span className="text-muted-foreground shrink-0">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dotColor }} />
        <span className="font-semibold text-sm flex-1 min-w-0 truncate">{label}</span>
        <span className="text-xs text-muted-foreground shrink-0">({documents.length})</span>

        {/* Folder actions (not for Uncategorized) */}
        {!isVirtual && (
          <div className="flex items-center gap-1 ml-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onRename?.(folder!.id, folder!.name)}
              className="text-muted-foreground hover:text-primary transition-colors p-1 rounded"
              title="Rename folder"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete?.(folder!.id, folder!.name)}
              className="text-muted-foreground hover:text-red-400 transition-colors p-1 rounded"
              title="Delete folder"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Documents */}
      {open && (
        <div className="divide-y divide-muted/40 px-1 py-1">
          {documents.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No documents in this folder.</p>
          ) : (
            documents.map(doc => (
              <DocumentRow key={doc.id} doc={doc} allFolders={allFolders} onPreview={onPreview} onRenameDoc={onRenameDoc} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

interface RenameDialogProps {
  open: boolean
  currentName: string
  onClose: () => void
  onSave: (name: string) => Promise<void>
}

export function RenameFolderDialog({ open, currentName, onClose, onSave }: RenameDialogProps) {
  const [name, setName] = useState(currentName)
  const [saving, setSaving] = useState(false)

  async function handle() {
    if (!name.trim()) return
    setSaving(true)
    await onSave(name.trim())
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename folder</DialogTitle>
          <DialogDescription>Enter a new name for this folder.</DialogDescription>
        </DialogHeader>
        <Input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && void handle()} autoFocus />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={() => void handle()} disabled={saving || !name.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteDialogProps {
  open: boolean
  folderName: string
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DeleteFolderDialog({ open, folderName, onClose, onConfirm }: DeleteDialogProps) {
  const [deleting, setDeleting] = useState(false)

  async function handle() {
    setDeleting(true)
    await onConfirm()
    setDeleting(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete folder?</DialogTitle>
          <DialogDescription>
            The folder <strong>"{folderName}"</strong> will be deleted. Documents inside it will move to Uncategorized.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>Cancel</Button>
          <Button variant="destructive" onClick={() => void handle()} disabled={deleting}>
            {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
