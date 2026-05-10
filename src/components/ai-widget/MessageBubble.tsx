'use client'
import { useState, useRef } from 'react'
import { Copy, Check, Download, X, Trash2, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { exportMessageToPdf } from '@/lib/pdf-export'
import { cn } from '@/lib/utils'

interface Props {
  role: 'user' | 'assistant'
  content: string
  messageId?: string
  onDelete?: (id: string) => void
}

export function MessageBubble({ role, content, messageId, onDelete }: Props) {
  const [copied, setCopied] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewCopied, setPreviewCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const backdropDownRef = useRef(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handlePreviewCopy() {
    await navigator.clipboard.writeText(content)
    setPreviewCopied(true)
    setTimeout(() => setPreviewCopied(false), 2000)
  }

  async function handleDownload() {
    setDownloading(true)
    await exportMessageToPdf(content)
    setDownloading(false)
    setPreviewOpen(false)
  }

  function handleDelete() {
    if (messageId && onDelete) onDelete(messageId)
  }

  return (
    <div className={cn('flex gap-2 group', role === 'user' ? 'justify-end' : 'justify-start')}>

      {role === 'assistant' && (
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 mt-1">D</div>
      )}

      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
        role === 'user'
          ? 'bg-primary/20 text-foreground border border-primary/30 rounded-tr-sm'
          : 'bg-surface border border-muted rounded-tl-sm'
      )}>
        {role === 'assistant' ? (
          <div className="ai-prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words">{content}</p>
        )}

        {/* Action buttons - assistant */}
        {role === 'assistant' && (
          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted transition-colors"
            >
              <Download className="w-3 h-3" />
              PDF
            </button>
            {onDelete && messageId && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 px-1.5 py-0.5 rounded hover:bg-muted transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            )}
          </div>
        )}

        {/* Delete button - user messages */}
        {role === 'user' && onDelete && messageId && (
          <div className="flex justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 text-xs text-white/60 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Resizable PDF Preview */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onMouseDown={(e) => { backdropDownRef.current = e.target === e.currentTarget }}
          onMouseUp={(e) => {
            if (backdropDownRef.current && e.target === e.currentTarget) setPreviewOpen(false)
            backdropDownRef.current = false
          }}
        >
          <div
            className="bg-background border border-muted rounded-xl shadow-2xl flex flex-col"
            style={{
              resize: 'both',
              overflow: 'hidden',
              width: '640px',
              height: '70vh',
              minWidth: '320px',
              minHeight: '240px',
              maxWidth: '90vw',
              maxHeight: '90vh',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="shrink-0 flex items-center justify-between px-5 pt-4 pb-3 border-b border-muted">
              <span className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Document Preview
              </span>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-6 bg-muted/10 flex justify-center" style={{ flex: 1, minHeight: 0 }}>
              <div className="w-full max-w-2xl bg-surface border border-muted shadow-sm rounded-lg p-6 sm:p-8 ai-prose">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>
            <div className="shrink-0 flex justify-end gap-2 px-5 py-3 border-t border-muted bg-muted/20">
              <button
                onClick={handlePreviewCopy}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-muted bg-background hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                {previewCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {previewCopied ? 'Copied!' : 'Copy text'}
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                <Download className="w-3 h-3" />
                {downloading ? 'Generating…' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
