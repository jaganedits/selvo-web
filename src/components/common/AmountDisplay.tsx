import { cn } from '@/lib/utils.ts'
import { formatIndianAmount } from '@/lib/date.ts'

interface AmountDisplayProps {
  amount: number
  type?: 'income' | 'expense' | string
  className?: string
  showSign?: boolean
}

export function AmountDisplay({ amount, type, className, showSign }: AmountDisplayProps) {
  const isIncome = type === 'income' || type === 'settlement_income'
  const prefix = showSign ? (isIncome ? '+' : '-') : ''

  return (
    <span
      className={cn(
        'font-heading font-bold tabular-nums tracking-tight',
        isIncome ? 'text-income' : type ? 'text-expense' : '',
        className
      )}
    >
      {prefix}{'\u20B9'}{formatIndianAmount(amount)}
    </span>
  )
}
