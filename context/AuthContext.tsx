import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, GoogleAuthProvider, signInWithCredential,
} from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { app, db } from '../lib/firebase';
import { setSessionUser } from '../lib/userSession';

// ── 타입 ──────────────────────────────────────────
export type User = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
};

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: (idToken: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
};

const TOKEN_KEY = 'userToken';
const INFO_KEY  = 'userInfo';
const EMAIL_KEY = 'user_email';
const PASS_KEY  = 'user_password';
const AUTO_KEY  = 'auto_login';

// ── Firestore users/{uid} 조회 또는 신규 생성 ─────
async function fetchOrCreateUser(uid: string, email: string, name: string): Promise<User> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    return {
      id: uid,
      email: data.email ?? email,
      name: data.name ?? name,
      role: data.role ?? 'user',
    };
  }

  // 문서 없으면 전체 초기 데이터로 생성
  const newUser: User = { id: uid, email, name, role: 'user' };
  await setDoc(ref, {
    uid,
    email,
    name,
    nickname: name,
    role: 'user',
    // 초기 자산 100만원
    balance: 1_000_000,
    totalAsset: 1_000_000,
    initialBalance: 1_000_000,
    // 빈 배열
    portfolio: [],
    transactions: [],
    wishlist: [],
    // 학습
    learning: {
      completedLessons: [],
      wrongAnswers: [],
      streak: 0,
      totalPoints: 0,
      lastStudyDate: null,
      rewardHistory: [],
    },
    // 기타
    subscribedTags: [],
    notificationsEnabled: false,
    tutorialCompleted: false,
    surveyCompleted: false,
    investmentType: null,
    school: null,
    inviteCode: uid.slice(0, 6).toUpperCase(),
    invitedBy: null,
    invitedFriends: [],
    inviteReward: 0,
    profileImage: null,
    pushToken: null,
    realNameVerified: false,
    dailyMissions: {},
    postCount: 0,
    totalLikes: 0,
    createdAt: new Date().toISOString(),
  });
  return newUser;
}

