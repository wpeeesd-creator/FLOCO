/**
 * 관리자 — 거래 종목 TOP 10 화면
 * 청소년이 실제로 거래하는 종목 분석 (거래수/거래대금/거래자수, 시장별 비중)
 * 토스 톤 라이트 디자인 (DS 토큰 — AdminDashboardScreen과 동일)
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Clipboard,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  TrendingUp,
  BarChart3,
  ClipboardList,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { fetchAllUsersForAdmin } from '../../lib/adminService';
import { STOCKS } from '../../store/appStore';

// 환율 고정 (관리자 통계용 근사치 — 환율 API 호출 없음)
const USD_TO_KRW = 1300;

type Market = 'KR' | 'US' | 'CRYPTO' | 'unknown';
type SortKey = 'trades' | 'volume' | 'traders';
type MarketFilter = 'all' | Market;

interface StockStat {
  ticker: string;
  name: string;
  market: Market;
  totalTrades: number;
  totalBuys: number;
  totalSells: number;
  totalVolumeKRW: number;
  uniqueTraders: number;
}

const MARKET_LABELS: Record<Market, string> = {
  KR: '국내',
  US: '미국',
  CRYPTO: '코인',
  unknown: '기타',
};

// 시장 감지 — STOCKS 메타데이터가 1차 소스 (코인 티커가 'BTC' 같은 영문이라
// 정규식만으로는 미국 주식과 구분 불가). 메타 없을 때만 정규식 fallback.
export function detectMarket(ticker: string): Market {
  const meta = STOCKS.find(s => s.ticker === ticker);
  if (meta) {
    if (meta.type === 'crypto' || meta.market === '암호화폐') return 'CRYPTO';
    if (meta.market === '한국') return 'KR';
    if (meta.market === '미국') return 'US';
  }
  if (/^\d{6}$/.test(ticker)) return 'KR';
  if (ticker.includes('KRW-') || ticker.includes('USDT')) return 'CRYPTO';
  if (/^[A-Z]{1,5}$/.test(ticker)) return 'US';
  return 'unknown';
}

// ── 종목별 집계 ───────────────────────────────
export function computeTopStocks(users: any[]): StockStat[] {
  const stockStats: Record<string, Omit<StockStat, 'uniqueTraders'> & { uniqueTraders: Set<string> }> = {};

  for (const user of users) {
    if (user.role === 'admin') continue;

    const txs: any[] = user.transactions ?? [];
    for (const tx of txs) {
      const ticker: string = tx.ticker ?? tx.symbol ?? 'unknown';
      const name: string = tx.stockName ?? tx.name ?? ticker;

      if (!stockStats[ticker]) {
        stockStats[ticker] = {
          ticker,
          name,
          market: detectMarket(ticker),
          totalTrades: 0,
          totalBuys: 0,
          totalSells: 0,
          totalVolumeKRW: 0,
          uniqueTraders: new Set<string>(),
        };
      }

      const s = stockStats[ticker];
      s.totalTrades += 1;
      if (tx.type === 'buy') s.totalBuys += 1;
      else if (tx.type === 'sell') s.totalSells += 1;

      // 거래대금 (원화 환산) — tx에 currency 필드가 없으므로 STOCKS.krw로 통화 판정
      const amount = (tx.quantity ?? tx.qty ?? 0) * (tx.price ?? 0);
      const meta = STOCKS.find(st => st.ticker === ticker);
      const isUSD = meta ? meta.krw === false : false;
      s.totalVolumeKRW += isUSD ? amount * USD_TO_KRW : amount;

      s.uniqueTraders.add(user.uid ?? user.id ?? 'unknown');
    }
  }

  return Object.values(stockStats).map(s => ({
    ...s,
    uniqueTraders: s.uniqueTraders.size,
  }));
}

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'trades', label: '거래 많은 순' },
  { id: 'volume', label: '거래대금 순' },
  { id: 'traders', label: '거래자 많은 순' },
];

const MARKET_OPTIONS: { id: MarketFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'KR', label: '국내' },
  { id: 'US', label: '미국' },
  { id: 'CRYPTO', label: '코인' },
];

export default function AdminTopStocksScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  // 디자인 토큰 — AdminDashboardScreen과 동일 (PPT 캡처용 고정 라이트 톤)
  const DS = {
    bg: '#F9FAFB',
    cardBg: '#FFFFFF',
    text: '#1F2937',
    textSub: '#6B7280',
    textMuted: '#9CA3AF',
    primary: theme.primary ?? '#0066FF',
    border: '#F3F4F6',
    positive: '#22C55E',
    negative: '#EF4444',
  };

  const MARKET_COLORS: Record<Market, string> = {
    KR: DS.primary,
    US: '#F59E0B',
    CRYPTO: '#8B5CF6',
    unknown: DS.textMuted,
  };

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('trades');
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('all');

  const loadData = async () => {
    try {
      const all = await fetchAllUsersForAdmin();
      setUsers(all.filter((u: any) => u.role !== 'admin'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const allStocks = useMemo(() => computeTopStocks(users), [users]);

  const filteredStocks = useMemo(
    () => (marketFilter === 'all' ? allStocks : allStocks.filter(s => s.market === marketFilter)),
    [allStocks, marketFilter],
  );

  const sortedTop10 = useMemo(() => {
    const sorted = [...filteredStocks].sort((a, b) => {
      if (sortBy === 'trades') return b.totalTrades - a.totalTrades;
      if (sortBy === 'volume') return b.totalVolumeKRW - a.totalVolumeKRW;
      return b.uniqueTraders - a.uniqueTraders;
    });
    return sorted.slice(0, 10);
  }, [filteredStocks, sortBy]);

  // 시장별 거래 비중 (필터와 무관하게 전체 기준)
  const marketBreakdown = useMemo(() => {
    const totals: Record<Market, number> = { KR: 0, US: 0, CRYPTO: 0, unknown: 0 };
    allStocks.forEach(s => { totals[s.market] += s.totalTrades; });
    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
    return (Object.keys(totals) as Market[])
      .filter(m => totals[m] > 0)
      .map(m => ({
        market: m,
        label: MARKET_LABELS[m],
        color: MARKET_COLORS[m],
        tradeCount: totals[m],
        percent: (totals[m] / grandTotal) * 100,
      }))
      .sort((a, b) => b.tradeCount - a.tradeCount);
  }, [allStocks]);

  const totalTradeCount = useMemo(
    () => allStocks.reduce((sum, s) => sum + s.totalTrades, 0),
    [allStocks],
  );

  const sortByLabel = SORT_OPTIONS.find(o => o.id === sortBy)?.label ?? '';

  // ── 사업계획서용 복사 ──
  const copyToClipboard = () => {
    const copyText = `[FLOCO 거래 종목 TOP 10 - ${sortByLabel}]

${sortedTop10.map((s, i) =>
  `${i + 1}. ${s.name} (${s.ticker}) - ${MARKET_LABELS[s.market]}
   거래 ${s.totalTrades}건 (매수 ${s.totalBuys} · 매도 ${s.totalSells})
   거래대금 ${(s.totalVolumeKRW / 10000).toFixed(0)}만원
   거래자 ${s.uniqueTraders}명`,
).join('\n')}

[시장별 거래 비중]
${marketBreakdown.map(m => `${m.label}: ${m.tradeCount}건 (${m.percent.toFixed(1)}%)`).join('\n')}

기준일: ${new Date().toLocaleDateString('ko-KR')}
총 사용자: ${users.length}명 / 총 거래: ${totalTradeCount}건
(미국 종목 원화 환산: 1달러 = ${USD_TO_KRW.toLocaleString()}원 고정)`;
    Clipboard.setString(copyText);
    Alert.alert('복사 완료', '사업계획서용 텍스트가 복사됐어요.');
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: DS.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: DS.cardBg,
      borderBottomWidth: 1,
      borderBottomColor: DS.border,
    },
    backBtn: { width: 36, alignItems: 'flex-start' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: DS.text, flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 100 }, // 탭바 가림 방지
    sortRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
    chip: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: DS.cardBg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: DS.border,
    },
    chipActive: { backgroundColor: DS.primary, borderColor: DS.primary },
    chipText: { fontSize: 12, color: DS.textSub, fontWeight: '600' },
    chipTextActive: { color: '#fff', fontWeight: '700' },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 16,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: DS.text },
    stockCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: DS.cardBg,
      borderRadius: 14,
      padding: 14,
      marginBottom: 8,
      gap: 12,
    },
    rankCol: { width: 28, alignItems: 'center' },
    rank: { fontSize: 16, fontWeight: '800', color: DS.textSub },
    rankTop: { color: DS.primary },
    infoCol: { flex: 1, minWidth: 0 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    stockName: { fontSize: 14, fontWeight: '700', color: DS.text, flexShrink: 1 },
    marketBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    marketBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    ticker: { fontSize: 11, color: DS.textMuted, marginTop: 2 },
    statsCol: { alignItems: 'flex-end' },
    mainStat: { fontSize: 14, fontWeight: '800', color: DS.text },
    subStat: { fontSize: 11, color: DS.textSub, marginTop: 2 },
    marketCard: {
      backgroundColor: DS.cardBg,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    marketRow: { marginBottom: 12 },
    marketLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    marketLabel: { fontSize: 13, fontWeight: '600', color: DS.text },
    marketValue: { fontSize: 12, color: DS.textSub, fontWeight: '600' },
    barBg: { height: 10, backgroundColor: DS.border, borderRadius: 5, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 5, minWidth: 3 },
    copyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: DS.primary,
      borderRadius: 14,
      paddingVertical: 16,
      marginTop: 4,
    },
    copyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyCard: {
      backgroundColor: DS.cardBg,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
    },
    emptyText: { fontSize: 14, color: DS.textSub },
  });

  const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <View style={styles.sectionHeader}>
      <Icon size={18} color={DS.text} strokeWidth={2} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DS.primary} />
          <Text style={{ marginTop: 12, color: DS.textSub }}>거래 종목 분석 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={24} color={DS.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={styles.headerTitle}>거래 종목 TOP</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* 정렬 칩 */}
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.id}
              onPress={() => setSortBy(opt.id)}
              style={[styles.chip, sortBy === opt.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, sortBy === opt.id && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 시장별 필터 */}
        <View style={styles.sortRow}>
          {MARKET_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.id}
              onPress={() => setMarketFilter(opt.id)}
              style={[styles.chip, marketFilter === opt.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, marketFilter === opt.id && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TOP 10 리스트 */}
        <SectionHeader icon={TrendingUp} title={`TOP 10 (${sortByLabel})`} />

        {sortedTop10.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>해당 조건의 거래가 없어요</Text>
          </View>
        ) : (
          sortedTop10.map((stock, idx) => (
            <View key={stock.ticker} style={styles.stockCard}>
              <View style={styles.rankCol}>
                <Text style={[styles.rank, idx < 3 && styles.rankTop]}>{idx + 1}</Text>
              </View>
              <View style={styles.infoCol}>
                <View style={styles.nameRow}>
                  <Text style={styles.stockName} numberOfLines={1}>{stock.name}</Text>
                  <View style={[styles.marketBadge, { backgroundColor: MARKET_COLORS[stock.market] }]}>
                    <Text style={styles.marketBadgeText}>{MARKET_LABELS[stock.market]}</Text>
                  </View>
                </View>
                <Text style={styles.ticker}>{stock.ticker}</Text>
              </View>
              <View style={styles.statsCol}>
                <Text style={styles.mainStat}>
                  {sortBy === 'trades'
                    ? `${stock.totalTrades}건`
                    : sortBy === 'volume'
                      ? `${(stock.totalVolumeKRW / 10000).toFixed(0)}만원`
                      : `${stock.uniqueTraders}명`}
                </Text>
                <Text style={styles.subStat}>
                  매수 {stock.totalBuys} · 매도 {stock.totalSells}
                </Text>
              </View>
            </View>
          ))
        )}

        {/* 시장별 거래 비중 */}
        <SectionHeader icon={BarChart3} title="시장별 거래 비중" />
        <View style={styles.marketCard}>
          {marketBreakdown.length === 0 ? (
            <Text style={styles.emptyText}>거래 데이터가 없어요</Text>
          ) : (
            marketBreakdown.map(m => (
              <View key={m.market} style={styles.marketRow}>
                <View style={styles.marketLabelRow}>
                  <Text style={styles.marketLabel}>{m.label}</Text>
                  <Text style={styles.marketValue}>
                    {m.tradeCount.toLocaleString()}건 ({m.percent.toFixed(1)}%)
                  </Text>
                </View>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${m.percent}%`, backgroundColor: m.color }]} />
                </View>
              </View>
            ))
          )}
        </View>

        {/* 복사 버튼 */}
        <TouchableOpacity onPress={copyToClipboard} style={styles.copyBtn} activeOpacity={0.85}>
          <ClipboardList size={16} color="#fff" />
          <Text style={styles.copyBtnText}>사업계획서용 복사</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
