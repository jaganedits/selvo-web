import type { UserFirebaseConfig } from '@/types/user.ts'

export function validateFirebaseConfig(config: UserFirebaseConfig): string | null {
  if (!config.apiKey.trim()) return 'API Key is required'
  if (!config.projectId.trim()) return 'Project ID is required'
  if (!config.appId.trim()) return 'App ID is required'
  if (!config.messagingSenderId.trim()) return 'Messaging Sender ID is required'
  return null
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required'
  if (password.length < 6) return 'Password must be at least 6 characters'
  return null
}
