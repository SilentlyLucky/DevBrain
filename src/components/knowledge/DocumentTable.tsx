'use client'
import { useEffect, useRef, useState } from 'react'
import {
  FileText, Globe, Trash2, Eye, X, Calendar,
  Loader2, Pencil, Download, FileCode, Table2, Code, AlignLeft,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { deleteDocument, fetchDocumentContent, getDocumentSignedUrl, updateDocumentTitle } from '@/actions/documents'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-notification'
import { useStorage } from '@/lib/context/StorageContext'
import { formatDate, formatDateLong, formatDateTime } from '@/lib/utils'
import type { Document } from '@/types'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'

// ─── Markdown viewer styles ──────────────────────────────────────────────────

const PAPER_STYLES = `
  .pdf-md h1 { font-size: 1.85em; font-weight: 700; margin: 1.5em 0 0.5em; line-height: 1.2; color: #111; }
  .pdf-md h2 { font-size: 1.45em; font-weight: 700; margin: 1.4em 0 0.4em; line-height: 1.3; color: #1a1a1a; }
  .pdf-md h3 { font-size: 1.2em;  font-weight: 700; margin: 1.2em 0 0.35em; line-height: 1.35; color: #222; }
  .pdf-md h4 { font-size: 1.05em; font-weight: 700; margin: 1em 0 0.3em;   color: #333; }
  .pdf-md h5, .pdf-md h6 { font-size: 1em; font-weight: 700; margin: 0.8em 0 0.25em; color: #444; }
  .pdf-md p  { margin: 0 0 0.9em; }
  .pdf-md ul { list-style: disc;    padding-left: 1.8em; margin: 0.4em 0 0.9em; }
  .pdf-md ol { list-style: decimal; padding-left: 1.8em; margin: 0.4em 0 0.9em; }
  .pdf-md li { margin-bottom: 0.3em; }
  .pdf-md ul ul { list-style: circle; margin-top: 0.25em; margin-bottom: 0.25em; }
  .pdf-md strong { font-weight: 700; }
  .pdf-md em     { font-style:  italic; }
  .pdf-md blockquote { border-left: 3px solid #ccc; margin: 0.8em 0; padding: 0.4em 0.9em; color: #555; font-style: italic; }
  .pdf-md code { font-family: 'Courier New', Courier, monospace; font-size: 0.88em; background: #f3f3f3; padding: 0.1em 0.35em; border-radius: 3px; color: #c7254e; }
  .pdf-md pre { background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; padding: 1em; overflow-x: auto; margin: 0.8em 0; }
  .pdf-md pre code { background: none; padding: 0; color: inherit; font-size: 0.85em; }
  .pdf-md table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 0.93em; }
  .pdf-md th { background: #f0f0f0; font-weight: 700; border: 1px solid #ccc; padding: 0.4em 0.7em; text-align: left; }
  .pdf-md td { border: 1px solid #ddd; padding: 0.35em 0.7em; }
  .pdf-md tr:nth-child(even) td { background: #fafafa; }
  .pdf-md hr { border: none; border-top: 1px solid #d0d0d0; margin: 1.6em 0; }
  .pdf-md a { color: #0057b8; text-decoration: underline; }
`

// ─── Icon helper ─────────────────────────────────────────────────────────────

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

// ─── PDF Canvas Renderer ─────────────────────────────────────────────────────

function PdfPage({ pdf, pageNum }: { pdf: PDFDocumentProxy; pageNum: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false
    let renderTask: RenderTask | null = null

    pdf.getPage(pageNum).then((page) => {
      if (cancelled || !canvasRef.current) return
      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = canvasRef.current
      canvas.width = viewport.width
      canvas.height = viewport.height
      renderTask = page.render({
        canvas,
        canvasContext: canvas.getContext('2d')!,
        viewport,
      })
      void renderTask.promise.catch(() => {})
    })

    return () => {
      cancelled = true
      renderTask?.cancel()
    }
  }, [pdf, pageNum])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', display: 'block', boxShadow: '0 2px 12px rgba(0,0,0,0.4)', borderRadius: '2px' }}
    />
  )
}

