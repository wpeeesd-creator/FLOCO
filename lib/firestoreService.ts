/**
 * Firestore CRUD 서비스
 * - 유저 프로필 (users/{uid}) — single source of truth
 */

import {
  doc, setDoc, getDoc, getDocs,
  collection, updateDoc, deleteDoc,
  serverTimestamp, query, orderBy,
  onSnapshot, addDoc, arrayUnion, arrayRemove,
  increment, where, limit as firestoreLimit,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export type UserRole = 'admin' | 'user';

// ── 타입 ──────────────────────────────────────

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: number;
}

// ── 유저 프로필 ──────────────────────────────

export async function createUserProfile(
  uid: string,
  data: Omit<UserProfile, 'uid'>
): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid), { ...data, uid });
  } catch (error) {
    console.error('Firestore createUserProfile 오류:', error);
    throw error;
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (error) {
    console.error('Firestore getUserProfile 오류:', error);
    return null;
  }
}

export async function getAllUserProfiles(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => d.data() as UserProfile);
  } catch (error) {
    console.error('Firestore getAllUserProfiles 오류:', error);
    return [];
  }
}

export async function deleteUserProfile(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (error) {
    console.error('Firestore deleteUserProfile 오류:', error);
    throw error;
  }
}

// ── 커뮤니티 ─────────────────────────────────

export type PostCategory = '전체' | '투자인증' | '분석' | '질문' | '자유';

export interface CommunityPost {
  id: string;
  uid: string;
  nickname: string;
  investmentTypeEmoji: string;
  category: PostCategory;
  content: string;
  tickers: string[];
  likes: string[];
  commentCount: number;
  createdAt: number;
}

export interface CommunityComment {
  id: string;
  uid: string;
  nickname: string;
  content: string;
  createdAt: number;
}

export async function createPost(
  post: Omit<CommunityPost, 'id' | 'likes' | 'commentCount' | 'createdAt'>
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'posts'), {
      ...post,
      likes: [],
      commentCount: 0,
      createdAt: Date.now(),
    });
    return ref.id;
  } catch (error) {
    console.error('createPost 오류:', error);
    throw error;
  }
}

export async function getPosts(category?: PostCategory): Promise<CommunityPost[]> {
  try {
    const col = collection(db, 'posts');
    const q = category && category !== '전체'
      ? query(col, where('category', '==', category), orderBy('createdAt', 'desc'), firestoreLimit(50))
      : query(col, orderBy('createdAt', 'desc'), firestoreLimit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityPost));
  } catch (error) {
    console.error('getPosts 오류:', error);
    return [];
  }
}

export async function getPost(postId: string): Promise<CommunityPost | null> {
  try {
    const snap = await getDoc(doc(db, 'posts', postId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as CommunityPost) : null;
  } catch (error) {
    console.error('getPost 오류:', error);
    return null;
  }
}

export async function toggleLike(postId: string, uid: string): Promise<void> {
  try {
    const ref = doc(db, 'posts', postId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const likes: string[] = snap.data().likes ?? [];
    if (likes.includes(uid)) {
      await updateDoc(ref, { likes: arrayRemove(uid) });
    } else {
      await updateDoc(ref, { likes: arrayUnion(uid) });
    }
  } catch (error) {
    console.error('toggleLike 오류:', error);
    throw error;
  }
}

export async function deletePost(postId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (error) {
    console.error('deletePost 오류:', error);
    throw error;
  }
}

export async function addComment(
  postId: string,
  comment: Omit<CommunityComment, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'posts', postId, 'comments'), {
      ...comment,
      createdAt: Date.now(),
    });
    await updateDoc(doc(db, 'posts', postId), { commentCount: increment(1) });
    return ref.id;
  } catch (error) {
    console.error('addComment 오류:', error);
    throw error;
  }
}

export async function getComments(postId: string): Promise<CommunityComment[]> {
  try {
    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityComment));
  } catch (error) {
    console.error('getComments 오류:', error);
    return [];
  }
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
    await updateDoc(doc(db, 'posts', postId), { commentCount: increment(-1) });
  } catch (error) {
    console.error('deleteComment 오류:', error);
    throw error;
  }
}
