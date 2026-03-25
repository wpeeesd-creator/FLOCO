/**
 * FLOCO Crashlytics — 크래시 리포팅
 * Expo 환경에서는 콘솔 로그로 동작하며,
 * @react-native-firebase/crashlytics 설치 시 자동으로 Firebase Crashlytics로 전환
 */

let firebaseCrashlytics: any = null;

// @react-native-firebase/crashlytics 가 설치된 경우에만 로드
try {
  firebaseCrashlytics = require('@react-native-firebase/crashlytics').default;
} catch {
  // Expo Go 환경에서는 네이티브 모듈 없이 동작
}

/** 로그 메시지 기록 (크래시 발생 시 함께 전송됨) */
export function log(message: string): void {
  try {
    if (firebaseCrashlytics) {
      firebaseCrashlytics().log(message);
    }
    if (__DEV__) {
      console.log(`[Crashlytics] ${message}`);
    }
  } catch {
    // 무시
  }
}

/** 에러 기록 (non-fatal) */
export function recordError(error: Error, context?: string): void {
  try {
    if (firebaseCrashlytics) {
      if (context) {
        firebaseCrashlytics().log(context);
      }
      firebaseCrashlytics().recordError(error);
    }
    if (__DEV__) {
      console.error(`[Crashlytics] ${context ?? 'Error'}:`, error);
    }
  } catch {
    // 무시
  }
}

/** 사용자 식별자 설정 */
export function setUserId(userId: string): void {
  try {
    if (firebaseCrashlytics) {
      firebaseCrashlytics().setUserId(userId);
    }
  } catch {
    // 무시
  }
}

/** 커스텀 속성 설정 */
export function setAttribute(key: string, value: string): void {
  try {
    if (firebaseCrashlytics) {
      firebaseCrashlytics().setAttribute(key, value);
    }
  } catch {
    // 무시
  }
}

/** 앱 시작 로그 */
export function logAppStart(): void {
  log('앱 시작');
}
