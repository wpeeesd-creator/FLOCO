import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import StockLogo from '../../components/StockLogo';
import { useWishlist } from '../../hooks/useWishlist';

// ── 섹터 ──────────────────────────────────

type Sector = '전체' | '반도체' | '바이오' | 'IT' | '자동차' | '금융';

interface KRStock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  sector: Sector;
  logo: string;
}

const KR_STOCKS: KRStock[] = [
  // 반도체
  { ticker: '005930', name: '삼성전자',         price: 75400,  change: +1.20, sector: '반도체', logo: '📱' },
  { ticker: '000660', name: 'SK하이닉스',       price: 198500, change: -0.80, sector: '반도체', logo: '🔬' },
  { ticker: '058470', name: 'SK리츠',           price: 42100,  change: +0.45, sector: '반도체', logo: '🏢' },
  { ticker: '042700', name: '한미반도체',        price: 128000, change: +2.30, sector: '반도체', logo: '⚙️' },
  // 바이오
  { ticker: '207940', name: '삼성바이오로직스',  price: 798000, change: -0.40, sector: '바이오', logo: '🧬' },
  { ticker: '068270', name: '셀트리온',          price: 178500, change: +0.90, sector: '바이오', logo: '💊' },
  { ticker: '326030', name: 'SK바이오팜',        price: 89400,  change: +1.50, sector: '바이오', logo: '🧪' },
  { ticker: '145020', name: '휴젤',              price: 182000, change: -0.30, sector: '바이오', logo: '💉' },
  // IT
  { ticker: '035420', name: 'NAVER',            price: 215000, change: -0.30, sector: 'IT',     logo: '🟩' },
  { ticker: '035720', name: '카카오',            price: 48200,  change: +2.10, sector: 'IT',     logo: '💬' },
  { ticker: '066570', name: 'LG전자',            price: 98400,  change: +0.72, sector: 'IT',     logo: '📺' },
  { ticker: '036570', name: '엔씨소프트',        price: 187000, change: -1.40, sector: 'IT',     logo: '🎮' },
  { ticker: '263750', name: '펄어비스',          price: 38900,  change: +0.52, sector: 'IT',     logo: '🕹️' },
  // 자동차
  { ticker: '005380', name: '현대자동차',        price: 245000, change: +0.50, sector: '자동차', logo: '🚗' },
  { ticker: '000270', name: '기아',              price: 118500, change: +0.70, sector: '자동차', logo: '🚙' },
  { ticker: '012330', name: '현대모비스',        price: 248000, change: +0.20, sector: '자동차', logo: '🔧' },
  { ticker: '373220', name: 'LG에너지솔루션',   price: 387000, change: -0.52, sector: '자동차', logo: '🔋' },
  { ticker: '006400', name: '삼성SDI',           price: 298000, change: +1.01, sector: '자동차', logo: '⚡' },
  // 금융
  { ticker: '105560', name: 'KB금융',            price: 78500,  change: +0.89, sector: '금융',   logo: '🏦' },
  { ticker: '086790', name: '하나금융지주',      price: 54200,  change: +0.56, sector: '금융',   logo: '🏛️' },
  { ticker: '032830', name: '삼성생명',          price: 82000,  change: +0.37, sector: '금융',   logo: '🛡️' },
  { ticker: '323410', name: '카카오뱅크',        price: 24150,  change: -1.10, sector: '금융',   logo: '🐝' },
  { ticker: '055550', name: '신한지주',          price: 45600,  change: +0.44, sector: '금융',   logo: '💰' },
  // 기타 대형주
  { ticker: '005490', name: 'POSCO홀딩스',       price: 312000, change: -0.64, sector: '반도체', logo: '🏗️' },
  { ticker: '051910', name: 'LG화학',            price: 312000, change: -0.32, sector: '바이오', logo: '🧪' },
  { ticker: '015760', name: '한국전력',          price: 22050,  change: +0.23, sector: '금융',   logo: '💡' },
  { ticker: '017670', name: 'SK텔레콤',          price: 52300,  change: +0.19, sector: 'IT',     logo: '📶' },
  { ticker: '030200', name: 'KT',               price: 37800,  change: +0.27, sector: 'IT',     logo: '📞' },
  { ticker: '028260', name: '삼성물산',          price: 118500, change: +0.42, sector: '금융',   logo: '🏢' },
  { ticker: '003550', name: 'LG',               price: 82000,  change: +0.61, sector: 'IT',     logo: '🔴' },
];

// ── 지수 ──────────────────────────────────

const INDICES = [
  { name: '코스피',  value: '2,595', change: '+0.3%', up: true,  emoji: '📈' },
  { name: '코스닥',  value: '852',   change: '-0.2%', up: false, emoji: '📊' },
  { name: '원/달러', value: '1,342', change: '-0.1%', up: false, emoji: '💱' },
];

// ── 컴포넌트 ──────────────────────────────

