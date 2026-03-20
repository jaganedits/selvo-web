import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { useSecondaryFirebase } from '@/hooks/use-secondary-firebase.ts'
import type { Budget } from '@/types/budget.ts'

export function useBudgets(monthKey: string) {
  const { db, uid } = useSecondaryFirebase()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users', uid, `budgets_${monthKey}`),
      (snap) => {
        setBudgets(snap.docs.map(d => ({
          category: d.data().category as string,
          amount: d.data().amount as number,
          name: d.data().name as string | undefined,
        })))
        setLoading(false)
      }
    )

    return unsub
  }, [db, uid, monthKey])

  return { budgets, loading }
}
