/**
 * 본인(서영) 계정 데이터 완전 리셋 — 임시 디버그 스크립트
 *
 * 대상 UID: 8AFondf3MUT42Jhs4ayIRzHCFRj2 (하드코딩, 실수 방지)
 * - users/{uid}: 자산/포트폴리오/거래/미션/학습 리셋. email/displayName/wishlist/notifications 등은 유지.
 *
 * portfolios 컬렉션은 single source of truth에서 제외되어 더 이상 리셋하지 않음.
 *
 * TODO: AdminScreen "전체 사용자 리셋" 기능 추가 후 삭제.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const TARGET_UID = '8AFondf3MUT42Jhs4ayIRzHCFRj2';

export interface ResetResult {
  success: boolean;
  uid: string;
  changes: Record<string, unknown>;
  errors: string[];
}

export async function resetMyAccount(): Promise<ResetResult> {
  const errors: string[] = [];
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔁 [resetMyAccount] 시작 — UID:', TARGET_UID);

  // 리셋 직전 상태 스냅샷
  let beforeUsers: any = null;
  try {
    const u = await getDoc(doc(db, 'users', TARGET_UID));
    beforeUsers = u.exists() ? u.data() : null;
    console.log('📸 [BEFORE] users.balance:', beforeUsers?.balance, 'totalAsset:', beforeUsers?.totalAsset, 'portfolio.length:', beforeUsers?.portfolio?.length);
  } catch (e) {
    console.warn('⚠️ [resetMyAccount] BEFORE 스냅샷 실패 (계속 진행):', (e as Error).message);
  }

  // ── users/{uid} 리셋 (계정 메타·관심종목·알림은 유지) ──
  const userPayload = {
    balance: 10_000_000,
    totalAsset: 10_000_000,
    initialBalance: 10_000_000,
    portfolio: [],
    transactions: [],
    dailyMissions: {},          // 다음 진입 시 자동 재생성
    bonusClaimed: {},           // 미션 보너스 마킹도 초기화
    learning: {
      completedLessons: [],
      totalPoints: 0,
    },
  };

  // setDoc + merge:true → 문서가 없어도 생성, 있으면 지정 필드만 덮어씀
  try {
    console.log('🔧 users 리셋 시도 — payload:', JSON.stringify(userPayload));
    await setDoc(doc(db, 'users', TARGET_UID), userPayload, { merge: true });
    console.log('✅ users 리셋 완료 — balance:', userPayload.balance, 'totalAsset:', userPayload.totalAsset, 'initialBalance:', userPayload.initialBalance, 'portfolio:', userPayload.portfolio.length, '건');
  } catch (e) {
    const msg = `users 리셋 실패: ${(e as Error).message}`;
    errors.push(msg);
    console.error('❌', msg, e);
  }

  // 리셋 직후 검증 — 실제로 값이 바뀌었는지 재조회
  try {
    const u = await getDoc(doc(db, 'users', TARGET_UID));
    console.log('📸 [AFTER] users.balance:', u.data()?.balance, 'totalAsset:', u.data()?.totalAsset, 'portfolio.length:', u.data()?.portfolio?.length);

    const userOk = u.data()?.balance === 10_000_000
      && u.data()?.totalAsset === 10_000_000
      && (u.data()?.portfolio?.length ?? 0) === 0;
    if (!userOk) errors.push('users 검증 실패: 리셋 후 값이 예상과 다름');
  } catch (e) {
    console.warn('⚠️ AFTER 검증 실패 (계속 진행):', (e as Error).message);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(errors.length === 0 ? '🎉 [resetMyAccount] 완료' : '⚠️ [resetMyAccount] 일부 실패:', errors);

  return {
    success: errors.length === 0,
    uid: TARGET_UID,
    changes: userPayload,
    errors,
  };
}
