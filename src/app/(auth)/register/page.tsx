import Link from 'next/link'
import { Brain, ArrowLeft, Calendar, FileText, TrendingUp, MessageCircle, Pencil } from 'lucide-react'
import { RegisterForm } from '@/components/auth/RegisterForm'
import React from 'react'

const CHIPS = [
  { icon: <Calendar className="w-4 h-4" />, style: { top: '-14%', left: '50%', transform: 'translateX(-50%)' }, hue: 195 },
  { icon: <FileText className="w-4 h-4" />, style: { top: '14%', left: '-12%' }, hue: 280 },
  { icon: <TrendingUp className="w-4 h-4" />, style: { top: '14%', right: '-12%' }, hue: 145 },
  { icon: <Pencil className="w-4 h-4" />, style: { top: '58%', left: '-10%' }, hue: 45 },
  { icon: <MessageCircle className="w-4 h-4" />, style: { top: '58%', right: '-10%' }, hue: 330 },
]

const GLITTER = [
  { top: '5%', left: '8%', s: 1.5, o: 0.45, d: '0s', dur: '2.4s' },
  { top: '9%', left: '82%', s: 1, o: 0.30, d: '0.6s', dur: '3.1s' },
  { top: '16%', left: '55%', s: 2, o: 0.50, d: '1.1s', dur: '2.0s' },
  { top: '18%', left: '30%', s: 1, o: 0.25, d: '0.3s', dur: '2.8s' },
  { top: '25%', left: '90%', s: 1.5, o: 0.40, d: '1.5s', dur: '2.2s' },
  { top: '30%', left: '5%', s: 1, o: 0.30, d: '0.9s', dur: '3.5s' },
  { top: '38%', left: '70%', s: 2, o: 0.35, d: '0.4s', dur: '2.7s' },
  { top: '45%', left: '18%', s: 1.5, o: 0.45, d: '1.8s', dur: '2.1s' },
  { top: '52%', left: '88%', s: 1, o: 0.20, d: '0.7s', dur: '3.2s' },
  { top: '60%', left: '42%', s: 1, o: 0.30, d: '1.3s', dur: '2.5s' },
  { top: '68%', left: '10%', s: 2, o: 0.40, d: '0.2s', dur: '2.9s' },
  { top: '72%', left: '78%', s: 1.5, o: 0.35, d: '1.6s', dur: '2.3s' },
  { top: '80%', left: '60%', s: 1, o: 0.25, d: '0.5s', dur: '3.0s' },
  { top: '85%', left: '25%', s: 2, o: 0.45, d: '1.0s', dur: '2.6s' },
  { top: '92%', left: '85%', s: 1, o: 0.30, d: '1.4s', dur: '2.8s' },
  { top: '12%', left: '64%', s: 1, o: 0.20, d: '0.8s', dur: '3.3s' },
  { top: '55%', left: '3%', s: 1.5, o: 0.35, d: '1.9s', dur: '2.1s' },
  { top: '34%', left: '95%', s: 1, o: 0.28, d: '0.1s', dur: '3.4s' },
]

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex bg-surface">

      <div className="hidden lg:flex flex-col w-[48%] relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(155deg, #020817 0%, #07111F 100%)',
        }} />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none"
          style={{ background: 'rgba(168,85,247,0.12)' }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none"
          style={{ background: 'rgba(37,99,235,0.20)' }} />
        <div className="absolute bottom-20 right-0 w-72 h-72 rounded-full blur-[120px] pointer-events-none"
          style={{ background: 'rgba(168,85,247,0.08)' }} />

        {/* Glitter dots */}
        {GLITTER.map((g, i) => (
          <div key={i} className="absolute rounded-full pointer-events-none animate-pulse" style={{
            top: g.top, left: g.left,
            width: `${g.s}px`, height: `${g.s}px`,
            opacity: g.o,
            background: '#36F3FF',
            boxShadow: `0 0 ${g.s * 3}px #00E5FF`,
            animationDelay: g.d, animationDuration: g.dur,
          }} />
        ))}

        <div className="relative z-10 flex flex-col h-full px-14 py-12">
          <Link href="/" className="inline-flex items-center gap-3 group w-fit">
            <div className="w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0" style={{
              background: 'linear-gradient(135deg, rgba(0,229,255,0.18), rgba(37,99,235,0.14))',
              border: '1.5px solid rgba(0,229,255,0.5)',
              boxShadow: '0 0 16px rgba(0,229,255,0.3)',
              color: '#36F3FF',
            }}>
              <Brain className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">DevBrain</span>
          </Link>

          <div className="mt-14">
            <h1 className="text-[2.6rem] font-bold leading-[1.1] text-foreground mb-4">
              Your Helper for<br />
              <span style={{
                backgroundImage: 'linear-gradient(90deg, #00E5FF 0%, #00C2D1 25%, #A855F7 50%, #00C2D1 75%, #00E5FF 100%)',
                backgroundSize: '200% auto',
                backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent',
                animation: 'shimmer 3s linear infinite',
                display: 'inline-block',
              }}>
                Productivity
              </span>
            </h1>
            <p className="text-[0.95rem] text-muted-foreground leading-relaxed max-w-[340px]">
              DevBrain helps you master complex topics faster.
            </p>
          </div>

          {/* Brain + Pedestal illustration */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-64" style={{ height: '320px' }}>

              <div className="absolute inset-x-0 top-0 h-64 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full blur-3xl opacity-35 pointer-events-none" style={{
                  background: 'radial-gradient(circle, rgba(0,229,255,0.5), transparent 70%)',
                }} />
                <div className="absolute left-1/2 top-1/2 w-[115%] h-[115%] rounded-full border border-dashed border-primary/25 animate-orbit-cw" style={{ transform: 'translate(-50%, -50%)' }} />
                <div className="absolute left-1/2 top-1/2 w-[82%] h-[82%] rounded-full border border-primary/35 animate-orbit-ccw" style={{ transform: 'translate(-50%, -50%)' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain className="w-28 h-28 text-primary" strokeWidth={1.4} style={{
                    filter: 'drop-shadow(0 0 3px #00E5FF) drop-shadow(0 0 14px rgba(0,229,255,0.6))',
                  }} />
                </div>
                {CHIPS.map((chip, i) => {
                  const c = (l: number, ch: number, a = 1) => `oklch(${l} ${ch} ${chip.hue} / ${a})`
                  return (
                    <div key={i} className="absolute" style={chip.style as React.CSSProperties}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                        background: `linear-gradient(135deg, ${c(0.24, 0.28, 0.6)}, ${c(0.18, 0.22, 0.38)})`,
                        border: `2px solid ${c(0.84, 0.34, 0.95)}`,
                        color: c(0.92, 0.32),
                        boxShadow: `0 0 12px ${c(0.72, 0.34, 0.55)}`,
                      }}>
                        {chip.icon}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Light beam */}
              <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{
                bottom: '56px', width: '2px', height: '52px',
                background: 'linear-gradient(to top, #00E5FF 0%, rgba(0,229,255,0.4) 60%, transparent 100%)',
                filter: 'drop-shadow(0 0 4px #00E5FF)',
              }} />

              {/* Pedestal */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[85%] pointer-events-none">
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
                    <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
                      backgroundImage: 'linear-gradient(to right, rgba(0,229,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,229,255,0.3) 1px, transparent 1px)',
                      backgroundSize: '12px 12px',
                      maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)',
                    }} />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="border-l-2 border-primary/40 pl-4">
            <p className="text-sm text-muted-foreground/75 italic leading-relaxed">
              "AI reads, you understand.<br />DevBrain remembers everything."
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center relative" style={{
        background: '#07111F',
        borderLeft: '1px solid #132238',
      }}>
        {/* Ambient dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.035]" style={{
          backgroundImage: 'radial-gradient(rgba(0,229,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <Link href="/" className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="w-full max-w-[520px] px-6">
          <Link href="/" className="flex lg:hidden items-center gap-2.5 mb-6 group">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, rgba(0,229,255,0.18), rgba(37,99,235,0.14))',
              border: '1.5px solid rgba(0,229,255,0.5)', color: '#36F3FF',
            }}>
              <Brain className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <span className="font-bold text-lg group-hover:text-primary transition-colors">DevBrain</span>
          </Link>

          {/* Tabs */}
          <div className="flex mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Link href="/login" className="pb-3 px-1 mr-6 text-sm font-medium transition-colors border-b-2 border-transparent" style={{ color: '#7E8A9A' }}>Log In</Link>
            <span className="pb-3 px-1 text-sm font-semibold cursor-default" style={{
              color: '#00E5FF',
              borderBottom: '2px solid #00E5FF',
            }}>Sign Up</span>
          </div>

          {/* Form card */}
          <div className="rounded-[24px] p-10 backdrop-blur-[18px]" style={{
            background: '#0B1324',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: [
              '0 0 40px rgba(0,229,255,0.06)',
              '0 0 120px rgba(0,0,0,0.8)',
              '0 25px 60px rgba(2,8,23,0.65)',
              'inset 0 1px 0 rgba(255,255,255,0.06)',
            ].join(', '),
          }}>
            {/* Top accent */}
            <div className="h-px w-full mb-6 rounded-full" style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.35) 40%, rgba(0,229,255,0.15) 70%, transparent 100%)',
            }} />

            <h2 className="text-[1.5rem] font-bold mb-1 text-foreground">
              Create your account
            </h2>
            <p className="text-sm mb-6" style={{ color: '#7E8A9A' }}>
              Get started and experience DevBrain.
            </p>
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  )
}
