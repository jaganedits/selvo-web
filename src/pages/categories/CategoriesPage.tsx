import { useState, type FormEvent } from 'react'
import { Card, CardContent } from '@/components/ui/card.tsx'
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
      await addCategory(db, uid, {
        name: newName.trim(),
        type: newType,
        iconCode: 0xe1d5,
        colorValue: 0xFF95A5A6,
      })
      toast.success('Category added')
      setDialogOpen(false)
      setNewName('')
    } catch {
      toast.error('Failed to add category')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-3 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-extrabold tracking-tight">Categories</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage expense & income categories</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button size="sm" className="rounded-xl bg-brand hover:bg-brand-light">
              <Plus className="mr-1.5 h-4 w-4" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-secondary/60 p-1">
                {(['expense', 'income'] as const).map(t => (
                  <Button
                    key={t}
                    type="button"
                    variant="ghost"
                    onClick={() => setNewType(t)}
                    className={cn(
                      'h-9 rounded-lg text-sm font-bold capitalize',
                      newType === t
                        ? 'bg-brand text-white shadow-sm hover:bg-brand hover:text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t}
                  </Button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">Name</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Category name" required className="h-11 rounded-xl" />
              </div>
              <Button type="submit" className="h-11 w-full rounded-xl bg-brand hover:bg-brand-light" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Category
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
            <TabsContent key={type} value={type} className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/50">Default</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {defaults.map(c => (
                    <Card key={c.name} className="border-border/50 shadow-sm">
                      <CardContent className="flex items-center gap-3 p-3">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-[13px] font-semibold">{c.name}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {customs.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/50">Custom</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {customs.map(c => (
                      <Card key={c.docId} className="border-border/50 shadow-sm">
                        <CardContent className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
                            <span className="text-[13px] font-semibold">{c.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                            onClick={() => { deleteCategory(db, uid, c.docId); toast.success('Deleted') }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {customs.length === 0 && (
                <EmptyState
                  icon={<Tags className="h-6 w-6 text-muted-foreground" />}
                  title="No custom categories"
                  description="Add custom categories to organize your transactions"
                />
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
