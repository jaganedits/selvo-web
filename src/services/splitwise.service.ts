import { SPLITWISE_CATEGORY_MAP } from '@/config/constants.ts'

const BASE = '/api/splitwise'
const TOKEN_KEY = 'splitwise_token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

function headers(): Record<string, string> {
  const token = getStoredToken()
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function get(path: string, params?: Record<string, string>) {
  const url = new URL(`${window.location.origin}${BASE}${path}`)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { headers: headers() })
  if (!res.ok) throw new Error(`Splitwise API error: ${res.status}`)
  return res.json()
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/get_current_user`, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    })
    return res.ok
  } catch {
    return false
  }
}

export async function getCurrentUser() {
  const data = await get('/get_current_user')
  return data?.user ?? null
}

export async function getExpenses(params?: {
  limit?: number
  offset?: number
  datedAfter?: string
  datedBefore?: string
  groupId?: number
}) {
  const q: Record<string, string> = { limit: String(params?.limit ?? 50), offset: String(params?.offset ?? 0) }
  if (params?.datedAfter) q.dated_after = params.datedAfter
  if (params?.datedBefore) q.dated_before = params.datedBefore
  if (params?.groupId) q.group_id = String(params.groupId)
  const data = await get('/get_expenses', q)
  return (data?.expenses ?? []) as Record<string, unknown>[]
}

export async function getFriends() {
  const data = await get('/get_friends')
  return (data?.friends ?? []) as Record<string, unknown>[]
}

export async function getGroups() {
  const data = await get('/get_groups')
  return (data?.groups ?? []) as Record<string, unknown>[]
}

function mapCategory(swCategory: string): string {
  const lower = swCategory.toLowerCase()
  for (const [key, value] of Object.entries(SPLITWISE_CATEGORY_MAP)) {
    if (lower.includes(key)) return value
  }
  return 'Other'
}

export interface ParsedExpense {
  type: 'expense' | 'settlement_income' | 'settlement_expense'
  amount: number
  name: string
  category: string
  date: Date
  note: string
  paymentMode: string
  splitwiseId: string
}

export function parseExpense(raw: Record<string, unknown>, currentUserId?: number): ParsedExpense | null {
  const deletedAt = raw.deleted_at
  if (deletedAt != null && String(deletedAt) !== 'null') return null

  const cost = parseFloat(String(raw.cost ?? '0'))
  if (cost <= 0) return null

  const isPayment = raw.payment === true
  const date = new Date(String(raw.date ?? ''))

  if (isPayment && currentUserId != null) {
    const repayments = (raw.repayments as { from?: number; to?: number; amount?: string }[]) ?? []
    if (!repayments.length) return null
    const r = repayments[0]!
    const amount = parseFloat(String(r.amount ?? '0'))
    if (amount <= 0) return null

    const users = (raw.users as { user?: { id?: number; first_name?: string; last_name?: string } }[]) ?? []
    let otherName = 'Friend'
    for (const u of users) {
      if (u.user?.id !== currentUserId) {
        otherName = `${u.user?.first_name ?? ''} ${u.user?.last_name ?? ''}`.trim() || 'Friend'
        break
      }
    }

    if (r.to === currentUserId) {
      return { type: 'settlement_income', amount, name: `Settlement from ${otherName}`, category: 'Settlements', date, note: 'Splitwise settlement received', paymentMode: '', splitwiseId: String(raw.id ?? '') }
    }
    if (r.from === currentUserId) {
      return { type: 'settlement_expense', amount, name: `Settlement to ${otherName}`, category: 'Settlements', date, note: 'Splitwise settlement paid', paymentMode: 'UPI', splitwiseId: String(raw.id ?? '') }
    }
    return null
  }

  const users = (raw.users as { user?: { id?: number }; user_id?: number; owed_share?: string }[]) ?? []
  let myShare = cost
  if (currentUserId != null) {
    for (const u of users) {
      const uid = u.user?.id ?? u.user_id
      if (uid === currentUserId) {
        myShare = parseFloat(String(u.owed_share ?? '0'))
        break
      }
    }
  }
  if (myShare <= 0) return null

  const catName = (raw.category as { name?: string })?.name ?? 'Other'

  return {
    type: 'expense', amount: myShare, name: String(raw.description ?? ''),
    category: mapCategory(catName), date, note: 'Imported from Splitwise',
    paymentMode: 'UPI', splitwiseId: String(raw.id ?? ''),
  }
}

export function parseFriendBalances(rawFriends: Record<string, unknown>[]) {
  const result: { id: number; name: string; pictureUrl: string | null; amount: number }[] = []
  for (const f of rawFriends) {
    const balances = (f.balance as { currency_code?: string; amount?: string }[]) ?? []
    let amount = 0
    for (const b of balances) {
      if (b.currency_code === 'INR') { amount = parseFloat(String(b.amount ?? '0')); break }
    }
    if (amount === 0) continue
    const name = `${f.first_name ?? ''} ${f.last_name ?? ''}`.trim()
    const pic = (f.picture as { medium?: string })?.medium ?? null
    result.push({ id: f.id as number, name, pictureUrl: pic, amount })
  }
  result.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
  return result
}
