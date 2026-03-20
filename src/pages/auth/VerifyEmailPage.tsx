import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button.tsx'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.tsx'
import { checkEmailVerified, resendVerificationEmail } from '@/services/auth.service.ts'
import { ROUTES } from '@/config/routes.ts'
import { Mail, RefreshCw, CheckCircle2 } from 'lucide-react'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  // Poll for verification every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const verified = await checkEmailVerified()
      if (verified) {
        navigate(ROUTES.DASHBOARD, { replace: true })
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [navigate])

  async function handleResend() {
    setResending(true)
    try {
      await resendVerificationEmail()
      setResent(true)
      setTimeout(() => setResent(false), 5000)
    } catch { /* ignore */ }
    setResending(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
            <Mail className="h-8 w-8 text-brand" />
          </div>
          <CardTitle className="font-heading text-2xl">Check your email</CardTitle>
          <CardDescription>
            We sent a verification link to your email address. Click the link to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Waiting for verification...
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={resending || resent}
          >
            {resent ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4 text-income" />
                Email sent!
              </>
            ) : (
              'Resend verification email'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