// ── Context ───────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ──────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = getAuth(app);
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function setUser(u: User | null) {
    setUserState(u);
    setSessionUser(u ? { name: u.name, email: u.email } : null);
  }

  // ── 세션 복원 (앱 시작 시) ─────────────────────
  const restoreSession = async () => {
    try {
      const storedUser = await SecureStore.getItemAsync(INFO_KEY);
      if (storedUser) {
        const cached = JSON.parse(storedUser) as User;
        // SecureStore 캐시로 빠르게 표시 후, Firestore에서 최신 role 재조회
        const fresh = await fetchOrCreateUser(cached.id, cached.email, cached.name);
        setUser(fresh);
        await SecureStore.setItemAsync(INFO_KEY, JSON.stringify(fresh));
      }
    } catch {
      // 복원 실패 시 로그인 화면 유지
    } finally {
      setIsLoading(false);
    }
  };

  // ── 자동 로그인 시도 (SecureStore 저장된 이메일/비밀번호로 재인증) ──
  const tryAutoLogin = async (): Promise<boolean> => {
    try {
      const autoFlag = await SecureStore.getItemAsync(AUTO_KEY);
      if (autoFlag !== 'true') return false;

      const email = await SecureStore.getItemAsync(EMAIL_KEY);
      const password = await SecureStore.getItemAsync(PASS_KEY);
      if (!email || !password) return false;

      await signInWithEmailAndPassword(auth, email, password);
      return true; // onAuthStateChanged가 유저 세팅 처리
    } catch {
      // 자동 로그인 실패 → 저장 정보 삭제
      await SecureStore.deleteItemAsync(AUTO_KEY);
      await SecureStore.deleteItemAsync(EMAIL_KEY);
      await SecureStore.deleteItemAsync(PASS_KEY);
      return false;
    }
  };

  // 앱 시작 시 Firebase Auth 리스너 + 자동 로그인
  useEffect(() => {
    let autoLoginAttempted = false;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.email) {
        const name = fbUser.displayName ?? fbUser.email.split('@')[0];
        const userData = await fetchOrCreateUser(fbUser.uid, fbUser.email, name);
        setUser(userData);
        await SecureStore.setItemAsync(TOKEN_KEY, fbUser.uid);
        await SecureStore.setItemAsync(INFO_KEY, JSON.stringify(userData));
        setIsLoading(false);
      } else if (!autoLoginAttempted) {
        // 첫 번째 null → 자동 로그인 시도
        autoLoginAttempted = true;
        const success = await tryAutoLogin();
        if (!success) {
          // 자동 로그인 실패 → 로그인 화면
          setUser(null);
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await SecureStore.deleteItemAsync(INFO_KEY);
          setIsLoading(false);
        }
        // 성공 시 onAuthStateChanged가 다시 호출되어 위 분기에서 처리
      } else {
        // 자동 로그인 이후 로그아웃
        setUser(null);
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // ── 로그인 ──────────────────────────────────────
  const login = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const name = cred.user.displayName ?? email.split('@')[0];
      const userData = await fetchOrCreateUser(cred.user.uid, cred.user.email ?? email, name);
      setUser(userData);
      await SecureStore.setItemAsync(TOKEN_KEY, cred.user.uid);
      await SecureStore.setItemAsync(INFO_KEY, JSON.stringify(userData));
      // 자동 로그인용 저장
      await SecureStore.setItemAsync(EMAIL_KEY, email.trim());
      await SecureStore.setItemAsync(PASS_KEY, password);
      await SecureStore.setItemAsync(AUTO_KEY, 'true');
      return { success: true, message: '로그인 완료' };
    } catch (e: any) {
      return { success: false, message: translateError(e.code ?? '') };
    }
  };

  // ── 회원가입 ─────────────────────────────────────
  const register = async (email: string, password: string, name: string) => {
    if (!name.trim()) return { success: false, message: '이름을 입력해주세요.' };
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const userData = await fetchOrCreateUser(cred.user.uid, email.trim(), name.trim());
      setUser(userData);
      await SecureStore.setItemAsync(TOKEN_KEY, cred.user.uid);
      await SecureStore.setItemAsync(INFO_KEY, JSON.stringify(userData));
      // 자동 로그인용 저장
      await SecureStore.setItemAsync(EMAIL_KEY, email.trim());
      await SecureStore.setItemAsync(PASS_KEY, password);
      await SecureStore.setItemAsync(AUTO_KEY, 'true');
      return { success: true, message: '회원가입 완료' };
    } catch (e: any) {
      return { success: false, message: translateError(e.code ?? '') };
    }
  };

  // ── 구글 로그인 ──────────────────────────────────
  const loginWithGoogle = async (idToken: string) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const cred = await signInWithCredential(auth, credential);
      const name = cred.user.displayName ?? cred.user.email?.split('@')[0] ?? '사용자';
      const userData = await fetchOrCreateUser(cred.user.uid, cred.user.email ?? '', name);
      setUser(userData);
      await SecureStore.setItemAsync(TOKEN_KEY, cred.user.uid);
      await SecureStore.setItemAsync(INFO_KEY, JSON.stringify(userData));
      return { success: true, message: '구글 로그인 완료' };
    } catch (e: any) {
      return { success: false, message: translateError(e.code ?? '') };
    }
  };

  // ── 로그아웃 ─────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(INFO_KEY);
    await SecureStore.deleteItemAsync(EMAIL_KEY);
    await SecureStore.deleteItemAsync(PASS_KEY);
    await SecureStore.deleteItemAsync(AUTO_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, login, register, loginWithGoogle, logout, restoreSession }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ── Firebase 에러 → 한국어 ────────────────────────
function translateError(code: string): string {
  const map: Record<string, string> = {
    'auth/user-not-found':         '등록되지 않은 이메일이에요.',
    'auth/wrong-password':         '비밀번호가 틀렸어요.',
    'auth/invalid-credential':     '이메일 또는 비밀번호가 틀렸어요.',
    'auth/email-already-in-use':   '이미 사용 중인 이메일이에요.',
    'auth/invalid-email':          '올바른 이메일 형식이 아니에요.',
    'auth/weak-password':          '비밀번호는 6자 이상이어야 해요.',
    'auth/too-many-requests':      '너무 많이 시도했어요. 잠시 후 다시 시도해주세요.',
    'auth/network-request-failed': '인터넷 연결이 끊겨 있어요. 연결을 확인해주세요.',
    'auth/internal-error':         '서버에 문제가 생겼어요. 잠시 후 다시 시도해주세요.',
    'auth/timeout':                '서버 응답이 느려요. 잠시 후 다시 시도해주세요.',
    'auth/user-disabled':          '비활성화된 계정이에요. 관리자에게 문의해주세요.',
  };
  return map[code] ?? '오류가 발생했어요. 다시 시도해주세요.';
}
