import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function registerPushToken(uid: string): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('푸시 알림은 실제 기기에서만 작동');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('푸시 권한 거부됨');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: undefined,
    });
    const token = tokenData.data;

    await updateDoc(doc(db, 'users', uid), {
      expoPushToken: token,
      pushTokenUpdatedAt: new Date().toISOString(),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    return token;
  } catch (error) {
    console.error('푸시 토큰 등록 실패:', error);
    return null;
  }
}

export async function removePushToken(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      expoPushToken: null,
    });
  } catch (error) {
    console.error('푸시 토큰 제거 실패:', error);
  }
}
