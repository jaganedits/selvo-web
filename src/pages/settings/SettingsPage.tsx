import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.tsx'
import { FirebaseConfigForm } from '@/components/common/FirebaseConfigForm.tsx'
import { useAuth } from '@/hooks/use-auth.ts'
import { useTheme } from '@/hooks/use-theme.ts'
import { useAllTransactions } from '@/hooks/use-transactions.ts'
import { useSecondaryFirebase } from '@/hooks/use-secondary-firebase.ts'
import { signOut, deleteAccount } from '@/services/auth.service.ts'
import { deleteAllUserData } from '@/services/firestore.service.ts'
import { validateConfig, connectWithConfig, isProjectUsedByOther } from '@/services/user-firebase.service.ts'
import { exportTransactionsCSV } from '@/services/export.service.ts'
import type { UserFirebaseConfig } from '@/types/user.ts'
import { toast } from 'sonner'
import { Moon, Sun, Download, LogOut, Trash2, Loader2, RefreshCw, Shield } from 'lucide-react'

function FirebaseLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M3.89 15.67L6.22 2.68a.42.42 0 0 1 .8-.14l2.47 4.63-5.6 8.5z" fill="#FFC24A" />
      <path d="M9.49 7.17L3.89 15.67l2.33-12.99a.42.42 0 0 1 .8-.14l2.47 4.63z" fill="#FFA712" />
      <path d="M14.65 5.34l1.62 2.56L20.11 15.67l-2.3 2.06L3.89 15.67l10.76-10.33z" fill="#F4BD62" />
      <path d="M14.65 5.34L9.49 7.17l2.02-3.84a.42.42 0 0 1 .76 0l2.38 2.01z" fill="#FFA50E" />
      <path d="M17.81 17.73L20.11 15.67l-3.84-7.77L14.65 5.34 3.89 15.67l6.55 5.85a1.26 1.26 0 0 0 1.12.22l6.25-3.01z" fill="#F6820C" />
      <path d="M20.11 15.67L16.27 7.9a.42.42 0 0 0-.73-.05L3.89 15.67l6.55 5.85a1.26 1.26 0 0 0 1.47.13l8.2-5.98z" fill="#FDE068" />
      <path d="M10.44 21.52a1.26 1.26 0 0 1-1.47-.13L3.93 15.7l-.04-.03.04.03 13.88 2.06-1.12.84-6.25 2.92z" fill="#FCCA3F" />
      <path d="M17.81 17.73l2.3-2.06-3.84-7.77a.42.42 0 0 0-.73-.05L3.89 15.67l6.55 5.85a1.26 1.26 0 0 0 1.47.13l5.9-3.92z" fill="#EEAB37" />
    </svg>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { db, uid } = useSecondaryFirebase()
  const { theme, toggleTheme, isDark } = useTheme()
  const { transactions } = useAllTransactions()
  const [deleting, setDeleting] = useState(false)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)

  const cachedConfig = (() => {
    try { const raw = localStorage.getItem('firebase_config_cache'); return raw ? JSON.parse(raw) : null } catch { return null }
  })()

  async function handleDeleteAccount() {
    if (!confirm('Permanently delete all data?')) return
    setDeleting(true)
    try { await deleteAllUserData(db, uid); await deleteAccount(); toast.success('Deleted') }
    catch { toast.error('Failed. Sign in again.') }
    finally { setDeleting(false) }
  }

  async function handleValidateConfig(config: UserFirebaseConfig) {
    return validateConfig(config)
  }

  async function handleConnectConfig(config: UserFirebaseConfig) {
    if (!user) return false
    const ok = await connectWithConfig(user.uid, config)
    if (ok) {
      toast.success('Firebase config updated')
      setConfigDialogOpen(false)
      window.location.reload()
    }
    return ok
  }

  async function handleProjectUsedCheck(projectId: string) {
    if (!user) return true
    return isProjectUsedByOther(projectId, user.uid)
  }

  return (
    <div className="space-y-3 animate-fade-up">
      <h1 className="font-heading text-lg font-extrabold tracking-tight">Settings</h1>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Left */}
        <div className="space-y-3">
          {/* Profile */}
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Profile</p>
              <div className="flex items-center gap-3">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white font-heading text-sm font-bold">
                    {user?.displayName?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate">{user?.displayName || 'User'}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Badge variant="secondary" className="text-[9px] shrink-0">
                  {user?.providerData.some(p => p.providerId === 'google.com') ? 'Google' : 'Email'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Appearance + Export */}
          <Card className="border-border/50 shadow-sm">
            <CardContent className="divide-y divide-border/30 p-0">
              <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary/80">
                    {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold">Theme</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{theme}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="" onClick={toggleTheme}>{isDark ? 'Light' : 'Dark'}</Button>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary/80"><Download className="h-3.5 w-3.5" /></div>
                  <div>
                    <p className="text-[12px] font-semibold">Export</p>
                    <p className="text-[10px] text-muted-foreground">{transactions.length} transactions</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="" onClick={() => { exportTransactionsCSV(transactions); toast.success('Downloaded') }}>CSV</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right */}
        <div className="space-y-3">
          {/* Firebase Config */}
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FirebaseLogo className="h-4 w-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Firebase</p>
                </div>
                <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
                  <DialogTrigger>
                    <Button variant="outline" size="sm" className="">
                      <RefreshCw className="mr-1 h-3 w-3" />Change
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Update Firebase Config</DialogTitle></DialogHeader>
                    <FirebaseConfigForm
                      onValidate={handleValidateConfig}
                      onConnect={handleConnectConfig}
                      isProjectUsedCheck={handleProjectUsedCheck}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              {cachedConfig ? (
                <div className="space-y-1.5">
                  <Badge variant="secondary" className="bg-income/10 text-income text-[9px] font-bold">Connected</Badge>
                  {[
                    ['Project', cachedConfig.projectId],
                    ['API Key', cachedConfig.apiKey?.slice(0, 14) + '...'],
                    ['App ID', cachedConfig.appId?.slice(0, 18) + '...'],
                    ...(cachedConfig.storageBucket ? [['Bucket', cachedConfig.storageBucket]] : []),
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex items-center justify-between rounded-md bg-secondary/40 px-2.5 py-1.5">
                      <span className="text-[10px] text-muted-foreground">{label}</span>
                      <span className="font-mono text-[11px] font-medium">{val}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 rounded-md bg-income/5 border border-income/10 px-2.5 py-1.5">
                    <Shield className="h-3 w-3 text-income" />
                    <p className="text-[10px] text-income">Data stored in your own project</p>
                  </div>
                </div>
              ) : (
                <p className="text-[12px] text-muted-foreground">No config cached</p>
              )}
            </CardContent>
          </Card>

          {/* Account */}
          <Card className="border-border/50 shadow-sm">
            <CardContent className="divide-y divide-border/30 p-0">
              <div className="p-3">
                <Button variant="outline" size="sm" className="w-full" onClick={() => signOut()}>
                  <LogOut className="mr-1.5 h-3.5 w-3.5" />Sign Out
                </Button>
              </div>
              <div className="p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-destructive/60">Danger</p>
                <Button variant="destructive" size="sm" className="" onClick={handleDeleteAccount} disabled={deleting}>
                  {deleting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}<Trash2 className="mr-1 h-3 w-3" />Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
