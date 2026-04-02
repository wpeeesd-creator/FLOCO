/**
 * 데일리 미션 서비스
 * - 매일 자정 자동 리셋 (날짜 키 기반)
 * - 미션 완료 시 포트폴리오 현금 보상
 * - 전체 완료 시 보너스 지급
 */

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// ── 타입 ──────────────────────────────────────

export type MissionType = 'trade' | 'learning' | 'news' | 'community' | 'ranking';

export interface DailyMission {
  id: string;
  emoji: string;
  title: string;
  description: string;
  type: MissionType;
  target: number;
  current: number;
  reward: number;
  completed: boolean;
}

// ── 상수 ──────────────────────────────────────

export const ALL_COMPLETE_BONUS = 50_000;

// ── 오늘 날짜 키 ──────────────────────────────

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

// ── 미션 생성 ─────────────────────────────────

export function generateDailyMissions(): DailyMission[] {
  return [
    {
      id: 'mission_trade',
      emoji: '📈',
      title: '오늘의 거래',
      description: '주식을 1번 매수 또는 매도하기',
      type: 'trade',
      target: 1,
      current: 0,
      reward: 10_000,
      completed: false,
    },
    {
      id: 'mission_learning',
      emoji: '📚',
      title: '오늘의 학습',
      description: '학습 레슨 1개 완료하기',
      type: 'learning',
      target: 1,
      current: 0,
      reward: 15_000,
      completed: false,
    },
    {
      id: 'mission_news',
      emoji: '📰',
      title: '오늘의 뉴스',
      description: '뉴스 1개 읽기',
      type: 'news',
      target: 1,
      current: 0,
      reward: 5_000,
      completed: false,
    },
    {
      id: 'mission_community',
      emoji: '💬',
      title: '오늘의 소통',
      description: '커뮤니티 게시물에 좋아요 누르기',
      type: 'community',
      target: 1,
      current: 0,
      reward: 5_000,
      completed: false,
    },
    {
      id: 'mission_ranking',
      emoji: '🏆',
      title: '랭킹 확인',
      description: '오늘 랭킹 확인하기',
      type: 'ranking',
      target: 1,
      current: 0,
      reward: 5_000,
      completed: false,
    },
  ];
}

// ── 미션 로드 (오늘 것 없으면 새로 생성) ─────

export async function loadTodayMissions(uid: string): Promise<DailyMission[]> {
  const today = getTodayKey();
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const saved = snap.data()?.dailyMissions?.[today];
      if (saved && Array.isArray(saved) && saved.length > 0) {
        return saved as DailyMission[];
      }
    }
    // 오늘 미션 새로 생성
    const newMissions = generateDailyMissions();
    await updateDoc(doc(db, 'users', uid), {
      [`dailyMissions.${today}`]: newMissions,
    });
    return newMissions;
  } catch (error) {
    console.error('데일리 미션 로드 오류:', error);
    return generateDailyMissions();
  }
}

// ── 미션 진행도 업데이트 ──────────────────────

export async function updateMissionProgress(
  uid: string,
  type: MissionType,
): Promise<{ rewarded: number; allComplete: boolean } | null> {
  const today = getTodayKey();

  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;

    const data = snap.data();
    const missions: DailyMission[] = data?.dailyMissions?.[today] ?? generateDailyMissions();

    let rewarded = 0;
    let justCompleted = false;

    const updated = missions.map((m) => {
      if (m.type === type && !m.completed) {
        const newCurrent = m.current + 1;
        const isCompleted = newCurrent >= m.target;
        if (isCompleted) {
          rewarded = m.reward;
          justCompleted = true;
        }
        return { ...m, current: newCurrent, completed: isCompleted };
      }
      return m;
    });

    if (!justCompleted && updated.every((m, i) => m.current === missions[i].current)) {
      // 이미 완료된 미션이거나 변경 없음
      return null;
    }

    const allComplete = updated.every((m) => m.completed);
    const totalReward = rewarded + (allComplete && !missions.every((m) => m.completed) ? ALL_COMPLETE_BONUS : 0);

    // Firestore 업데이트: 미션 상태 저장
    const updatePayload: Record<string, any> = {
      [`dailyMissions.${today}`]: updated,
    };
    await updateDoc(doc(db, 'users', uid), updatePayload);

    // 보상이 있으면 포트폴리오 현금 추가
    if (totalReward > 0) {
      try {
        const portSnap = await getDoc(doc(db, 'portfolios', uid));
        if (portSnap.exists()) {
          const currentCash = portSnap.data()?.cash ?? 1_000_000;
          await updateDoc(doc(db, 'portfolios', uid), {
            cash: currentCash + totalReward,
            updatedAt: Date.now(),
          });
        }
      } catch (error) {
        console.error('미션 보상 지급 오류:', error);
      }
    }

    return { rewarded: totalReward, allComplete };
  } catch (error) {
    console.error('미션 업데이트 오류:', error);
    return null;
  }
}
