'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { createFolder } from '@/actions/folders'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-notification'
import { cn } from '@/lib/utils'

const PRESET_COLORS = [
  { hex: '#3B82F6', label: 'Blue' },
  { hex: '#06B6D4', label: 'Cyan' },
  { hex: '#8B5CF6', label: 'Purple' },
  { hex: '#EC4899', label: 'Pink' },
  { hex: '#10B981', label: 'Green' },
  { hex: '#F59E0B', label: 'Amber' },
  { hex: '#EF4444', label: 'Red' },
  { hex: '#F97316', label: 'Orange' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function NewFolderModal({ open, onClose }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0].hex)
  const [saving, setSaving] = useState(false)

  if (!open) return null

  async function handleCreate() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', name.trim())
      fd.append('color', color)
      await createFolder(fd)
      toast.success(`Folder "${name.trim()}" created.`)
      setName('')
      setColor(PRESET_COLORS[0].hex)
      onClose()
      router.refresh()
    } catch {
      toast.error('Failed to create folder.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-[380px] rounded-2xl border border-muted p-6 space-y-5 shadow-2xl"
        style={{ background: 'var(--color-surface-2)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">New Folder</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Name input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Folder name</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && void handleCreate()}
            placeholder="e.g. Work, Personal, Research…"
            className="w-full h-10 rounded-xl text-sm px-3 border border-muted bg-surface focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        {/* Color picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Color</label>
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map(c => (
              <button
                key={c.hex}
                title={c.label}
                onClick={() => setColor(c.hex)}
                className={cn(
                  'w-7 h-7 rounded-full transition-all hover:scale-110',
                  color === c.hex && 'ring-2 ring-offset-2 ring-offset-surface-2'
                )}
                style={{ background: c.hex, '--tw-ring-color': c.hex } as React.CSSProperties}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
          <span className="text-sm font-medium">{name || 'Folder name'}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-9 rounded-xl text-sm border border-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleCreate()}
            disabled={!name.trim() || saving}
            className="flex-1 h-9 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: color }}
          >
            {saving ? 'Creating…' : 'Create Folder'}
          </button>
        </div>
      </div>
    </div>
  )
}