export default function KRStockScreen() {
  const navigation = useNavigation<any>();
  const [sector, setSector] = useState<Sector>('전체');
  const [refreshing, setRefreshing] = useState(false);
  const { toggleWishlist, isWishlisted } = useWishlist();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filtered = sector === '전체'
    ? KR_STOCKS
    : KR_STOCKS.filter(s => s.sector === sector);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🇰🇷 국내주식</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0066FF" />}
        >
          {/* Description */}
          <View style={styles.descBox}>
            <Text style={styles.descTitle}>국내 주식 시장</Text>
            <Text style={styles.descText}>
              대한민국 증권거래소에 상장된 삼성전자·SK하이닉스·카카오 등에 투자할 수 있습니다.
            </Text>
          </View>

          {/* Index Cards */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.indexRow}>
            {INDICES.map(idx => (
              <View key={idx.name} style={[styles.indexCard, { backgroundColor: idx.up ? '#F0FFF4' : '#FFF5F5' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 18 }}>{idx.emoji}</Text>
                  <Text style={styles.indexLabel}>{idx.name}</Text>
                </View>
                <Text style={styles.indexValue}>{idx.value}</Text>
                <Text style={[styles.indexChange, { color: idx.up ? '#22C55E' : '#EF4444' }]}>
                  {idx.change}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Sector Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectorRow}>
            {(['전체', '반도체', '바이오', 'IT', '자동차', '금융'] as Sector[]).map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.sectorBtn, sector === s && styles.sectorBtnActive]}
                onPress={() => setSector(s)}
              >
                <Text style={[styles.sectorText, sector === s && styles.sectorTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Count */}
          <View style={styles.countRow}>
            <Text style={styles.countText}>{filtered.length}개 종목</Text>
          </View>

          {/* Stock List */}
          <View style={styles.listCard}>
            {filtered.map((s, i) => {
              const sUp = s.change >= 0;
              const isFav = isWishlisted(s.ticker);
              return (
                <TouchableOpacity
                  key={s.ticker}
                  style={[styles.stockRow, i < filtered.length - 1 && styles.stockBorder]}
                  onPress={() => navigation.navigate('종목상세D', { ticker: s.ticker })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.logoCircle, { backgroundColor: sUp ? '#F0FFF4' : '#FFF5F5' }]}>
                    <Text style={{ fontSize: 20 }}>{s.logo}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.stockName}>{s.name}</Text>
                    <Text style={styles.stockTicker}>{s.ticker} · {s.sector}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                    <Text style={styles.stockPrice}>₩{s.price.toLocaleString()}</Text>
                    <View style={[styles.changeBadge, { backgroundColor: sUp ? '#F0FFF4' : '#FFF5F5' }]}>
                      <Text style={[styles.changeText, { color: sUp ? '#22C55E' : '#EF4444' }]}>
                        {sUp ? '+' : ''}{s.change.toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => toggleWishlist(s.ticker)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={{ fontSize: 20, color: isFav ? '#FF3B30' : '#D1D1D6' }}>
                      {isFav ? '♥' : '♡'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Education Section */}
          <View style={styles.eduBox}>
            <Text style={styles.eduTitle}>💡 국내주식이란?</Text>
            <Text style={styles.eduDesc}>한국거래소(KRX)에 상장된 주식으로, 코스피와 코스닥 시장에서 거래됩니다.</Text>

            <View style={styles.eduItem}>
              <Text style={styles.eduBullet}>📌</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.eduItemTitle}>오전 9시 ~ 오후 3시 30분 거래</Text>
                <Text style={styles.eduItemText}>정규장 기준이며, 시간외 거래(08:30~09:00, 15:30~16:00)도 가능합니다.</Text>
              </View>
            </View>

            <View style={styles.eduItem}>
              <Text style={styles.eduBullet}>📌</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.eduItemTitle}>1주 단위로 거래해요</Text>
                <Text style={styles.eduItemText}>해외주식과 달리 소수점 거래는 불가능하며, 최소 1주부터 매매할 수 있습니다.</Text>
              </View>
            </View>

            <View style={styles.eduItem}>
              <Text style={styles.eduBullet}>📌</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.eduItemTitle}>코스피/코스닥으로 나뉘어요</Text>
                <Text style={styles.eduItemText}>코스피는 대형주 중심, 코스닥은 중소형·기술주 중심 시장입니다.</Text>
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

  descBox: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  descTitle: { fontSize: 22, fontWeight: '800', color: '#191919', marginBottom: 6 },
  descText: { fontSize: 14, color: '#8E8E93', lineHeight: 20 },

  indexRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  indexCard: { borderRadius: 14, padding: 16, width: 150, gap: 6 },
  indexLabel: { fontSize: 13, fontWeight: '600', color: '#191919' },
  indexValue: { fontSize: 22, fontWeight: '800', color: '#191919', fontFamily: 'Courier' },
  indexChange: { fontSize: 14, fontWeight: '700' },

  sectorRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 6 },
  sectorBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F8F9FA' },
  sectorBtnActive: { backgroundColor: '#0066FF' },
  sectorText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
  sectorTextActive: { color: '#FFFFFF', fontWeight: '700' },

  countRow: { paddingHorizontal: 20, paddingBottom: 8 },
  countText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },

  listCard: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: '#F2F2F7',
  },
  stockRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14 },
  stockBorder: { borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  logoCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  stockName: { fontSize: 15, fontWeight: '700', color: '#191919' },
  stockTicker: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  stockPrice: { fontSize: 15, fontWeight: '700', color: '#191919', fontFamily: 'Courier' },
  changeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 3 },
  changeText: { fontSize: 12, fontWeight: '700' },

  eduBox: {
    marginHorizontal: 16, marginTop: 24, backgroundColor: '#F8FAFC',
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0',
  },
  eduTitle: { fontSize: 17, fontWeight: '800', color: '#191919', marginBottom: 4 },
  eduDesc: { fontSize: 13, color: '#8E8E93', marginBottom: 16, lineHeight: 18 },
  eduItem: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  eduBullet: { fontSize: 16, marginTop: 1 },
  eduItemTitle: { fontSize: 14, fontWeight: '700', color: '#191919', marginBottom: 2 },
  eduItemText: { fontSize: 13, color: '#64748B', lineHeight: 18 },
});
