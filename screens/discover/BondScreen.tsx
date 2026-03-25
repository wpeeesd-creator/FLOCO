import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// ── 데이터 ──────────────────────────────────

type BondTab = '전체' | '국채' | '해외채권' | '회사채';

interface Bond {
  id: string;
  name: string;
  rate: string;
  change: string;
  type: BondTab;
  flag: string;
  maturity: string;
}

const BONDS: Bond[] = [
  { id: 'kr3y',  name: '국채 3년물',      rate: '3.45%', change: '+0.02%', type: '국채',     flag: '🇰🇷', maturity: '3년' },
  { id: 'kr10y', name: '국채 10년물',     rate: '3.72%', change: '-0.01%', type: '국채',     flag: '🇰🇷', maturity: '10년' },
  { id: 'kr1y',  name: '국채 1년물',      rate: '3.18%', change: '+0.01%', type: '국채',     flag: '🇰🇷', maturity: '1년' },
  { id: 'kr5y',  name: '국채 5년물',      rate: '3.55%', change: '+0.00%', type: '국채',     flag: '🇰🇷', maturity: '5년' },
  { id: 'us2y',  name: '미국채 2년물',    rate: '4.89%', change: '+0.03%', type: '해외채권', flag: '🇺🇸', maturity: '2년' },
  { id: 'us10y', name: '미국채 10년물',   rate: '4.32%', change: '-0.02%', type: '해외채권', flag: '🇺🇸', maturity: '10년' },
  { id: 'us30y', name: '미국채 30년물',   rate: '4.48%', change: '-0.01%', type: '해외채권', flag: '🇺🇸', maturity: '30년' },
  { id: 'jpn10', name: '일본 국채 10년',  rate: '0.92%', change: '+0.01%', type: '해외채권', flag: '🇯🇵', maturity: '10년' },
  { id: 'corp1', name: '회사채 AA',       rate: '4.12%', change: '+0.01%', type: '회사채',   flag: '🏢', maturity: '3년' },
  { id: 'corp2', name: '회사채 A+',       rate: '4.85%', change: '+0.02%', type: '회사채',   flag: '🏢', maturity: '3년' },
  { id: 'corp3', name: '삼성전자 채권 AA+', rate: '3.78%', change: '-0.01%', type: '회사채', flag: '📱', maturity: '5년' },
];

const RATE_CARDS = [
  { name: '한국 기준금리', value: '3.50%', org: '한국은행', emoji: '🇰🇷' },
  { name: '미국 기준금리', value: '5.25%', org: '연준(Fed)', emoji: '🇺🇸' },
  { name: '일본 기준금리', value: '0.10%', org: '일본은행', emoji: '🇯🇵' },
];

// ── 컴포넌트 ──────────────────────────────

