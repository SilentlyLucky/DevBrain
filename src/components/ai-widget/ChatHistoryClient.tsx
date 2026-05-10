'use client'
import { useRef, useEffect } from 'react'
import { isToolUIPart, type UIMessage } from 'ai'
import { MessageBubble } from './MessageBubble'
import { deleteChatMessage, saveChatMessage } from '@/actions/chat'
import { useAiChat } from '@/lib/context/AiChatContext'
import { Send, Search, FileText, Calendar, List, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ChatMessage } from '@/types'

const TOOL_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  retrieveContext:    { label: 'Searching knowledge base…', icon: <Search className="w-3 h-3" /> },
  listDocuments:      { label: 'Listing documents…',        icon: <List className="w-3 h-3" /> },
  listSchedules:      { label: 'Checking schedule…',        icon: <Calendar className="w-3 h-3" /> },
  getDocumentContent: { label: 'Reading document…',         icon: <FileText className="w-3 h-3" /> },
  createSchedule:     { label: 'Creating schedule…',        icon: <Calendar className="w-3 h-3" /> },
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

function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map(p => p.text)
    .join('')
}

// Props kept for page compatibility but messages come from shared context
export function ChatHistoryClient({ initialMessages: _ }: { initialMessages: ChatMessage[] }) {
  const formRef     = useRef<HTMLFormElement>(null)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, setMessages, sendMessage, status, error } = useAiChat()

  const isLoading = status === 'submitted' || status === 'streaming'

  // scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // scroll to bottom immediately on first render
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [])

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

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
    // plain Enter = new line
  }

  async function handleDelete(id: string) {
    setMessages(messages.filter(m => m.id !== id))
    await deleteChatMessage(id).catch(() => {})
  }

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: '#0B1324',
        border: '1px solid #132238',
        boxShadow: '0 0 40px rgba(0,229,255,0.04), 0 25px 50px rgba(0,0,0,0.5)',
        height: 'calc(100vh - 180px)',
        minHeight: '480px',
      }}
    >
      {/* Messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(168,85,247,0.10))',
                border: '1.5px solid rgba(0,229,255,0.3)',
              }}
            >
              <Send className="w-6 h-6" style={{ color: '#00E5FF' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: '#7E8A9A' }}>No messages yet</p>
            <p className="text-xs max-w-xs" style={{ color: '#3A4A5C' }}>
              Start a conversation below. Your full chat history will appear here.
            </p>
          </div>
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
                onDelete={handleDelete}
              />
            )}
          </div>
        ))}

        {error && (
          <div className="flex items-start gap-2 px-1">
            <div
              className="rounded-xl px-3 py-2 text-xs flex items-center gap-2 w-full"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{error.message?.includes('503') || error.message?.includes('quota')
                ? 'Gemini API quota exceeded. Please wait and try again.'
                : (error.message || 'AI is temporarily unavailable. Please try again.')}
              </span>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.20), rgba(37,99,235,0.18))', color: '#00E5FF' }}
            >D</div>
            <div
              className="rounded-2xl rounded-tl-sm px-4 py-3"
              style={{ background: '#132238', border: '1px solid rgba(0,229,255,0.1)' }}
            >
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map(d => (
                  <span key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#00E5FF', animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.15), transparent)' }} />

      {/* Input */}
      <form
        ref={formRef}
        onSubmit={handleFormSubmit}
        className="flex-shrink-0 p-4 flex items-center gap-3"
        style={{ background: '#07111F' }}
      >
        <textarea
          ref={textareaRef}
          name="message"
          rows={1}
          placeholder="Ask DevBrain AI anything… (Ctrl+Enter to send)"
          disabled={isLoading}
          className="flex-1 text-sm rounded-xl px-4 py-3 outline-none transition-all duration-200 resize-none overflow-y-auto"
          style={{
            background: '#0B1324',
            border: '1px solid rgba(0,229,255,0.15)',
            color: '#E2E8F0',
            maxHeight: '160px',
            minHeight: '48px',
            lineHeight: '1.6',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.40)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0,229,255,0.06)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.15)'; e.currentTarget.style.boxShadow = 'none' }}
          onInput={e => autoResize(e.currentTarget)}
          onKeyDown={handleKeyDown}
        />
        <Button
          type="submit"
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
