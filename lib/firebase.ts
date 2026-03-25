/**
 * Firebase 초기화
 *
 * 사용 전 Firebase Console에서:
 * 1. 프로젝트 생성 (https://console.firebase.google.com)
 * 2. Authentication → Email/Password 사용 설정
 * 3. Firestore Database 생성 (테스트 모드로 시작)
 * 4. 프로젝트 설정 → 앱 추가(웹) → config 복사 → 아래에 붙여넣기
 */

import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyAfuOxeysX16Q9XC2VrtQrp05QB7wrwnpY',
  authDomain:        'floco-58983.firebaseapp.com',
  projectId:         'floco-58983',
  storageBucket:     'floco-58983.firebasestorage.app',
  messagingSenderId: '572965735174',
  appId:             '1:572965735174:web:48de716c6f9a2df80d2c87',
  measurementId:     'G-7P7H42N00L',
};

// 중복 초기화 방지 (핫리로드 시 크래시 방지)
const isNew = getApps().length === 0;
export const app = isNew ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = isNew
  ? initializeAuth(app, { persistence: inMemoryPersistence })
  : getAuth(app);
export const db = getFirestore(app);
