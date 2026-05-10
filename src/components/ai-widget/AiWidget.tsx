'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Brain, Minus, X, Maximize2, Minimize2 } from 'lucide-react'
import { ChatWindow } from './ChatWindow'
import { useAiChat } from '@/lib/context/AiChatContext'
import { cn } from '@/lib/utils'

const MIN_W = 280
const MAX_W = 720
const MIN_H = 300
const MAX_H = 860

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const CURSOR: Record<ResizeDir, string> = {
  n: 'cursor-ns-resize',   s: 'cursor-ns-resize',
  e: 'cursor-ew-resize',   w: 'cursor-ew-resize',
  ne: 'cursor-nesw-resize', sw: 'cursor-nesw-resize',
  nw: 'cursor-nwse-resize', se: 'cursor-nwse-resize',
}

export function AiWidget() {
  const { isOpen, isMinimized, setIsOpen, setIsMinimized } = useAiChat()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [size, setSize] = useState({ width: 380, height: 500 })
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [schedulePanelOpen, setSchedulePanelOpen] = useState(false)

  useEffect(() => {
    function handler(e: Event) {
      setSchedulePanelOpen((e as CustomEvent<{ open: boolean }>).detail.open)
    }
    window.addEventListener('schedule-panel', handler)
    return () => window.removeEventListener('schedule-panel', handler)
  }, [])

  const sizeRef = useRef(size)
  sizeRef.current = size
  const posRef = useRef(pos)
  posRef.current = pos
  const widgetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isFullscreen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isFullscreen])

  const startDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return
    if (isFullscreen) return
    e.preventDefault()

    const rect = widgetRef.current?.getBoundingClientRect()
    if (!rect) return

    const startMouseX = e.clientX
    const startMouseY = e.clientY
    const startLeft = rect.left
    const startTop  = rect.top

    function onMove(ev: MouseEvent) {
      const { width, height } = sizeRef.current
      const clampH = isMinimized ? 48 : height
      const newX = Math.max(0, Math.min(window.innerWidth  - width,  startLeft + (ev.clientX - startMouseX)))
      const newY = Math.max(0, Math.min(window.innerHeight - clampH, startTop  + (ev.clientY - startMouseY)))
      setPos({ x: newX, y: newY })
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',  onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',  onUp)
  }, [isFullscreen, isMinimized])

  const startResize = useCallback((e: React.MouseEvent, dir: ResizeDir) => {
    e.preventDefault()
    e.stopPropagation()

    const rect = widgetRef.current?.getBoundingClientRect()
    if (!rect) return

    const startMouseX = e.clientX
    const startMouseY = e.clientY
    const startW = rect.width
    const startH = rect.height
    const startLeft = rect.left
    const startTop  = rect.top

    if (!posRef.current) {
      setPos({ x: startLeft, y: startTop })
    }

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - startMouseX
      const dy = ev.clientY - startMouseY

      const maxW = Math.min(MAX_W, window.innerWidth  - 48)
      const maxH = Math.min(MAX_H, window.innerHeight - 48)

      let newW = startW
      let newH = startH
      let newX = startLeft
      let newY = startTop

      // Horizontal
      if (dir.includes('w')) {
        newW = Math.min(maxW, Math.max(MIN_W, startW - dx))
        newX = startLeft + (startW - newW)
      } else if (dir.includes('e')) {
        newW = Math.min(maxW, Math.max(MIN_W, startW + dx))
      }

      // Vertical
      if (dir.includes('n')) {
        newH = Math.min(maxH, Math.max(MIN_H, startH - dy))
        newY = startTop + (startH - newH)
      } else if (dir.includes('s')) {
        newH = Math.min(maxH, Math.max(MIN_H, startH + dy))
      }

      newX = Math.max(0, Math.min(window.innerWidth  - newW, newX))
      newY = Math.max(0, Math.min(window.innerHeight - newH, newY))

      setSize({ width: newW, height: newH })
      setPos({ x: newX, y: newY })
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',  onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',  onUp)
  }, [])

  function handleClose() {
    setIsOpen(false)
    setIsFullscreen(false)
    setPos(null)
  }

  if (!isOpen) {
    if (schedulePanelOpen) return null
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/40 flex items-center justify-center text-white hover:bg-primary/90 hover:scale-105 transition-all z-50"
      >
        <Brain className="w-6 h-6" />
      </button>
    )
  }

  const showResizeHandles = !isMinimized && !isFullscreen
  const posStyle = pos ? { left: pos.x, top: pos.y } : undefined
  const posClass = pos ? '' : 'bottom-6 right-6'
  const H = 6
  const C = 14

  return (
    <div
      ref={widgetRef}
      className={cn(
        'fixed bg-surface-2 border border-muted flex flex-col z-50',
        isFullscreen
          ? 'inset-0 rounded-none shadow-none'
          : cn('rounded-2xl shadow-2xl shadow-black/40', posClass)
      )}
      style={isFullscreen ? undefined : { width: size.width, height: isMinimized ? 48 : size.height, ...posStyle }}
    >
      {/* 8-directional resize handles */}
      {showResizeHandles && (
        <>
          {/* Edges */}
          <div className={`absolute top-0 left-[${C}px] right-[${C}px] h-[${H}px] z-10 ${CURSOR.n}`}
               style={{ top: 0, left: C, right: C, height: H }}
               onMouseDown={e => startResize(e, 'n')} />
          <div className={`absolute ${CURSOR.s}`}
               style={{ bottom: 0, left: C, right: C, height: H }}
               onMouseDown={e => startResize(e, 's')} />
          <div className={`absolute ${CURSOR.w}`}
               style={{ top: C, bottom: C, left: 0, width: H }}
               onMouseDown={e => startResize(e, 'w')} />
          <div className={`absolute ${CURSOR.e}`}
               style={{ top: C, bottom: C, right: 0, width: H }}
               onMouseDown={e => startResize(e, 'e')} />
          {/* Corners */}
          <div className={`absolute ${CURSOR.nw}`}
               style={{ top: 0, left: 0, width: C, height: C }}
               onMouseDown={e => startResize(e, 'nw')} />
          <div className={`absolute ${CURSOR.ne}`}
               style={{ top: 0, right: 0, width: C, height: C }}
               onMouseDown={e => startResize(e, 'ne')} />
          <div className={`absolute ${CURSOR.sw}`}
               style={{ bottom: 0, left: 0, width: C, height: C }}
               onMouseDown={e => startResize(e, 'sw')} />
          <div className={`absolute ${CURSOR.se}`}
               style={{ bottom: 0, right: 0, width: C, height: C }}
               onMouseDown={e => startResize(e, 'se')} />
        </>
      )}

      {/* Header - drag handle */}
      <div
        className={cn(
          'flex items-center justify-between px-3 py-2.5 border-b border-muted flex-shrink-0 select-none',
          !isFullscreen && 'cursor-grab active:cursor-grabbing'
        )}
        onMouseDown={startDrag}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">DevBrain Assistant</span>
        </div>
        <div className="flex gap-1">
          {!isFullscreen && (
            <button
              onClick={() => { setIsMinimized(!isMinimized); setIsFullscreen(false) }}
              className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
              title={isMinimized ? 'Restore' : 'Minimize'}
            >
              <Minus className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => { setIsFullscreen(f => !f); setIsMinimized(false) }}
            className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
            title="Close"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Chat */}
      <div className={cn('flex-1 min-h-0 flex flex-col overflow-hidden', isMinimized && 'hidden')}>
        <ChatWindow isFullscreen={isFullscreen} />
      </div>
    </div>
  )
}
