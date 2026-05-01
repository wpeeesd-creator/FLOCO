import * as admin from 'firebase-admin';
import { sendPushToAllUsers } from './sendPush';

interface RankSnapshot {
  uid: string;
  totalAsset: number;
  name: string;
}

export async function checkAndNotifyTop1Change(): Promise<void> {
  const db = admin.firestore();

  const usersSnapshot = await db.collection('users').get();

  const ranks: RankSnapshot[] = [];
  usersSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (data.role === 'admin') return;
    const totalAsset = data.totalAsset ?? data.balance ?? 0;
    if (totalAsset > 0) {
      ranks.push({
        uid: doc.id,
        totalAsset,
        name: data.name ?? data.displayName ?? '익명',
      });
    }
  });

  if (ranks.length === 0) return;

  ranks.sort((a, b) => b.totalAsset - a.totalAsset);
  const currentTop1 = ranks[0];

  const metaRef = db.collection('meta').doc('ranking');
  const metaDoc = await metaRef.get();
  const previousTop1Uid = metaDoc.exists ? metaDoc.data()?.top1Uid : null;

  if (previousTop1Uid === currentTop1.uid) {
    return;
  }

  await metaRef.set(
    {
      top1Uid: currentTop1.uid,
      top1Name: currentTop1.name,
      top1Asset: currentTop1.totalAsset,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  await sendPushToAllUsers(
    '👑 새로운 1위!',
    `${currentTop1.name}님이 1위에 올랐어요!`,
    { type: 'ranking_top1_changed', uid: currentTop1.uid }
  );
}
