import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// ── 데이터 ──────────────────────────────────

type EtfTab = '전체' | '국내ETF' | '해외ETF' | '테마ETF';

interface ETFItem {
  ticker: string;
  name: string;
  price: number;
  change: number;
  type: EtfTab;
  krw: boolean;
  desc: string;
  expense: string;
  holdings: string[];   // 구성 종목 top 5
}

const ETFS: ETFItem[] = [
  // 국내ETF
  {
    ticker: 'KODEX200', name: 'KODEX 200', price: 35420, change: +0.80,
    type: '국내ETF', krw: true, desc: 'KOSPI 200 지수 추종', expense: '0.15%',
    holdings: ['삼성전자', 'SK하이닉스', 'LG에너지솔루션', '삼성바이오', '현대차'],
  },
  {
    ticker: 'KODEX삼성', name: 'KODEX 삼성그룹', price: 12350, change: +1.20,
    type: '국내ETF', krw: true, desc: '삼성그룹 주요 계열사', expense: '0.30%',
    holdings: ['삼성전자', '삼성SDI', '삼성물산', '삼성생명', '삼성바이오'],
  },
  {
    ticker: 'TIGER코스닥', name: 'TIGER 코스닥150', price: 18760, change: -0.50,
    type: '국내ETF', krw: true, desc: '코스닥 상위 150종목', expense: '0.19%',
    holdings: ['에코프로비엠', 'HLB', '엘앤에프', '알테오젠', '리가켐바이오'],
  },
  {
    ticker: 'KODEX배당', name: 'KODEX 고배당', price: 14280, change: +0.35,
    type: '국내ETF', krw: true, desc: '고배당 우량주', expense: '0.25%',
    holdings: ['하나금융', 'KB금융', '신한지주', 'KT&G', 'SK텔레콤'],
  },
  // 해외ETF
  {
    ticker: 'SPY', name: 'SPY (S&P 500)', price: 521.30, change: +0.30,
    type: '해외ETF', krw: false, desc: '미국 대형주 500개 추종', expense: '0.09%',
    holdings: ['Apple', 'Microsoft', 'NVIDIA', 'Amazon', 'Meta'],
  },
  {
    ticker: 'QQQ', name: 'QQQ (나스닥100)', price: 445.20, change: +0.50,
    type: '해외ETF', krw: false, desc: '나스닥 상위 100개 기업', expense: '0.20%',
    holdings: ['Apple', 'Microsoft', 'NVIDIA', 'Broadcom', 'Meta'],
  },
  {
    ticker: 'ARKK', name: 'ARKK (혁신기업)', price: 48.30, change: -1.20,
    type: '해외ETF', krw: false, desc: '파괴적 혁신 기업 집중', expense: '0.75%',
    holdings: ['Tesla', 'Coinbase', 'Roku', 'UiPath', 'Zoom'],
  },
  {
    ticker: 'VTI', name: 'VTI (전체미국)', price: 265.40, change: +0.78,
    type: '해외ETF', krw: false, desc: '미국 전체 주식 시장', expense: '0.03%',
    holdings: ['Apple', 'Microsoft', 'NVIDIA', 'Amazon', 'Alphabet'],
  },
  {
    ticker: 'SOXX', name: 'SOXX (반도체)', price: 234.80, change: +1.85,
    type: '해외ETF', krw: false, desc: '글로벌 반도체 기업', expense: '0.35%',
    holdings: ['NVIDIA', 'Broadcom', 'AMD', 'Qualcomm', 'Texas Instruments'],
  },
  // 테마ETF
  {
    ticker: 'KODEX2차전지', name: 'KODEX 2차전지', price: 15230, change: +2.10,
    type: '테마ETF', krw: true, desc: '2차전지 핵심 기업', expense: '0.40%',
    holdings: ['LG에너지솔루션', '삼성SDI', 'LG화학', '에코프로비엠', 'SK이노베이션'],
  },
  {
    ticker: 'TIGERAI', name: 'TIGER AI', price: 22450, change: +3.20,
    type: '테마ETF', krw: true, desc: '인공지능 관련 기업', expense: '0.45%',
    holdings: ['삼성전자', 'SK하이닉스', 'NAVER', '카카오', 'SK텔레콤'],
  },
  {
    ticker: 'KODEX반도체', name: 'KODEX 반도체', price: 28760, change: +1.80,
    type: '테마ETF', krw: true, desc: '국내 반도체 관련 기업', expense: '0.40%',
    holdings: ['삼성전자', 'SK하이닉스', '한미반도체', 'DB하이텍', '리노공업'],
  },
  {
    ticker: 'TIGER친환경', name: 'TIGER 친환경에너지', price: 9850, change: -0.65,
    type: '테마ETF', krw: true, desc: '신재생에너지 기업', expense: '0.50%',
    holdings: ['한화솔루션', 'OCI', '두산에너빌리티', 'LS ELECTRIC', '씨에스윈드'],
  },
];

