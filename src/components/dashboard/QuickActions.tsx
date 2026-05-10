'use client'
import Link from 'next/link'
import {
  Upload, MessageSquare, Calendar as CalendarIcon, ChevronRight,
} from 'lucide-react'
import { useAiChat } from '@/lib/context/AiChatContext'

export function QuickActions() {
  const { open } = useAiChat()

  return (
    <div className="space-y-2">
      <ActionLink
        href="/knowledge"
        icon={<Upload className="w-5 h-5" />}
        title="Upload PDF"
        description="Add new documents to your knowledge base"
      />
      <ActionButton
        onClick={open}
        icon={<MessageSquare className="w-5 h-5" />}
        title="Start Chat"
        description="Ask anything from your documents"
      />
      <ActionLink
        href="/schedule"
        icon={<CalendarIcon className="w-5 h-5" />}
        title="Create Schedule"
        description="Generate your daily plan"
      />
    </div>
  )
}

function ActionLink(props: ActionProps & { href: string }) {
  return (
    <Link href={props.href} className={CLASSES}>
      <ActionContent {...props} />
    </Link>
  )
}

function ActionButton(props: ActionProps & { onClick: () => void }) {
  return (
    <button onClick={props.onClick} className={`${CLASSES} w-full text-left`}>
      <ActionContent {...props} />
    </button>
  )
}

const CLASSES =
  'flex items-center gap-3 p-3 rounded-xl border border-muted hover:border-primary/40 hover:bg-muted/30 transition-colors group'

type ActionProps = { icon: React.ReactNode; title: string; description: string }

function ActionContent({ icon, title, description }: ActionProps) {
  return (
    <>
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </>
  )
}
