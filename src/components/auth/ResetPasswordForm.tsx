'use client'
import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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

export function ResetPasswordForm() {
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/home')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="px-3 py-2.5 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
          {error}
        </div>
      )}

      {/* New password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: '#B6C2CF' }}>New Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#5F6B7A' }} />
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            className={`${fieldCls} pl-10 pr-16`}
            style={{ ...fieldStyle, '--tw-ring-color': 'rgba(0,229,255,0.25)' } as React.CSSProperties}
          />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: '#5F6B7A' }}>
            {showPw ? <><EyeOff className="w-3.5 h-3.5" />Hide</> : <><Eye className="w-3.5 h-3.5" />Show</>}
          </button>
        </div>
      </div>

      {/* Confirm password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: '#B6C2CF' }}>Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#5F6B7A' }} />
          <input
            type={showConfirm ? 'text' : 'password'}
            placeholder="Repeat new password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            className={`${fieldCls} pl-10 pr-16`}
            style={{ ...fieldStyle, '--tw-ring-color': 'rgba(0,229,255,0.25)' } as React.CSSProperties}
          />
          <button type="button" onClick={() => setShowConfirm(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: '#5F6B7A' }}>
            {showConfirm ? <><EyeOff className="w-3.5 h-3.5" />Hide</> : <><Eye className="w-3.5 h-3.5" />Show</>}
          </button>
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
        {loading ? 'Updating…' : 'Set New Password'}
      </button>
    </form>
  )
}
