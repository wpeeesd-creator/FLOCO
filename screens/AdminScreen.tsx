/**
 * 관리자 대시보드 — 실시간 통계 + 퀵메뉴 + 최근 활동
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { subscribeGlobalStats, type GlobalStats } from '../lib/adminService';
import { getAllUserProfiles, getAllPortfolios } from '../lib/firestoreService';
import { seedCommunityPosts } from '../lib/seedCommunity';
import { useAuth } from '../context/AuthContext';

// ── 더미 최근 활동 ─────────────────────────────
const RECENT_ACTIVITIES = [
  { id: '1', icon: 'person-add', color: '#34C759', text: '새 가입: 홍길동님이 가입했어요', time: '방금 전' },
  { id: '2', icon: 'trending-up', color: '#FF9500', text: '큰 거래: 김투자님 NVDA 50주 매수', time: '3분 전' },
  { id: '3', icon: 'warning', color: '#FF3B30', text: '신고 접수: 게시물 신고 1건', time: '12분 전' },
];

// ── 퀵메뉴 항목 ────────────────────────────────
const QUICK_MENUS = [
  { emoji: '📊', label: '유저 관리', route: '관리자통계' },
  { emoji: '📋', label: '거래 로그', route: '거래로그' },
  { emoji: '📚', label: '학습 통계', route: '학습통계' },
  { emoji: '🔥', label: '인기 종목', route: '인기종목' },
  { emoji: '🎉', label: '이벤트 관리', route: '이벤트관리' },
  { emoji: '🚨', label: '신고 관리', route: '신고관리' },
] as const;

export default function AdminScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [tradeCount, setTradeCount] = useState(0);
  const [tradeAmount, setTradeAmount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [users, portfolios] = await Promise.all([
        getAllUserProfiles(),
        getAllPortfolios(),
      ]);
      setUserCount(users.length);
      const allTrades = portfolios.flatMap(p => p.trades ?? []);
      setTradeCount(allTrades.length);
      setTradeAmount(allTrades.reduce((sum, t) => sum + (t.price * t.qty), 0));
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsub = subscribeGlobalStats(setStats);
    loadData();
    return () => unsub();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const seedSamplePosts = async () => {
    Alert.alert(
      '샘플 글 생성',
      '커뮤니티 샘플 글 8개를 생성할까요?\n(1회만 실행하세요)',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '생성',
          onPress: async () => {
            try {
              setIsSeeding(true);
              await seedCommunityPosts(user!.id);
              Alert.alert('완료', '샘플 글 생성 완료!');
            } catch (error) {
              Alert.alert('오류', '생성 중 오류 발생');
            } finally {
              setIsSeeding(false);
            }
          },
        },
      ]
    );
  };

  const statCards = [
    { emoji: '👥', label: '전체 유저 수', value: `${userCount}명`, color: theme.primary },
    { emoji: '🟢', label: '현재 접속자', value: `${stats?.activeToday ?? 0}명`, color: theme.green },
    { emoji: '📈', label: '오늘 거래 횟수', value: `${stats?.totalTrades ?? tradeCount}건`, color: '#FF9500' },
    { emoji: '💰', label: '오늘 총 거래금액', value: `₩${Math.round(stats?.totalTradeAmount ?? tradeAmount).toLocaleString()}`, color: '#FF9500' },
    { emoji: '📚', label: '오늘 학습 완료', value: `${stats?.totalLessonsCompleted ?? 0}건`, color: '#5856D6' },
    { emoji: '🚨', label: '미처리 신고', value: `${stats?.pendingReports ?? 0}건`, color: '#FF3B30' },
  ];

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
    headerBadge: {
      backgroundColor: '#EAF4FF',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    headerBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
    scrollContent: { padding: 16, paddingBottom: 40 },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: Colors.text,
      marginBottom: 10,
      marginTop: 8,
    },
    // Stats grid
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 16,
    },
    statCard: {
      width: '47%',
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      padding: 14,
      borderLeftWidth: 4,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    statEmoji: { fontSize: 22, marginBottom: 6 },
    statValue: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
    statLabel: { fontSize: 11, color: Colors.textSub, fontWeight: '500' },
    // Quick menu grid
    quickGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 16,
    },
    quickCard: {
      width: '30%',
      backgroundColor: theme.bgCard,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 8,
      alignItems: 'center',
      gap: 6,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    quickEmoji: { fontSize: 24 },
    quickLabel: { fontSize: 11, fontWeight: '600', color: Colors.text, textAlign: 'center' },
    // Activity feed
    activityCard: {
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      padding: 4,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    activityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
    },
    activityIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activityText: { flex: 1, fontSize: 13, color: Colors.text, fontWeight: '500' },
    activityTime: { fontSize: 11, color: Colors.textSub },
    activityDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 14 },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>관리자 대시보드</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>🛡️ Admin</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* 통계 그리드 */}
        <Text style={styles.sectionTitle}>실시간 통계</Text>
        <View style={styles.statsGrid}>
          {statCards.map((card) => (
            <View key={card.label} style={[styles.statCard, { borderLeftColor: card.color }]}>
              <Text style={styles.statEmoji}>{card.emoji}</Text>
              <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* 퀵 메뉴 */}
        <Text style={styles.sectionTitle}>빠른 메뉴</Text>
        <View style={styles.quickGrid}>
          {QUICK_MENUS.map((menu) => (
            <TouchableOpacity
              key={menu.route}
              style={styles.quickCard}
              onPress={() => navigation.navigate(menu.route)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickEmoji}>{menu.emoji}</Text>
              <Text style={styles.quickLabel}>{menu.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 최근 활동 피드 */}
        <Text style={styles.sectionTitle}>최근 활동</Text>
        <View style={styles.activityCard}>
          {RECENT_ACTIVITIES.map((item, index) => (
            <View key={item.id}>
              <View style={styles.activityRow}>
                <View style={[styles.activityIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon as any} size={16} color={item.color} />
                </View>
                <Text style={styles.activityText} numberOfLines={1}>{item.text}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
              {index < RECENT_ACTIVITIES.length - 1 && <View style={styles.activityDivider} />}
            </View>
          ))}
        </View>

        {/* 커뮤니티 샘플 글 생성 */}
        <TouchableOpacity
          onPress={seedSamplePosts}
          disabled={isSeeding}
          style={{
            backgroundColor: isSeeding ? '#A0D8A8' : theme.green,
            borderRadius: 12,
            padding: 16,
            marginTop: 16,
            alignItems: 'center',
          }}
          activeOpacity={0.7}
        >
          <Text style={{ color: theme.bgCard, fontWeight: 'bold', fontSize: 15 }}>
            {isSeeding ? '생성 중...' : '💬 커뮤니티 샘플 글 생성 (1회만)'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
