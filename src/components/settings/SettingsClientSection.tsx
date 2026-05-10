'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Pencil, Mail, Calendar as CalendarIcon, Bell } from 'lucide-react'
import { useToast } from '@/components/ui/toast-notification'
import { formatDateLong } from '@/lib/utils'

interface Props {
  name: string
  email: string
  memberSince: string
  avatarUrl: string | null
}

export function SettingsClientSection({ name: initialName, email, memberSince, avatarUrl }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const toast = useToast()

  const [displayName, setDisplayName] = useState(initialName)

  // Edit name dialog
  const [nameOpen, setNameOpen] = useState(false)
  const [newName, setNewName] = useState(initialName)
  const [savingName, setSavingName] = useState(false)

  // Change email dialog
  const [emailOpen, setEmailOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)

  const [deleting, setDeleting] = useState(false)

  // Google account linking
  const [hasGoogle, setHasGoogle] = useState(false)
  const [linkingGoogle, setLinkingGoogle] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      const linked = u?.identities?.some(i => i.provider === 'google') ?? false
      setHasGoogle(linked)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLinkGoogle() {
    setLinkingGoogle(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
          scopes: 'https://www.googleapis.com/auth/calendar',
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) {
        console.error('[linkGoogle]', error.message)
        toast.error('Unable to connect Google account. Please try again later.')
        setLinkingGoogle(false)
      }
      // On success, the browser is redirecting - don't reset loading state
    } catch {
      toast.error('Unable to connect Google account. Please try again later.')
      setLinkingGoogle(false)
    }
  }

  async function handleSaveName() {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === displayName) { setNameOpen(false); return }
    setSavingName(true)
    const { error } = await supabase.auth.updateUser({ data: { full_name: trimmed } })
    setSavingName(false)
    if (error) {
      toast.error('Failed to update name. Please try again.')
    } else {
      setDisplayName(trimmed)
      toast.success('Name updated successfully!')
      setNameOpen(false)
      router.refresh()
    }
  }

  async function handleSaveEmail() {
    const trimmed = newEmail.trim()
    if (!trimmed || trimmed === email) { setEmailOpen(false); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Please enter a valid email address.')
      return
    }
    setSavingEmail(true)
    const { error } = await supabase.auth.updateUser({ email: trimmed })
    setSavingEmail(false)
    if (error) {
      toast.error(error.message || 'Failed to update email.')
    } else {
      toast.success('Confirmation sent! Check your new inbox to confirm the change.')
      setEmailOpen(false)
      setNewEmail('')
    }
  }

  async function handleDelete() {
    const ok = await toast.confirm('Delete your account?', {
      description: 'This will permanently delete your account and all data. This action cannot be undone.',
      confirmLabel: 'Delete Account',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    })
    if (!ok) return
    setDeleting(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your profile and account information.</p>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Information */}
      <Card className="bg-surface-2 border-muted p-6 space-y-5">
        <h2 className="font-semibold text-base">Profile Information</h2>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="w-16 h-16 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-2xl font-bold text-primary">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-lg">{displayName}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
          <Button
            variant="outline" size="sm"
            className="gap-2 text-primary border-primary/40 hover:bg-primary/10 hover:text-primary"
            onClick={() => { setNewName(displayName); setNameOpen(true) }}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Profile
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-2 border-t border-muted">
          <div>
            <p className="text-muted-foreground text-xs">Full Name</p>
            <p className="font-medium mt-1">{displayName}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Email</p>
            <p className="font-medium mt-1">{email}</p>
          </div>
        </div>
      </Card>

      {/* Account Details */}
      <Card className="bg-surface-2 border-muted p-6 space-y-4">
        <h2 className="font-semibold text-base">Account Details</h2>
        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Member Since</p>
                <p className="font-medium mt-0.5">{memberSince}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Email</p>
                <p className="font-medium mt-0.5">{email}</p>
              </div>
            </div>
            <Button
              variant="outline" size="sm"
              className="gap-2 text-primary border-primary/40 hover:bg-primary/10 hover:text-primary"
              onClick={() => { setNewEmail(''); setEmailOpen(true) }}
            >
              <Pencil className="w-3.5 h-3.5" />
              Change Email
            </Button>
          </div>
        </div>
      </Card>

      {/* Connected Accounts */}
      <Card className="bg-surface-2 border-muted p-5">
        <h3 className="font-semibold text-sm mb-4">Connected Accounts</h3>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">Google Calendar</p>
              {hasGoogle ? (
                <p className="text-xs text-green-400 mt-0.5">✓ Connected - {email}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">Connect to enable Calendar sync</p>
              )}
            </div>
          </div>
          {!hasGoogle && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLinkGoogle}
              disabled={linkingGoogle}
              className="gap-2 text-primary border-primary/40 hover:bg-primary/10 hover:text-primary"
            >
              {linkingGoogle ? 'Connecting…' : 'Connect Google Account'}
            </Button>
          )}
        </div>

      </Card>

      {/* Danger Zone */}
      <Card
        className="border-destructive/40 p-6"
        style={{ background: 'color-mix(in oklab, var(--color-destructive) 6%, var(--color-surface-2))' }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-destructive/15 flex items-center justify-center text-destructive">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-destructive">Delete Account</p>
              <p className="text-xs text-muted-foreground mt-0.5">Permanently delete your account and all associated data.</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete Account'}
          </Button>
        </div>
      </Card>

      {/* Edit Name Dialog */}
      <Dialog open={nameOpen} onOpenChange={setNameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Display Name</DialogTitle>
            <DialogDescription>This name is shown across your DevBrain account.</DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Your name"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && !savingName && handleSaveName()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNameOpen(false)} disabled={savingName}>Cancel</Button>
            <Button onClick={handleSaveName} disabled={savingName || !newName.trim()}>
              {savingName ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Email Dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email Address</DialogTitle>
            <DialogDescription>
              A confirmation link will be sent to your new email. Your email won&apos;t change until you click the link.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="new@email.com"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && !savingEmail && handleSaveEmail()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)} disabled={savingEmail}>Cancel</Button>
            <Button onClick={handleSaveEmail} disabled={savingEmail || !newEmail.trim()}>
              {savingEmail ? 'Sending…' : 'Send Confirmation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
