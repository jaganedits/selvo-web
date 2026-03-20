import {
  doc,
  getDoc,
  writeBatch,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
} from 'firebase/firestore'
import { mainDb } from '@/config/firebase.ts'
import { connectSecondaryFirebase, disconnectSecondaryFirebase } from '@/config/firebase-secondary.ts'
import type { UserFirebaseConfig } from '@/types/user.ts'
import { isValidFirebaseConfig } from '@/types/user.ts'
import type { Firestore } from 'firebase/firestore'

const CACHE_KEY = 'firebase_config_cache'

let userFirestore: Firestore | null = null

export function getUserFirestore(): Firestore | null {
  return userFirestore
}

export async function loadSavedConfig(uid: string): Promise<boolean> {
  // 1. Try local cache
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const cfg: UserFirebaseConfig = JSON.parse(cached)
      if (isValidFirebaseConfig(cfg)) {
        const { db } = connectSecondaryFirebase(cfg)
        userFirestore = db
        return true
      }
    }
  } catch (e) {
    console.warn('Config cache read failed:', e)
  }

  // 2. Fall back to Firestore
  try {
    const userDoc = await getDoc(doc(mainDb, 'users', uid))
    const data = userDoc.data()
    if (!data) return false

    const configMap = data.firebaseConfig as UserFirebaseConfig | undefined
    if (!configMap || !isValidFirebaseConfig(configMap)) return false

    // Cache locally
    localStorage.setItem(CACHE_KEY, JSON.stringify(configMap))

    const { db } = connectSecondaryFirebase(configMap)
    userFirestore = db
    return true
  } catch (e) {
    console.error('loadSavedConfig error:', e)
    return false
  }
}

export async function isProjectUsedByOther(projectId: string, currentUid: string): Promise<boolean> {
  try {
    const projDoc = await getDoc(doc(mainDb, 'firebase_projects', projectId))
    if (!projDoc.exists()) return false
    const ownerUid = projDoc.data()?.uid as string | undefined
    return ownerUid != null && ownerUid !== currentUid
  } catch (e) {
    console.error('isProjectUsedByOther error:', e)
    return true // fail closed
  }
}

export async function validateConfig(cfg: UserFirebaseConfig): Promise<boolean> {
  try {
    const { db } = connectSecondaryFirebase(cfg)
    userFirestore = db

    // Test write + read
    const testRef = doc(collection(db, '_connection_test'), 'ping')
    await setDoc(testRef, { ok: true, at: new Date().toISOString() })
    const snap = await getDoc(testRef)
    if (!snap.exists()) return false

    // Clean up
    await deleteDoc(testRef)
    return true
  } catch (e) {
    console.error('validateConfig error:', e)
    userFirestore = null
    return false
  }
}

export async function connectWithConfig(uid: string, cfg: UserFirebaseConfig): Promise<boolean> {
  if (!isValidFirebaseConfig(cfg)) return false

  if (!userFirestore) {
    const valid = await validateConfig(cfg)
    if (!valid) return false
  }

  try {
    const batch = writeBatch(mainDb)

    batch.set(
      doc(mainDb, 'users', uid),
      {
        firebaseConfig: {
          apiKey: cfg.apiKey,
          projectId: cfg.projectId,
          appId: cfg.appId,
          storageBucket: cfg.storageBucket,
          messagingSenderId: cfg.messagingSenderId,
        },
        configSetAt: serverTimestamp(),
      },
      { merge: true }
    )

    batch.set(doc(mainDb, 'firebase_projects', cfg.projectId), {
      uid,
      connectedAt: serverTimestamp(),
    })

    await batch.commit()
    localStorage.setItem(CACHE_KEY, JSON.stringify(cfg))
    return true
  } catch (e) {
    console.error('connectWithConfig save error:', e)
    return false
  }
}

export function disconnect(): void {
  userFirestore = null
  localStorage.removeItem(CACHE_KEY)
  disconnectSecondaryFirebase()
}
