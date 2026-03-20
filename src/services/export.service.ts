import type { Transaction } from '@/types/transaction.ts'
import { format } from 'date-fns'

export function exportTransactionsCSV(transactions: Transaction[]): void {
  const headers = ['Date', 'Type', 'Category', 'Name', 'Amount', 'Payment Mode', 'Note']
  const rows = transactions.map(t => [
    format(t.date.toDate(), 'yyyy-MM-dd'),
    t.type,
    t.category,
    t.name,
    t.amount.toString(),
    t.paymentMode,
    t.note,
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `selvo-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
