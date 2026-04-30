/**
 * 데일리 미션 서비스
 * - 매일 자정 자동 리셋 (날짜 키 기반)
 * - 미션 완료 시 포트폴리오 현금 보상
 * - 전체 완료 시 보너스 지급
 */

import { doc, getDoc, updateDoc, increment, deleteField } from 'firebase/firestore';
import { db } from './firebase';
import { saveNotif } from '../utils/notificationService';

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

// 미션 타입별 완료 알림 본문 (NotificationScreen body 필드)
const MISSION_NOTIF_BODY: Record<MissionType, string> = {
  trade: '오늘의 거래 +10,000원 받았어요',
  learning: '오늘의 학습 +15,000원 받았어요',
  news: '오늘의 뉴스 +5,000원 받았어요',
  community: '오늘의 소통 +5,000원 받았어요',
  ranking: '랭킹 확인 +5,000원 받았어요',
};

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
    const dailyMissions = snap.exists() ? (snap.data()?.dailyMissions ?? {}) : {};
    const saved = dailyMissions?.[today];

    // 옛날 날짜 키 정리 (today 외 키는 deleteField로 제거)
    const staleKeys = Object.keys(dailyMissions).filter((k) => k !== today);
    const cleanupPayload: Record<string, any> = {};
    for (const k of staleKeys) {
      cleanupPayload[`dailyMissions.${k}`] = deleteField();
    }

    if (saved && Array.isArray(saved) && saved.length > 0) {
      if (staleKeys.length > 0) {
        await updateDoc(doc(db, 'users', uid), cleanupPayload);
      }
      return saved as DailyMission[];
    }

    // 오늘 미션 새로 생성 + 옛날 키 정리 (한 번의 updateDoc으로 합침)
    const newMissions = generateDailyMissions();
    await updateDoc(doc(db, 'users', uid), {
      ...cleanupPayload,
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
): Promise<{ rewarded: number; allComplete: boolean; bonusGranted: boolean } | null> {
  const today = getTodayKey();

  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;

    const data = snap.data();
    const missions: DailyMission[] = data?.dailyMissions?.[today] ?? generateDailyMissions();

    // [중복 호출 방지] 해당 type 미션이 이미 완료된 상태면 즉시 종료
    const targetMission = missions.find((m) => m.type === type);
    if (targetMission?.completed) {
      return null;
    }

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
      // 변경 없음
      return null;
    }

    // 전체 완료 보너스 (bonusClaimed 플래그로 중복 지급 방지)
    const allComplete = updated.every((m) => m.completed);
    const alreadyClaimedBonus = data?.bonusClaimed?.[today] === true;
    const bonusGranted = allComplete && !alreadyClaimedBonus;
    const totalReward = rewarded + (bonusGranted ? ALL_COMPLETE_BONUS : 0);

    // Firestore 업데이트: 미션 상태 + 보상 적립 + 보너스 마킹 (users 문서)
    const updatePayload: Record<string, any> = {
      [`dailyMissions.${today}`]: updated,
    };
    if (totalReward > 0) {
      updatePayload.balance = increment(totalReward);
      updatePayload.totalAsset = increment(totalReward);
    }
    if (bonusGranted) {
      updatePayload[`bonusClaimed.${today}`] = true;
    }
    await updateDoc(doc(db, 'users', uid), updatePayload);

    // 미션 완료 알림 (방금 completed:true로 바뀐 순간에만)
    if (justCompleted) {
      try {
        const latestSnap = await getDoc(doc(db, 'users', uid));
        const latestNotifs = latestSnap.data()?.notifications ?? [];
        await saveNotif(uid, latestNotifs, {
          type: 'reward',
          title: '🎁 미션 완료!',
          body: MISSION_NOTIF_BODY[type],
        });
      } catch (e) {
        console.warn('미션 완료 알림 저장 실패:', e);
      }
    }

    // 전체 완료 보너스 알림 (bonusClaimed false→true 순간에만)
    if (bonusGranted) {
      try {
        const latestSnap = await getDoc(doc(db, 'users', uid));
        const latestNotifs = latestSnap.data()?.notifications ?? [];
        await saveNotif(uid, latestNotifs, {
          type: 'reward',
          title: '🎉 모든 미션 클리어!',
          body: '전체 완료 보너스 +50,000원 받았어요',
        });
      } catch (e) {
        console.warn('전체 완료 보너스 알림 저장 실패:', e);
      }
    }

    return { rewarded: totalReward, allComplete, bonusGranted };
  } catch (error) {
    console.error('미션 업데이트 오류:', error);
    return null;
  }
}
