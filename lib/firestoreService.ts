/**
 * Firestore CRUD 서비스
 * - 유저 프로필 (users/{uid})
 * - 포트폴리오 스냅샷 (portfolios/{uid}) — 랭킹·관리자용
 */

import {
  doc, setDoc, getDoc, getDocs,
  collection, updateDoc, deleteDoc,
  serverTimestamp, query, orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Holding, TradeRecord } from '../store/appStore';

export type UserRole = 'admin' | 'user';

// ── 타입 ──────────────────────────────────────

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: number;
}

export interface PortfolioSnapshot {
  uid: string;
  name: string;
  email: string;
  cash: number;
  holdings: Holding[];
  trades: TradeRecord[];
  xp: number;
  level: number;
  streak: number;
  lastCheckIn: string;
  floPoints: number;
  completedLessons: string[];
  completedEvents: string[];
  achievements: string[];
  updatedAt: number;
}

// ── 유저 프로필 ──────────────────────────────

export async function createUserProfile(
  uid: string,
  data: Omit<UserProfile, 'uid'>
): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid), { ...data, uid });
  } catch (error) {
    console.error('Firestore createUserProfile 오류:', error);
    throw error;
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (error) {
    console.error('Firestore getUserProfile 오류:', error);
    return null;
  }
}

export async function getAllUserProfiles(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => d.data() as UserProfile);
  } catch (error) {
    console.error('Firestore getAllUserProfiles 오류:', error);
    return [];
  }
}

export async function deleteUserProfile(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (error) {
    console.error('Firestore deleteUserProfile 오류:', error);
    throw error;
  }
}

// ── 포트폴리오 스냅샷 ─────────────────────────

export async function savePortfolio(
  uid: string,
  snapshot: Omit<PortfolioSnapshot, 'uid' | 'updatedAt'>
): Promise<void> {
  try {
    await setDoc(doc(db, 'portfolios', uid), {
      ...snapshot,
      uid,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Firestore savePortfolio 오류:', error);
    throw error;
  }
}

export async function getPortfolio(uid: string): Promise<PortfolioSnapshot | null> {
  try {
    const snap = await getDoc(doc(db, 'portfolios', uid));
    return snap.exists() ? (snap.data() as PortfolioSnapshot) : null;
  } catch (error) {
    console.error('Firestore getPortfolio 오류:', error);
    return null;
  }
}

export async function getAllPortfolios(): Promise<PortfolioSnapshot[]> {
  try {
    const snap = await getDocs(collection(db, 'portfolios'));
    return snap.docs.map(d => d.data() as PortfolioSnapshot);
  } catch (error) {
    console.error('Firestore getAllPortfolios 오류:', error);
    return [];
  }
}

export async function resetPortfolio(uid: string, name: string, email: string): Promise<void> {
  try {
    await savePortfolio(uid, {
    name, email,
    cash: 1_000_000,
    holdings: [],
    trades: [],
    xp: 0,
    level: 1,
    streak: 0,
    lastCheckIn: '',
    floPoints: 0,
    completedLessons: [],
    completedEvents: [],
    achievements: [],
  });
  } catch (error) {
    console.error('Firestore resetPortfolio 오류:', error);
    throw error;
  }
}

export async function updatePortfolioBalance(uid: string, cash: number): Promise<void> {
  try {
    await updateDoc(doc(db, 'portfolios', uid), { cash, updatedAt: Date.now() });
  } catch (error) {
    console.error('Firestore updatePortfolioBalance 오류:', error);
    throw error;
  }
}

// ── 실시간 리스너 ─────────────────────────────

/**
 * 포트폴리오 실시간 구독
 * Firestore 데이터 변경 시 콜백으로 최신 스냅샷 전달
 * 반환값: unsubscribe 함수 (컴포넌트 언마운트 시 호출)
 */
export function subscribePortfolio(
  uid: string,
  onData: (snapshot: PortfolioSnapshot) => void,
  onError?: (error: Error) => void,
): () => void {
  const ref = doc(db, 'portfolios', uid);
  return onSnapshot(
    ref,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as PortfolioSnapshot;
        console.log('실시간 포트폴리오 업데이트 수신, uid:', uid);
        onData(data);
      }
    },
    (error) => {
      console.error('실시간 리스너 오류:', error);
      onError?.(error);
    },
  );
}
