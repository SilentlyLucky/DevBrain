"use client"

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Brain, FileText, MessageCircle, TrendingUp, Calendar, Pencil,
  ArrowRight, CheckCircle2, ChevronRight,
} from 'lucide-react'
import { LandingCursor } from '@/components/landing/LandingCursor'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col relative overflow-hidden selection:bg-primary/30">

      {/* ── Ambient edge glows - colour hints at corners only ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Violet - top-right corner */}
        <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full opacity-40 blur-[160px]"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.25), transparent 70%)' }} />

        {/* Cobalt - bottom-left corner */}
        <div className="absolute bottom-[-20%] left-[-10%] w-[80vw] h-[80vw] rounded-full opacity-40 blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.45), transparent 70%)' }} />

        {/* Magenta - bottom-right corner */}
        <div className="absolute bottom-[-15%] right-[-8%] w-[45vw] h-[45vw] rounded-full opacity-20 blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%)' }} />
      </div>

      <LandingCursor />
      {/* ─── Ambient background ─── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-3xl" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            color: 'var(--color-primary)',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}
        />
      </div>

      {/* ─── Navbar (logo + login + signup only) ─── */}
      <nav className="relative z-30 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-default">
            <div
              className="w-11 h-11 rounded-[13px] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_24px_rgba(0,229,255,0.4)]"
              style={{
                background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(37,99,235,0.12))',
                border: '1.5px solid rgba(0,229,255,0.5)',
                boxShadow: '0 0 16px rgba(0,229,255,0.25)',
                color: '#36F3FF',
              }}
            >
              <Brain className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" strokeWidth={2.2} />
            </div>
            <span className="font-bold text-xl tracking-tight transition-colors duration-300 group-hover:text-[#00E5FF]">DevBrain</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="h-11 px-6 rounded-xl border backdrop-blur-xl transition-all duration-300 flex items-center justify-center font-semibold text-white text-sm bg-[#0B1220]/95 border-cyan-500/40 hover:bg-[#0B1220] hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(0,217,255,0.15)]"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="h-11 px-6 rounded-xl backdrop-blur-xl transition-all duration-300 flex items-center justify-center font-semibold text-white text-sm hover:brightness-125"
              style={{
                background: 'linear-gradient(#0B1220, #0B1220) padding-box, linear-gradient(90deg, #A855F7, #00E5FF) border-box',
                border: '1.5px solid transparent',
                boxShadow: '0 0 12px rgba(168,85,247,0.12), 0 0 12px rgba(0,229,255,0.12)'
              }}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative z-10 px-6 pt-12 pb-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left column - copy */}
          <div className="relative">
            <div
              className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-7 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_16px_rgba(0,229,255,0.25)] hover:border-cyan-400/60 cursor-default"
              style={{
                background: 'linear-gradient(90deg, rgba(0,229,255,0.12), rgba(37,99,235,0.08))',
                border: '1px solid rgba(0,229,255,0.35)',
                color: '#00E5FF',
              }}
            >
              <Brain className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110 group-hover:text-white" />
              <span className="transition-colors duration-300 group-hover:text-white">AI Productivity Assistant</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[68px] font-bold tracking-tight leading-[1.05] mb-6">
              Your Helper for{' '}
              <span
                style={{
                  backgroundImage: 'linear-gradient(90deg, #00E5FF 0%, #00C2D1 25%, #A855F7 50%, #00C2D1 75%, #00E5FF 100%)',
                  backgroundSize: '200% auto',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  animation: 'shimmer 3s linear infinite',
                  lineHeight: '1.2',
                  paddingBottom: '0.1em',
                }}
              >
                Productivity
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-md leading-relaxed mb-9">
              Save, understand, and rediscover your knowledge with AI assistance that learns with you.
            </p>

            {/* Primary CTA only - no Watch Demo */}
            <div className="mb-7">
              <Link
                href="/register"
                className="btn-shimmer group inline-flex items-center gap-2 h-12 px-7 rounded-xl text-base font-semibold text-white"
              >
                Get Started
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {['Summarize Docs instantly', 'Smart study scheduling', 'Fast Response AI Chat'].map(t => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column - animated brain illustration */}
          <BrainHeroVisual />
        </div>
      </section>

      {/* ─── Feature cards (4) ─── */}
      <section className="relative z-10 px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 rounded-[24px] border border-[#132238] bg-[#0B1324]/50 backdrop-blur-sm">
            <FeatureItem
              icon={<FileText className="w-6 h-6" />}
              title="Capture Anything"
              description="Upload PDFs and other documents. DevBrain understands it all."
              accentColor="#00E5FF"
            />
            <FeatureItem
              icon={<Brain className="w-6 h-6" />}
              title="AI Understands & Helps"
              description="AI understands, learns, and connects the dots across your contents."
              accentColor="#2563EB"
            />
            <FeatureItem
              icon={<MessageCircle className="w-6 h-6" />}
              title="Ask & Get Answers"
              description="Ask questions and get accurate, context-aware answers instantly."
              accentColor="#A855F7"
            />
            <FeatureItem
              icon={<TrendingUp className="w-6 h-6" />}
              title="Smart Scheduling"
              description="Smart scheduling to keep you consistent."
              accentColor="#4BFC98"
            />
          </div>
        </div>
      </section>

      {/* ─── Footer (two-column: Brand | Contact Us, divider, copyright) ─── */}
      <footer className="relative z-10 mt-auto pt-12 pb-8" style={{
        background: 'linear-gradient(to bottom, transparent, rgba(7,17,31,0.5))',
      }}>
        {/* Top edge accent - vivid gradient hairline */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px]">
          <div className="h-full bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent" />
        </div>
        {/* Ambient footer glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(0,229,255,0.07) 0%, transparent 70%)' }}
        />

        <div className="max-w-6xl mx-auto px-6">
          {/* Two-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 pb-10">
            {/* ── LEFT: Brand ── */}
            <div>
              {/* Logo + name with halo glow */}
              <div className="flex items-center gap-3.5 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-[13px] blur-md animate-pulse"
                    style={{ background: 'rgba(0,229,255,0.35)' }} />
                  <div className="relative w-11 h-11 rounded-[13px] flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, rgba(0,229,255,0.18), rgba(37,99,235,0.14))',
                    border: '1.5px solid rgba(0,229,255,0.55)',
                    boxShadow: '0 0 18px rgba(0,229,255,0.35)',
                    color: '#36F3FF',
                  }}>
                    <Brain className="w-5 h-5" strokeWidth={2} />
                  </div>
                </div>
                <span className="font-bold text-2xl tracking-tight">DevBrain</span>
              </div>

              {/* Description with deliberate emphasis */}
              <p className="text-sm text-foreground/70 leading-[1.9] max-w-md">
                Your AI-powered second brain. Built to help you <br />
                <span className="text-primary font-medium">remember</span>,{' '}
                <span className="text-primary font-medium">understand</span>, and{' '}
                <span className="text-primary font-medium">be productive</span>.
              </p>
              <p className="text-sm text-foreground/40 leading-[1.9] max-w-md mt-2 italic">
                Save what matters. Find it instantly. Understand it deeper.
              </p>
            </div>

            {/* ── RIGHT: Contact Me ── */}
            <div>
              {/* Header with gradient continuation line */}
              <div className="flex items-center gap-3 mb-6T">
                <h3 className="text-lg font-bold tracking-tight whitespace-nowrap" style={{
                  backgroundImage: 'linear-gradient(90deg, #00E5FF, #A855F7)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}>Contact Me</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-[rgba(0,229,255,0.5)] via-[rgba(0,229,255,0.15)] to-transparent" />
              </div>

              {/* Contact list */}
              <ul className="space-y-1">
                <ContactRow icon={<LinkedinSvg />} label="LinkedIn" value="@stevenalvinch" href="https://linkedin.com/in/stevenalvinch" accentColor="#2563EB" />
                <ContactRow icon={<GmailSvg />} label="Email" value="stevenalvinch@gmail.com" href="mailto:stevenalvinch@gmail.com" accentColor="#00E5FF" />
                <ContactRow icon={<GithubSvg />} label="GitHub" value="@stevenalvinch" href="https://github.com/stevenalvinch" accentColor="#A855F7" />
                <ContactRow icon={<PhoneSvg />} label="Phone" value="+62 812-3456-7890" href="tel:+6281234567890" accentColor="#4BFC98" />
              </ul>
            </div>
          </div>

          {/* Full-width gradient divider */}
          <div className="relative h-px mt-2">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(0,229,255,0.35)] to-transparent" />
            {/* Center jewel - multi-layer glow */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #00E5FF, #A855F7)',
                boxShadow: '0 0 10px 2px rgba(0,229,255,0.7), 0 0 4px 1px rgba(0,229,255,0.5)',
              }}
            />
          </div>

          {/* Copyright centered */}
          <div className="pt-6 text-center">
            <p className="text-xs text-foreground/55 tracking-wide">
              <span className="text-primary">©</span> 2026 <span className="font-semibold text-foreground/85">DevBrain</span>. All rights reserved.
            </p>
            <p className="text-[11px] text-foreground/40 mt-1.5">
              Made with <span className="text-primary">care</span>,  <span className="text-primary">caffeine</span>, and <span className="text-primary">creativity</span>.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─── Brain Hero Visual ───────────────────────────────────────────────────────
