export interface SplitwiseExpense {
  id: number
  description: string
  cost: string
  date: string
  category: string
  selvoCategory: string
  type: 'expense' | 'income' | 'settlement_expense' | 'settlement_income'
  amount: number
  groupName?: string
}

export interface SplitwiseFriend {
  id: number
  firstName: string
  lastName: string
  balance: number
  currencyCode: string
}

export interface SplitwiseGroup {
  id: number
  name: string
  members: { id: number; firstName: string; lastName: string }[]
}
