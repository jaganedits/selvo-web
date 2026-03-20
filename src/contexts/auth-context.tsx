import { createContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { mainAuth } from '@/config/firebase.ts'
import { loadSavedConfig, disconnect } from '@/services/user-firebase.service.ts'

interface AuthContextValue {
  user: User | null
  loading: boolean
  hasFirebaseConfig: boolean
  configLoading: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasFirebaseConfig, setHasFirebaseConfig] = useState(false)
  const [configLoading, setConfigLoading] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(mainAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setHasFirebaseConfig(false)
        setLoading(false)
        disconnect()
        return
      }

      // Check email verification (Google users bypass)
      const isGoogle = firebaseUser.providerData.some(
        p => p.providerId === 'google.com'
      )
      if (!isGoogle && !firebaseUser.emailVerified) {
        setUser(firebaseUser)
        setHasFirebaseConfig(false)
        setLoading(false)
        return
      }

      setUser(firebaseUser)
      setConfigLoading(true)

      // Load Firebase config
      const hasConfig = await loadSavedConfig(firebaseUser.uid)
      setHasFirebaseConfig(hasConfig)
      setConfigLoading(false)
      setLoading(false)
    })

    return unsub
  }, [])

  return (
    <AuthContext value={{ user, loading, hasFirebaseConfig, configLoading }}>
      {children}
    </AuthContext>
  )
}
