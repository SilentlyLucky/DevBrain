'use client'
import { useEffect, useRef } from 'react'

export function LandingCursor() {
  const dotRef       = useRef<HTMLDivElement>(null)
  const haloRef      = useRef<HTMLDivElement>(null)
  const spotlightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) return

    const mouse     = { x: -200, y: -200 }
    const halo      = { x: -200, y: -200 }
    const spotlight = { x: -200, y: -200 }

    let pressedTarget = 1
    let pressedCurrent = 1

    let visible = false
    let raf = 0

    function show() {
      if (visible) return
      visible = true
      dotRef.current && (dotRef.current.style.opacity = '1')
      haloRef.current && (haloRef.current.style.opacity = '1')
      spotlightRef.current && (spotlightRef.current.style.opacity = '1')
    }

    function hide() {
      visible = false
      dotRef.current && (dotRef.current.style.opacity = '0')
      haloRef.current && (haloRef.current.style.opacity = '0')
      spotlightRef.current && (spotlightRef.current.style.opacity = '0')
    }

    function onMove(e: MouseEvent) {
      mouse.x = e.clientX
      mouse.y = e.clientY
      show()
    }

    function onOver(e: MouseEvent) {
      const target = e.target as HTMLElement
      const interactive = target.closest('a, button, [role="button"], input, textarea, [data-cursor-magnet]')
      if (!haloRef.current) return
      if (interactive) {
        haloRef.current.classList.add('cursor-halo-hover')
      } else {
        haloRef.current.classList.remove('cursor-halo-hover')
      }
    }

    function onDown() { pressedTarget = 0.55 }
    function onUp()   { pressedTarget = 1 }

    function animate() {
      halo.x      += (mouse.x      - halo.x)      * 0.20
      halo.y      += (mouse.y      - halo.y)      * 0.20
      spotlight.x += (mouse.x - spotlight.x)      * 0.08
      spotlight.y += (mouse.y - spotlight.y)      * 0.08

      pressedCurrent += (pressedTarget - pressedCurrent) * 0.30
      const s = pressedCurrent.toFixed(3)

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%) scale(${s})`
      }
      if (haloRef.current) {
        haloRef.current.style.transform = `translate3d(${halo.x}px, ${halo.y}px, 0) translate(-50%, -50%)`
      }
      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(${spotlight.x}px, ${spotlight.y}px, 0) translate(-50%, -50%)`
      }

      raf = requestAnimationFrame(animate)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup',   onUp)
    document.documentElement.addEventListener('mouseleave', hide)
    document.documentElement.addEventListener('mouseenter', show)
    document.body.classList.add('cursor-none-mode')
    raf = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('mouseup',   onUp)
      document.documentElement.removeEventListener('mouseleave', hide)
      document.documentElement.removeEventListener('mouseenter', show)
      document.body.classList.remove('cursor-none-mode')
    }
  }, [])

  return (
    <>
      {/* Layer 3 - Wide spotlight */}
      <div
        ref={spotlightRef}
        aria-hidden
        className="fixed top-0 left-0 w-[420px] h-[420px] rounded-full pointer-events-none z-[1] opacity-0 transition-opacity duration-500 hidden lg:block"
        style={{
          background:
            'radial-gradient(circle, rgba(0,229,255,0.10) 0%, transparent 65%)',
          willChange: 'transform, opacity',
        }}
      />

      {/* Layer 2 - Halo ring (hover) */}
      <div
        ref={haloRef}
        aria-hidden
        className="cursor-halo fixed top-0 left-0 w-9 h-9 rounded-full pointer-events-none z-[9999] opacity-0 hidden lg:block"
        style={{
          border: '1.5px solid #00E5FF',
          backgroundColor: 'rgba(0,229,255,0.08)',
          willChange: 'transform, width, height, opacity',
          transition:
            'width 280ms cubic-bezier(0.34, 1.56, 0.64, 1), height 280ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 200ms ease, border-color 200ms ease, opacity 250ms ease',
        }}
      />

      {/* Layer 1 - Bright dot (instant follow) */}
      <div
        ref={dotRef}
        aria-hidden
        className="cursor-dot fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-primary pointer-events-none z-[10000] opacity-0 hidden lg:block"
        style={{
          boxShadow:
            '0 0 10px #00E5FF, 0 0 22px rgba(0,229,255,0.5)',
          willChange: 'transform, opacity',
          transition: 'opacity 250ms ease',
        }}
      />
    </>
  )
}
