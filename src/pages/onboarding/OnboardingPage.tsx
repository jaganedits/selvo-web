import { useState } from 'react'
import { Button } from '@/components/ui/button.tsx'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.tsx'
import { FirebaseConfigForm } from '@/components/common/FirebaseConfigForm.tsx'
import { useAuth } from '@/hooks/use-auth.ts'
import { validateConfig, connectWithConfig, isProjectUsedByOther } from '@/services/user-firebase.service.ts'
import { ROUTES } from '@/config/routes.ts'
import type { UserFirebaseConfig } from '@/types/user.ts'
import { ArrowRight, CloudCog } from 'lucide-react'

type Step = 'welcome' | 'setup'

export default function OnboardingPage() {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>('welcome')

  async function handleValidate(config: UserFirebaseConfig) {
    return validateConfig(config)
  }

  async function handleConnect(config: UserFirebaseConfig) {
    if (!user) return false
    const ok = await connectWithConfig(user.uid, config)
    if (ok) window.location.href = ROUTES.DASHBOARD
    return ok
  }

  async function handleProjectCheck(projectId: string) {
    if (!user) return true
    return isProjectUsedByOther(projectId, user.uid)
  }

  if (step === 'welcome') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand via-brand-light to-[#FF8F4C] p-6">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10">
              <span className="font-heading text-3xl font-bold text-brand">S</span>
            </div>
            <CardTitle className="font-heading text-2xl">Welcome to Selvo</CardTitle>
            <CardDescription>
              Connect your own Firebase project to store your data securely.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-muted p-3 text-left text-sm text-muted-foreground">
              <p className="font-medium text-foreground text-[13px]">Why your own Firebase?</p>
              <p className="mt-1 text-[12px]">Your financial data stays in your own cloud project. You own it, you control it.</p>
            </div>
            <Button onClick={() => setStep('setup')} className="w-full h-10 bg-brand hover:bg-brand-light">
              Set up Firebase <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
            <CloudCog className="h-5 w-5 text-brand" />
          </div>
          <CardTitle className="text-center font-heading text-xl">Connect Firebase</CardTitle>
          <CardDescription className="text-center text-[13px]">
            Paste your config, upload JSON, or enter manually
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FirebaseConfigForm
            onValidate={handleValidate}
            onConnect={handleConnect}
            isProjectUsedCheck={handleProjectCheck}
          />
        </CardContent>
      </Card>
    </div>
  )
}
