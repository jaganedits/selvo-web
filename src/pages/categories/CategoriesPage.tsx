import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.tsx'
import { EmptyState } from '@/components/common/EmptyState.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx'
import { useCategories } from '@/hooks/use-categories.ts'
import { useSecondaryFirebase } from '@/hooks/use-secondary-firebase.ts'
import { addCategory, deleteCategory } from '@/services/firestore.service.ts'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/config/constants.ts'
import { cn } from '@/lib/utils.ts'
import { toast } from 'sonner'
import { Plus, Trash2, Tags, Loader2 } from 'lucide-react'

export default function CategoriesPage() {
  const { db, uid } = useSecondaryFirebase()
  const { categories: customCategories, loading } = useCategories()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'expense' | 'income'>('expense')

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    try {
      await addCategory(db, uid, { name: newName.trim(), type: newType, iconCode: 0xe1d5, colorValue: 0xFF95A5A6 })
      toast.success('Category added')
      setDialogOpen(false)
      setNewName('')
    } catch {
      toast.error('Failed to add category')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="space-y-2"><Skeleton className="h-8 w-48 rounded-lg" /><Skeleton className="h-40 rounded-lg" /></div>

  return (
    <div className="space-y-2 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-lg font-extrabold tracking-tight">Categories</h1>
          <p className="text-[12px] text-muted-foreground">Manage expense & income categories</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button size="sm" className="bg-brand hover:bg-brand-light"><Plus className="mr-1 h-3.5 w-3.5" />Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary/60 p-0.5">
                {(['expense', 'income'] as const).map(t => (
                  <Button key={t} type="button" variant="ghost" size="sm" onClick={() => setNewType(t)}
                    className={cn('capitalize', newType === t ? 'bg-brand text-white shadow-sm hover:bg-brand hover:text-white' : 'text-muted-foreground')}
                  >{t}</Button>
                ))}
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Name</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Category name" required />
              </div>
              <Button type="submit" className="w-full bg-brand hover:bg-brand-light" disabled={saving}>
                {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}Add Category
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="expense">
        <TabsList>
          <TabsTrigger value="expense">Expense</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
        </TabsList>

        {(['expense', 'income'] as const).map(type => {
          const defaults = type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES
          const customs = customCategories.filter(c => c.type === type)

          return (
            <TabsContent key={type} value={type} className="mt-2 space-y-3">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Default</p>
                <div className="rounded-lg border border-border/50 divide-y divide-border/30 overflow-hidden">
                  {defaults.map(c => (
                    <div key={c.name} className="flex items-center gap-2.5 px-3 py-2 hover:bg-secondary/30 transition-colors">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-[13px] font-medium">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {customs.length > 0 && (
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Custom</p>
                  <div className="rounded-lg border border-border/50 divide-y divide-border/30 overflow-hidden">
                    {customs.map(c => (
                      <div key={c.docId} className="group flex items-center justify-between px-3 py-2 hover:bg-secondary/30 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="h-2 w-2 rounded-full bg-muted-foreground shrink-0" />
                          <span className="text-[13px] font-medium">{c.name}</span>
                        </div>
                        <Button variant="ghost" size="icon-sm"
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                          onClick={() => { deleteCategory(db, uid, c.docId); toast.success('Deleted') }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {customs.length === 0 && (
                <EmptyState icon={<Tags className="h-5 w-5 text-muted-foreground" />} title="No custom categories" description="Add custom categories to organize" />
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
