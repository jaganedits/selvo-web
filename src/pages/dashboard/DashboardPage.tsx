import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx'
import { StatCard } from '@/components/common/StatCard.tsx'
import { MonthPicker } from '@/components/common/MonthPicker.tsx'
import { EmptyState } from '@/components/common/EmptyState.tsx'
import { useTransactions } from '@/hooks/use-transactions.ts'
import { useBudgets } from '@/hooks/use-budgets.ts'
import { getMonthKey, formatIndianAmount, formatDate } from '@/lib/date.ts'
import { DEFAULT_CATEGORY_MAP } from '@/config/constants.ts'
import { ROUTES } from '@/config/routes.ts'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { cn } from '@/lib/utils.ts'
import {
  TrendingUp, TrendingDown, Wallet, ArrowRight, ReceiptText, Plus,
} from 'lucide-react'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [monthKey, setMonthKey] = useState(getMonthKey(new Date()))
  const { transactions, loading } = useTransactions(monthKey)
  const { budgets } = useBudgets(monthKey)

  const totalIncome = transactions
    .filter(t => t.type === 'income' || t.type === 'settlement_income')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions
    .filter(t => t.type === 'expense' || t.type === 'settlement_expense')
    .reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpense

  const categoryTotals = new Map<string, number>()
  transactions
    .filter(t => t.type === 'expense' || t.type === 'settlement_expense')
    .forEach(t => categoryTotals.set(t.category, (categoryTotals.get(t.category) ?? 0) + t.amount))
  const topCategories = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)

  const recentTransactions = transactions.slice(0, 8)

  // Budget usage
  const budgetItems = budgets.map(b => {
    const spent = categoryTotals.get(b.category) ?? 0
    const pct = b.amount > 0 ? Math.min(Math.round((spent / b.amount) * 100), 100) : 0
    return { ...b, spent, pct, isOver: spent > b.amount }
  }).slice(0, 4)

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between"><Skeleton className="h-9 w-44" /><Skeleton className="h-9 w-52" /></div>
        <div className="grid gap-3 md:grid-cols-3"><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /></div>
        <div className="grid gap-3 lg:grid-cols-3"><Skeleton className="h-80 rounded-xl lg:col-span-2" /><Skeleton className="h-80 rounded-xl" /></div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-up">
        <div>
          <h1 className="font-heading text-lg font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-[12px] text-muted-foreground">{transactions.length} transactions this month</p>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker monthKey={monthKey} onChange={setMonthKey} />
          <Button onClick={() => navigate(ROUTES.TRANSACTION_FORM)} size="sm" className="h-8 rounded-lg bg-brand text-xs hover:bg-brand-light">
            <Plus className="mr-1 h-3.5 w-3.5" />Add
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 md:grid-cols-3 stagger-children">
        <StatCard title="Income" value={`\u20B9${formatIndianAmount(totalIncome)}`} icon={<TrendingUp className="h-4 w-4 text-income" />} valueClassName="text-income" accent="income" />
        <StatCard title="Expense" value={`\u20B9${formatIndianAmount(totalExpense)}`} icon={<TrendingDown className="h-4 w-4 text-expense" />} valueClassName="text-expense" accent="expense" />
        <StatCard title="Balance" value={`\u20B9${formatIndianAmount(Math.abs(balance))}`} icon={<Wallet className="h-4 w-4 text-budget" />} valueClassName={balance >= 0 ? 'text-income' : 'text-expense'} accent="budget" />
      </div>

      {/* Main grid — 3 cols on desktop */}
      <div className="grid gap-3 lg:grid-cols-3">
        {/* Recent Transactions — 2 cols wide */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm animate-fade-up" style={{ animationDelay: '100ms' }}>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <CardTitle className="text-[13px] font-bold">Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs font-semibold text-brand hover:text-brand-light hover:bg-brand/5" onClick={() => navigate(ROUTES.TRANSACTIONS)}>
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentTransactions.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={<ReceiptText className="h-5 w-5 text-muted-foreground" />}
                  title="No transactions yet"
                  description="Start tracking your spending"
                  action={<Button size="sm" className="rounded-xl bg-brand hover:bg-brand-light" onClick={() => navigate(ROUTES.TRANSACTION_FORM)}><Plus className="mr-1.5 h-3 w-3" />Add</Button>}
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Description</TableHead>
                    <TableHead className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 hidden sm:table-cell">Category</TableHead>
                    <TableHead className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 hidden sm:table-cell">Date</TableHead>
                    <TableHead className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map(t => {
                    const catColor = DEFAULT_CATEGORY_MAP[t.category]?.color ?? '#95A5A6'
                    const isIncome = t.type === 'income' || t.type === 'settlement_income'
                    return (
                      <TableRow key={t.docId}>
                        <TableCell className="px-3 py-1.5 text-[13px] font-semibold">{t.name}</TableCell>
                        <TableCell className="px-3 py-1.5 hidden sm:table-cell">
                          <Badge variant="secondary" className="text-[9px] font-semibold" style={{ borderLeft: `2px solid ${catColor}` }}>{t.category}</Badge>
                        </TableCell>
                        <TableCell className="px-3 py-1.5 text-[11px] text-muted-foreground tabular-nums hidden sm:table-cell">{formatDate(t.date.toDate())}</TableCell>
                        <TableCell className={cn('px-3 py-1.5 text-right font-heading text-[13px] font-bold tabular-nums', isIncome ? 'text-income' : 'text-expense')}>
                          {isIncome ? '+' : '-'}{'\u20B9'}{formatIndianAmount(t.amount)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Right sidebar — Category breakdown + Budget */}
        <div className="space-y-3">
          {/* Categories */}
          <Card className="border-border/50 shadow-sm animate-fade-up" style={{ animationDelay: '200ms' }}>
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-[13px] font-bold">Spending by Category</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-brand hover:text-brand-light hover:bg-brand/5" onClick={() => navigate(ROUTES.REPORTS)}>
                Details <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {topCategories.length === 0 ? (
                <p className="py-6 text-center text-[12px] text-muted-foreground">No expenses this month</p>
              ) : (
                <div className="space-y-3">
                  {topCategories.map(([category, amount]) => {
                    const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
                    const color = DEFAULT_CATEGORY_MAP[category]?.color ?? '#95A5A6'
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
                            <span className="text-[12px] font-semibold">{category}</span>
                          </div>
                          <span className="text-[11px] font-bold tabular-nums text-muted-foreground">{pct}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-secondary/80">
                          <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget overview */}
          {budgetItems.length > 0 && (
            <Card className="border-border/50 shadow-sm animate-fade-up" style={{ animationDelay: '300ms' }}>
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                <CardTitle className="text-[13px] font-bold">Budget Status</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-brand hover:text-brand-light hover:bg-brand/5" onClick={() => navigate(ROUTES.BUDGETS)}>
                  Manage <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                {budgetItems.map(b => (
                  <div key={b.category} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold">{b.category}</span>
                        <span className={cn('text-[10px] font-bold tabular-nums', b.isOver ? 'text-destructive' : 'text-muted-foreground')}>
                          {b.pct}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary/80">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${b.pct}%`, backgroundColor: b.isOver ? 'var(--destructive)' : 'var(--color-budget)' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