export default function BondScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<BondTab>('전체');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filtered = tab === '전체' ? BONDS : BONDS.filter(b => b.type === tab);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📜 채권</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0066FF" />}
        >
          {/* 채권이란? 카드 */}
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>💡 채권이란?</Text>
            <Text style={styles.introDesc}>국가나 기업이 자금을 조달하기 위해 발행하는 차용증서입니다.</Text>

            <View style={styles.introItem}>
              <Text style={styles.introBullet}>📌</Text>
              <Text style={styles.introItemText}>국가/기업에 돈을 빌려주는 것</Text>
            </View>
            <View style={styles.introItem}>
              <Text style={styles.introBullet}>📌</Text>
              <Text style={styles.introItemText}>정해진 이자를 받아요</Text>
            </View>
            <View style={styles.introItem}>
              <Text style={styles.introBullet}>📌</Text>
              <Text style={styles.introItemText}>주식보다 안전해요</Text>
            </View>
          </View>

          {/* 기준금리 카드 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rateRow}>
            {RATE_CARDS.map(r => (
              <View key={r.name} style={styles.rateCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 18 }}>{r.emoji}</Text>
                  <Text style={styles.rateLabel}>{r.name}</Text>
                </View>
                <Text style={styles.rateValue}>{r.value}</Text>
                <Text style={styles.rateOrg}>{r.org}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {(['전체', '국채', '해외채권', '회사채'] as BondTab[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Count */}
          <View style={styles.countRow}>
            <Text style={styles.countText}>{filtered.length}개 채권</Text>
          </View>

          {/* Bond List */}
          <View style={styles.listCard}>
            {filtered.map((b, i) => {
              const isUp = b.change.startsWith('+') && b.change !== '+0.00%';
              const isDown = b.change.startsWith('-');
              const color = isUp ? '#22C55E' : isDown ? '#EF4444' : '#8E8E93';
              return (
                <View key={b.id} style={[styles.bondRow, i < filtered.length - 1 && styles.bondBorder]}>
                  <View style={styles.bondIcon}>
                    <Text style={{ fontSize: 20 }}>{b.flag}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.bondName}>{b.name}</Text>
                    <Text style={styles.bondMeta}>{b.type} · 만기 {b.maturity}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.bondRate}>{b.rate}</Text>
                    <Text style={[styles.bondChange, { color }]}>
                      {isUp ? '▲' : isDown ? '▼' : '─'} {b.change}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* 채권 vs 주식 비교 */}
          <View style={styles.compareCard}>
            <Text style={styles.compareTitle}>📊 채권 vs 주식 비교</Text>
            <View style={styles.compareRow}>
              <View style={styles.compareCol}>
                <Text style={styles.compareLabel}>📜 채권</Text>
                <View style={styles.compareItem}>
                  <Text style={styles.compareStat}>안전성</Text>
                  <Text style={styles.compareStars}>⭐⭐⭐⭐</Text>
                </View>
                <View style={styles.compareItem}>
                  <Text style={styles.compareStat}>수익률</Text>
                  <Text style={styles.compareStars}>⭐⭐</Text>
                </View>
                <View style={styles.compareItem}>
                  <Text style={styles.compareStat}>변동성</Text>
                  <Text style={styles.compareStars}>⭐</Text>
                </View>
              </View>
              <View style={styles.compareDivider} />
              <View style={styles.compareCol}>
                <Text style={styles.compareLabel}>📈 주식</Text>
                <View style={styles.compareItem}>
                  <Text style={styles.compareStat}>안전성</Text>
                  <Text style={styles.compareStars}>⭐⭐</Text>
                </View>
                <View style={styles.compareItem}>
                  <Text style={styles.compareStat}>수익률</Text>
                  <Text style={styles.compareStars}>⭐⭐⭐⭐⭐</Text>
                </View>
                <View style={styles.compareItem}>
                  <Text style={styles.compareStat}>변동성</Text>
                  <Text style={styles.compareStars}>⭐⭐⭐⭐</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 금리와 채권 관계 */}
          <View style={styles.relationCard}>
            <Text style={styles.relationTitle}>🔗 금리와 채권의 관계</Text>
            <Text style={styles.relationDesc}>금리와 채권 가격은 시소처럼 반대로 움직여요.</Text>

            <View style={styles.relationBox}>
              <View style={[styles.relationItem, { backgroundColor: '#FFF5F5' }]}>
                <Text style={styles.relationEmoji}>📈</Text>
                <Text style={styles.relationLabel}>금리 상승</Text>
                <Text style={styles.relationArrow}>→</Text>
                <Text style={styles.relationEmoji}>📉</Text>
                <Text style={styles.relationLabel}>채권 가격 하락</Text>
              </View>
              <View style={[styles.relationItem, { backgroundColor: '#F0FFF4' }]}>
                <Text style={styles.relationEmoji}>📉</Text>
                <Text style={styles.relationLabel}>금리 하락</Text>
                <Text style={styles.relationArrow}>→</Text>
                <Text style={styles.relationEmoji}>📈</Text>
                <Text style={styles.relationLabel}>채권 가격 상승</Text>
              </View>
            </View>

            <Text style={styles.relationTip}>
              💡 금리가 높을 때 채권을 사면, 나중에 금리가 내려갈 때 시세차익을 얻을 수 있어요!
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ── 스타일 ──────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 22, color: '#0066FF', fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#191919' },

  // 채권이란? 카드
  introCard: {
    margin: 16, backgroundColor: '#FFFBEB', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  introTitle: { fontSize: 17, fontWeight: '800', color: '#191919', marginBottom: 4 },
  introDesc: { fontSize: 13, color: '#8E8E93', marginBottom: 14, lineHeight: 18 },
  introItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  introBullet: { fontSize: 14 },
  introItemText: { fontSize: 14, fontWeight: '600', color: '#44403C' },

  // 기준금리
  rateRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  rateCard: { backgroundColor: '#F8F9FA', borderRadius: 14, padding: 16, width: 160, gap: 6 },
  rateLabel: { fontSize: 13, fontWeight: '600', color: '#191919' },
  rateValue: { fontSize: 24, fontWeight: '800', color: '#191919', fontFamily: 'Courier' },
  rateOrg: { fontSize: 11, color: '#8E8E93' },

  // 탭
  tabRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 6 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F8F9FA' },
  tabBtnActive: { backgroundColor: '#0066FF' },
  tabText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '700' },

  countRow: { paddingHorizontal: 20, paddingBottom: 8 },
  countText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },

  // 채권 리스트
  listCard: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: '#F2F2F7',
  },
  bondRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14 },
  bondBorder: { borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  bondIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF8E1',
    alignItems: 'center', justifyContent: 'center',
  },
  bondName: { fontSize: 15, fontWeight: '700', color: '#191919' },
  bondMeta: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  bondRate: { fontSize: 18, fontWeight: '800', color: '#191919', fontFamily: 'Courier' },
  bondChange: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  // 채권 vs 주식
  compareCard: {
    marginHorizontal: 16, marginTop: 24, backgroundColor: '#F8FAFC',
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0',
  },
  compareTitle: { fontSize: 17, fontWeight: '800', color: '#191919', marginBottom: 16 },
  compareRow: { flexDirection: 'row' },
  compareCol: { flex: 1, gap: 10 },
  compareDivider: { width: 1, backgroundColor: '#E2E8F0', marginHorizontal: 12 },
  compareLabel: { fontSize: 15, fontWeight: '700', color: '#191919', marginBottom: 4 },
  compareItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compareStat: { fontSize: 13, color: '#64748B' },
  compareStars: { fontSize: 12 },

  // 금리 관계
  relationCard: {
    marginHorizontal: 16, marginTop: 16, backgroundColor: '#F0F7FF',
    borderRadius: 16, padding: 20, borderLeftWidth: 4, borderLeftColor: '#0066FF',
  },
  relationTitle: { fontSize: 17, fontWeight: '800', color: '#191919', marginBottom: 4 },
  relationDesc: { fontSize: 13, color: '#8E8E93', marginBottom: 16 },
  relationBox: { gap: 10, marginBottom: 14 },
  relationItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
  },
  relationEmoji: { fontSize: 20 },
  relationLabel: { fontSize: 13, fontWeight: '600', color: '#191919' },
  relationArrow: { fontSize: 16, color: '#8E8E93', fontWeight: '700' },
  relationTip: { fontSize: 13, color: '#0066FF', fontWeight: '600', lineHeight: 18 },
});
