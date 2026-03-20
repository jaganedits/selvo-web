import type { Timestamp } from 'firebase/firestore'

export type CategoryType = 'expense' | 'income'

export interface Category {
  docId: string
  name: string
  type: CategoryType
  iconCode: number
  colorValue: number
  createdAt: Timestamp
}

export interface CategoryDef {
  name: string
  icon: string
  color: string
}
