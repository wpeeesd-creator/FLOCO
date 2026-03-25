/**
 * 관심 종목 관리 훅 — Firestore 연동
 * users/{uid}/wishlist 필드에 저장
 * 모든 카테고리 화면에서 공유
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export function useWishlist() {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Firestore에서 관심 종목 로드
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.id));
        if (snap.exists()) {
          const data = snap.data();
          setWishlist(data?.wishlist ?? []);
        }
      } catch (error) {
        console.error('관심 종목 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  // 관심 종목 추가/제거
  const toggleWishlist = useCallback(async (ticker: string) => {
    const isWishlisted = wishlist.includes(ticker);
    const updated = isWishlisted
      ? wishlist.filter(t => t !== ticker)
      : [...wishlist, ticker];

    // 즉시 로컬 반영 (Optimistic UI)
    setWishlist(updated);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Firestore 동기화
    if (user?.id) {
      try {
        await updateDoc(doc(db, 'users', user.id), { wishlist: updated });
        console.log(`관심 종목 ${isWishlisted ? '제거' : '추가'}: ${ticker}`);
      } catch (error) {
        console.error('관심 종목 저장 오류:', error);
        // 롤백
        setWishlist(wishlist);
      }
    }
  }, [wishlist, user?.id]);

  const isWishlisted = useCallback((ticker: string) => {
    return wishlist.includes(ticker);
  }, [wishlist]);

  return { wishlist, toggleWishlist, isWishlisted, loading };
}
