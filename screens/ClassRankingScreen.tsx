/**
 * 우리 반 랭킹 화면
 * Firestore users/{uid}.school.classId 기준 필터링
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { getAllPortfolios } from '../lib/firestoreService';
import { STOCKS } from '../store/appStore';
import { Colors } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

const MEDALS = ['🥇', '🥈', '🥉'];
const INITIAL_FUND = 1_000_000;

interface ClassMember {
  uid: string;
  name: string;
  investEmoji: string;
  totalAsset: number;
  returnRate: number;
}

interface ClassRankingScreenProps {
  classId: string;
  schoolName: string;
  grade: string;
  classNum: string;
}

export default function ClassRankingScreen({ classId, schoolName, grade, classNum }: ClassRankingScreenProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [ranked, setRanked] = useState<ClassMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      // 같은 classId를 가진 유저 조회
      const q = query(collection(db, 'users'), where('school.classId', '==', classId));
      const usersSnap = await getDocs(q);
      const classUsers = usersSnap.docs.map((d) => ({
        uid: d.id,
        name: d.data()?.name ?? '익명',
        investEmoji: d.data()?.investmentType?.emoji ?? '📊',
      }));

      if (classUsers.length === 0) {
        setRanked([]);
        return;
      }

      // 포트폴리오 로드
      const allPortfolios = await getAllPortfolios();
      const classUids = new Set(classUsers.map((u) => u.uid));

      const members: ClassMember[] = classUsers.map((cu) => {
        const port = allPortfolios.find((p) => p.uid === cu.uid);
        let totalAsset = INITIAL_FUND;
        if (port) {
          const holdingsValue = (port.holdings ?? []).reduce((sum, h) => {
            const s = STOCKS.find((st) => st.ticker === h.ticker);
            return sum + (s ? (s.price ?? 0) * (h.qty ?? 0) : 0);
          }, 0);
          totalAsset = (port.cash ?? 0) + holdingsValue;
        }
        const returnRate = ((totalAsset - INITIAL_FUND) / INITIAL_FUND) * 100;
        return { ...cu, totalAsset, returnRate };
      });

      members.sort((a, b) => b.totalAsset - a.totalAsset);
      setRanked(members);
    } catch (error) {
      console.error('반 랭킹 로드 오류:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [classId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    classCard: {
      backgroundColor: Colors.primary, margin: 16, borderRadius: 20, padding: 20,
    },
    classCardLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
    classCardTitle: {
      color: theme.bgCard, fontSize: 22, fontWeight: '700', marginTop: 4,
    },
    classCardSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 },
    list: { paddingHorizontal: 16, paddingBottom: 20 },
    row: {
      backgroundColor: theme.bgCard, borderRadius: 16, padding: 16,
      marginBottom: 8, flexDirection: 'row', alignItems: 'center',
    },
    rowMe: { backgroundColor: theme.primaryLight },
    rank: { fontSize: 20, width: 36, textAlign: 'center' },
    rowEmoji: { fontSize: 20, marginHorizontal: 8 },
    rowMeta: { flex: 1 },
    rowName: { fontWeight: '700', color: Colors.text, fontSize: 15 },
    rowAsset: { color: Colors.textSub, fontSize: 13, marginTop: 2 },
    rowReturn: { fontWeight: '700', fontSize: 15 },
    empty: {
      flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40,
    },
    emptyEmoji: { fontSize: 48 },
    emptyText: {
      color: Colors.textSub, marginTop: 16, textAlign: 'center', fontSize: 16, lineHeight: 24,
    },
    emptyBtn: {
      marginTop: 16, backgroundColor: Colors.primary, borderRadius: 12,
      paddingHorizontal: 24, height: 44, justifyContent: 'center',
    },
    emptyBtnText: { color: theme.bgCard, fontWeight: '700' },
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 반 정보 카드 */}
      <View style={styles.classCard}>
        <Text style={styles.classCardLabel}>현재 반</Text>
        <Text style={styles.classCardTitle}>{schoolName} {grade} {classNum}</Text>
        <Text style={styles.classCardSub}>총 {ranked.length}명 참여 중</Text>
      </View>

      {/* 랭킹 리스트 */}
      {ranked.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyText}>
            아직 반 친구들이 없어요{'\n'}친구들을 초대해보세요!
          </Text>
          <TouchableOpacity
            onPress={() => navigation.getParent()?.navigate('마이페이지Tab')}
            style={styles.emptyBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyBtnText}>초대 코드 공유하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={ranked}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          renderItem={({ item, index }) => {
            const isMe = item.uid === user?.id;
            const isUp = item.returnRate >= 0;
            return (
              <View style={[styles.row, isMe && styles.rowMe]}>
                <Text style={styles.rank}>
                  {index < 3 ? MEDALS[index] : `${index + 1}`}
                </Text>
                <Text style={styles.rowEmoji}>{item.investEmoji}</Text>
                <View style={styles.rowMeta}>
                  <Text style={styles.rowName}>
                    {item.name}{isMe ? ' (나)' : ''}
                  </Text>
                  <Text style={styles.rowAsset}>
                    {Math.round(item.totalAsset).toLocaleString()}원
                  </Text>
                </View>
                <Text style={[styles.rowReturn, { color: isUp ? Colors.green : Colors.red }]}>
                  {isUp ? '+' : ''}{item.returnRate.toFixed(2)}%
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

