import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import StockLogo from '../../components/StockLogo';
import { useWishlist } from '../../hooks/useWishlist';
import { useTheme } from '../../context/ThemeContext';
import { STOCKS } from '../../store/appStore';

// ── 섹터 ──────────────────────────────────

const SECTOR_TABS = ['전체', '기술', '반도체', '금융', '헬스케어', '에너지', '소비재', '산업재', '부동산', '유틸리티'] as const;
type Sector = (typeof SECTOR_TABS)[number];

const US_STOCKS = STOCKS.filter(s => s.market === '미국');

// ── 지수 ──────────────────────────────────

const INDICES = [
  { name: '나스닥',   value: '21,849', change: '-0.4%', up: false, emoji: '📊' },
  { name: 'S&P 500', value: '5,218',  change: '+0.2%', up: true,  emoji: '📈' },
  { name: '다우존스', value: '39,127', change: '-0.1%', up: false, emoji: '🏛️' },
];

// ── 컴포넌트 ──────────────────────────────

export default function USStockScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const [sector, setSector] = useState<Sector>('전체');
  const [refreshing, setRefreshing] = useState(false);
  const { toggleWishlist, isWishlisted } = useWishlist();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filtered = useMemo(() =>
    sector === '전체'
      ? US_STOCKS
      : US_STOCKS.filter(s => s.sector === sector),
    [sector],
  );

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bgCard },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
    },
    backBtn: { padding: 4 },
    backText: { fontSize: 22, color: theme.primary, fontWeight: '600' },
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
    sectorBtnActive: { backgroundColor: theme.primary },
    sectorText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
    sectorTextActive: { color: theme.bgCard, fontWeight: '700' },
    countRow: { paddingHorizontal: 20, paddingBottom: 8 },
    countText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
    listCard: {
      marginHorizontal: 16, backgroundColor: theme.bgCard, borderRadius: 16,
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgCard }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🇺🇸 해외주식</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        >
          {/* Description */}
          <View style={styles.descBox}>
            <Text style={styles.descTitle}>미국 주식 시장</Text>
            <Text style={styles.descText}>
              세계 최대 주식 시장으로, 애플·엔비디아·테슬라 등 글로벌 기업에 투자할 수 있습니다.
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
            {SECTOR_TABS.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.sectorBtn, sector === s && styles.sectorBtnActive]}
                onPress={() => setSector(s)}
              >
                <Text style={[styles.sectorText, sector === s && styles.sectorTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Stock Count */}
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
                  {/* Logo */}
                  <View style={[styles.logoCircle, { backgroundColor: sUp ? '#F0FFF4' : '#FFF5F5' }]}>
                    <Text style={{ fontSize: 20 }}>{s.logo}</Text>
                  </View>

                  {/* Name + Ticker */}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.stockName}>{s.name}</Text>
                    <Text style={styles.stockTicker}>{s.ticker} · {s.sector}</Text>
                  </View>

                  {/* Price + Change */}
                  <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                    <Text style={styles.stockPrice}>${s.price.toFixed(2)}</Text>
                    <View style={[styles.changeBadge, { backgroundColor: sUp ? '#F0FFF4' : '#FFF5F5' }]}>
                      <Text style={[styles.changeText, { color: sUp ? '#22C55E' : '#EF4444' }]}>
                        {sUp ? '+' : ''}{s.change.toFixed(2)}%
                      </Text>
                    </View>
                  </View>

                  {/* Favorite */}
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
            <Text style={styles.eduTitle}>💡 해외주식이란?</Text>
            <Text style={styles.eduDesc}>미국 시장에 상장된 글로벌 기업에 직접 투자하는 것입니다.</Text>

            <View style={styles.eduItem}>
              <Text style={styles.eduBullet}>📌</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.eduItemTitle}>환율이 수익에 영향을 줘요</Text>
                <Text style={styles.eduItemText}>달러로 거래되므로 원/달러 환율 변동이 수익률에 반영됩니다.</Text>
              </View>
            </View>

            <View style={styles.eduItem}>
              <Text style={styles.eduBullet}>📌</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.eduItemTitle}>미국 시장은 한국 밤에 열려요</Text>
                <Text style={styles.eduItemText}>정규장: 한국시간 23:30~06:00 (서머타임 22:30~05:00)</Text>
              </View>
            </View>

            <View style={styles.eduItem}>
              <Text style={styles.eduBullet}>📌</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.eduItemTitle}>소수점 투자도 가능해요</Text>
                <Text style={styles.eduItemText}>1주가 비싸도 0.01주 단위로 소액 투자가 가능합니다.</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

