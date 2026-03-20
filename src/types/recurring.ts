import type { Timestamp } from 'firebase/firestore'

export type Frequency = 'daily' | 'weekly' | 'monthly'

export interface RecurringTransaction {
  docId: string
  type: 'expense' | 'income'
  amount: number
  category: string
  name: string
  frequency: Frequency
  nextDate: Timestamp
  paymentMode: string
  note: string
  isActive: boolean
  createdAt: Timestamp
}
