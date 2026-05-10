'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

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

const fieldFocusRingStyle = 'rgba(0,229,255,0.25)'

export function LoginForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/home'); router.refresh()
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        scopes: 'https://www.googleapis.com/auth/calendar',
      },
    })
  }

  return (
    <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
      {error && (
        <div className="px-3 py-2.5 rounded-xl text-sm" style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#EF4444',
        }}>
          {error}
        </div>
      )}

      {/* Email */}
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
            style={{ ...fieldStyle, '--tw-ring-color': fieldFocusRingStyle } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium" style={{ color: '#B6C2CF' }}>Password</label>
          <Link href="/forgot-password" className="text-xs font-medium hover:underline" style={{ color: '#00E5FF' }}>
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#5F6B7A' }} />
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className={`${fieldCls} pl-10 pr-16`}
            style={{ ...fieldStyle, '--tw-ring-color': fieldFocusRingStyle } as React.CSSProperties}
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: '#5F6B7A' }}
          >
            {showPw ? <><EyeOff className="w-3.5 h-3.5" />Hide</> : <><Eye className="w-3.5 h-3.5" />Show</>}
          </button>
        </div>
      </div>

      {/* Log In button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
        style={{
          background: 'linear-gradient(90deg, #00E5FF, #A855F7)',
          boxShadow: '0 4px 20px rgba(0,229,255,0.40)',
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 28px rgba(0,229,255,0.70), 0 0 16px rgba(0,229,255,0.35)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,229,255,0.40)')}
      >
        {loading ? 'Logging in…' : 'Log In'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: '#132238' }} />
        <span className="text-xs whitespace-nowrap" style={{ color: '#5F6B7A' }}>or continue with</span>
        <div className="flex-1 h-px" style={{ background: '#132238' }} />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full h-11 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2.5 active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, rgba(0,229,255,0.04), rgba(168,85,247,0.04))',
          border: '1px solid rgba(0,229,255,0.18)',
          color: '#E2E8F0',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,229,255,0.12), 0 0 0 1px rgba(0,229,255,0.35), inset 0 1px 0 rgba(255,255,255,0.08)'
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(168,85,247,0.06))'
          e.currentTarget.style.borderColor = 'rgba(0,229,255,0.35)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.06)'
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,229,255,0.04), rgba(168,85,247,0.04))'
          e.currentTarget.style.borderColor = 'rgba(0,229,255,0.18)'
        }}
      >
        <GoogleIcon />
        Log in with Google
      </button>

      {/* Switch */}
      <p className="text-center text-sm" style={{ color: '#7E8A9A' }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold hover:underline" style={{ color: '#00E5FF' }}>
          Sign up here
        </Link>
      </p>
    </form>
  )
}
