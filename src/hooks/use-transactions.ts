import { useState, useEffect } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore'
import { useSecondaryFirebase } from '@/hooks/use-secondary-firebase.ts'
import { getMonthStart, getMonthEnd } from '@/lib/date.ts'
import type { Transaction } from '@/types/transaction.ts'

function docToTransaction(doc: { id: string; data: () => Record<string, unknown> }): Transaction {
  const data = doc.data()
  return {
    docId: doc.id,
    type: data.type as Transaction['type'],
    amount: data.amount as number,
    category: data.category as string,
    name: data.name as string,
    date: data.date as Timestamp,
    note: (data.note as string) || '',
    paymentMode: (data.paymentMode as string) || '',
    splitwiseId: data.splitwiseId as string | undefined,
    createdAt: data.createdAt as Timestamp,
  }
}

export function useTransactions(monthKey: string) {
  const { db, uid } = useSecondaryFirebase()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const start = Timestamp.fromDate(getMonthStart(monthKey))
    const end = Timestamp.fromDate(getMonthEnd(monthKey))

    const q = query(
      collection(db, 'users', uid, 'transactions'),
      where('date', '>=', start),
      where('date', '<=', end),
      orderBy('date', 'desc')
    )

    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(docToTransaction))
      setLoading(false)
    })

    return unsub
  }, [db, uid, monthKey])

  return { transactions, loading }
}

export function useAllTransactions() {
  const { db, uid } = useSecondaryFirebase()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'users', uid, 'transactions'),
      orderBy('date', 'desc')
    )

    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(docToTransaction))
      setLoading(false)
    })

    return unsub
  }, [db, uid])

  return { transactions, loading }
}
