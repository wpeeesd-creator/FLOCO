/**
 * 친구 초대 코드 서비스
 * - 초대 코드 생성 (uid 기반 6자리)
 * - 초대 코드 적용 (양쪽 보상 지급)
 */

import {
  doc, getDoc, getDocs, updateDoc,
  collection, query, where, arrayUnion,
} from 'firebase/firestore';
import { db } from './firebase';

const INVITER_REWARD = 50_000;   // 초대한 사람 보상
const INVITEE_REWARD = 30_000;   // 초대받은 사람 보상

/** uid 앞 6자를 대문자로 변환하여 초대 코드 생성 */
export function generateInviteCode(uid: string): string {
  return uid.slice(0, 6).toUpperCase();
}

export type ApplyResult = { success: boolean; message: string };

/** 초대 코드 적용 — 양쪽 보상 지급 */
export async function applyInviteCode(myUid: string, code: string): Promise<ApplyResult> {
  const trimmed = code.trim().toUpperCase();

  if (trimmed.length !== 6) {
    return { success: false, message: '초대 코드는 6자리예요' };
  }

  try {
    // 1. 이미 초대 코드를 사용했는지 확인
    const mySnap = await getDoc(doc(db, 'users', myUid));
    if (mySnap.exists() && mySnap.data()?.invitedBy) {
      return { success: false, message: '이미 초대 코드를 사용했어요' };
    }

    // 2. 초대 코드로 유저 찾기
    const q = query(
      collection(db, 'users'),
      where('inviteCode', '==', trimmed),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, message: '존재하지 않는 초대 코드예요' };
    }

    const inviterDoc = snapshot.docs[0];
    const inviterUid = inviterDoc.id;

    // 3. 본인 코드 체크
    if (inviterUid === myUid) {
      return { success: false, message: '본인 코드는 사용할 수 없어요' };
    }

    // 4. 초대자 보상 (users 문서)
    await updateDoc(doc(db, 'users', inviterUid), {
      invitedFriends: arrayUnion(myUid),
      inviteReward: (inviterDoc.data()?.inviteReward ?? 0) + INVITER_REWARD,
    });

    // 5. 초대자 포트폴리오 현금 추가
    const inviterPortSnap = await getDoc(doc(db, 'portfolios', inviterUid));
    if (inviterPortSnap.exists()) {
      const inviterCash = inviterPortSnap.data()?.cash ?? 1_000_000;
      await updateDoc(doc(db, 'portfolios', inviterUid), {
        cash: inviterCash + INVITER_REWARD,
        updatedAt: Date.now(),
      });
    }

    // 6. 피초대자 보상 (users 문서)
    await updateDoc(doc(db, 'users', myUid), {
      invitedBy: inviterUid,
    });

    // 7. 피초대자 포트폴리오 현금 추가
    const myPortSnap = await getDoc(doc(db, 'portfolios', myUid));
    if (myPortSnap.exists()) {
      const myCash = myPortSnap.data()?.cash ?? 1_000_000;
      await updateDoc(doc(db, 'portfolios', myUid), {
        cash: myCash + INVITEE_REWARD,
        updatedAt: Date.now(),
      });
    }

    return {
      success: true,
      message: `+${INVITEE_REWARD.toLocaleString()}원이 지급됐어요!\n친구에게도 +${INVITER_REWARD.toLocaleString()}원이 지급됩니다`,
    };
  } catch (error) {
    console.error('초대 코드 적용 오류:', error);
    return { success: false, message: '초대 코드 적용 중 오류가 발생했어요' };
  }
}
