import { useState, type FormEvent } from 'react'
import { Card, CardContent } from '@/components/ui/card.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.tsx'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { DatePicker } from '@/components/common/DatePicker.tsx'
import { EmptyState } from '@/components/common/EmptyState.tsx'
import { AmountDisplay } from '@/components/common/AmountDisplay.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { useRecurring } from '@/hooks/use-recurring.ts'
import { useSecondaryFirebase } from '@/hooks/use-secondary-firebase.ts'
import { addRecurring, deleteRecurring, toggleRecurring } from '@/services/firestore.service.ts'
import { DEFAULT_EXPENSE_CATEGORIES } from '@/config/constants.ts'
import { formatDate } from '@/lib/date.ts'
import { cn } from '@/lib/utils.ts'
import { toast } from 'sonner'
import { Plus, Trash2, Repeat, Loader2, Pause, Play } from 'lucide-react'

export default function RecurringPage() {
  const { db, uid } = useSecondaryFirebase()
  const { recurring, loading } = useRecurring()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    type: 'expense' as 'expense' | 'income',
    amount: '',
    name: '',
    category: DEFAULT_EXPENSE_CATEGORIES[0]!.name,
    frequency: 'monthly' as string,
    nextDate: new Date(),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.amount || parseFloat(form.amount) <= 0) { setFormError('Amount is required'); return }
    if (!form.name.trim()) { setFormError('Name is required'); return }
    setFormError('')
    doSave()
  }

  async function doSave() {
    setSaving(true)
    try {
      await addRecurring(db, uid, {
        type: form.type, amount: parseFloat(form.amount), category: form.category,
        name: form.name, frequency: form.frequency, nextDate: form.nextDate,
      })
      toast.success('Added')
      setDialogOpen(false)
      setForm(f => ({ ...f, amount: '', name: '' }))
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }

  if (loading) return <div className="space-y-3"><Skeleton className="h-8 w-48 rounded-lg" />{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>

  return (
    <div className="space-y-3 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-lg font-extrabold tracking-tight">Recurring</h1>
          <p className="text-[12px] text-muted-foreground">{recurring.length} active</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); setFormError('') }}>
          <DialogTrigger><Button size="sm" className="bg-brand hover:bg-brand-light"><Plus className="mr-1 h-3.5 w-3.5" />Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Recurring Transaction</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              {formError && <p className="rounded-md bg-destructive/10 px-3 py-1.5 text-[11px] text-destructive">{formError}</p>}
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary/60 p-0.5">
                {(['expense', 'income'] as const).map(t => (
                  <Button key={t} type="button" variant="ghost" size="sm"
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={cn('h-8 rounded-md text-xs font-bold capitalize',
                      form.type === t ? t === 'expense' ? 'bg-expense text-white shadow-sm hover:bg-expense hover:text-white' : 'bg-income text-white shadow-sm hover:bg-income hover:text-white' : 'text-muted-foreground'
                    )}>{t}</Button>
                ))}
              </div>
              <div className="grid items-start grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Amount *</Label>
                  <Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="mt-1 h-9 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Name *</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 h-9 rounded-lg" />
                </div>
              </div>
              <div className="grid items-start grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Frequency</Label>
                  <div className="mt-1">
                    <Select value={form.frequency} onValueChange={v => v && setForm(f => ({ ...f, frequency: v }))}>
                      <SelectTrigger className="h-9 w-full rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Next Date</Label>
                  <div className="mt-1">
                    <DatePicker date={form.nextDate} onChange={d => setForm(f => ({ ...f, nextDate: d }))} className="h-9 w-full" />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full bg-brand hover:bg-brand-light" disabled={saving}>
                {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}Add
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {recurring.length === 0 ? (
        <EmptyState icon={<Repeat className="h-5 w-5 text-muted-foreground" />} title="No recurring transactions" description="Set up recurring bills, subscriptions, etc." />
      ) : (
        <div className="space-y-1.5">
          {recurring.map(r => (
            <Card key={r.docId} className="border-border/50 shadow-sm">
              <CardContent className="flex items-center justify-between px-3 py-2.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-semibold">{r.name}</p>
                    <Badge variant="secondary" className="capitalize text-[9px] font-bold px-1.5 py-0">{r.frequency}</Badge>
                    {!r.isActive && <Badge variant="outline" className="text-[9px] px-1.5 py-0">Paused</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Next: {formatDate(r.nextDate.toDate())} &middot; {r.category}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <AmountDisplay amount={r.amount} type={r.type} showSign className="text-[13px]" />
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => toggleRecurring(db, uid, r.docId, !r.isActive)}>
                    {r.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive" onClick={() => { deleteRecurring(db, uid, r.docId); toast.success('Deleted') }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
