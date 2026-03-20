import { deleteApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, enableIndexedDbPersistence, type Firestore } from 'firebase/firestore'
import type { UserFirebaseConfig } from '@/types/user.ts'

const SECONDARY_APP_NAME = 'secondary'

export function connectSecondaryFirebase(config: UserFirebaseConfig): {
  app: FirebaseApp
  db: Firestore
} {
  const existing = getApps().find(a => a.name === SECONDARY_APP_NAME)
  if (existing) {
    deleteApp(existing)
  }

  const firebaseConfig = {
    apiKey: config.apiKey,
    projectId: config.projectId,
    appId: config.appId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
  }

  const app = initializeApp(firebaseConfig, SECONDARY_APP_NAME)
  const db = getFirestore(app)

  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistence failed: multiple tabs open')
    } else if (err.code === 'unimplemented') {
      console.warn('Persistence not available in this browser')
    }
  })

  return { app, db }
}

export function disconnectSecondaryFirebase(): void {
  const app = getApps().find(a => a.name === SECONDARY_APP_NAME)
  if (app) {
    deleteApp(app)
  }
}

export function getSecondaryApp(): FirebaseApp | undefined {
  return getApps().find(a => a.name === SECONDARY_APP_NAME)
}
