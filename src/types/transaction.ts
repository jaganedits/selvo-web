import type { Timestamp } from 'firebase/firestore'

export type TransactionType = 'expense' | 'income' | 'settlement_expense' | 'settlement_income'

export interface Transaction {
  docId: string
  type: TransactionType
  amount: number
  category: string
  name: string
  date: Timestamp
  note: string
  paymentMode: string
  splitwiseId?: string
  createdAt: Timestamp
}

export type TransactionInput = Omit<Transaction, 'docId' | 'createdAt'>
