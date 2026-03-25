/**
 * 마이페이지 — 프로필, 투자 현황, 학습 현황, 설정, 로그아웃
 */

import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore, STOCKS } from '../store/appStore';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/ui';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user: currentUser, logout } = useAuth();
  const {
    cash, holdings, trades, xp, level, streak,
    completedLessons, floPoints, getTotalValue, getReturnRate,
  } = useAppStore();

  const safeHoldings = holdings ?? [];
  const safeTrades = trades ?? [];
  const safeCompletedLessons = completedLessons ?? [];

  let totalValue = 0;
  let returnRate = 0;
  try {
    totalValue = getTotalValue() ?? 0;
    returnRate = getReturnRate() ?? 0;
  } catch { /* fallback */ }

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('로그아웃 오류:', error);
              Alert.alert('오류', '로그아웃 중 문제가 발생했어요');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>마이페이지</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* 프로필 카드 */}
          <View style={styles.profileCard}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{currentUser?.name ?? '사용자'}</Text>
              <Text style={styles.profileEmail}>{currentUser?.email ?? ''}</Text>
              <Text style={styles.profileDate}>Lv.{level} · 가입일 정보 없음</Text>
            </View>
          </View>

          {/* 내 투자 현황 */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📊 내 투자 현황</Text>
            <View style={styles.statGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>총 자산</Text>
                <Text style={styles.statValue}>₩{Math.round(totalValue).toLocaleString()}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>수익률</Text>
                <Text style={[styles.statValue, { color: returnRate >= 0 ? '#22C55E' : '#EF4444' }]}>
                  {returnRate >= 0 ? '+' : ''}{returnRate.toFixed(2)}%
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>보유 종목</Text>
                <Text style={styles.statValue}>{safeHoldings.length}종목</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>거래 횟수</Text>
                <Text style={styles.statValue}>{safeTrades.length}건</Text>
              </View>
            </View>
          </View>

          {/* 학습 현황 */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📚 학습 현황</Text>
            <View style={styles.learnGrid}>
              <View style={styles.learnItem}>
                <Text style={styles.learnEmoji}>🔥</Text>
                <Text style={styles.learnValue}>{streak ?? 0}일</Text>
                <Text style={styles.learnLabel}>연속 학습</Text>
              </View>
              <View style={styles.learnItem}>
                <Text style={styles.learnEmoji}>⭐</Text>
                <Text style={styles.learnValue}>{floPoints ?? 0}</Text>
                <Text style={styles.learnLabel}>총 포인트</Text>
              </View>
              <View style={styles.learnItem}>
                <Text style={styles.learnEmoji}>📖</Text>
                <Text style={styles.learnValue}>{safeCompletedLessons.length}/8</Text>
                <Text style={styles.learnLabel}>완료 코스</Text>
              </View>
            </View>
          </View>

          {/* 설정 메뉴 */}
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuIcon}>🔔</Text>
              <Text style={styles.menuText}>알림 설정</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <View style={styles.menuItem}>
              <Text style={styles.menuIcon}>📱</Text>
              <Text style={styles.menuText}>앱 버전</Text>
              <Text style={styles.menuValue}>1.0.0</Text>
            </View>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Linking.openURL('mailto:support@floco.app')}
            >
              <Text style={styles.menuIcon}>💬</Text>
              <Text style={styles.menuText}>문의하기</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* 관리자 전용 메뉴 */}
          {currentUser?.role === 'admin' && (
            <TouchableOpacity style={styles.adminBtn} onPress={() => navigation.navigate('관리자대시보드')}>
              <Text style={styles.adminBtnText}>⚙️ 관리자 대시보드</Text>
            </TouchableOpacity>
          )}

          {/* 로그아웃 버튼 */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>로그아웃</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#191919' },

  // 프로필 카드
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    margin: 16, backgroundColor: '#F8F9FA', borderRadius: 20, padding: 20,
  },
  avatarBox: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#0066FF',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 28 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#191919' },
  profileEmail: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  profileDate: { fontSize: 12, color: '#B0B8C1', marginTop: 4 },

  // 투자 현황
  sectionCard: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#F2F2F7',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#191919', marginBottom: 14 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  statItem: { width: '50%', marginBottom: 12 },
  statLabel: { fontSize: 12, color: '#8E8E93' },
  statValue: { fontSize: 17, fontWeight: '700', color: '#191919', marginTop: 2, fontFamily: 'Courier' },

  // 학습 현황
  learnGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  learnItem: { alignItems: 'center', gap: 4 },
  learnEmoji: { fontSize: 28 },
  learnValue: { fontSize: 18, fontWeight: '800', color: '#191919' },
  learnLabel: { fontSize: 11, color: '#8E8E93' },

  // 설정 메뉴
  menuCard: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: '#FFFFFF',
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F2F2F7',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
  },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuText: { flex: 1, fontSize: 15, fontWeight: '500', color: '#191919' },
  menuArrow: { fontSize: 20, color: '#B0B8C1' },
  menuValue: { fontSize: 14, color: '#8E8E93' },
  menuDivider: { height: 1, backgroundColor: '#F2F2F7', marginLeft: 46 },

  // 관리자 버튼
  adminBtn: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: '#F0F0FF',
    borderRadius: 12, height: 52, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#0066FF',
  },
  adminBtnText: { color: '#0066FF', fontSize: 16, fontWeight: '700' },

  // 로그아웃 버튼
  logoutBtn: {
    marginHorizontal: 16, marginTop: 12, marginBottom: 40,
    backgroundColor: '#FFF0F0', borderRadius: 12, height: 52,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#FF3B30',
  },
  logoutBtnText: { color: '#FF3B30', fontSize: 16, fontWeight: '700' },
});