function PdfCanvasViewer({ docId }: { docId: string }) {
  const [state, setState] = useState<{ pdf: PDFDocumentProxy; numPages: number } | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const url = await getDocumentSignedUrl(docId)
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      const pdf = await pdfjsLib.getDocument(url).promise
      if (!cancelled) setState({ pdf, numPages: pdf.numPages })
    }
    load().catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [docId])

  if (error) return <div className="flex items-center justify-center py-20 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Failed to load PDF.</div>
  if (!state) return <div className="flex items-center justify-center gap-2 py-20 text-sm" style={{ color: 'var(--color-muted-foreground)' }}><Loader2 className="w-4 h-4 animate-spin" />Loading PDF…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Array.from({ length: state.numPages }, (_, i) => <PdfPage key={i + 1} pdf={state.pdf} pageNum={i + 1} />)}
    </div>
  )
}

// ─── DOCX Viewer ─────────────────────────────────────────────────────────────

function DocxCanvasViewer({ docId }: { docId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const url = await getDocumentSignedUrl(docId)
      const res = await fetch(url)
      const arrayBuffer = await res.arrayBuffer()
      const { renderAsync } = await import('docx-preview')
      if (cancelled || !containerRef.current) return
      await renderAsync(arrayBuffer, containerRef.current, undefined, { inWrapper: false })
      if (!cancelled) setLoading(false)
    }
    load().catch(() => { if (!cancelled) { setError(true); setLoading(false) } })
    return () => { cancelled = true }
  }, [docId])

  if (error) return <div className="flex items-center justify-center py-20 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Failed to load DOCX.</div>
  return (
    <>
      {loading && <div className="flex items-center justify-center gap-2 py-20 text-sm" style={{ color: 'var(--color-muted-foreground)' }}><Loader2 className="w-4 h-4 animate-spin" />Loading DOCX…</div>}
      <div ref={containerRef} style={{ background: '#fff', padding: '40px', display: loading ? 'none' : 'block' }} />
    </>
  )
}

// ─── CSV Table Viewer ────────────────────────────────────────────────────────

function CsvTableViewer({ content }: { content: string }) {
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    import('papaparse').then(({ default: Papa }) => {
      const result = Papa.parse<string[]>(content, { skipEmptyLines: true, header: false })
      if (result.data.length > 0) {
        setHeaders(result.data[0])
        setRows(result.data.slice(1))
      }
    }).catch(() => setError(true))
  }, [content])

  if (error) return (
    <div className="flex items-center justify-center py-20 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
      Failed to load CSV.
    </div>
  )

  return (
    <div style={{ overflowX: 'auto', background: '#fff', padding: '32px', minHeight: '400px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ border: '1px solid #ccc', padding: '8px 12px', background: '#f0f0f0', fontWeight: 700, textAlign: 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ border: '1px solid #ddd', padding: '7px 12px' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Code Viewer ─────────────────────────────────────────────────────────────

const LANG_MAP: Record<string, string> = {
  '.js': 'javascript', '.ts': 'typescript', '.jsx': 'jsx', '.tsx': 'tsx',
  '.py': 'python', '.java': 'java', '.c': 'c', '.cpp': 'cpp',
  '.go': 'go', '.rs': 'rust', '.html': 'html', '.md': 'markdown', '.txt': 'text',
}

function CodeViewer({ content, extension }: { content: string; extension: string }) {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const lang = LANG_MAP[extension] ?? 'text'
    import('shiki').then(({ codeToHtml }) =>
      codeToHtml(content, { lang, theme: 'github-dark' })
    ).then((result) => {
      if (!cancelled) setHtml(result)
    }).catch(() => {})

    return () => { cancelled = true }
  }, [content, extension])

  if (!html) {
    return (
      <pre style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: '32px', background: '#0d1117', color: '#e6edf3', minHeight: '400px' }}>
        {content}
      </pre>
    )
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} style={{ minHeight: '400px' }} />
}

