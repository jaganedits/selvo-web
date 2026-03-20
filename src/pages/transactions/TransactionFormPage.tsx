import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
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

export default function TransactionFormPage() {
  const navigate = useNavigate()
  const { db, uid } = useSecondaryFirebase()
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]!.name)
  const [date, setDate] = useState(new Date())
  const [paymentMode, setPaymentMode] = useState<string>(PAYMENT_MODES[0]!)
  const [note, setNote] = useState('')

  const categories = type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES

  function handleTypeChange(newType: 'expense' | 'income') {
    setType(newType)
    const cats = newType === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES
    setCategory(cats[0]!.name)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!amount || !name) return
    setLoading(true)
    try {
      await addTransaction(db, uid, {
        type, amount: parseFloat(amount), category, name,
        date: Timestamp.fromDate(date), note, paymentMode,
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
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Row 1: Type + Amount */}
            <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Type</Label>
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary/60 p-0.5">
                  {(['expense', 'income'] as const).map(t => (
                    <Button key={t} type="button" variant="ghost" size="sm"
                      onClick={() => handleTypeChange(t)}
                      className={cn('h-8 rounded-md text-xs font-bold capitalize',
                        type === t ? t === 'expense'
                          ? 'bg-expense text-white shadow-sm hover:bg-expense hover:text-white'
                          : 'bg-income text-white shadow-sm hover:bg-income hover:text-white'
                        : 'text-muted-foreground'
                      )}
                    >{t}</Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Amount</Label>
                <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-background px-3">
                  <span className="text-sm text-muted-foreground/50">{'\u20B9'}</span>
                  <input type="number" step="0.01" placeholder="0.00" value={amount}
                    onChange={e => setAmount(e.target.value)} required
                    className="h-9 w-full bg-transparent font-heading text-lg font-bold tabular-nums outline-none placeholder:text-muted-foreground/20"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Description + Category */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Description</Label>
                <Input placeholder="What was this for?" value={name} onChange={e => setName(e.target.value)} required className="h-9 rounded-lg text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Category</Label>
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
            </div>

            {/* Row 3: Date + Payment + Note */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Date</Label>
                <DatePicker date={date} onChange={setDate} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Payment Mode</Label>
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
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Note</Label>
                <Input placeholder="Optional" value={note} onChange={e => setNote(e.target.value)} className="h-9 rounded-lg text-sm" />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-1">
              <Button type="button" variant="outline" size="sm" className="mr-2 h-9 rounded-lg" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={loading} className="h-9 rounded-lg bg-brand px-6 font-semibold hover:bg-brand-light">
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
