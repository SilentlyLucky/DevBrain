'use client'
import { useRef, useEffect } from 'react'
import { isToolUIPart } from 'ai'
import { Send, Trash2, Search, FileText, Calendar, List, AlertTriangle, Pencil } from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { deleteChatHistory, deleteChatMessage, saveChatMessage } from '@/actions/chat'
import { Button } from '@/components/ui/button'
import { useAiChat } from '@/lib/context/AiChatContext'
import type { UIMessage } from 'ai'

const TOOL_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  retrieveContext:    { label: 'Searching knowledge base…', icon: <Search className="w-3 h-3" /> },
  listDocuments:      { label: 'Listing documents…',        icon: <List className="w-3 h-3" /> },
  listSchedules:      { label: 'Checking schedule…',        icon: <Calendar className="w-3 h-3" /> },
  getDocumentContent: { label: 'Reading document…',         icon: <FileText className="w-3 h-3" /> },
  createSchedule:     { label: 'Creating schedule…',        icon: <Calendar className="w-3 h-3" /> },
  updateSchedule:     { label: 'Updating schedule…',        icon: <Pencil className="w-3 h-3" /> },
  deleteSchedule:     { label: 'Deleting schedule…',        icon: <Trash2 className="w-3 h-3" /> },
  deleteDocument:     { label: 'Deleting document…',        icon: <Trash2 className="w-3 h-3" /> },
}

function ToolCallIndicator({ toolName }: { toolName: string }) {
  const meta = TOOL_LABELS[toolName] ?? { label: `Running ${toolName}…`, icon: null }
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-lg bg-muted/40 w-fit">
      {meta.icon}
      <span>{meta.label}</span>
      <span className="flex gap-0.5">
        {[0, 150, 300].map(d => (
          <span key={d} className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />
        ))}
      </span>
    </div>
  )
}

function getToolNameFromPart(part: unknown): string {
  if (typeof part === 'object' && part !== null) {
    const p = part as { type?: string }
    if (typeof p.type === 'string' && p.type.startsWith('tool-')) return p.type.slice(5)
  }
  return 'unknown'
}

function isActiveTool(part: unknown): boolean {
  if (!isToolUIPart(part as Parameters<typeof isToolUIPart>[0])) return false
  const state = (part as { state?: string }).state
  return state !== 'output' && state !== 'error'
}

function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map(p => p.text)
    .join('')
}

export function ChatWindow({ isFullscreen = false }: { isFullscreen?: boolean }) {
  const bottomRef  = useRef<HTMLDivElement>(null)
  const formRef    = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    messages, setMessages, sendMessage, status, error,
    initialPrompt, setInitialPrompt,
  } = useAiChat()

  const isLoading = status === 'submitted' || status === 'streaming'

  // auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const maxH = isFullscreen ? 168 : 80

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, maxH) + 'px'
  }

  // pre-fill prompt from sidebar
  useEffect(() => {
    if (initialPrompt && textareaRef.current) {
      textareaRef.current.value = initialPrompt
      autoResize(textareaRef.current)
      textareaRef.current.focus()
      setInitialPrompt('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, setInitialPrompt])

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const ta = textareaRef.current
    const text = ta?.value.trim()
    if (!text || isLoading) return
    saveChatMessage('user', text)
    sendMessage({ text })
    if (ta) { ta.value = ''; ta.style.height = 'auto'; ta.focus() }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  async function handleClear() {
    await deleteChatHistory()
    window.location.reload()
  }

  async function handleDeleteMessage(id: string) {
    setMessages(messages.filter(m => m.id !== id))
    await deleteChatMessage(id).catch(() => {})
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Info bar */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-muted flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Displaying the last 50 messages.</p>
        <button onClick={handleClear} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
          <Trash2 className="w-3 h-3" /> Clear History
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-8">
            Ask DevBrain AI anything about your documents or schedule.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="space-y-1.5">
            {m.role === 'assistant' && m.parts
              .filter(isActiveTool)
              .map((p, i) => <ToolCallIndicator key={i} toolName={getToolNameFromPart(p)} />)
            }
            {getTextContent(m) && (
              <MessageBubble
                role={m.role as 'user' | 'assistant'}
                content={getTextContent(m)}
                messageId={m.id}
                onDelete={handleDeleteMessage}
              />
            )}
          </div>
        ))}
        {error && (
          <div className="flex items-start gap-2 px-1">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 text-xs text-red-400 flex items-center gap-2 w-full">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{error.message?.includes('503') || error.message?.includes('quota')
                ? 'Gemini API quota habis. Tunggu beberapa menit lalu coba lagi.'
                : (error.message || 'AI tidak tersedia sementara. Coba lagi.')}
              </span>
            </div>
          </div>
        )}
        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">D</div>
            <div className="bg-surface border border-muted rounded-2xl rounded-tl-sm px-3 py-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form ref={formRef} onSubmit={handleFormSubmit} className="flex-shrink-0 p-3 border-t border-muted flex items-center gap-2">
        <textarea
          ref={textareaRef}
          name="message"
          rows={1}
          placeholder="Type a message… (Ctrl+Enter to send)"
          className="flex-1 bg-surface-2 border border-muted rounded-xl px-3 py-2 text-sm outline-none focus:border-primary transition-colors resize-none overflow-y-auto"
          style={{ height: '36px', minHeight: '36px', maxHeight: `${maxH}px`, lineHeight: '1.5' }}
          disabled={isLoading}
          onInput={e => autoResize(e.currentTarget)}
          onKeyDown={handleKeyDown}
        />
        <Button
          type="submit"
          size="sm"
          disabled={isLoading}
          className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
          style={{ background: 'linear-gradient(90deg, #00E5FF, #A855F7)', boxShadow: '0 0 16px rgba(0,229,255,0.35)', border: 'none' }}
        >
          <Send className="w-4 h-4 text-white" />
        </Button>
      </form>
    </div>
  )
}
