import { createContext, type ReactNode } from 'react'
import { getUserFirestore } from '@/services/user-firebase.service.ts'
import type { Firestore } from 'firebase/firestore'

interface FirebaseContextValue {
  db: Firestore
  uid: string
}

export const FirebaseContext = createContext<FirebaseContextValue | null>(null)

export function SecondaryFirebaseProvider({
  uid,
  children,
}: {
  uid: string
  children: ReactNode
}) {
  const db = getUserFirestore()

  if (!db) {
    return null
  }

  return (
    <FirebaseContext value={{ db, uid }}>
      {children}
    </FirebaseContext>
  )
}
