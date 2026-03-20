import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Card, CardContent } from '@/components/ui/card.tsx'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.tsx'
import { DatePicker } from '@/components/common/DatePicker.tsx'
import { useSecondaryFirebase } from '@/hooks/use-secondary-firebase.ts'
import { addTransaction } from '@/services/firestore.service.ts'
import { ROUTES } from '@/config/routes.ts'
import { PAYMENT_MODES, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/config/constants.ts'
import { Timestamp } from 'firebase/firestore'
import { toast } from 'sonner'
import { cn } from '@/lib/utils.ts'
import { Loader2, ArrowLeft } from 'lucide-react'

const schema = z.object({
  amount: z.string().min(1, 'Required').refine(v => parseFloat(v) > 0, 'Must be > 0'),
  name: z.string().min(1, 'Required'),
  note: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function FieldError({ message }: { message?: string }) {
  return <p className={cn('h-4 text-[10px] text-destructive', !message && 'invisible')}>{message || ' '}</p>
}

export default function TransactionFormPage() {
  const navigate = useNavigate()
  const { db, uid } = useSecondaryFirebase()
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]!.name)
  const [date, setDate] = useState(new Date())
  const [paymentMode, setPaymentMode] = useState<string>(PAYMENT_MODES[0]!)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', name: '', note: '' },
  })

  const categories = type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES

  function handleTypeChange(newType: 'expense' | 'income') {
    setType(newType)
    const cats = newType === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES
    setCategory(cats[0]!.name)
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      await addTransaction(db, uid, {
        type, amount: parseFloat(data.amount), category, name: data.name,
        date: Timestamp.fromDate(date), note: data.note ?? '', paymentMode,
      })
      toast.success('Transaction added')
      navigate(ROUTES.TRANSACTIONS, { replace: true })
    } catch {
      toast.error('Failed to add transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2 h-8 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />Back
        </Button>
        <h1 className="font-heading text-lg font-extrabold tracking-tight">New Transaction</h1>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
            {/* Row 1: Type + Amount */}
            <div className="grid items-start grid-cols-[200px_1fr] gap-3">
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Type</Label>
                <div className="mt-1 grid grid-cols-2 gap-1 rounded-lg bg-secondary/60 p-0.5">
                  {(['expense', 'income'] as const).map(t => (
                    <Button key={t} type="button" variant="ghost" size="sm"
                      onClick={() => handleTypeChange(t)}
                      className={cn('h-9 rounded-md text-xs font-bold capitalize',
                        type === t ? t === 'expense'
                          ? 'bg-expense text-white shadow-sm hover:bg-expense hover:text-white'
                          : 'bg-income text-white shadow-sm hover:bg-income hover:text-white'
                        : 'text-muted-foreground'
                      )}
                    >{t}</Button>
                  ))}
                </div>
                <div className="h-4" />
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Amount *</Label>
                <Input
                  {...register('amount')}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className={cn('mt-1 h-9 rounded-lg text-sm font-heading font-bold tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none', errors.amount && 'border-destructive focus-visible:ring-destructive/30')}
                />
                <FieldError message={errors.amount?.message} />
              </div>
            </div>

            {/* Row 2: Description + Category */}
            <div className="grid items-start grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Description *</Label>
                <Input
                  {...register('name')}
                  placeholder="What was this for?"
                  className={cn('mt-1 h-9 rounded-lg text-sm', errors.name && 'border-destructive focus-visible:ring-destructive/30')}
                />
                <FieldError message={errors.name?.message} />
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Category</Label>
                <div className="mt-1">
                  <Select value={category} onValueChange={v => v && setCategory(v)}>
                    <SelectTrigger className="h-9 w-full rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.name} value={c.name}>
                          <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="h-4" />
              </div>
            </div>

            {/* Row 3: Date + Payment Mode + Note */}
            <div className="grid items-start grid-cols-3 gap-3">
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Date</Label>
                <div className="mt-1">
                  <DatePicker date={date} onChange={setDate} className="h-9 w-full" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Payment Mode</Label>
                <div className="mt-1">
                  <Select value={paymentMode} onValueChange={v => v && setPaymentMode(v)}>
                    <SelectTrigger className="h-9 w-full rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_MODES.map(mode => (
                        <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Note</Label>
                <Input {...register('note')} placeholder="Optional" className="mt-1 h-9 rounded-lg text-sm" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-brand px-6 hover:bg-brand-light">
                {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Add Transaction
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
