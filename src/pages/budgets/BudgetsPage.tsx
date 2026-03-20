import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.tsx'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.tsx'
import { MonthPicker } from '@/components/common/MonthPicker.tsx'
import { EmptyState } from '@/components/common/EmptyState.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { useBudgets } from '@/hooks/use-budgets.ts'
import { useTransactions } from '@/hooks/use-transactions.ts'
import { useSecondaryFirebase } from '@/hooks/use-secondary-firebase.ts'
import { setBudget, deleteBudget } from '@/services/firestore.service.ts'
import { getMonthKey, formatIndianAmount } from '@/lib/date.ts'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_CATEGORY_MAP } from '@/config/constants.ts'
import { toast } from 'sonner'
import { Plus, Trash2, PiggyBank, Loader2 } from 'lucide-react'

export default function BudgetsPage() {
  const { db, uid } = useSecondaryFirebase()
  const [monthKey, setMonthKey] = useState(getMonthKey(new Date()))
  const { budgets, loading } = useBudgets(monthKey)
  const { transactions } = useTransactions(monthKey)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [budgetCategory, setBudgetCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]!.name)
  const [budgetAmount, setBudgetAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const categorySpending = new Map<string, number>()
  transactions
    .filter(t => t.type === 'expense' || t.type === 'settlement_expense')
    .forEach(t => {
      categorySpending.set(t.category, (categorySpending.get(t.category) ?? 0) + t.amount)
    })

  async function handleSaveBudget() {
    if (!budgetAmount) return
    setSaving(true)
    try {
      await setBudget(db, uid, budgetCategory, parseFloat(budgetAmount), monthKey)
      toast.success('Budget saved')
      setDialogOpen(false)
      setBudgetAmount('')
    } catch {
      toast.error('Failed to save budget')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteBudget(category: string) {
    try {
      await deleteBudget(db, uid, category, monthKey)
      toast.success('Budget removed')
    } catch {
      toast.error('Failed to remove budget')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48 rounded-lg" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3 animate-fade-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-lg font-extrabold tracking-tight">Budgets</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{budgets.length} budgets set</p>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker monthKey={monthKey} onChange={setMonthKey} />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <Button size="sm" className="bg-brand hover:bg-brand-light">
                <Plus className="mr-1 h-3.5 w-3.5" />Set Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Budget</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Category</Label>
                  <Select value={budgetCategory} onValueChange={v => v && setBudgetCategory(v)}>
                    <SelectTrigger className="h-9 w-full rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_EXPENSE_CATEGORIES.map(c => (
                        <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Budget amount"
                    value={budgetAmount}
                    onChange={e => setBudgetAmount(e.target.value)}
                    className="h-9 rounded-lg"
                  />
                </div>
                <Button onClick={handleSaveBudget} className="w-full bg-brand hover:bg-brand-light" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Budget
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          icon={<PiggyBank className="h-6 w-6 text-muted-foreground" />}
          title="No budgets set"
          description="Set budgets to track your spending by category"
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 stagger-children">
          {budgets.map(b => {
            const spent = categorySpending.get(b.category) ?? 0
            const percentage = b.amount > 0 ? Math.min(Math.round((spent / b.amount) * 100), 100) : 0
            const isOver = spent > b.amount
            const catColor = DEFAULT_CATEGORY_MAP[b.category]?.color ?? '#95A5A6'

            return (
              <Card key={b.category} size="sm" className="border-border/50 shadow-sm" style={{ borderLeft: `3px solid ${catColor}` }}>
                <CardContent className="flex flex-col gap-1 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold">{b.category}</span>
                    <Button variant="ghost" size="icon-sm"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                      onClick={() => handleDeleteBudget(b.category)}
                    ><Trash2 className="h-3 w-3" /></Button>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="font-heading text-base font-extrabold tabular-nums">
                      {'\u20B9'}{formatIndianAmount(spent)}
                    </span>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      of {'\u20B9'}{formatIndianAmount(b.amount)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary/80">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: isOver ? 'var(--destructive)' : catColor,
                      }}
                    />
                  </div>
                  <p className={`mt-1.5 text-[11px] font-semibold ${isOver ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {isOver
                      ? `Over budget by \u20B9${formatIndianAmount(spent - b.amount)}`
                      : `\u20B9${formatIndianAmount(b.amount - spent)} remaining`}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
