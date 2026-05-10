'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const fieldCls = [
  'w-full h-11 rounded-xl text-sm text-foreground',
  'border transition-all duration-200',
  'placeholder:text-muted-foreground/40',
  'focus:outline-none focus:ring-2 focus:border-[#00E5FF]/50',
  'focus:shadow-[0_0_0_4px_rgba(0,229,255,0.08)]',
].join(' ')

const fieldStyle = {
  background: '#0B1324',
  borderColor: 'rgba(255,255,255,0.06)',
}

export function ForgotPasswordForm() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  if (sent) {
    return (
      <>
        <style>{`
          @keyframes db-ring {
            0%   { transform: scale(1);   opacity: 0.55; }
            100% { transform: scale(2.8); opacity: 0;    }
          }
          @keyframes db-float {
            0%, 100% { transform: translateY(0px);  }
            50%       { transform: translateY(-5px); }
          }
          @keyframes db-shimmer-in {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0);    }
          }
        `}</style>

        <div className="py-4 flex flex-col items-center gap-6 text-center"
          style={{ animation: 'db-shimmer-in 0.5s ease both' }}>

          {/* Radar icon */}
          <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
            {/* Expanding rings */}
            {[0, 0.6, 1.2].map((delay, i) => (
              <div key={i} className="absolute inset-0 rounded-full"
                style={{
                  border: '1.5px solid rgba(0,229,255,0.45)',
                  animation: `db-ring 2.4s ease-out ${delay}s infinite`,
                }}
              />
            ))}
            {/* Ambient glow blob */}
            <div className="absolute inset-0 rounded-full blur-xl"
              style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.18) 0%, transparent 70%)' }}
            />
            {/* Icon disc */}
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0,229,255,0.14) 0%, rgba(168,85,247,0.10) 100%)',
                border: '1.5px solid rgba(0,229,255,0.5)',
                boxShadow: '0 0 24px rgba(0,229,255,0.28), inset 0 1px 0 rgba(255,255,255,0.08)',
                animation: 'db-float 3s ease-in-out infinite',
              }}
            >
              <Mail className="w-7 h-7" style={{
                color: '#00E5FF',
                filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.7))',
              }} />
            </div>
          </div>

          {/* Status label */}
          <div className="space-y-1">
            <p className="text-[10px] font-mono tracking-[0.3em] uppercase"
              style={{ color: 'rgba(0,229,255,0.55)' }}>
              ✦ &nbsp;Signal transmitted&nbsp; ✦
            </p>
            <h3 className="text-[1.4rem] font-bold tracking-tight text-foreground">
              Check your inbox
            </h3>
          </div>

          {/* Email callout */}
          <div className="w-full rounded-2xl px-5 py-4"
            style={{
              background: 'rgba(0,229,255,0.04)',
              border: '1px solid rgba(0,229,255,0.14)',
            }}>
            <p className="text-xs" style={{ color: '#7E8A9A' }}>Reset link sent to</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: '#e2e8f0' }}>{email}</p>
            <p className="text-[11px] mt-2 leading-relaxed" style={{ color: '#5F6B7A' }}>
              Didn&apos;t get it? Check your spam or promotions folder.
            </p>
          </div>

          {/* Back link */}
          <Link href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium transition-all duration-200 group"
            style={{ color: '#7E8A9A' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#00E5FF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#7E8A9A')}
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Log In
          </Link>
        </div>
      </>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="px-3 py-2.5 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: '#B6C2CF' }}>Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#5F6B7A' }} />
          <input
            type="email"
            placeholder="name@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className={`${fieldCls} pl-10 pr-4`}
            style={{ ...fieldStyle, '--tw-ring-color': 'rgba(0,229,255,0.25)' } as React.CSSProperties}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
        style={{ background: 'linear-gradient(90deg, #00E5FF, #A855F7)', boxShadow: '0 4px 20px rgba(0,229,255,0.40)' }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 28px rgba(0,229,255,0.70), 0 0 16px rgba(0,229,255,0.35)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,229,255,0.40)')}
      >
        {loading ? 'Sending…' : 'Send Reset Link'}
      </button>

      <p className="text-center text-sm" style={{ color: '#7E8A9A' }}>
        Remember your password?{' '}
        <Link href="/login" className="font-semibold hover:underline" style={{ color: '#00E5FF' }}>
          Log in here
        </Link>
      </p>
    </form>
  )
}
