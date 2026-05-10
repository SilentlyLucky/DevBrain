'use client'
import { useState } from 'react'
import { FolderPlus, Search, X } from 'lucide-react'
import { renameFolder, deleteFolder } from '@/actions/folders'
import { FolderSection, RenameFolderDialog, DeleteFolderDialog } from './FolderSection'
import { NewFolderModal } from './NewFolderModal'
import { DocumentViewer } from './DocumentTable'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-notification'
import { updateDocumentTitle } from '@/actions/documents'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Document, Folder } from '@/types'

interface Props {
  folders: Folder[]
  documents: Document[]
}

export function KnowledgeBase({ folders, documents }: Props) {
  const router = useRouter()
  const toast = useToast()

  const [query, setQuery] = useState('')
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [preview, setPreview] = useState<Document | null>(null)
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null)
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [editedTitle, setEditedTitle] = useState('')
  const [savingTitle, setSavingTitle] = useState(false)

  // Group documents by folder
  const folderGroups: Map<string, Document[]> = new Map()
  for (const f of folders) folderGroups.set(f.id, [])

  const uncategorized: Document[] = []

  for (const doc of documents) {
    const docFolders = doc.folders ?? []
    if (docFolders.length === 0) {
      uncategorized.push(doc)
    } else {
      for (const df of docFolders) {
        folderGroups.get(df.id)?.push(doc)
      }
    }
  }

  const q = query.trim().toLowerCase()
  const isSearching = q.length > 0
  const filterDocs = (docs: Document[]) =>
    isSearching ? docs.filter(d => d.title.toLowerCase().includes(q)) : docs

  async function handleRename(name: string) {
    if (!renaming) return
    try {
      await renameFolder(renaming.id, name)
      toast.success('Folder renamed.')
      router.refresh()
    } catch {
      toast.error('Failed to rename folder.')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteFolder(deleting.id)
      toast.success('Folder deleted.')
      router.refresh()
    } catch {
      toast.error('Failed to delete folder.')
    }
  }

  async function handleTitleSave() {
    if (!editingDoc) return
    const nextTitle = editedTitle.trim()
    if (!nextTitle || nextTitle === editingDoc.title) { setEditingDoc(null); return }

    setSavingTitle(true)
    try {
      const formData = new FormData()
      formData.append('id', editingDoc.id)
      formData.append('title', nextTitle)
      await updateDocumentTitle(formData)
      setEditingDoc(null)
      toast.success('Title updated.')
      router.refresh()
    } catch (error) {
      console.error('[document rename]', error)
      toast.error('Failed to update the title.')
    } finally {
      setSavingTitle(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          Your Documents ({documents.length})
        </h2>
        <button
          onClick={() => setNewFolderOpen(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-125"
          style={{
            background: 'linear-gradient(#0B1220, #0B1220) padding-box, linear-gradient(90deg, #A855F7, #00E5FF) border-box',
            border: '1.5px solid transparent',
            boxShadow: '0 0 12px rgba(168,85,247,0.12), 0 0 12px rgba(0,229,255,0.12)',
          }}
        >
          <FolderPlus className="w-4 h-4 text-[#00E5FF]" />
          New Folder
        </button>
      </div>

      <div className="space-y-3">
        {folders.map(f => (
          <FolderSection
            key={f.id}
            folder={f}
            documents={folderGroups.get(f.id) ?? []}
            allFolders={folders}
            onPreview={setPreview}
            onRename={(id, name) => setRenaming({ id, name })}
            onDelete={(id, name) => setDeleting({ id, name })}
            onRenameDoc={(doc) => { setEditingDoc(doc); setEditedTitle(doc.title) }}
          />
        ))}

        {(uncategorized.length > 0 || folders.length === 0) && (
          <FolderSection
            folder={null}
            documents={uncategorized}
            allFolders={folders}
            onPreview={setPreview}
            onRenameDoc={(doc) => { setEditingDoc(doc); setEditedTitle(doc.title) }}
          />
        )}

        {documents.length === 0 && (
          <p className="text-center text-muted-foreground py-10 text-sm">
            No documents yet. Upload a file above.
          </p>
        )}
      </div>

      <NewFolderModal open={newFolderOpen} onClose={() => setNewFolderOpen(false)} />

      <RenameFolderDialog
        open={!!renaming}
        currentName={renaming?.name ?? ''}
        onClose={() => setRenaming(null)}
        onSave={handleRename}
      />

      <DeleteFolderDialog
        open={!!deleting}
        folderName={deleting?.name ?? ''}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />

      <Dialog open={!!editingDoc} onOpenChange={(open) => !open && setEditingDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit document title</DialogTitle>
            <DialogDescription>Update the title shown in your Knowledge base.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} placeholder="Document title" autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDoc(null)} disabled={savingTitle}>Cancel</Button>
            <Button onClick={() => void handleTitleSave()} disabled={savingTitle || !editedTitle.trim()}>
              {savingTitle ? 'Saving…' : 'Save title'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {preview && <DocumentViewer doc={preview} onClose={() => setPreview(null)} />}
    </>
  )
}
