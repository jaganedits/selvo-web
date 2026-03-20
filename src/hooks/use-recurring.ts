import { useState, useEffect } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useSecondaryFirebase } from '@/hooks/use-secondary-firebase.ts'
import type { RecurringTransaction } from '@/types/recurring.ts'
import type { Timestamp } from 'firebase/firestore'

export function useRecurring() {
  const { db, uid } = useSecondaryFirebase()
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'users', uid, 'recurring'),
      orderBy('nextDate')
    )

    const unsub = onSnapshot(q, (snap) => {
      setRecurring(snap.docs.map(d => ({
        docId: d.id,
        type: d.data().type as 'expense' | 'income',
        amount: d.data().amount as number,
        category: d.data().category as string,
        name: d.data().name as string,
        frequency: d.data().frequency as RecurringTransaction['frequency'],
        nextDate: d.data().nextDate as Timestamp,
        paymentMode: (d.data().paymentMode as string) || '',
        note: (d.data().note as string) || '',
        isActive: d.data().isActive as boolean,
        createdAt: d.data().createdAt as Timestamp,
      })))
      setLoading(false)
    })

    return unsub
  }, [db, uid])

  return { recurring, loading }
}
