import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import * as admin from 'firebase-admin';

const expo = new Expo();

export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<void> {
  const db = admin.firestore();
  const tokens: string[] = [];

  for (const uid of userIds) {
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      const userData = userDoc.data();

      if (
        userData?.notificationsEnabled === true &&
        userData?.expoPushToken &&
        Expo.isExpoPushToken(userData.expoPushToken)
      ) {
        tokens.push(userData.expoPushToken);
      }
    } catch (error) {
      console.error(`토큰 조회 실패 (uid: ${uid}):`, error);
    }
  }

  if (tokens.length === 0) {
    console.log('발송할 토큰 없음');
    return;
  }

  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
  }));

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error('푸시 발송 오류:', error);
    }
  }
}

export async function sendPushToAllUsers(
  title: string,
  body: string,
  data: Record<string, any> = {},
  excludeUid?: string
): Promise<void> {
  const db = admin.firestore();
  const usersSnapshot = await db.collection('users').get();

  const userIds = usersSnapshot.docs
    .map((doc) => doc.id)
    .filter((uid) => uid !== excludeUid);

  await sendPushToUsers(userIds, title, body, data);
}
