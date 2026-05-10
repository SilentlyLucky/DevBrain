import Link from 'next/link'
import { Brain, ArrowLeft } from 'lucide-react'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative"
      style={{ background: '#07111F' }}>
      {/* Ambient dot grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035]" style={{
        backgroundImage: 'radial-gradient(rgba(0,229,255,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <Link href="/login" className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Log In
      </Link>

      <div className="w-full max-w-[520px] px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-8 group w-fit mx-auto">
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, rgba(0,229,255,0.18), rgba(37,99,235,0.14))',
            border: '1.5px solid rgba(0,229,255,0.5)', color: '#36F3FF',
          }}>
            <Brain className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <span className="font-bold text-lg group-hover:text-primary transition-colors">DevBrain</span>
        </Link>

        {/* Card */}
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
          <div className="h-px w-full mb-6 rounded-full" style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.35) 40%, rgba(0,229,255,0.15) 70%, transparent 100%)',
          }} />
          <h2 className="text-[1.5rem] font-bold mb-1 text-foreground">Forgot password?</h2>
          <p className="text-sm mb-6" style={{ color: '#7E8A9A' }}>
            Enter your email and we&apos;ll send you a reset link.
          </p>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  )
}
