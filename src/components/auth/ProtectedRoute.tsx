import { Navigate } from 'react-router'
import { useAuth } from '@/hooks/use-auth.ts'
import { ROUTES } from '@/config/routes.ts'
import { SecondaryFirebaseProvider } from '@/contexts/firebase-context.tsx'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, hasFirebaseConfig, configLoading } = useAuth()

  if (loading || configLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-brand to-brand-light">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg">
            <span className="font-heading text-2xl font-bold text-brand">S</span>
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-white" />
          <p className="text-sm text-white/80">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  // Email not verified (non-Google users)
  const isGoogle = user.providerData.some(p => p.providerId === 'google.com')
  if (!isGoogle && !user.emailVerified) {
    return <Navigate to={ROUTES.VERIFY_EMAIL} replace />
  }

  // No Firebase config — needs onboarding
  if (!hasFirebaseConfig) {
    return <Navigate to={ROUTES.ONBOARDING} replace />
  }

  return (
    <SecondaryFirebaseProvider uid={user.uid}>
      {children}
    </SecondaryFirebaseProvider>
  )
}
