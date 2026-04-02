/**
 * 앱 버전 업데이트 체크
 */

import { Alert, Linking } from 'react-native';

const CURRENT_VERSION = '1.0.0';

export const checkVersion = async () => {
  try {
    const response = await fetch(
      'https://firestore.googleapis.com/v1/projects/floco-58983/databases/(default)/documents/config/version'
    );
    const data = await response.json();
    const minVersion = data?.fields?.minVersion?.stringValue ?? '1.0.0';

    if (compareVersions(CURRENT_VERSION, minVersion) < 0) {
      Alert.alert(
        '업데이트 필요',
        '더 나은 서비스를 위해 업데이트가 필요해요!',
        [
          {
            text: '업데이트',
            onPress: () =>
              Linking.openURL(
                'https://play.google.com/store/apps/details?id=com.floco.app'
              ),
          },
        ],
        { cancelable: false }
      );
    }
  } catch (error) {
    console.log('버전 체크 실패:', error);
  }
};

const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  return 0;
};
