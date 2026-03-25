import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { app, db } from '../lib/firebase';

// ── 타입 ──────────────────────────────────────────────────────
export type UserRole = 'admin' | 'user';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

type AuthResult = { success: boolean; message: string };

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

type AuthActions = {
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, name: string) => Promise<AuthResult>;
  loginWithGoogle: (idToken: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  initAuthListener: () => () => void;
};

// ── Firebase 에러 → 한국어 ─────────────────────────────────────
function translateError(code: string): string {
  const map: Record<string, string> = {
    'auth/user-not-found':         '등록되지 않은 이메일이에요.',
    'auth/wrong-password':         '비밀번호가 틀렸어요.',
    'auth/invalid-credential':     '이메일 또는 비밀번호가 틀렸어요.',
    'auth/email-already-in-use':   '이미 사용 중인 이메일이에요.',
    'auth/invalid-email':          '올바른 이메일 형식이 아니에요.',
    'auth/weak-password':          '비밀번호는 6자 이상이어야 해요.',
    'auth/too-many-requests':      '잠시 후 다시 시도해주세요.',
    'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
  };
  return map[code] ?? '오류가 발생했어요. 다시 시도해주세요.';
}

// ── Firestore users/{uid} 조회 또는 신규 생성 ──────────────────
async function fetchOrCreateUser(uid: string, email: string, name: string): Promise<AuthUser> {
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

  const newUser: AuthUser = { id: uid, email, name, role: 'user' };
  await setDoc(ref, { uid, email, name, role: 'user', createdAt: Date.now() });
  return newUser;
}

// ── Zustand 스토어 ─────────────────────────────────────────────
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // ── 상태 ──
      user: null,
      isLoading: true,
      isAuthenticated: false,

      // ── 기본 세터 ──
      setUser: (user) => set({ user, isAuthenticated: user !== null }),
      setLoading: (isLoading) => set({ isLoading }),

      // ── 로그인 ──
      login: async (email, password) => {
        const auth = getAuth(app);
        try {
          const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
          const name = cred.user.displayName ?? email.split('@')[0];
          const userData = await fetchOrCreateUser(cred.user.uid, cred.user.email ?? email, name);
          set({ user: userData, isAuthenticated: true });
          return { success: true, message: '로그인 완료' };
        } catch (e: any) {
          return { success: false, message: translateError(e.code ?? '') };
        }
      },

      // ── 회원가입 ──
      register: async (email, password, name) => {
        if (!name.trim()) return { success: false, message: '이름을 입력해주세요.' };
        const auth = getAuth(app);
        try {
          const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
          const userData = await fetchOrCreateUser(cred.user.uid, email.trim(), name.trim());
          set({ user: userData, isAuthenticated: true });
          return { success: true, message: '회원가입 완료' };
        } catch (e: any) {
          return { success: false, message: translateError(e.code ?? '') };
        }
      },

      // ── 구글 로그인 ──
      loginWithGoogle: async (idToken) => {
        const auth = getAuth(app);
        try {
          const credential = GoogleAuthProvider.credential(idToken);
          const cred = await signInWithCredential(auth, credential);
          const name = cred.user.displayName ?? cred.user.email?.split('@')[0] ?? '사용자';
          const userData = await fetchOrCreateUser(cred.user.uid, cred.user.email ?? '', name);
          set({ user: userData, isAuthenticated: true });
          return { success: true, message: '구글 로그인 완료' };
        } catch (e: any) {
          return { success: false, message: translateError(e.code ?? '') };
        }
      },

      // ── 로그아웃 ──
      logout: async () => {
        const auth = getAuth(app);
        try {
          await signOut(auth);
        } catch {
          // 네트워크 오류 등으로 Firebase signOut 실패해도 로컬 상태는 초기화
        }
        set({ user: null, isAuthenticated: false });
      },

      // ── Firebase Auth 상태 변경 리스너 초기화 ──
      // 앱 루트에서 한 번 호출하고 반환된 unsubscribe를 cleanup에 사용
      initAuthListener: () => {
        const auth = getAuth(app);
        set({ isLoading: true });

        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          try {
            if (fbUser && fbUser.email) {
              const name = fbUser.displayName ?? fbUser.email.split('@')[0];
              const userData = await fetchOrCreateUser(fbUser.uid, fbUser.email, name);
              set({ user: userData, isAuthenticated: true, isLoading: false });
            } else {
              set({ user: null, isAuthenticated: false, isLoading: false });
            }
          } catch {
            // Firestore 조회 실패 시 로딩 상태 해제 (로그인 화면 유지)
            set({ isLoading: false });
          }
        });

        return unsubscribe;
      },
    }),
    {
      name: 'floco-auth',
      storage: createJSONStorage(() => AsyncStorage),
      // user만 persist, 로딩 상태는 제외
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
