/**
 * FLOCO Analytics — 이벤트 추적
 * Expo 환경에서는 콘솔 로그로 동작하며,
 * @react-native-firebase/analytics 설치 시 자동으로 Firebase Analytics로 전환
 */

type EventParams = Record<string, string | number | boolean>;

let firebaseAnalytics: any = null;

// @react-native-firebase/analytics 가 설치된 경우에만 로드
try {
  firebaseAnalytics = require('@react-native-firebase/analytics').default;
} catch {
  // Expo Go 환경에서는 네이티브 모듈 없이 동작
}

/** 커스텀 이벤트 로깅 */
export async function logEvent(name: string, params?: EventParams): Promise<void> {
  try {
    if (firebaseAnalytics) {
      await firebaseAnalytics().logEvent(name, params);
    }
    if (__DEV__) {
      console.log(`[Analytics] ${name}`, params ?? '');
    }
  } catch (error) {
    console.warn('[Analytics] 이벤트 로깅 실패:', error);
  }
}

/** 화면 조회 로깅 */
export async function logScreenView(screenName: string): Promise<void> {
  try {
    if (firebaseAnalytics) {
      await firebaseAnalytics().logScreenView({
        screen_name: screenName,
        screen_class: screenName,
      });
    }
    if (__DEV__) {
      console.log(`[Analytics] Screen: ${screenName}`);
    }
  } catch (error) {
    console.warn('[Analytics] 화면 로깅 실패:', error);
  }
}

// ── 앱 전용 이벤트 헬퍼 ──────────────────────────

/** 주식 매수 이벤트 */
export function logStockPurchase(ticker: string, quantity: number, price: number): void {
  logEvent('stock_purchased', { ticker, quantity, price, total: price * quantity });
}

/** 주식 매도 이벤트 */
export function logStockSold(ticker: string, quantity: number, price: number): void {
  logEvent('stock_sold', { ticker, quantity, price, total: price * quantity });
}

/** 퀴즈 완료 이벤트 */
export function logQuizCompleted(courseId: string, score: number, reward: number): void {
  logEvent('quiz_completed', { courseId, score, reward });
}

/** 레슨 완료 이벤트 */
export function logLessonCompleted(lessonId: string, xpGained: number): void {
  logEvent('lesson_completed', { lessonId, xpGained });
}

/** 레벨업 이벤트 */
export function logLevelUp(newLevel: number): void {
  logEvent('level_up', { level: newLevel });
}
