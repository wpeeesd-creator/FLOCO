/**
 * 마이페이지 화면 — 포트폴리오, 거래 내역, 레벨 시스템
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore, STOCKS } from '../store/appStore';
import { useAuth } from '../context/AuthContext';
import { Colors, Typography, Card, ReturnBadge, Badge, XpBar, Hearts, Streak } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

type MyTab = 'portfolio' | 'trades' | 'achievements';

const ACHIEVEMENTS = [
  { id: 'first_lesson', emoji: '📜', label: '첫 수업 완료', desc: '첫 번째 레슨을 완료했어요' },
  { id: 'streak_7', emoji: '🔥', label: '7일 연속', desc: '7일 연속 학습했어요' },
  { id: 'first_trade', emoji: '📈', label: '첫 거래', desc: '첫 번째 주식을 거래했어요' },
  { id: 'diversified', emoji: '🌐', label: '분산 투자', desc: '3종목 이상 보유 중' },
];

export default function MyPageScreen() {
  const { theme, isDark } = useTheme();
  const { cash, holdings, trades, xp, level, streak, hearts, completedLessons, floPoints, achievements, getTotalValue, getReturnRate } = useAppStore();
  const { user: currentUser, logout } = useAuth();
  const [tab, setTab] = useState<MyTab>('portfolio');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('MyPageScreen 마운트');
    try {
      console.log('cash:', cash);
      console.log('holdings:', holdings);
      console.log('trades:', trades);
      setIsLoading(false);
    } catch (error) {
      console.error('MyPageScreen 초기화 오류:', error);
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgCard }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 12 }}>내 정보를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('MyPageScreen 렌더링 시작');

  function handleLogout() {
    Alert.alert('로그아웃', '로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: logout },
    ]);
  }

  let totalValue = 0;
  let returnRate = 0;
  try {
    totalValue = getTotalValue() ?? 0;
    returnRate = getReturnRate() ?? 0;
  } catch (error) {
    console.error('MyPageScreen 자산 계산 오류:', error);
  }
  const profit = totalValue - 1_000_000;
  const XP_PER_LEVEL = 500;
  const safeHoldings = holdings ?? [];
  const safeTrades = trades ?? [];
  const safeCompletedLessons = completedLessons ?? [];
  const safeAchievements = achievements ?? [];

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 16, paddingBottom: 14,
      backgroundColor: theme.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
    headerSub: { fontSize: 12, color: Colors.textSub, marginTop: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logoutBtn: { backgroundColor: Colors.card, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    logoutText: { fontSize: 11, fontWeight: '600', color: Colors.textSub },
    profileCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: theme.bgCard, margin: 16, borderRadius: 16, padding: 16,
      shadowColor: theme.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    avatarBox: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: theme.bgCard, fontSize: 20, fontWeight: '700' },
    levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    levelText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
    assetCard: {
      backgroundColor: Colors.navy, marginHorizontal: 16, borderRadius: 16, padding: 20, gap: 16,
      shadowColor: theme.text, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
    },
    assetMain: { gap: 6 },
    assetLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
    assetValue: { color: theme.bgCard, fontSize: 28, fontWeight: '700', fontFamily: 'Courier', letterSpacing: -0.5 },
    assetRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    assetProfit: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
    assetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    assetItem: { width: '45%' },
    assetItemLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
    assetItemValue: { color: theme.bgCard, fontSize: 13, fontWeight: '700', marginTop: 2 },
    tabBar: {
      flexDirection: 'row', backgroundColor: theme.bgCard,
      marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 4,
    },
    tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    tabBtnActive: { backgroundColor: Colors.primary },
    tabText: { fontSize: 12, fontWeight: '600', color: Colors.textSub },
    tabTextActive: { color: theme.bgCard },
    tabContent: { padding: 16, gap: 8 },
    holdingCard: { padding: 14 },
    holdingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    holdingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    holdingStats: { flexDirection: 'row', justifyContent: 'space-between' },
    tradeCard: { padding: 12 },
    tradeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    tradeLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    tradeStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    achCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    achCardLocked: { opacity: 0.6 },
    achEmoji: { fontSize: 28 },
    empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
    emptyEmoji: { fontSize: 40 },
    emptyText: { fontSize: 15, color: Colors.textSub, fontWeight: '500' },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgCard }}>
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: 12 }]}>
        <View>
          <Text style={styles.headerTitle}>마이페이지</Text>
          <Text style={styles.headerSub}>Lv.{level} · {currentUser?.name ?? ''}</Text>
        </View>
        <View style={styles.headerRight}>
          <Streak count={streak} />
          <Hearts count={hearts} />
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* 프로필 카드 */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>K</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.levelRow}>
              <Text style={styles.levelText}>Lv.{level}</Text>
              <Badge label={`⭐ ${floPoints} FLO`} type="warning" size="sm" />
            </View>
            <XpBar current={xp} max={XP_PER_LEVEL} />
          </View>
        </View>

        {/* 자산 요약 */}
        <View style={styles.assetCard}>
          <View style={styles.assetMain}>
            <Text style={styles.assetLabel}>총 자산</Text>
            <Text style={styles.assetValue}>₩{Math.round(totalValue).toLocaleString()}</Text>
            <View style={styles.assetRow}>
              <ReturnBadge value={returnRate} />
              <Text style={styles.assetProfit}>
                {profit >= 0 ? '+' : ''}₩{Math.round(profit).toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.assetGrid}>
            <View style={styles.assetItem}>
              <Text style={styles.assetItemLabel}>현금</Text>
              <Text style={styles.assetItemValue}>₩{Math.round(cash).toLocaleString()}</Text>
            </View>
            <View style={styles.assetItem}>
              <Text style={styles.assetItemLabel}>주식</Text>
              <Text style={styles.assetItemValue}>₩{Math.round(totalValue - cash).toLocaleString()}</Text>
            </View>
            <View style={styles.assetItem}>
              <Text style={styles.assetItemLabel}>학습</Text>
              <Text style={styles.assetItemValue}>{safeCompletedLessons.length}/8 완료</Text>
            </View>
            <View style={styles.assetItem}>
              <Text style={styles.assetItemLabel}>거래</Text>
              <Text style={styles.assetItemValue}>{safeTrades.length}건</Text>
            </View>
          </View>
        </View>

        {/* 탭 */}
        <View style={styles.tabBar}>
          {(['portfolio', 'trades', 'achievements'] as MyTab[]).map(t => (
            <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'portfolio' ? '보유 종목' : t === 'trades' ? '거래 내역' : '업적'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 보유 종목 탭 */}
        {tab === 'portfolio' && (
          <View style={styles.tabContent}>
            {safeHoldings.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyText}>보유 종목이 없어요</Text>
              </View>
            ) : (
              safeHoldings.map(h => {
                const stock = STOCKS.find(s => s.ticker === h.ticker);
                if (!stock) return null;
                const gainRate = ((stock.price - h.avgPrice) / h.avgPrice) * 100;
                const gainAmt = (stock.price - h.avgPrice) * h.qty;
                return (
                  <Card key={h.ticker} style={styles.holdingCard}>
                    <View style={styles.holdingTop}>
                      <View style={styles.holdingLeft}>
                        <Text style={{ fontSize: 24 }}>{stock.logo}</Text>
                        <View>
                          <Text style={[Typography.body1, { fontWeight: '700' }]}>{stock.name}</Text>
                          <Text style={Typography.caption}>{h.ticker} · {h.qty}주</Text>
                        </View>
                      </View>
                      <ReturnBadge value={gainRate} />
                    </View>
                    <View style={styles.holdingStats}>
                      <View>
                        <Text style={Typography.caption}>평균 단가</Text>
                        <Text style={[Typography.body2, { fontWeight: '700' }]}>
                          {stock.krw ? `₩${Math.round(h.avgPrice).toLocaleString()}` : `$${h.avgPrice.toFixed(2)}`}
                        </Text>
                      </View>
                      <View>
                        <Text style={Typography.caption}>현재가</Text>
                        <Text style={[Typography.body2, { fontWeight: '700' }]}>
                          {stock.krw ? `₩${stock.price.toLocaleString()}` : `$${stock.price.toFixed(2)}`}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={Typography.caption}>평가 손익</Text>
                        <Text style={[Typography.body2, { fontWeight: '700', color: gainAmt >= 0 ? Colors.green : Colors.red }]}>
                          {gainAmt >= 0 ? '+' : ''}{stock.krw ? `₩${Math.round(gainAmt).toLocaleString()}` : `$${gainAmt.toFixed(2)}`}
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* 거래 내역 탭 */}
        {tab === 'trades' && (
          <View style={styles.tabContent}>
            {safeTrades.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyText}>거래 내역이 없어요</Text>
              </View>
            ) : (
              [...safeTrades].reverse().map(t => {
                const stock = STOCKS.find(s => s.ticker === t.ticker);
                const total = t.price * t.qty;
                return (
                  <Card key={t.id} style={styles.tradeCard}>
                    <View style={styles.tradeTop}>
                      <View style={styles.tradeLeft}>
                        <Text style={{ fontSize: 20 }}>{stock?.logo ?? '📊'}</Text>
                        <View>
                          <Text style={[Typography.body1, { fontWeight: '700' }]}>{t.ticker}</Text>
                          <Text style={Typography.caption}>{new Date(t.timestamp).toLocaleDateString('ko-KR')}</Text>
                        </View>
                      </View>
                      <Badge label={t.type === 'buy' ? '매수' : '매도'} type={t.type === 'buy' ? 'success' : 'danger'} size="sm" />
                    </View>
                    <View style={styles.tradeStats}>
                      <Text style={Typography.caption}>{t.qty}주 × {stock?.krw ? `₩${t.price.toLocaleString()}` : `$${t.price.toFixed(2)}`}</Text>
                      <Text style={[Typography.body2, { fontWeight: '700', color: t.type === 'buy' ? Colors.red : Colors.green }]}>
                        {t.type === 'buy' ? '-' : '+'}{stock?.krw ? `₩${Math.round(total).toLocaleString()}` : `$${total.toFixed(2)}`}
                      </Text>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* 업적 탭 */}
        {tab === 'achievements' && (
          <View style={styles.tabContent}>
            {ACHIEVEMENTS.map(ach => {
              const earned = safeAchievements.includes(ach.id);
              return (
                <Card key={ach.id} style={[styles.achCard, !earned && styles.achCardLocked]}>
                  <Text style={[styles.achEmoji, !earned && { opacity: 0.3 }]}>{ach.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.body1, { fontWeight: '700', color: earned ? Colors.text : Colors.textMuted }]}>
                      {ach.label}
                    </Text>
                    <Text style={Typography.caption}>{ach.desc}</Text>
                  </View>
                  {earned && <Badge label="획득" type="success" size="sm" />}
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
    </SafeAreaView>
  );
}

