/**
 * FLOCO Cloud Functions — 서버 사이드 거래 트랜잭션
 * 클라이언트 Optimistic UI + 서버 검증 이중 구조
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

// ── 매수 트랜잭션 ──────────────────────────────

export const buyStock = functions.https.onCall(async (data, context) => {
  const { ticker, name, price, quantity } = data;
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다');
  }

  if (!ticker || !price || !quantity || quantity <= 0) {
    throw new functions.https.HttpsError('invalid-argument', '유효하지 않은 주문입니다');
  }

  const userRef = db.doc(`portfolios/${uid}`);
  const fee = Math.round(price * quantity * 0.001);
  const totalCost = price * quantity + fee;

  return db.runTransaction(async (t) => {
    const doc = await t.get(userRef);

    if (!doc.exists) {
      throw new functions.https.HttpsError('not-found', '포트폴리오를 찾을 수 없습니다');
    }

    const userData = doc.data()!;
    const cash: number = userData.cash ?? 1_000_000;
    const holdings: any[] = userData.holdings ?? [];
    const trades: any[] = userData.trades ?? [];

    if (cash < totalCost) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `잔액이 부족합니다. (필요: ₩${Math.round(totalCost).toLocaleString()}, 보유: ₩${Math.round(cash).toLocaleString()})`,
      );
    }

    // 기존 보유 종목 업데이트 또는 새로 추가
    const existing = holdings.find((h: any) => h.ticker === ticker);
    let updatedHoldings: any[];

    if (existing) {
      updatedHoldings = holdings.map((h: any) =>
        h.ticker === ticker
          ? {
              ...h,
              qty: h.qty + quantity,
              avgPrice: (h.avgPrice * h.qty + price * quantity) / (h.qty + quantity),
            }
          : h,
      );
    } else {
      updatedHoldings = [...holdings, { ticker, qty: quantity, avgPrice: price }];
    }

    const newTrade = {
      id: Date.now().toString(),
      ticker,
      type: 'buy',
      qty: quantity,
      price,
      fee,
      timestamp: Date.now(),
    };

    t.update(userRef, {
      cash: cash - totalCost,
      holdings: updatedHoldings,
      trades: [...trades, newTrade],
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: `${name ?? ticker} ${quantity}주 매수 완료`,
      newCash: cash - totalCost,
    };
  });
});

// ── 매도 트랜잭션 ──────────────────────────────

export const sellStock = functions.https.onCall(async (data, context) => {
  const { ticker, name, price, quantity } = data;
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다');
  }

  if (!ticker || !price || !quantity || quantity <= 0) {
    throw new functions.https.HttpsError('invalid-argument', '유효하지 않은 주문입니다');
  }

  const userRef = db.doc(`portfolios/${uid}`);
  const fee = Math.round(price * quantity * 0.001);
  const revenue = price * quantity - fee;

  return db.runTransaction(async (t) => {
    const doc = await t.get(userRef);

    if (!doc.exists) {
      throw new functions.https.HttpsError('not-found', '포트폴리오를 찾을 수 없습니다');
    }

    const userData = doc.data()!;
    const cash: number = userData.cash ?? 1_000_000;
    const holdings: any[] = userData.holdings ?? [];
    const trades: any[] = userData.trades ?? [];

    const holding = holdings.find((h: any) => h.ticker === ticker);

    if (!holding || holding.qty < quantity) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `보유 수량이 부족합니다. (보유: ${holding?.qty ?? 0}주, 요청: ${quantity}주)`,
      );
    }

    // 전량 매도 시 제거, 부분 매도 시 수량 감소
    const updatedHoldings =
      holding.qty === quantity
        ? holdings.filter((h: any) => h.ticker !== ticker)
        : holdings.map((h: any) =>
            h.ticker === ticker ? { ...h, qty: h.qty - quantity } : h,
          );

    const newTrade = {
      id: Date.now().toString(),
      ticker,
      type: 'sell',
      qty: quantity,
      price,
      fee,
      timestamp: Date.now(),
    };

    t.update(userRef, {
      cash: cash + revenue,
      holdings: updatedHoldings,
      trades: [...trades, newTrade],
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: `${name ?? ticker} ${quantity}주 매도 완료`,
      newCash: cash + revenue,
    };
  });
});

// ── 랭킹 조회 (읽기 전용) ──────────────────────

export const getRankings = functions.https.onCall(async () => {
  const snap = await db.collection('portfolios').get();
  const rankings = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: data.uid,
      name: data.name,
      cash: data.cash ?? 1_000_000,
      holdings: data.holdings ?? [],
      tradeCount: (data.trades ?? []).length,
    };
  });
  return { rankings };
});
