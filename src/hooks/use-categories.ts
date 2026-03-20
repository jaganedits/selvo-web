import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { useSecondaryFirebase } from '@/hooks/use-secondary-firebase.ts'
import type { Category, CategoryType } from '@/types/category.ts'
import type { Timestamp } from 'firebase/firestore'

export function useCategories(type?: CategoryType) {
  const { db, uid } = useSecondaryFirebase()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users', uid, 'categories'),
      (snap) => {
        let docs = snap.docs.map(d => ({
          docId: d.id,
          name: d.data().name as string,
          type: d.data().type as CategoryType,
          iconCode: d.data().iconCode as number,
          colorValue: d.data().colorValue as number,
          createdAt: d.data().createdAt as Timestamp,
        }))
        if (type) {
          docs = docs.filter(c => c.type === type)
        }
        setCategories(docs)
        setLoading(false)
      }
    )

    return unsub
  }, [db, uid, type])

  return { categories, loading }
}
