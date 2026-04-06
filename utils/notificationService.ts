import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export const saveNotif = async (
  uid: string,
  existing: any[],
  data: {
    type: string
    title: string
    body: string
    ticker?: string
    stockName?: string
    quantity?: number
    price?: number
    total?: number
    tradeType?: string
  }
) => {
  try {
    const notif = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...data,
      createdAt: new Date().toISOString(),
      read: false
    }
    const updated = [notif, ...(existing ?? [])].slice(0, 50)
    await updateDoc(doc(db, 'users', uid), { notifications: updated })
    console.log('✅ 알림 저장:', notif.title)
    return notif
  } catch (e) {
    console.error('알림 저장 오류:', e)
    return null
  }
}
