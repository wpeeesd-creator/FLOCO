/**
 * Firestore 실시간 동기화 훅
 * portfolios/{uid} 문서의 변경을 감지하여 Zustand store에 반영
 * → 모든 화면(HomeScreen, StockScreen 등)이 자동으로 최신 데이터 렌더링
 */

import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { subscribePortfolio } from '../lib/firestoreService';
import { calculateTotalFromHoldings } from '../lib/calculateAsset';

export function useRealtimeSync(userId: string | undefined) {
  const loadFromSnapshot = useAppStore((s) => s.loadFromSnapshot);
  const isTradePending = useAppStore((s) => s.isTradePending);
  const pendingRef = useRef(isTradePending);

  // 거래 진행 중 여부를 ref로 추적 (onSnapshot 콜백에서 최신값 참조)
  useEffect(() => {
    pendingRef.current = isTradePending;
  }, [isTradePending]);

  useEffect(() => {
    if (!userId) return;

    console.log('실시간 동기화 시작, userId:', userId);

    const unsubscribe = subscribePortfolio(
      userId,
      (snapshot) => {
        // Optimistic UI 거래 중이면 서버 데이터로 덮어쓰지 않음
        // (거래 완료 후 다음 onSnapshot에서 반영됨)
        if (pendingRef.current) {
          console.log('거래 진행 중 — 실시간 업데이트 스킵');
          return;
        }

        const totalAsset = calculateTotalFromHoldings(
          snapshot.cash ?? 1_000_000,
          snapshot.holdings ?? [],
        );
        console.log('총 자산 재계산:', totalAsset);

        loadFromSnapshot(userId, {
          cash: snapshot.cash,
          holdings: snapshot.holdings,
          trades: snapshot.trades,
          xp: snapshot.xp,
          level: snapshot.level,
          streak: snapshot.streak,
          lastCheckIn: snapshot.lastCheckIn,
          floPoints: snapshot.floPoints,
          completedLessons: snapshot.completedLessons,
          completedEvents: snapshot.completedEvents,
          achievements: snapshot.achievements,
        });
      },
      (error) => {
        console.error('실시간 동기화 오류:', error);
      },
    );

    return () => {
      console.log('실시간 동기화 해제, userId:', userId);
      unsubscribe();
    };
  }, [userId, loadFromSnapshot]);
}