// ─── DocumentViewer ──────────────────────────────────────────────────────────

export function DocumentViewer({ doc, onClose }: { doc: Document; onClose: () => void }) {
  const [content, setContent] = useState<string | null>(null)
  const [contentLoading, setContentLoading] = useState(false)

  const ext = doc.file_extension ?? null
  const usePdfCanvas  = (doc.source_type === 'PDF' || ext === '.pdf') && !!doc.file_url
  const useDocxCanvas = ext === '.docx' && !!doc.file_url
  const needsContent  = !usePdfCanvas && !useDocxCanvas

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    if (!needsContent) return
    setContentLoading(true)
    fetchDocumentContent(doc.id).then(c => {
      setContent(c ?? '')
      setContentLoading(false)
    })
  }, [doc.id, needsContent])

  const resolvedContent = content ?? ''
  const useCsvTable   = ext === '.csv'
  const useCode       = ext !== null && CODE_EXTS.has(ext)
  const useMd         = ext === '.md' || (doc.source_type === 'URL' && /^#{1,6}\s|^\*\*|^\- |\*[^*]/.test(resolvedContent))

  const wordCount = resolvedContent.trim().split(/\s+/).length
  const { Icon, color } = getDocumentIcon(doc)

  const sourceLabel =
    doc.source_type === 'PDF' ? 'PDF Document'
    : doc.source_type === 'URL' ? 'Web Article'
    : ext ? ext.slice(1).toUpperCase() + ' File'
    : 'Document'

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--color-surface)' }}>
      <style dangerouslySetInnerHTML={{ __html: PAPER_STYLES }} />

      {/* Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-muted)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <Icon className={`w-4 h-4 ${color} shrink-0`} />
          <span className="text-white font-medium text-sm truncate max-w-xs">{doc.title}</span>
          <Badge variant="outline" className="text-xs shrink-0" style={{ borderColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}>
            {ext ? ext.slice(1).toUpperCase() : doc.source_type}
          </Badge>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {!usePdfCanvas && !useDocxCanvas && !useCsvTable && !useCode && (
            <span className="text-xs hidden sm:block" style={{ color: 'var(--color-muted-foreground)' }}>
              {wordCount.toLocaleString()} words
            </span>
          )}
          <span className="text-xs hidden sm:flex items-center gap-1" style={{ color: 'var(--color-muted-foreground)' }}>
            <Calendar className="w-3 h-3" />
            {formatDate(doc.created_at)}
          </span>
          <button onClick={onClose} className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--color-muted-foreground)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-muted)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto py-10 px-4" style={{ background: 'var(--color-surface)' }}>
        {usePdfCanvas ? (
          <div className="mx-auto" style={{ maxWidth: '900px' }}>
            <PdfCanvasViewer docId={doc.id} />
          </div>
        ) : useDocxCanvas ? (
          <div className="mx-auto" style={{ maxWidth: '900px' }}>
            <DocxCanvasViewer docId={doc.id} />
          </div>
        ) : contentLoading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading content…
          </div>
        ) : useCsvTable ? (
          <div className="mx-auto" style={{ maxWidth: '1100px' }}>
            <CsvTableViewer content={resolvedContent} />
          </div>
        ) : useCode ? (
          <div className="mx-auto" style={{ maxWidth: '960px', borderRadius: '6px', overflow: 'hidden' }}>
            <CodeViewer content={resolvedContent} extension={ext!} />
          </div>
        ) : (
          <div className="mx-auto rounded-sm" style={{ maxWidth: '860px', background: '#ffffff', boxShadow: '0 4px 32px rgba(0,0,0,0.6)', minHeight: '1100px', padding: '96px 80px' }}>
            <h1 className="font-bold mb-2" style={{ fontSize: '22px', color: '#1a1a1a', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: '1.3' }}>
              {doc.title}
            </h1>
            <div className="flex items-center gap-3 text-xs mb-8 pb-6" style={{ color: 'var(--color-muted-foreground)', borderBottom: '1px solid #e5e5e5', fontFamily: 'system-ui, sans-serif' }}>
              <span>{sourceLabel}</span>
              <span>·</span>
              <span>{formatDateLong(doc.created_at)}</span>
              <span>·</span>
              <span>{wordCount.toLocaleString()} words</span>
            </div>
            {useMd ? (
              <div className="pdf-md" style={{ fontSize: '15px', lineHeight: '1.85', color: '#1a1a1a', fontFamily: 'Georgia, "Times New Roman", serif' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{resolvedContent}</ReactMarkdown>
              </div>
            ) : (
              <div style={{ fontSize: '15px', lineHeight: '1.85', color: '#1a1a1a', fontFamily: 'Georgia, "Times New Roman", serif', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {resolvedContent}
              </div>
            )}
            <div className="mt-16 pt-6 text-xs text-center" style={{ borderTop: '1px solid #e5e5e5', color: '#9a9a9a', fontFamily: 'system-ui, sans-serif' }}>
              Extracted by DevBrain · {formatDateTime(doc.created_at)}
            </div>
          </div>
        )}
        <div className="h-10" />
      </div>
    </div>
  )
}

// ─── DocumentTable ───────────────────────────────────────────────────────────

export function DocumentTable({ documents }: { documents: Document[] }) {
  const router = useRouter()
  const toast = useToast()
  const { refreshStorage } = useStorage()
  const [preview, setPreview] = useState<Document | null>(null)
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [editedTitle, setEditedTitle] = useState('')
  const [savingTitle, setSavingTitle] = useState(false)

  function getDownloadFilename(doc: Document) {
    const safeTitle = doc.title
      .trim()
      .replace(/[^a-z0-9\-_. ]/gi, '')
      .replace(/\s+/g, '_')
      .slice(0, 80) || 'devbrain-document'
    const ext = doc.file_extension ?? (doc.source_type === 'PDF' ? '.pdf' : '.txt')
    return `${safeTitle}${ext}`
  }

  async function downloadDocument(doc: Document) {
    try {
      let blob: Blob
      const isBinary = doc.source_type === 'PDF' || doc.file_extension === '.docx'

      if (isBinary && doc.file_url) {
        const signedUrl = await getDocumentSignedUrl(doc.id)
        const response = await fetch(signedUrl)
        if (!response.ok) throw new Error('Failed to download file')
        blob = await response.blob()
      } else {
        const content = await fetchDocumentContent(doc.id) ?? ''
        blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      }

      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = getDownloadFilename(doc)
      anchor.click()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 100)
    } catch (error) {
      console.error('[document download]', error)
      toast.error('Failed to download the document.')
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

  if (documents.length === 0) {
    return <p className="text-center text-muted-foreground py-10 text-sm">No documents yet. Upload a file above.</p>
  }

  return (
    <>
      <div className="rounded-xl border border-muted overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-muted bg-surface">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Title</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Type</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Added</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const { Icon, color } = getDocumentIcon(doc)
              const typeLabel = doc.file_extension ? doc.file_extension.slice(1).toUpperCase() : doc.source_type
              return (
                <tr key={doc.id} className="border-b border-muted last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium truncate max-w-50">{doc.title}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                      {typeLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(doc.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => setPreview(doc)} className="text-muted-foreground hover:text-primary transition-colors" title="Preview">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setEditingDoc(doc); setEditedTitle(doc.title) }} className="text-muted-foreground hover:text-primary transition-colors" title="Edit title">
                        <Pencil className="w-4 h-4" />
                      </button>
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
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {preview && <DocumentViewer doc={preview} onClose={() => setPreview(null)} />}

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
    </>
  )
}
