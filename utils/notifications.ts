/**
 * 푸시 알림 유틸리티
 * - 권한 요청 + 토큰 저장
 * - 로컬 알림 예약
 * - 거래/학습/랭킹/이벤트/댓글 알림 시나리오
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// ── 기본 설정 ────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── 푸시 토큰 등록 ──────────────────────────
export async function registerForPushNotifications(uid: string): Promise<string | undefined> {
  if (!Device.isDevice) {
    console.log('[알림] 실제 기기에서만 푸시 알림 가능');
    return undefined;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return undefined;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Firestore에 토큰 저장
    await updateDoc(doc(db, 'users', uid), {
      pushToken: token,
      notificationsEnabled: true,
    });

    // Android 알림 채널
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0066FF',
      });
    }

    return token;
  } catch (error) {
    console.error('[알림] 토큰 등록 실패:', error);
    return undefined;
  }
}

// ── 로컬 알림 ──────────────────────────────
export async function scheduleLocalNotification(
  title: string,
  body: string,
  seconds: number = 0,
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: seconds > 0 ? { seconds, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL } : null,
    });
  } catch (error) {
    console.error('[알림] 예약 실패:', error);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('[알림] 취소 실패:', error);
  }
}

// ── 시나리오별 알림 ─────────────────────────

/** 매수/매도 완료 */
export async function sendTradeNotification(
  type: 'buy' | 'sell',
  stockName: string,
  quantity: number,
  price: number,
): Promise<void> {
  await scheduleLocalNotification(
    type === 'buy' ? '📈 매수 완료' : '📉 매도 완료',
    `${stockName} ${quantity}주 ${type === 'buy' ? '매수' : '매도'} 완료!\n${Math.round(price * quantity).toLocaleString()}원`,
  );
}

/** 학습 완료 보상 */
export async function sendLearningRewardNotification(
  lessonTitle: string,
  reward: number,
): Promise<void> {
  await scheduleLocalNotification(
    '🎉 학습 완료!',
    `${lessonTitle} 완료! +${reward.toLocaleString()}원 지급`,
  );
}

/** 매일 학습 리마인더 (오전 9시) */
export async function scheduleDailyLearningReminder(): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📚 오늘의 학습을 시작해요!',
        body: '매일 학습하면 FLO 포인트와 가상 자산을 받을 수 있어요 🎁',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
      },
    });
  } catch (error) {
    console.error('[알림] 학습 리마인더 예약 실패:', error);
  }
}

/** 스트릭 위기 알림 (23:30) */
export async function scheduleStreakWarning(streak: number): Promise<void> {
  if (streak < 3) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔥 ${streak}일 연속 학습 중!`,
        body: '오늘 학습을 완료하지 않으면 스트릭이 끊겨요!',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 23,
        minute: 30,
      },
    });
  } catch (error) {
    console.error('[알림] 스트릭 알림 예약 실패:', error);
  }
}

/** 랭킹 변동 */
export async function sendRankingNotification(
  prevRank: number,
  newRank: number,
): Promise<void> {
  if (newRank < prevRank) {
    await scheduleLocalNotification(
      '🏆 순위가 올랐어요!',
      `${prevRank}위 → ${newRank}위로 상승했어요!`,
    );
  } else if (newRank > prevRank) {
    await scheduleLocalNotification(
      '📊 순위가 변경됐어요',
      `현재 ${newRank}위예요. 더 열심히 투자해보세요!`,
    );
  }
}

/** 이벤트 마감 임박 */
export async function scheduleEventReminder(
  eventTitle: string,
  endTimestamp: number,
): Promise<void> {
  const oneDayBefore = endTimestamp - 86400000;
  const secondsUntil = Math.floor((oneDayBefore - Date.now()) / 1000);
  if (secondsUntil <= 0) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ 이벤트 마감 임박!',
        body: `${eventTitle} 마감 하루 전이에요!`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntil,
      },
    });
  } catch (error) {
    console.error('[알림] 이벤트 알림 예약 실패:', error);
  }
}

/** 댓글 알림 */
export async function sendCommentNotification(
  commenterNickname: string,
): Promise<void> {
  await scheduleLocalNotification(
    '💬 새 댓글이 달렸어요!',
    `${commenterNickname}님이 내 게시물에 댓글을 남겼어요`,
  );
}