const SUMMARY = [
  { emoji: '📊', label: '전체', count: `${ETFS.length}개` },
  { emoji: '🇰🇷', label: '국내', count: `${ETFS.filter(e => e.type === '국내ETF').length}개` },
  { emoji: '🇺🇸', label: '해외', count: `${ETFS.filter(e => e.type === '해외ETF').length}개` },
  { emoji: '🎯', label: '테마', count: `${ETFS.filter(e => e.type === '테마ETF').length}개` },
];

// ── 컴포넌트 ──────────────────────────────

export default function ETFScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<EtfTab>('전체');
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filtered = tab === '전체' ? ETFS : ETFS.filter(e => e.type === tab);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📊 ETF</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0066FF" />}
        >
          {/* ETF란? 카드 */}
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>💡 ETF란?</Text>
            <Text style={styles.introDesc}>상장지수펀드(Exchange Traded Fund)로 주식처럼 거래되는 펀드입니다.</Text>

            <View style={styles.introItem}>
              <Text style={styles.introBullet}>📌</Text>
              <Text style={styles.introItemText}>여러 주식을 묶은 바구니</Text>
            </View>
            <View style={styles.introItem}>
              <Text style={styles.introBullet}>📌</Text>
              <Text style={styles.introItemText}>분산투자 효과</Text>
            </View>
            <View style={styles.introItem}>
              <Text style={styles.introBullet}>📌</Text>
              <Text style={styles.introItemText}>주식처럼 쉽게 거래 가능</Text>
            </View>
          </View>

          {/* Summary Cards */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryRow}>
            {SUMMARY.map(s => (
              <View key={s.label} style={styles.summaryCard}>
                <Text style={{ fontSize: 24 }}>{s.emoji}</Text>
                <Text style={styles.summaryValue}>{s.count}</Text>
                <Text style={styles.summaryLabel}>{s.label}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {(['전체', '국내ETF', '해외ETF', '테마ETF'] as EtfTab[]).map(t => (
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
            <Text style={styles.countText}>{filtered.length}개 ETF</Text>
          </View>

          {/* ETF List */}
          <View style={styles.listCard}>
            {filtered.map((e, i) => {
              const eUp = e.change >= 0;
              const isExpanded = expandedTicker === e.ticker;
              return (
                <View key={e.ticker}>
                  <TouchableOpacity
                    style={[styles.etfRow, i < filtered.length - 1 && !isExpanded && styles.etfBorder]}
                    onPress={() => setExpandedTicker(isExpanded ? null : e.ticker)}
                    activeOpacity={0.7}
                  >
                    {/* Icon */}
                    <View style={[styles.etfIcon, { backgroundColor: eUp ? '#F0FFF4' : '#FFF5F5' }]}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: e.krw ? '#0066FF' : '#7C3AED' }}>
                        {e.krw ? 'KR' : 'US'}
                      </Text>
                    </View>

                    {/* Name + Desc */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.etfName}>{e.name}</Text>
                      <Text style={styles.etfDesc}>{e.desc} · {e.expense}</Text>
                    </View>

                    {/* Price + Change */}
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.etfPrice}>
                        {e.krw ? `₩${e.price.toLocaleString()}` : `$${e.price.toFixed(2)}`}
                      </Text>
                      <View style={[styles.changeBadge, { backgroundColor: eUp ? '#F0FFF4' : '#FFF5F5' }]}>
                        <Text style={[styles.changeText, { color: eUp ? '#22C55E' : '#EF4444' }]}>
                          {eUp ? '+' : ''}{e.change.toFixed(2)}%
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Expanded: 구성 종목 */}
                  {isExpanded && (
                    <View style={styles.holdingsBox}>
                      <Text style={styles.holdingsTitle}>📋 주요 구성 종목</Text>
                      {e.holdings.map((h, hi) => (
                        <View key={hi} style={styles.holdingRow}>
                          <Text style={styles.holdingRank}>{hi + 1}</Text>
                          <Text style={styles.holdingName}>{h}</Text>
                        </View>
                      ))}
                      <TouchableOpacity
                        style={styles.detailBtn}
                        onPress={() => navigation.navigate('종목상세D', { ticker: e.ticker })}
                      >
                        <Text style={styles.detailBtnText}>상세 보기 →</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Education */}
          <View style={styles.eduBox}>
            <Text style={styles.eduTitle}>📚 ETF 투자 팁</Text>

            <View style={styles.eduItem}>
              <Text style={styles.eduBullet}>1️⃣</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.eduItemTitle}>운용보수를 확인하세요</Text>
                <Text style={styles.eduItemText}>같은 지수를 추종해도 수수료(0.03%~0.75%)가 다릅니다. 장기 투자 시 큰 차이!</Text>
              </View>
            </View>

            <View style={styles.eduItem}>
              <Text style={styles.eduBullet}>2️⃣</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.eduItemTitle}>거래량이 많은 ETF를 선택하세요</Text>
                <Text style={styles.eduItemText}>거래량이 적으면 사고 팔기 어렵고, 시장가와 괴리가 발생할 수 있어요.</Text>
              </View>
            </View>

            <View style={styles.eduItem}>
              <Text style={styles.eduBullet}>3️⃣</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.eduItemTitle}>테마 ETF는 변동성이 커요</Text>
                <Text style={styles.eduItemText}>2차전지·AI 같은 테마 ETF는 수익률이 높지만 리스크도 큽니다.</Text>
              </View>
            </View>
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

  introCard: {
    margin: 16, backgroundColor: '#F0F7FF', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  introTitle: { fontSize: 17, fontWeight: '800', color: '#191919', marginBottom: 4 },
  introDesc: { fontSize: 13, color: '#8E8E93', marginBottom: 14, lineHeight: 18 },
  introItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  introBullet: { fontSize: 14 },
  introItemText: { fontSize: 14, fontWeight: '600', color: '#1E40AF' },

  summaryRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  summaryCard: {
    backgroundColor: '#F8F9FA', borderRadius: 14, padding: 14, width: 90,
    alignItems: 'center', gap: 4,
  },
  summaryValue: { fontSize: 16, fontWeight: '800', color: '#191919' },
  summaryLabel: { fontSize: 11, color: '#8E8E93' },

  tabRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 6 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F8F9FA' },
  tabBtnActive: { backgroundColor: '#0066FF' },
  tabText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '700' },

  countRow: { paddingHorizontal: 20, paddingBottom: 8 },
  countText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },

  listCard: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: '#F2F2F7',
  },
  etfRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14 },
  etfBorder: { borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  etfIcon: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  etfName: { fontSize: 15, fontWeight: '700', color: '#191919' },
  etfDesc: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  etfPrice: { fontSize: 15, fontWeight: '700', color: '#191919', fontFamily: 'Courier' },
  changeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 3 },
  changeText: { fontSize: 12, fontWeight: '700' },

  // 구성 종목 펼치기
  holdingsBox: {
    backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  holdingsTitle: { fontSize: 13, fontWeight: '700', color: '#191919', marginBottom: 8 },
  holdingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  holdingRank: { width: 20, fontSize: 12, fontWeight: '700', color: '#0066FF', textAlign: 'center' },
  holdingName: { fontSize: 13, color: '#4A4A4A' },
  detailBtn: {
    marginTop: 10, backgroundColor: '#0066FF', borderRadius: 8,
    paddingVertical: 8, alignItems: 'center',
  },
  detailBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  eduBox: {
    marginHorizontal: 16, marginTop: 24, backgroundColor: '#F8FAFC',
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0',
  },
  eduTitle: { fontSize: 17, fontWeight: '800', color: '#191919', marginBottom: 16 },
  eduItem: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  eduBullet: { fontSize: 16, marginTop: 1 },
  eduItemTitle: { fontSize: 14, fontWeight: '700', color: '#191919', marginBottom: 2 },
  eduItemText: { fontSize: 13, color: '#64748B', lineHeight: 18 },
});
