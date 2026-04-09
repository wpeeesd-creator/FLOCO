/**
 * 지표/변동표 화면 — 주요 시장 지표
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Card } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

interface IndexData {
  name: string;
  symbol: string;
  value: number;
  change: number;
  unit: string;
}

// 샘플 시장 지표 데이터 (실제 서비스 시 API 연동)
const MARKET_INDICES: IndexData[] = [
  { name: '코스피', symbol: 'KOSPI', value: 2634.70, change: +0.42, unit: '' },
  { name: '코스닥', symbol: 'KOSDAQ', value: 868.43, change: -0.31, unit: '' },
  { name: '나스닥', symbol: 'NASDAQ', value: 17932.15, change: +1.24, unit: '' },
  { name: 'S&P 500', symbol: 'SPX', value: 5648.40, change: +0.87, unit: '' },
  { name: '다우존스', symbol: 'DJIA', value: 42587.50, change: +0.53, unit: '' },
  { name: '원/달러', symbol: 'USD/KRW', value: 1342.50, change: -0.18, unit: '₩' },
  { name: '달러인덱스', symbol: 'DXY', value: 104.32, change: +0.12, unit: '' },
  { name: '금', symbol: 'GOLD', value: 2654.80, change: +0.34, unit: '$' },
  { name: '유가 (WTI)', symbol: 'WTI', value: 78.42, change: -1.23, unit: '$' },
  { name: '비트코인', symbol: 'BTC', value: 65420, change: +2.14, unit: '$' },
];

const SECTOR_DATA = [
  { name: '반도체', change: +2.31, emoji: '🔬' },
  { name: '2차전지', change: -1.45, emoji: '🔋' },
  { name: '바이오', change: +0.87, emoji: '💊' },
  { name: '금융', change: +0.42, emoji: '🏦' },
  { name: '자동차', change: +1.12, emoji: '🚗' },
  { name: '에너지', change: -0.63, emoji: '⚡' },
  { name: '소비재', change: +0.28, emoji: '🛍️' },
  { name: 'IT', change: +1.74, emoji: '💻' },
];

type FilterTab = '전체' | '국내' | '해외' | '원자재';

export default function MarketScreen() {
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<FilterTab>('전체');
  const [updatedAt] = useState(new Date());

  const filteredIndices = MARKET_INDICES.filter(idx => {
    if (activeTab === '전체') return true;
    if (activeTab === '국내') return ['KOSPI', 'KOSDAQ', 'USD/KRW'].includes(idx.symbol);
    if (activeTab === '해외') return ['NASDAQ', 'SPX', 'DJIA', 'DXY'].includes(idx.symbol);
    if (activeTab === '원자재') return ['GOLD', 'WTI', 'BTC'].includes(idx.symbol);
    return true;
  });

  function fmtValue(idx: IndexData) {
    if (idx.unit === '₩') return `₩${idx.value.toLocaleString()}`;
    if (idx.unit === '$') return `$${idx.value.toLocaleString()}`;
    return idx.value.toLocaleString();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgCard }}>
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: theme.bgCard }]}>
        <View>
          <Text style={[Typography.h2]}>지표/변동표</Text>
          <Text style={[Typography.caption, { marginTop: 2 }]}>
            기준: {updatedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      {/* 필터 탭 */}
      <View style={[styles.filterRow, { backgroundColor: theme.bgCard }]}>
        {(['전체', '국내', '해외', '원자재'] as FilterTab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.filterBtn, activeTab === t && styles.filterBtnActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.filterText, activeTab === t && styles.filterTextActive, activeTab === t && { color: theme.bgCard }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* 주요 지수 */}
        <Text style={styles.sectionTitle}>주요 지수</Text>
        <Card style={styles.card}>
          {filteredIndices.map((idx, i) => (
            <View
              key={idx.symbol}
              style={[styles.row, i < filteredIndices.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.idxName}>{idx.name}</Text>
                <Text style={styles.idxSymbol}>{idx.symbol}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.idxValue}>{fmtValue(idx)}</Text>
                <Text style={[styles.idxChange, { color: idx.change >= 0 ? Colors.green : Colors.red }]}>
                  {idx.change >= 0 ? '▲' : '▼'} {Math.abs(idx.change).toFixed(2)}%
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* 섹터별 등락 */}
        <Text style={styles.sectionTitle}>섹터별 등락</Text>
        <View style={styles.sectorGrid}>
          {SECTOR_DATA.map(s => (
            <View
              key={s.name}
              style={[styles.sectorCard, { borderLeftColor: s.change >= 0 ? Colors.green : Colors.red, backgroundColor: theme.bgCard }]}
            >
              <Text style={styles.sectorEmoji}>{s.emoji}</Text>
              <Text style={styles.sectorName}>{s.name}</Text>
              <Text style={[styles.sectorChange, { color: s.change >= 0 ? Colors.green : Colors.red }]}>
                {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
              </Text>
            </View>
          ))}
        </View>

        {/* 공포탐욕 지수 */}
        <Text style={styles.sectionTitle}>시장 심리</Text>
        <Card style={styles.card}>
          <View style={styles.fearGreedRow}>
            <Text style={{ fontSize: 36 }}>😐</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.fearGreedLabel}>공포·탐욕 지수</Text>
              <Text style={styles.fearGreedValue}>52 — 중립</Text>
              <View style={styles.fearBg}>
                <View style={[styles.fearFill, { width: '52%' as any }]} />
              </View>
            </View>
          </View>
          <Text style={[Typography.caption, { marginTop: 8, textAlign: 'center' }]}>
            0 = 극도의 공포 · 100 = 극도의 탐욕
          </Text>
        </Card>
      </ScrollView>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, color: Colors.textSub },
  filterTextActive: { fontWeight: '700' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSub, marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  card: { marginHorizontal: 16, padding: 0 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  idxName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  idxSymbol: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  idxValue: { fontSize: 15, fontWeight: '700', fontFamily: 'Courier', color: Colors.text },
  idxChange: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  sectorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: 16 },
  sectorCard: {
    width: '46%', borderRadius: 12, padding: 12,
    borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectorEmoji: { fontSize: 22, marginBottom: 4 },
  sectorName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  sectorChange: { fontSize: 14, fontWeight: '800', marginTop: 4 },
  fearGreedRow: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 4 },
  fearGreedLabel: { fontSize: 13, color: Colors.textSub },
  fearGreedValue: { fontSize: 18, fontWeight: '800', color: Colors.text, marginVertical: 4 },
  fearBg: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  fearFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
});
