import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  type Firestore,
} from 'firebase/firestore'
import { mainDb } from '@/config/firebase.ts'
import type { TransactionInput } from '@/types/transaction.ts'

function txCollection(db: Firestore, uid: string) {
  return collection(db, 'users', uid, 'transactions')
}

function catCollection(db: Firestore, uid: string) {
  return collection(db, 'users', uid, 'categories')
}

function budgetCollection(db: Firestore, uid: string, monthKey: string) {
  return collection(db, 'users', uid, `budgets_${monthKey}`)
}

function recurringCollection(db: Firestore, uid: string) {
  return collection(db, 'users', uid, 'recurring')
}

// -- Transactions --

export async function addTransaction(
  db: Firestore,
  uid: string,
  input: TransactionInput
) {
  const data: Record<string, unknown> = {
    type: input.type,
    amount: input.amount,
    category: input.category,
    name: input.name,
    date: input.date,
    note: input.note || '',
    paymentMode: input.paymentMode || '',
    createdAt: serverTimestamp(),
  }
  if (input.splitwiseId) {
    data.splitwiseId = input.splitwiseId
  }
  await addDoc(txCollection(db, uid), data)
}

export async function updateTransaction(
  db: Firestore,
  uid: string,
  docId: string,
  input: Partial<TransactionInput>
) {
  const data: Record<string, unknown> = {}
  if (input.type !== undefined) data.type = input.type
  if (input.amount !== undefined) data.amount = input.amount
  if (input.category !== undefined) data.category = input.category
  if (input.name !== undefined) data.name = input.name
  if (input.date !== undefined) data.date = input.date
  if (input.note !== undefined) data.note = input.note
  if (input.paymentMode !== undefined) data.paymentMode = input.paymentMode
  await updateDoc(doc(txCollection(db, uid), docId), data)
}

export async function deleteTransaction(db: Firestore, uid: string, docId: string) {
  await deleteDoc(doc(txCollection(db, uid), docId))
}

export async function getImportedSplitwiseIds(db: Firestore, uid: string): Promise<Set<string>> {
  const q = query(txCollection(db, uid), where('splitwiseId', '>', ''))
  const snap = await getDocs(q)
  const ids = new Set<string>()
  snap.docs.forEach(d => {
    const swId = d.data().splitwiseId as string | undefined
    if (swId) ids.add(swId)
  })
  return ids
}

export async function getAllTransactions(db: Firestore, uid: string) {
  const q = query(txCollection(db, uid), orderBy('date', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ ...d.data(), docId: d.id }))
}

// -- Categories --

export async function addCategory(
  db: Firestore,
  uid: string,
  data: { name: string; type: string; iconCode: number; colorValue: number }
) {
  await addDoc(catCollection(db, uid), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function deleteCategory(db: Firestore, uid: string, docId: string) {
  await deleteDoc(doc(catCollection(db, uid), docId))
}

// -- Budgets --

export async function setBudget(
  db: Firestore,
  uid: string,
  category: string,
  amount: number,
  monthKey: string,
  name?: string
) {
  const data: Record<string, unknown> = { category, amount }
  if (name) data.name = name
  await setDoc(doc(budgetCollection(db, uid, monthKey), category), data)
}

export async function deleteBudget(
  db: Firestore,
  uid: string,
  category: string,
  monthKey: string
) {
  await deleteDoc(doc(budgetCollection(db, uid, monthKey), category))
}

// -- Recurring --

export async function addRecurring(
  db: Firestore,
  uid: string,
  data: {
    type: string
    amount: number
    category: string
    name: string
    frequency: string
    nextDate: Date
    paymentMode?: string
    note?: string
  }
) {
  await addDoc(recurringCollection(db, uid), {
    type: data.type,
    amount: data.amount,
    category: data.category,
    name: data.name,
    frequency: data.frequency,
    nextDate: Timestamp.fromDate(data.nextDate),
    paymentMode: data.paymentMode ?? '',
    note: data.note ?? '',
    isActive: true,
    createdAt: serverTimestamp(),
  })
}

export async function updateRecurring(
  db: Firestore,
  uid: string,
  docId: string,
  data: Record<string, unknown>
) {
  await updateDoc(doc(recurringCollection(db, uid), docId), data)
}

export async function deleteRecurring(db: Firestore, uid: string, docId: string) {
  await deleteDoc(doc(recurringCollection(db, uid), docId))
}

export async function toggleRecurring(
  db: Firestore,
  uid: string,
  docId: string,
  isActive: boolean
) {
  await updateDoc(doc(recurringCollection(db, uid), docId), { isActive })
}

// -- User Profile --

export async function saveUserProfile(uid: string, name: string, email: string) {
  await setDoc(doc(mainDb, 'users', uid), {
    name,
    email,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

// -- Delete All --

export async function deleteAllUserData(db: Firestore, uid: string) {
  async function deleteAll(colRef: ReturnType<typeof collection>) {
    const snaps = await getDocs(colRef)
    for (const d of snaps.docs) {
      await deleteDoc(d.ref)
    }
  }

  await deleteAll(txCollection(db, uid))
  await deleteAll(catCollection(db, uid))
  await deleteAll(recurringCollection(db, uid))

  const now = new Date()
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    await deleteAll(budgetCollection(db, uid, key))
  }

  await deleteDoc(doc(mainDb, 'users', uid))
}
