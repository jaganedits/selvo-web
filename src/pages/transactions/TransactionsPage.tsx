import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { Card, CardContent } from '@/components/ui/card.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx'
import { MonthPicker } from '@/components/common/MonthPicker.tsx'
import { DateRangePicker } from '@/components/common/DateRangePicker.tsx'
import { EmptyState } from '@/components/common/EmptyState.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { useTransactions } from '@/hooks/use-transactions.ts'
import { useSecondaryFirebase } from '@/hooks/use-secondary-firebase.ts'
import { deleteTransaction } from '@/services/firestore.service.ts'
import { getMonthKey, formatDate, formatIndianAmount } from '@/lib/date.ts'
import { DEFAULT_CATEGORY_MAP } from '@/config/constants.ts'
import { ROUTES } from '@/config/routes.ts'
import { cn } from '@/lib/utils.ts'
import { toast } from 'sonner'
import { Plus, Search, Trash2, ReceiptText, X } from 'lucide-react'
import type { Transaction } from '@/types/transaction.ts'
import type { DateRange } from 'react-day-picker'

export default function TransactionsPage() {
  const navigate = useNavigate()
  const { db, uid } = useSecondaryFirebase()
  const [monthKey, setMonthKey] = useState(getMonthKey(new Date()))
  const [globalFilter, setGlobalFilter] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const { transactions, loading } = useTransactions(monthKey)

  const filtered = useMemo(() => {
    let result = transactions
    if (filterType !== 'all') result = result.filter(t => t.type === filterType)
    if (dateRange?.from) {
      const from = dateRange.from
      const to = dateRange.to ?? dateRange.from
      result = result.filter(t => {
        const d = t.date.toDate()
        return d >= from && d <= new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59)
      })
    }
    return result
  }, [transactions, filterType, dateRange])

  const totalIncome = transactions.filter(t => t.type === 'income' || t.type === 'settlement_income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense' || t.type === 'settlement_expense').reduce((s, t) => s + t.amount, 0)

  async function handleDelete(docId: string) {
    try { await deleteTransaction(db, uid, docId); toast.success('Deleted') }
    catch { toast.error('Failed') }
  }

  const columns: ColumnDef<Transaction>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Description',
      cell: ({ row }) => {
        const t = row.original
        return (
          <div>
            <p className="text-[13px] font-semibold">{t.name}</p>
            {t.note && <p className="text-[10px] text-muted-foreground/60">{t.note}</p>}
          </div>
        )
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const cat = row.original.category
        const color = DEFAULT_CATEGORY_MAP[cat]?.color ?? '#95A5A6'
        return <Badge variant="secondary" className="text-[10px] font-semibold" style={{ borderLeft: `2px solid ${color}` }}>{cat}</Badge>
      },
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => <span className="text-[12px] text-muted-foreground tabular-nums">{formatDate(row.original.date.toDate())}</span>,
    },
    {
      accessorKey: 'paymentMode',
      header: 'Mode',
      cell: ({ row }) => row.original.paymentMode ? <span className="text-[11px] text-muted-foreground">{row.original.paymentMode}</span> : null,
    },
    {
      accessorKey: 'amount',
      header: () => <span className="text-right block">Amount</span>,
      cell: ({ row }) => {
        const t = row.original
        const isIncome = t.type === 'income' || t.type === 'settlement_income'
        return (
          <span className={cn('block text-right font-heading text-[13px] font-bold tabular-nums', isIncome ? 'text-income' : 'text-expense')}>
            {isIncome ? '+' : '-'}{'\u20B9'}{formatIndianAmount(t.amount)}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-opacity"
          onClick={() => handleDelete(row.original.docId)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      ),
      size: 40,
    },
  ], [])

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  })

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-3 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-lg font-extrabold tracking-tight">Transactions</h1>
          <p className="text-[12px] text-muted-foreground tabular-nums">
            {transactions.length} transactions &middot;
            <span className="text-income"> +{'\u20B9'}{formatIndianAmount(totalIncome)}</span>
            <span className="text-expense"> -{'\u20B9'}{formatIndianAmount(totalExpense)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker monthKey={monthKey} onChange={setMonthKey} />
          <Button onClick={() => navigate(ROUTES.TRANSACTION_FORM)} size="sm" className="h-8 rounded-lg bg-brand text-xs hover:bg-brand-light">
            <Plus className="mr-1 h-3.5 w-3.5" />Add
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
          <Input placeholder="Search..." value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} className="h-8 rounded-lg pl-8 text-xs" />
        </div>
        <div className="flex items-center gap-1.5">
          <DateRangePicker dateRange={dateRange} onChange={setDateRange} />
          {dateRange?.from && (
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => setDateRange(undefined)}>
              <X className="h-3 w-3" />
            </Button>
          )}
          <div className="flex gap-0.5 rounded-lg bg-secondary/60 p-0.5">
            {['all', 'expense', 'income'].map(type => (
              <Button key={type} variant="ghost" size="sm"
                onClick={() => setFilterType(type)}
                className={cn('h-7 rounded-md px-3 text-[11px] font-bold capitalize',
                  filterType === type ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                )}
              >{type}</Button>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="h-5 w-5 text-muted-foreground" />}
          title="No transactions"
          description={globalFilter ? 'Try a different search' : 'Add your first transaction'}
          action={<Button size="sm" className="h-8 rounded-lg bg-brand text-xs hover:bg-brand-light" onClick={() => navigate(ROUTES.TRANSACTION_FORM)}><Plus className="mr-1 h-3 w-3" />Add</Button>}
        />
      ) : (
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id} className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} className="group">
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="px-3 py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
