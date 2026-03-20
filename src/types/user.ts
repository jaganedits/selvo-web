export interface UserFirebaseConfig {
  apiKey: string
  projectId: string
  appId: string
  storageBucket: string
  messagingSenderId: string
}

export interface UserProfile {
  uid: string
  name: string
  email: string
  firebaseConfig?: UserFirebaseConfig
  configSetAt?: Date
}

export function isValidFirebaseConfig(config: UserFirebaseConfig): boolean {
  return (
    config.apiKey.trim() !== '' &&
    config.projectId.trim() !== '' &&
    config.appId.trim() !== '' &&
    config.messagingSenderId.trim() !== ''
  )
}
