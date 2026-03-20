import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx'
import { Button } from '@/components/ui/button.tsx'
import { MonthPicker } from '@/components/common/MonthPicker.tsx'
import { StatCard } from '@/components/common/StatCard.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { useTransactions, useAllTransactions } from '@/hooks/use-transactions.ts'
import { getMonthKey, formatIndianAmount, getMonthStart } from '@/lib/date.ts'
import { exportTransactionsCSV } from '@/services/export.service.ts'
import { CHART_PALETTE } from '@/config/constants.ts'
import { format, subMonths } from 'date-fns'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import { Download, TrendingUp, TrendingDown, CalendarDays } from 'lucide-react'
import type { Transaction } from '@/types/transaction.ts'

function computeStats(transactions: Transaction[], allTransactions: Transaction[], monthKey: string) {
  const expenses = transactions.filter(t => t.type === 'expense' || t.type === 'settlement_expense')
  const incomes = transactions.filter(t => t.type === 'income' || t.type === 'settlement_income')

  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0)
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0)

  // Category breakdown
  const catMap = new Map<string, number>()
  expenses.forEach(t => catMap.set(t.category, (catMap.get(t.category) ?? 0) + t.amount))
  const categoryBreakdown = [...catMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  // Daily spending
  const dailyMap = new Map<string, number>()
  expenses.forEach(t => {
    const day = format(t.date.toDate(), 'dd')
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + t.amount)
  })
  const dailySpending = [...dailyMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, amount]) => ({ day, amount }))

  // 6-month trend
  const trendData = []
  const now = getMonthStart(monthKey)
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i)
    const mk = getMonthKey(d)
    const monthTxs = allTransactions.filter(t => {
      const txDate = t.date.toDate()
      return getMonthKey(txDate) === mk
    })
    const inc = monthTxs.filter(t => t.type === 'income' || t.type === 'settlement_income').reduce((s, t) => s + t.amount, 0)
    const exp = monthTxs.filter(t => t.type === 'expense' || t.type === 'settlement_expense').reduce((s, t) => s + t.amount, 0)
    trendData.push({ month: format(d, 'MMM'), income: inc, expense: exp })
  }

  // Average daily
  const daysWithExpense = dailyMap.size || 1
  const avgDaily = totalExpense / daysWithExpense

  return { totalExpense, totalIncome, categoryBreakdown, dailySpending, trendData, avgDaily }
}

export default function ReportsPage() {
  const [monthKey, setMonthKey] = useState(getMonthKey(new Date()))
  const { transactions, loading } = useTransactions(monthKey)
  const { transactions: allTransactions } = useAllTransactions()

  const stats = useMemo(
    () => computeStats(transactions, allTransactions, monthKey),
    [transactions, allTransactions, monthKey]
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl font-bold">Reports</h1>
        <div className="flex items-center gap-2">
          <MonthPicker monthKey={monthKey} onChange={setMonthKey} />
          <Button variant="outline" size="sm" onClick={() => exportTransactionsCSV(transactions)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Income" value={`\u20B9${formatIndianAmount(stats.totalIncome)}`} icon={<TrendingUp className="h-5 w-5 text-income" />} valueClassName="text-income" />
        <StatCard title="Expense" value={`\u20B9${formatIndianAmount(stats.totalExpense)}`} icon={<TrendingDown className="h-5 w-5 text-expense" />} valueClassName="text-expense" />
        <StatCard title="Avg Daily Spend" value={`\u20B9${formatIndianAmount(stats.avgDaily)}`} icon={<CalendarDays className="h-5 w-5 text-budget" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Category Breakdown</CardTitle></CardHeader>
          <CardContent>
            {stats.categoryBreakdown.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No expenses this month</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={stats.categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {stats.categoryBreakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `\u20B9${formatIndianAmount(Number(v))}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Daily Bar Chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Daily Spending</CardTitle></CardHeader>
          <CardContent>
            {stats.dailySpending.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.dailySpending}>
                  <XAxis dataKey="day" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v) => `\u20B9${formatIndianAmount(Number(v))}`} />
                  <Bar dataKey="amount" fill="#CF4500" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trend Line Chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">6-Month Trend</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v) => `\u20B9${formatIndianAmount(Number(v))}`} />
              <Line type="monotone" dataKey="income" stroke="#2ECC71" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expense" stroke="#CF4500" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
