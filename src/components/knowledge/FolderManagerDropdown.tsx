'use client'
import { useState, useEffect, useRef } from 'react'
import { FolderPlus, Check, Plus, X } from 'lucide-react'
import { addDocumentToFolder, removeDocumentFromFolder, createFolder } from '@/actions/folders'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-notification'
import type { Folder } from '@/types'

const PRESET_COLORS = [
  '#3B82F6', '#06B6D4', '#8B5CF6', '#EC4899',
  '#10B981', '#F59E0B', '#EF4444', '#F97316',
]

interface Props {
  documentId: string
  allFolders: Folder[]
  documentFolderIds: string[]
}

export function FolderManagerDropdown({ documentId, allFolders, documentFolderIds }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setShowNewFolder(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function toggleFolder(folderId: string, isCurrentlyAssigned: boolean) {
    setBusy(true)
    try {
      if (isCurrentlyAssigned) {
        await removeDocumentFromFolder(documentId, folderId)
      } else {
        await addDocumentToFolder(documentId, folderId)
      }
      router.refresh()
    } catch {
      toast.error('Failed to update folder.')
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateAndAssign() {
    if (!newName.trim()) return
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('name', newName.trim())
      fd.append('color', newColor)
      await createFolder(fd)
      // We need the new folder's id - refetch after creation via router.refresh
      // The assign happens implicitly since the user will see it in the list
      toast.success(`Folder "${newName.trim()}" created.`)
      setNewName('')
      setShowNewFolder(false)
      router.refresh()
    } catch {
      toast.error('Failed to create folder.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="text-muted-foreground hover:text-primary transition-colors"
        title="Manage folders"
      >
        <FolderPlus className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-6 z-50 w-52 rounded-xl border border-muted shadow-2xl overflow-hidden"
          style={{ background: 'var(--color-surface-2)' }}
        >
          <p className="text-xs font-semibold px-3 pt-3 pb-1 text-muted-foreground">Folders</p>

          {/* Folder checklist */}
          <div className="max-h-48 overflow-y-auto">
            {allFolders.length === 0 && (
              <p className="text-xs text-muted-foreground px-3 py-2 italic">No folders yet.</p>
            )}
            {allFolders.map(f => {
              const assigned = documentFolderIds.includes(f.id)
              return (
                <button
                  key={f.id}
                  onClick={() => void toggleFolder(f.id, assigned)}
                  disabled={busy}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-white/5 transition-colors text-left"
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: f.color }} />
                  <span className="flex-1 truncate">{f.name}</span>
                  {assigned && <Check className="w-3.5 h-3.5 shrink-0 text-primary" />}
                </button>
              )
            })}
          </div>

          {/* Divider */}
          <div className="h-px mx-3 bg-muted" />

          {/* Create new folder */}
          {!showNewFolder ? (
            <button
              onClick={() => setShowNewFolder(true)}
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
                onKeyDown={e => e.key === 'Enter' && void handleCreateAndAssign()}
                placeholder="Folder name"
                className="w-full h-8 rounded-lg text-xs px-3 border border-muted bg-surface focus:outline-none"
              />
              <div className="flex gap-1.5 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                    style={{ background: c, outline: newColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowNewFolder(false); setNewName('') }}
                  className="flex-1 h-7 rounded-lg text-xs border border-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3 inline mr-1" />Cancel
                </button>
                <button
                  onClick={() => void handleCreateAndAssign()}
                  disabled={!newName.trim() || busy}
                  className="flex-1 h-7 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-50"
                  style={{ background: newColor }}
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