const BRAIN_C = { x: 50, y: 44 }
const ICON_TARGETS = [
  { x: 50, y: 12 }, // Calendar (top center)
  { x: 12, y: 26 }, // FileText (left-upper)
  { x: 88, y: 28 }, // TrendingUp (right-upper)
  { x: 14, y: 59 }, // Pencil (left-lower)
  { x: 88, y: 55 }, // MessageCircle (right-lower)
] as const

// Matches FloatingPlate hue assignments - index-aligned with ICON_TARGETS
const ICON_HUES = [195, 280, 145, 45, 330] as const

const GLOW_EXCLUSION_RADIUS = '55%'
const BRAIN_R = 20  // approximate brain outline radius in SVG units

// Path from brain OUTLINE (not center) to icon - gives a short curve starting at the edge
function nervePath({ x, y }: { x: number; y: number }): string {
  const dx = x - BRAIN_C.x
  const dy = y - BRAIN_C.y
  const dist = Math.hypot(dx, dy) || 1
  // Start point: brain outline in direction of icon
  const sx = BRAIN_C.x + (dx / dist) * BRAIN_R
  const sy = BRAIN_C.y + (dy / dist) * BRAIN_R
  // Control point: mid-way with a slight perpendicular bow
  const mx = (sx + x) / 2
  const my = (sy + y) / 2
  const bow = 2.5                   // perpendicular offset for gentle curve
  const px = (-dy / dist) * bow
  const py = (dx / dist) * bow
  return `M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${(mx + px).toFixed(1)} ${(my + py).toFixed(1)} ${x} ${y}`
}

