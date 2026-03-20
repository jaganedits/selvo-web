import { Card, CardContent } from '@/components/ui/card.tsx'
import { cn } from '@/lib/utils.ts'
import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string
  icon?: ReactNode
  trend?: string
  className?: string
  valueClassName?: string
  accent?: 'income' | 'expense' | 'budget' | 'brand'
}

const accentMap = {
  income: 'card-accent-income',
  expense: 'card-accent-expense',
  budget: 'card-accent-budget',
  brand: 'card-accent-left',
}

export function StatCard({ title, value, icon, trend, className, valueClassName, accent }: StatCardProps) {
  return (
    <Card className={cn('border-border/50 shadow-sm', accent && accentMap[accent], className)}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">{title}</p>
            <p className={cn('mt-1 font-heading text-xl font-extrabold leading-none tracking-tight tabular-nums', valueClassName)}>
              {value}
            </p>
            {trend && <p className="mt-1 text-[11px] text-muted-foreground">{trend}</p>}
          </div>
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/80">{icon}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
