import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  deleteUser,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { mainAuth, mainDb } from '@/config/firebase.ts'

export class AuthError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'AuthError'
  }
}

function friendlyError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered'
    case 'auth/invalid-email':
      return 'Invalid email address'
    case 'auth/weak-password':
      return 'Password is too weak (min 6 characters)'
    case 'auth/user-not-found':
      return 'No account found with this email'
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect password'
    case 'auth/user-disabled':
      return 'This account has been disabled'
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later'
    default:
      return code.replace('auth/', '')
  }
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  try {
    const result = await signInWithEmailAndPassword(mainAuth, email, password)
    await result.user.reload()
    const user = mainAuth.currentUser
    if (user && !user.emailVerified) {
      try { await sendEmailVerification(user) } catch { /* ignore */ }
      await firebaseSignOut(mainAuth)
      throw new AuthError(
        'email-not-verified',
        'Please verify your email first. Check your inbox.'
      )
    }
    return result.user
  } catch (e) {
    if (e instanceof AuthError) throw e
    const err = e as { code?: string }
    throw new AuthError(err.code ?? 'unknown', friendlyError(err.code ?? 'unknown'))
  }
}

export async function registerWithEmail(email: string, password: string, name: string): Promise<User> {
  try {
    const result = await createUserWithEmailAndPassword(mainAuth, email, password)
    await updateProfile(result.user, { displayName: name })
    await sendEmailVerification(result.user)
    await setDoc(doc(mainDb, 'users', result.user.uid), {
      name,
      email,
      updatedAt: serverTimestamp(),
    }, { merge: true })
    return result.user
  } catch (e) {
    const err = e as { code?: string }
    throw new AuthError(err.code ?? 'unknown', friendlyError(err.code ?? 'unknown'))
  }
}

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(mainAuth, provider)
  await setDoc(doc(mainDb, 'users', result.user.uid), {
    name: result.user.displayName ?? '',
    email: result.user.email ?? '',
    updatedAt: serverTimestamp(),
  }, { merge: true })
  return result.user
}

export async function resendVerificationEmail(): Promise<void> {
  const user = mainAuth.currentUser
  if (user) await sendEmailVerification(user)
}

export async function checkEmailVerified(): Promise<boolean> {
  const user = mainAuth.currentUser
  if (!user) return false
  await user.reload()
  return mainAuth.currentUser?.emailVerified ?? false
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(mainAuth, email)
}

export async function signOut(): Promise<void> {
  localStorage.removeItem('firebase_config_cache')
  await firebaseSignOut(mainAuth)
}

export async function deleteAccount(): Promise<void> {
  const user = mainAuth.currentUser
  if (!user) return

  localStorage.removeItem('firebase_config_cache')

  try {
    await deleteUser(user)
  } catch {
    await firebaseSignOut(mainAuth)
  }
}
