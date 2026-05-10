import { getChatMessages } from '@/lib/dal'
import { ChatHistoryClient } from '@/components/ai-widget/ChatHistoryClient'

export default async function ChatHistoryPage() {
  const messages = await getChatMessages()

  return (
    <div className="w-full flex flex-col gap-4" style={{ height: 'calc(100vh - 48px)' }}>
      <div>
        <h1 className="text-2xl font-bold">Chat History</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your last {messages.length} messages - Max 50 - Continue the conversation below.
        </p>
      </div>

      <ChatHistoryClient initialMessages={messages} />
    </div>
  )
}
