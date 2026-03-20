import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  Timestamp,
  type Firestore,
} from 'firebase/firestore'
import { addTransaction } from '@/services/firestore.service.ts'

function advance(date: Date, frequency: string): Date {
  switch (frequency) {
    case 'daily':
      return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    case 'weekly':
      return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7)
    case 'monthly':
    default:
      return new Date(date.getFullYear(), date.getMonth() + 1, date.getDate())
  }
}

export async function processRecurring(db: Firestore, uid: string): Promise<void> {
  const now = new Date()
  const q = query(
    collection(db, 'users', uid, 'recurring'),
    where('isActive', '==', true)
  )
  const snap = await getDocs(q)

  for (const docSnap of snap.docs) {
    const data = docSnap.data()
    const nextTs = data.nextDate as Timestamp | undefined
    if (!nextTs) continue

    let nextDate = nextTs.toDate()
    const frequency = (data.frequency as string) || 'monthly'
    const type = (data.type as string) || 'expense'
    const amount = (data.amount as number) || 0
    const category = (data.category as string) || ''
    const name = (data.name as string) || ''
    const paymentMode = (data.paymentMode as string) || ''
    const note = (data.note as string) || ''

    while (nextDate <= now) {
      await addTransaction(db, uid, {
        type: type as 'expense' | 'income',
        amount,
        category,
        name,
        date: Timestamp.fromDate(nextDate),
        note,
        paymentMode,
      })
      nextDate = advance(nextDate, frequency)
    }

    await updateDoc(docSnap.ref, {
      nextDate: Timestamp.fromDate(nextDate),
    })
  }
}
