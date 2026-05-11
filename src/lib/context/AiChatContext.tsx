'use client'
import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useRouter } from 'next/navigation'
import { saveChatMessage } from '@/actions/chat'
import type { ChatMessage } from '@/types'

function toUIMessage(m: ChatMessage): UIMessage {
  return {
    id: m.id,
    role: m.role,
    parts: [{ type: 'text', text: m.content }],
    metadata: {},
  }
}

interface AiChatContextType {
  isOpen: boolean
  isMinimized: boolean
  setIsOpen: (v: boolean) => void
  setIsMinimized: (v: boolean) => void
  open: () => void
  close: () => void
  initialPrompt: string
  setInitialPrompt: (prompt: string) => void
  openWithPrompt: (prompt: string) => void
  messages: UIMessage[]
  setMessages: (msgs: UIMessage[]) => void
  sendMessage: (opts: { text: string }) => void
  status: string
  error: Error | undefined
}

const AiChatContext = createContext<AiChatContextType>({
  isOpen: false, isMinimized: false,
  setIsOpen: () => { }, setIsMinimized: () => { },
  open: () => { }, close: () => { },
  initialPrompt: '', setInitialPrompt: () => { }, openWithPrompt: () => { },
  messages: [], setMessages: () => { }, sendMessage: () => { },
  status: 'idle', error: undefined,
})

export function AiChatProvider({
  children,
  initialMessages = [],
}: {
  children: ReactNode
  initialMessages?: ChatMessage[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [initialPrompt, setInitialPrompt] = useState('')
  const router = useRouter()

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    messages: initialMessages.map(toUIMessage),
    onFinish: async ({ message }) => {
      const hasToolInvocation = message.parts.some(p => p.type === 'tool-invocation')
      if (hasToolInvocation) {
        router.refresh()
      }

      const text = message.parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map(p => p.text)
        .join('')
      if (text) await saveChatMessage('assistant', text)
    },
  })

  return (
    <AiChatContext.Provider value={{
      isOpen, isMinimized, setIsOpen, setIsMinimized,
      open: () => { setIsOpen(true); setIsMinimized(false) },
      close: () => setIsOpen(false),
      initialPrompt, setInitialPrompt,
      openWithPrompt: (prompt) => {
        setIsOpen(true)
        setIsMinimized(false)
        setInitialPrompt(prompt)
      },
      messages, setMessages, sendMessage, status, error,
    }}>
      {children}
    </AiChatContext.Provider>
  )
}

export const useAiChat = () => useContext(AiChatContext)
