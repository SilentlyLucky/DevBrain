'use client'
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ConfirmState {
  message: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  variant: 'default' | 'destructive'
  resolve: (value: boolean) => void
}

interface ToastContextValue {
  success: (msg: string) => void
  error: (msg: string) => void
  warning: (msg: string) => void
  info: (msg: string) => void
  confirm: (message: string, opts?: {
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'default' | 'destructive'
  }) => Promise<boolean>
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) { clearTimeout(timer); timers.current.delete(id) }
  }, [])

  const add = useCallback((message: string, type: ToastType) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev.slice(-4), { id, message, type }])
    const timer = setTimeout(() => dismiss(id), 4500)
    timers.current.set(id, timer)
  }, [dismiss])

  const confirm = useCallback((
    message: string,
    opts: { description?: string; confirmLabel?: string; cancelLabel?: string; variant?: 'default' | 'destructive' } = {}
  ): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmState({
        message,
        description: opts.description,
        confirmLabel: opts.confirmLabel ?? 'Confirm',
        cancelLabel: opts.cancelLabel ?? 'Cancel',
        variant: opts.variant ?? 'default',
        resolve,
      })
    })
  }, [])

  function handleConfirm(value: boolean) {
    confirmState?.resolve(value)
    setConfirmState(null)
  }

  const ctx: ToastContextValue = {
    success: (msg) => add(msg, 'success'),
    error:   (msg) => add(msg, 'error'),
    warning: (msg) => add(msg, 'warning'),
    info:    (msg) => add(msg, 'info'),
    confirm,
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}

      {/* Toast stack - bottom right */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>

      {/* Confirm dialog */}
      {confirmState && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => handleConfirm(false)} />
          <div className="relative bg-background border border-muted rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 space-y-6">
            <div className="space-y-2">
              <p className="font-semibold text-lg">{confirmState.message}</p>
              {confirmState.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{confirmState.description}</p>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => handleConfirm(false)}>
                {confirmState.cancelLabel}
              </Button>
              <Button
                variant={confirmState.variant === 'destructive' ? 'destructive' : 'default'}
                onClick={() => handleConfirm(true)}
              >
                {confirmState.confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

// ─── Toast item ───────────────────────────────────────────────────────────────

const STYLES: Record<ToastType, { icon: React.ReactNode; bar: string; border: string }> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />,
    bar: 'bg-green-400',
    border: 'border-green-500/30 bg-green-500/5',
  },
  error: {
    icon: <XCircle className="w-5 h-5 text-red-400 shrink-0" />,
    bar: 'bg-red-400',
    border: 'border-red-500/30 bg-red-500/5',
  },
  warning: {
    icon: <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />,
    bar: 'bg-yellow-400',
    border: 'border-yellow-500/30 bg-yellow-500/5',
  },
  info: {
    icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
    bar: 'bg-blue-400',
    border: 'border-blue-500/30 bg-blue-500/5',
  },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const s = STYLES[toast.type]
  return (
    <div className={cn(
      'pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-xl border shadow-xl',
      'min-w-[340px] max-w-[460px] relative overflow-hidden backdrop-blur-sm',
      s.border
    )}>
      <div className={cn('absolute bottom-0 left-0 h-[2px]', s.bar,
        'animate-[shrink_4.5s_linear_forwards]'
      )} />
      {s.icon}
      <p className="text-base text-foreground flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
