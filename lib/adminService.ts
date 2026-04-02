/**
 * 관리자 서비스 — 신고, 이벤트, 통계 CRUD
 */

import {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  addDoc, collection, query, orderBy, where,
  limit as firestoreLimit, onSnapshot, increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ── 타입 ────────────────────────────────────

export type ReportReason = '스팸' | '욕설' | '불건전' | '허위정보' | '기타';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';
export type ReportTargetType = 'post' | 'comment' | 'user';

export interface Report {
  id: string;
  reporterId: string;
  reporterNickname: string;
  targetType: ReportTargetType;
  targetId: string;
  targetContent: string;
  reason: ReportReason;
  status: ReportStatus;
  adminMemo?: string;
  createdAt: number;
  resolvedAt?: number;
}

export type EventType = 'profit_rate' | 'trade_count' | 'learning_streak';
export type EventStatus = 'upcoming' | 'active' | 'ended';

export interface EventReward {
  rank: number;
  amount: number;
}

export interface AppEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  startDate: number;
  endDate: number;
  rewards: EventReward[];
  participants: string[];
  status: EventStatus;
  createdAt: number;
}

export interface GlobalStats {
  totalUsers: number;
  activeToday: number;
  totalTrades: number;
  totalTradeAmount: number;
  totalLessonsCompleted: number;
  pendingReports: number;
  lastUpdated: number;
}

// ── 통계 ────────────────────────────────────

export function subscribeGlobalStats(
  onData: (stats: GlobalStats) => void,
  onError?: (error: Error) => void,
): () => void {
  const ref = doc(db, 'stats', 'global');
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as GlobalStats);
      } else {
        onData({
          totalUsers: 0, activeToday: 0, totalTrades: 0,
          totalTradeAmount: 0, totalLessonsCompleted: 0,
          pendingReports: 0, lastUpdated: Date.now(),
        });
      }
    },
    (error) => {
      console.error('subscribeGlobalStats 오류:', error);
      onError?.(error);
    },
  );
}

export async function updateTradeStats(tradeAmount: number): Promise<void> {
  try {
    const ref = doc(db, 'stats', 'global');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        totalTrades: increment(1),
        totalTradeAmount: increment(tradeAmount),
        lastUpdated: Date.now(),
      });
    } else {
      await setDoc(ref, {
        totalUsers: 0, activeToday: 0, totalTrades: 1,
        totalTradeAmount: tradeAmount, totalLessonsCompleted: 0,
        pendingReports: 0, lastUpdated: Date.now(),
      });
    }
  } catch (error) {
    console.error('updateTradeStats 오류:', error);
  }
}

export async function updateLearningStats(): Promise<void> {
  try {
    const ref = doc(db, 'stats', 'global');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        totalLessonsCompleted: increment(1),
        lastUpdated: Date.now(),
      });
    }
  } catch (error) {
    console.error('updateLearningStats 오류:', error);
  }
}

export async function updateUserCountStats(count: number): Promise<void> {
  try {
    await setDoc(doc(db, 'stats', 'global'), {
      totalUsers: count,
      lastUpdated: Date.now(),
    }, { merge: true });
  } catch (error) {
    console.error('updateUserCountStats 오류:', error);
  }
}

// ── 신고 ────────────────────────────────────

export async function createReport(
  report: Omit<Report, 'id' | 'status' | 'createdAt'>
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'reports'), {
      ...report,
      status: 'pending',
      createdAt: Date.now(),
    });
    // Increment pending count
    const statsRef = doc(db, 'stats', 'global');
    const snap = await getDoc(statsRef);
    if (snap.exists()) {
      await updateDoc(statsRef, { pendingReports: increment(1) });
    }
    return ref.id;
  } catch (error) {
    console.error('createReport 오류:', error);
    throw error;
  }
}

export async function getReports(status?: ReportStatus): Promise<Report[]> {
  try {
    const col = collection(db, 'reports');
    const q = status
      ? query(col, where('status', '==', status), orderBy('createdAt', 'desc'), firestoreLimit(100))
      : query(col, orderBy('createdAt', 'desc'), firestoreLimit(100));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Report));
  } catch (error) {
    console.error('getReports 오류:', error);
    return [];
  }
}

export async function resolveReport(
  reportId: string,
  status: 'resolved' | 'dismissed',
  adminMemo?: string,
): Promise<void> {
  try {
    await updateDoc(doc(db, 'reports', reportId), {
      status,
      adminMemo: adminMemo ?? '',
      resolvedAt: Date.now(),
    });
    if (status === 'resolved' || status === 'dismissed') {
      const statsRef = doc(db, 'stats', 'global');
      const snap = await getDoc(statsRef);
      if (snap.exists()) {
        const current = snap.data().pendingReports ?? 0;
        await updateDoc(statsRef, { pendingReports: Math.max(0, current - 1) });
      }
    }
  } catch (error) {
    console.error('resolveReport 오류:', error);
    throw error;
  }
}

// ── 유저 정지 ───────────────────────────────

export async function suspendUser(
  uid: string,
  days: number,
  reason: string,
): Promise<void> {
  try {
    const suspendUntil = Date.now() + days * 24 * 60 * 60 * 1000;
    await updateDoc(doc(db, 'users', uid), {
      suspended: true,
      suspendUntil,
      suspendReason: reason,
    });
  } catch (error) {
    console.error('suspendUser 오류:', error);
    throw error;
  }
}

export async function unsuspendUser(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      suspended: false,
      suspendUntil: null,
      suspendReason: null,
    });
  } catch (error) {
    console.error('unsuspendUser 오류:', error);
    throw error;
  }
}

// ── 이벤트 ──────────────────────────────────

export async function createEvent(
  event: Omit<AppEvent, 'id' | 'participants' | 'createdAt'>
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'events'), {
      ...event,
      participants: [],
      createdAt: Date.now(),
    });
    return ref.id;
  } catch (error) {
    console.error('createEvent 오류:', error);
    throw error;
  }
}

export async function getEvents(status?: EventStatus): Promise<AppEvent[]> {
  try {
    const col = collection(db, 'events');
    const q = status
      ? query(col, where('status', '==', status), orderBy('createdAt', 'desc'))
      : query(col, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AppEvent));
  } catch (error) {
    console.error('getEvents 오류:', error);
    return [];
  }
}

export async function updateEvent(
  eventId: string,
  data: Partial<AppEvent>,
): Promise<void> {
  try {
    await updateDoc(doc(db, 'events', eventId), data as any);
  } catch (error) {
    console.error('updateEvent 오류:', error);
    throw error;
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    console.error('deleteEvent 오류:', error);
    throw error;
  }
}

export async function joinEvent(eventId: string, uid: string): Promise<void> {
  try {
    const ref = doc(db, 'events', eventId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const participants: string[] = snap.data().participants ?? [];
      if (!participants.includes(uid)) {
        await updateDoc(ref, { participants: [...participants, uid] });
      }
    }
  } catch (error) {
    console.error('joinEvent 오류:', error);
    throw error;
  }
}

// ── 집계 유틸 ───────────────────────────────

export async function fetchAllPortfoliosForAdmin(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, 'portfolios'));
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  } catch (error) {
    console.error('fetchAllPortfoliosForAdmin 오류:', error);
    return [];
  }
}

export async function fetchAllUsersForAdmin(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  } catch (error) {
    console.error('fetchAllUsersForAdmin 오류:', error);
    return [];
  }
}
