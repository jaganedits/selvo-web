import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx'
import { EmptyState } from '@/components/common/EmptyState.tsx'
import { useSecondaryFirebase } from '@/hooks/use-secondary-firebase.ts'
import { addTransaction, getImportedSplitwiseIds } from '@/services/firestore.service.ts'
import {
  getStoredToken, saveToken, clearToken, validateApiKey,
  getCurrentUser, getFriends, getExpenses,
  parseFriendBalances, parseExpense, type ParsedExpense,
} from '@/services/splitwise.service.ts'
import { Timestamp } from 'firebase/firestore'
import { cn } from '@/lib/utils.ts'
import { toast } from 'sonner'
import { formatIndianAmount } from '@/lib/date.ts'
import { Key, Loader2, Download, UserCircle, Unplug, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import splitwiseLogo from '@/assets/splitwise-logo.svg'

function SplitwiseLogo({ className }: { className?: string }) {
  return <img src={splitwiseLogo} alt="Splitwise" className={className} />
}

export default function SplitwisePage() {
  const { db, uid } = useSecondaryFirebase()
  const [apiKey, setApiKey] = useState('')
  const [connected, setConnected] = useState(!!getStoredToken())
  const [connecting, setConnecting] = useState(false)

  const [currentUser, setCurrentUser] = useState<{ id: number; first_name: string } | null>(null)
  const [friends, setFriends] = useState<{ id: number; name: string; pictureUrl: string | null; amount: number }[]>([])
  const [expenses, setExpenses] = useState<ParsedExpense[]>([])
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set())
  const [loadingData, setLoadingData] = useState(false)
  const [importing, setImporting] = useState<string | null>(null)

  async function handleConnect() {
    if (!apiKey.trim()) return
    setConnecting(true)
    const valid = await validateApiKey(apiKey)
    setConnecting(false)
    if (valid) {
      saveToken(apiKey)
      setConnected(true)
      toast.success('Connected to Splitwise')
    } else {
      toast.error('Invalid API key')
    }
  }

  function handleDisconnect() {
    clearToken()
    setConnected(false)
    setCurrentUser(null)
    setFriends([])
    setExpenses([])
  }

  // Load data when connected
  useEffect(() => {
    if (!connected) return
    let cancelled = false

    async function load() {
      setLoadingData(true)
      try {
        const [user, rawFriends, rawExpenses, ids] = await Promise.all([
          getCurrentUser(),
          getFriends(),
          getExpenses({ limit: 50 }),
          getImportedSplitwiseIds(db, uid),
        ])
        if (cancelled) return
        setCurrentUser(user)
        setFriends(parseFriendBalances(rawFriends))
        setImportedIds(ids)

        // Parse expenses
        const parsed: ParsedExpense[] = []
        for (const raw of rawExpenses) {
          const p = parseExpense(raw, user?.id)
          if (p) parsed.push(p)
        }
        setExpenses(parsed)
      } catch (e) {
        console.error('Splitwise load error:', e)
        toast.error('Failed to load Splitwise data')
      }
      setLoadingData(false)
    }
    load()
    return () => { cancelled = true }
  }, [connected, db, uid])

  async function handleImport(expense: ParsedExpense) {
    setImporting(expense.splitwiseId)
    try {
      await addTransaction(db, uid, {
        type: expense.type,
        amount: expense.amount,
        category: expense.category,
        name: expense.name,
        date: Timestamp.fromDate(expense.date),
        note: expense.note,
        paymentMode: expense.paymentMode,
        splitwiseId: expense.splitwiseId,
      })
      setImportedIds(prev => new Set([...prev, expense.splitwiseId]))
      toast.success('Imported')
    } catch {
      toast.error('Failed to import')
    }
    setImporting(null)
  }

  async function handleImportAll() {
    const toImport = expenses.filter(e => !importedIds.has(e.splitwiseId))
    if (!toImport.length) { toast('Nothing to import'); return }
    for (const e of toImport) {
      await handleImport(e)
    }
    toast.success(`Imported ${toImport.length} transactions`)
  }

  // Not connected — show connect form
  if (!connected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center animate-fade-up">
        <Card className="w-full max-w-sm border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <SplitwiseLogo className="h-6 w-6" />
              <div>
                <p className="text-[13px] font-semibold">Connect Splitwise</p>
                <p className="text-[11px] text-muted-foreground">Import expenses into Selvo</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">API Key</Label>
                <Input type="password" placeholder="Your Splitwise API key" value={apiKey} onChange={e => setApiKey(e.target.value)} className="h-9 rounded-lg text-xs font-mono" />
              </div>
              <p className="text-[10px] text-muted-foreground">Get your API key from Splitwise Developer settings</p>
              <Button size="sm" className="w-full bg-[#5BC5A7] hover:bg-[#4ab396]" onClick={handleConnect} disabled={connecting}>
                {connecting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Key className="mr-1 h-3 w-3" />}
                Connect
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Connected — show data
  return (
    <div className="space-y-3 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SplitwiseLogo className="h-5 w-5" />
          <h1 className="font-heading text-lg font-extrabold tracking-tight">Splitwise</h1>
          {currentUser && <Badge variant="secondary" className="text-[9px]">{currentUser.first_name}</Badge>}
        </div>
        <Button variant="outline" size="sm" className="" onClick={handleDisconnect}>
          <Unplug className="mr-1 h-3 w-3" />Disconnect
        </Button>
      </div>

      {loadingData ? (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3"><Skeleton className="h-16 rounded-lg" /><Skeleton className="h-16 rounded-lg" /><Skeleton className="h-16 rounded-lg" /></div>
          <Skeleton className="h-48 rounded-lg" />
        </div>
      ) : (
        <>
          {/* Friend Balances */}
          {friends.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Balances</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {friends.map(f => (
                  <Card key={f.id} className="border-border/50 shadow-sm">
                    <CardContent className="flex items-center gap-2.5 p-2.5">
                      {f.pictureUrl ? (
                        <img src={f.pictureUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary"><UserCircle className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold truncate">{f.name}</p>
                        <p className={cn('text-[11px] font-bold tabular-nums', f.amount > 0 ? 'text-income' : 'text-expense')}>
                          {f.amount > 0 ? (
                            <><ArrowDownLeft className="mr-0.5 inline h-3 w-3" />owes you {'\u20B9'}{formatIndianAmount(Math.abs(f.amount))}</>
                          ) : (
                            <><ArrowUpRight className="mr-0.5 inline h-3 w-3" />you owe {'\u20B9'}{formatIndianAmount(Math.abs(f.amount))}</>
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Expenses */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Recent Expenses ({expenses.length})</p>
              {expenses.some(e => !importedIds.has(e.splitwiseId)) && (
                <Button size="sm" className="bg-[#5BC5A7] hover:bg-[#4ab396]" onClick={handleImportAll}>
                  <Download className="mr-1 h-3 w-3" />Import All
                </Button>
              )}
            </div>
            {expenses.length === 0 ? (
              <EmptyState icon={<SplitwiseLogo className="h-5 w-5" />} title="No expenses" description="No recent Splitwise expenses found" />
            ) : (
              <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-7 px-3 text-[10px]">Description</TableHead>
                        <TableHead className="h-7 px-3 text-[10px]">Category</TableHead>
                        <TableHead className="h-7 px-3 text-[10px] text-right">Amount</TableHead>
                        <TableHead className="h-7 px-3 text-[10px] w-20" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map(e => {
                        const isImported = importedIds.has(e.splitwiseId)
                        const isIncome = e.type === 'settlement_income'
                        return (
                          <TableRow key={e.splitwiseId}>
                            <TableCell className="px-3 py-1.5">
                              <p className="text-[12px] font-semibold">{e.name}</p>
                              <p className="text-[10px] text-muted-foreground">{e.date.toLocaleDateString()}</p>
                            </TableCell>
                            <TableCell className="px-3 py-1.5">
                              <Badge variant="secondary" className="text-[9px]">{e.category}</Badge>
                            </TableCell>
                            <TableCell className={cn('px-3 py-1.5 text-right font-heading text-[12px] font-bold tabular-nums', isIncome ? 'text-income' : 'text-expense')}>
                              {isIncome ? '+' : '-'}{'\u20B9'}{formatIndianAmount(e.amount)}
                            </TableCell>
                            <TableCell className="px-3 py-1.5">
                              {isImported ? (
                                <Badge variant="secondary" className="text-[9px] bg-income/10 text-income">Imported</Badge>
                              ) : (
                                <Button size="sm" variant="outline" className=""
                                  onClick={() => handleImport(e)} disabled={importing === e.splitwiseId}
                                >
                                  {importing === e.splitwiseId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="mr-0.5 h-3 w-3" />}
                                  Import
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}