// ── Brain glow tuning - change only these values ─────────────────────────────
const BRAIN_GLOW = {
  rotationSpeed: 3.5,     // seconds per full revolution (lower = faster)
  opacityMin: 0.6,   // arc brightness at its dimmest (0–1)
  opacityMax: 1.0,   // arc brightness at its brightest (0–1)
  pulsePeriod: 0.6,   // seconds per brightness pulse (lower = faster)
  arcSpread: 120,   // degrees: total width of the glowing arc
  arcFadeIn: 60,    // degrees: how long the arc takes to fade in
  glowBlur: 4,     // px: drop-shadow blur radius of the sweep layer
} as const
// ─────────────────────────────────────────────────────────────────────────────

// ── Beam tuning - change only these four values ──────────────────────────────
const BEAM = {
  delay: 0.24,   // seconds: how long after glow arrives before beam starts
  duration: 0.7,  // seconds: how long the beam takes to travel brain → icon (speed)
  length: 5,      // SVG units: visible length of the beam segment (size)
  width: 1.2,    // SVG units: stroke width of the beam (thickness)
} as const
// ─────────────────────────────────────────────────────────────────────────────

function BrainHeroVisual() {
  const maskContainerRef = useRef<HTMLDivElement>(null)
  const signalRefs = useRef<(SVGPathElement | null)[]>([])

  useEffect(() => {
    const maskContainer = maskContainerRef.current
    if (!maskContainer) return

    const signalLens = signalRefs.current.map((el) => {
      const len = el ? el.getTotalLength() : 15
      if (el) el.style.strokeDasharray = `${BEAM.length} ${len * 12}`
      return len
    })
    // Nerve start points on the brain outline (where glow must be to trigger a beam)
    const nerveStarts = ICON_TARGETS.map(({ x, y }) => {
      const dx = x - BRAIN_C.x
      const dy = y - BRAIN_C.y
      const dist = Math.hypot(dx, dy) || 1
      return { x: BRAIN_C.x + (dx / dist) * BRAIN_R, y: BRAIN_C.y + (dy / dist) * BRAIN_R }
    })
    const triggerTimes: number[] = new Array(ICON_TARGETS.length).fill(-Infinity)

    let frameId: number
    const tick = (now: number) => {
      const elapsed = now / 1000
      const t = (elapsed % BRAIN_GLOW.rotationSpeed) / BRAIN_GLOW.rotationSpeed

      const angle = t * 360
      const conicGrad = `conic-gradient(from ${angle}deg, transparent 0deg, rgba(0,0,0,0.15) ${BRAIN_GLOW.arcFadeIn}deg, black ${BRAIN_GLOW.arcSpread}deg, transparent ${BRAIN_GLOW.arcSpread}deg, transparent 360deg)`

      maskContainer.style.maskImage = conicGrad
      maskContainer.style.webkitMaskImage = conicGrad

      const amp = BRAIN_GLOW.opacityMax - BRAIN_GLOW.opacityMin
      const glowOpacity = BRAIN_GLOW.opacityMin + amp * (Math.sin(elapsed * Math.PI * 2 / BRAIN_GLOW.pulsePeriod) * 0.5 + 0.5)
      maskContainer.style.opacity = glowOpacity.toString()

      const tipMathAngle = angle + 120 - 90
      const tipRad = (tipMathAngle * Math.PI) / 180

      const R = 18.5
      const point = {
        x: 50 + R * Math.cos(tipRad),
        y: 44 + R * Math.sin(tipRad),
      }

      // Signal/beam: fire when glow tip is at the nerve start on the brain outline
      ICON_TARGETS.forEach((_target, i) => {
        const el = signalRefs.current[i]
        if (!el) return

        const len = signalLens[i] || 25
        // strokeDasharray is already set outside the tick loop

        const tSince = elapsed - triggerTimes[i]

        const ns = nerveStarts[i]
        const dToStart = Math.hypot(ns.x - point.x, ns.y - point.y)
        if (dToStart < 5 && tSince >= BEAM.duration) {
          triggerTimes[i] = elapsed
        }

        const tAnim = elapsed - triggerTimes[i]

        if (tAnim >= BEAM.delay && tAnim < BEAM.duration + BEAM.delay) {
          const tNorm = (tAnim - BEAM.delay) / BEAM.duration
          const offset = BEAM.length - tNorm * (len + BEAM.length)
          el.style.strokeDashoffset = offset.toString()
          el.style.opacity = '0.95'
        } else {
          el.style.opacity = '0'
        }
      })

      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [])

  return (
    <div className="relative aspect-square w-full max-w-[560px] mx-auto">
      <div
        className="absolute left-1/2 top-1/2 w-[120%] h-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(0,229,255,0.22) 0%, transparent 60%)',
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 w-[88%] h-[88%] rounded-full border border-dashed border-primary/30 animate-orbit-cw pointer-events-none"
        style={{ transform: 'translate(-50%, -50%)' }}
      />
      <div
        className="absolute left-1/2 top-1/2 w-[64%] h-[64%] rounded-full border border-primary/40 animate-orbit-ccw pointer-events-none"
        style={{ transform: 'translate(-50%, -50%)' }}
      />
      <Pedestal />
      <div
        className="absolute left-1/2 bottom-[10%] w-[2px] h-[40%] rounded-full origin-bottom animate-beam-shimmer pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, #00E5FF 0%, rgba(0,229,255,0.4) 60%, transparent 100%)',
          filter: 'drop-shadow(0 0 6px #00E5FF)',
          transform: 'translateX(-50%)',
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <filter id="nerve-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="0.9" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Tighter glow for signal beam - hugs the line closely */}
          <filter id="signal-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="0.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Faint base nerve wires */}
        {ICON_TARGETS.map((target, i) => (
          <path
            key={i}
            d={nervePath(target)}
            stroke="#00E5FF"
            strokeOpacity="0.28"
            strokeWidth="0.5"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {/* Signal beams - colored pulse traveling from brain to icon */}
        {ICON_TARGETS.map((target, i) => (
          <path
            key={`sig-${i}`}
            ref={(el) => { signalRefs.current[i] = el }}
            d={nervePath(target)}
            stroke={`oklch(0.92 0.30 ${ICON_HUES[i]})`}
            strokeWidth={BEAM.width}
            strokeLinecap="round"
            fill="none"
            opacity="0"
            filter="url(#signal-glow)"
          />
        ))}
      </svg>
      <div className="absolute left-1/2 top-[44%] w-[44%] h-[44%] -translate-x-1/2 -translate-y-1/2 animate-brain-heartbeat z-10 flex items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Base brain - plain teal */}
          <Brain
            className="w-full h-full text-primary"
            strokeWidth={1.3}
            style={{ filter: 'drop-shadow(0 0 3px #00E5FF) drop-shadow(0 0 4px rgba(0,229,255,0.55))' }}
          />
          {/* Rotating teal sweep */}
          <div ref={maskContainerRef} className="absolute inset-0 w-full h-full pointer-events-none">
            <Brain
              className="w-full h-full"
              strokeWidth={2}
              style={{
                color: '#36F3FF',
                filter: `drop-shadow(0 0 ${BRAIN_GLOW.glowBlur}px #36F3FF)`,
                maskImage: `radial-gradient(closest-side, transparent 0%, transparent ${GLOW_EXCLUSION_RADIUS}, black calc(${GLOW_EXCLUSION_RADIUS} + 1%))`,
                WebkitMaskImage: `radial-gradient(closest-side, transparent 0%, transparent ${GLOW_EXCLUSION_RADIUS}, black calc(${GLOW_EXCLUSION_RADIUS} + 1%))`,
              }}
            />
          </div>
          <BrainFiringDots />
        </div>
      </div>
      <div className="absolute inset-0 z-20 pointer-events-none">
        <FloatingPlate
          icon={<Calendar className="w-6 h-6" />}
          className="absolute left-1/2 -translate-x-1/2 top-[6%] animate-float-y-1 pointer-events-auto"
          hue={195}
        />
        <FloatingPlate
          icon={<FileText className="w-6 h-6" />}
          className="absolute left-[6%] top-[22%] animate-float-y-2 pointer-events-auto"
          style={{ animationDelay: '300ms' }}
          hue={280}
        />
        <FloatingPlate
          icon={<TrendingUp className="w-6 h-6" />}
          className="absolute right-[6%] top-[24%] animate-float-y-1 pointer-events-auto"
          style={{ animationDelay: '500ms' }}
          hue={145}
        />
        <FloatingPlate
          icon={<Pencil className="w-6 h-6" />}
          className="absolute left-[8%] top-[54%] animate-float-y-3 pointer-events-auto"
          style={{ animationDelay: '800ms' }}
          hue={45}
        />
        <FloatingPlate
          icon={<MessageCircle className="w-6 h-6" />}
          className="absolute right-[6%] top-[50%] animate-float-y-2 pointer-events-auto"
          style={{ animationDelay: '200ms' }}
          hue={330}
        />
      </div>
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary animate-particle-drift pointer-events-none"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            opacity: 0.5,
            boxShadow: '0 0 8px var(--color-primary)',
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

function Pedestal() {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-[5%] w-[72%] pointer-events-none">
      <div className="relative h-14">
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-full h-3 rounded-xl bg-gradient-to-b from-primary/15 to-primary/5 border border-primary/25 shadow-lg shadow-primary/10" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-2.5 w-[86%] h-3 rounded-xl bg-gradient-to-b from-primary/22 to-primary/10 border border-primary/35" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-5 w-[72%] h-9 rounded-xl bg-gradient-to-b from-primary/35 to-primary/15 border border-primary/50 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] rounded-lg border border-primary/35" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] h-[48%] rounded-md border border-primary/55" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[28%] h-[24%] rounded-sm border border-primary/80" />
          <div className="absolute left-1/2 top-1/2 w-[28%] h-[24%] rounded-sm border border-primary/70 animate-ring-emit" />
          <div className="absolute left-1/2 top-1/2 w-[28%] h-[24%] rounded-sm border border-primary/70 animate-ring-emit" style={{ animationDelay: '1s' }} />
          <div className="absolute left-1/2 top-1/2 w-[28%] h-[24%] rounded-sm border border-primary/70 animate-ring-emit" style={{ animationDelay: '2s' }} />
          <div className="absolute left-1/2 top-1/2 w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_14px_3px] shadow-primary" />
          <div className="absolute left-1/2 top-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(0,229,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,229,255,0.3) 1px, transparent 1px)',
              backgroundSize: '12px 12px',
              maskImage:
                'radial-gradient(ellipse at center, black 0%, transparent 80%)',
            }}
          />
        </div>
      </div>
    </div>
  )
}

function BrainFiringDots() {
  const dots = [
    { x: '32%', y: '28%', delay: '0s' },
    { x: '70%', y: '24%', delay: '0.5s' },
    { x: '50%', y: '14%', delay: '1s' },
    { x: '24%', y: '54%', delay: '1.5s' },
    { x: '76%', y: '58%', delay: '0.7s' },
    { x: '50%', y: '70%', delay: '1.2s' },
  ]
  return (
    <>
      {dots.map((d, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-white animate-pulse"
          style={{
            left: d.x,
            top: d.y,
            transform: 'translate(-50%, -50%)',
            boxShadow:
              '0 0 6px #00E5FF, 0 0 14px #00E5FF',
            animationDelay: d.delay,
            animationDuration: '1.5s',
          }}
        />
      ))}
    </>
  )
}

const PARTICLES = [
  { top: '12%', left: '24%', size: 4, delay: 0, duration: 4 },
  { top: '20%', left: '78%', size: 3, delay: 500, duration: 3.5 },
  { top: '36%', left: '14%', size: 3, delay: 1000, duration: 4.2 },
  { top: '42%', left: '88%', size: 4, delay: 1500, duration: 5 },
  { top: '58%', left: '20%', size: 3, delay: 700, duration: 3.8 },
  { top: '64%', left: '76%', size: 3, delay: 1200, duration: 4.5 },
  { top: '8%', left: '52%', size: 2, delay: 200, duration: 3 },
  { top: '32%', left: '60%', size: 2, delay: 1800, duration: 3.2 },
  { top: '70%', left: '50%', size: 3, delay: 600, duration: 4 },
  { top: '24%', left: '44%', size: 2, delay: 900, duration: 3.6 },
] as const

function FloatingPlate({
  icon, className = '', style, hue = 195,
}: {
  icon: React.ReactNode
  className?: string
  style?: React.CSSProperties
  hue?: number
}) {
  const c = (l: number, ch: number, a = 1) =>
    `oklch(${l} ${ch} ${hue} / ${a})`
  return (
    <div className={className} style={style}>
      <div
        className="w-14 h-14 rounded-2xl backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
        style={{
          background: `linear-gradient(135deg, ${c(0.24, 0.28, 0.6)}, ${c(0.18, 0.22, 0.38)})`,
          border: `2px solid ${c(0.84, 0.34, 0.95)}`,
          color: c(0.92, 0.32),
          boxShadow: `0 0 18px ${c(0.72, 0.34, 0.55)}, 0 6px 22px ${c(0.72, 0.26, 0.2)}, inset 0 1px 0 rgba(255,255,255,0.15)`,
        }}
      >
        {icon}
      </div>
    </div>
  )
}

function FeatureItem({ icon, title, description, accentColor = '#00E5FF' }: {
  icon: React.ReactNode
  title: string
  description: string
  accentColor?: string
  hue?: number
}) {
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }
  const rgb = hexToRgb(accentColor)
  const rgba = (a: number) => `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`
  return (
    <div className="p-5 rounded-[24px] border border-transparent hover:border-[rgba(0,229,255,0.2)] hover:bg-[#0B1324] transition-colors group">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
        style={{
          background: `linear-gradient(135deg, ${rgba(0.18)}, ${rgba(0.08)})`,
          border: `1px solid ${rgba(0.7)}`,
          color: accentColor,
          boxShadow: `0 0 12px ${rgba(0.3)}, inset 0 1px 0 rgba(255,255,255,0.1)`,
        }}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-base mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

// ─── Footer contact row (sketch layout: ⊙ LABEL ─── value ›) ──────────────

function ContactRow({
  icon, label, value, href, accentColor = '#00E5FF',
}: {
  icon: React.ReactNode
  label: string
  value: string
  href: string
  accentColor?: string
  hue?: number
}) {
  const external = href.startsWith('http')
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }
  const rgb = hexToRgb(accentColor)
  const rgba = (a: number) => `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`
  return (
    <li>
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className="group flex items-center gap-3.5 py-2.5 px-2 -mx-2 rounded-lg transition-all duration-300 hover:translate-x-1"
        onMouseEnter={e => (e.currentTarget.style.background = rgba(0.06))}
        onMouseLeave={e => (e.currentTarget.style.background = '')}
      >
        {/* Circle icon with accent bloom */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: rgba(0.4) }} />
          <div
            className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{
              border: `1px solid ${rgba(0.35)}`,
              background: rgba(0.08),
              color: rgba(0.75),
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.border = `1px solid ${rgba(0.8)}`
              el.style.background = rgba(0.18)
              el.style.color = accentColor
              el.style.boxShadow = `0 0 10px ${rgba(0.35)}`
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.border = `1px solid ${rgba(0.35)}`
              el.style.background = rgba(0.08)
              el.style.color = rgba(0.75)
              el.style.boxShadow = ''
            }}
          >
            {icon}
          </div>
        </div>

        {/* Label - Value */}
        <div className="flex-1 min-w-0 flex items-center gap-3 sm:gap-4">
          <span className="text-[10px] uppercase tracking-[0.22em] text-foreground/50 font-bold w-[60px] flex-shrink-0">
            {label}
          </span>
          <span className="text-sm font-medium text-foreground/65 truncate transition-colors"
            onMouseEnter={e => (e.currentTarget.style.color = accentColor)}
            onMouseLeave={e => (e.currentTarget.style.color = '')}
          >
            {value}
          </span>
        </div>

        {/* Chevron */}
        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0"
          style={{ color: accentColor }} />
      </a>
    </li>
  )
}

// ─── Brand SVG icons (lucide doesn't include brand marks) ─────────────────

function LinkedinSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.86-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  )
}

function GmailSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M24 5.46v13.91c0 .9-.73 1.63-1.64 1.63h-3.81V11.73L12 16.64l-6.55-4.91v9.27H1.64A1.64 1.64 0 0 1 0 19.37V5.46c0-2.02 2.31-3.18 3.93-1.97L5.45 4.64 12 9.55l6.55-4.91 1.53-1.15C21.69 2.28 24 3.43 24 5.46z" />
    </svg>
  )
}

function GithubSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.04-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23.96-.27 1.98-.4 3-.4s2.04.13 3 .4c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.29 0 .32.22.7.83.58A12 12 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function PhoneSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}
