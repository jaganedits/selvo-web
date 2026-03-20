import { use } from 'react'
import { FirebaseContext } from '@/contexts/firebase-context.tsx'

export function useSecondaryFirebase() {
  const context = use(FirebaseContext)
  if (!context) {
    throw new Error('useSecondaryFirebase must be used within SecondaryFirebaseProvider')
  }
  return context
}
