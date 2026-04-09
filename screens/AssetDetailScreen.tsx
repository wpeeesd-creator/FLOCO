/**
 * 자산 상세 화면 — 토스증권 디자인 시스템
 * 총 자산 현황, 자산 구성 바, 시장별 평가금, 보유 종목
 */

import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore, STOCKS } from '../store/appStore';
import { Colors } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import StockLogo from '../components/StockLogo';

export default function AssetDetailScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const { holdings, cash, getTotalValue, getReturnRate } = useAppStore();

  // ── 데이터 계산 ──────────────────────────────
  const totalValue = getTotalValue?.() ?? 1_000_000;
  const balance = cash ?? 1_000_000;
  const returnRate = getReturnRate?.() ?? 0;
  const profit = totalValue - 1_000_000;
  const isUp = profit >= 0;
  const portfolioValue = totalValue - balance;

  const cashPercent = totalValue > 0
    ? ((balance / totalValue) * 100).toFixed(1)
    : '100.0';
  const investPercent = totalValue > 0
    ? ((portfolioValue / totalValue) * 100).toFixed(1)
    : '0.0';

  // 보유 종목 데이터
  const safeHoldings = holdings ?? [];
  const holdingsData = safeHoldings.map(h => {
    const stock = STOCKS.find(s => s.ticker === h.ticker);
    if (!stock) return null;
    const evalAmt = (stock.price ?? 0) * (h.qty ?? 0);
    const pnlRate = (h.avgPrice ?? 0) > 0
      ? (((stock.price ?? 0) - (h.avgPrice ?? 0)) / (h.avgPrice ?? 0)) * 100
      : 0;
    return { ...h, stock, evalAmt, pnlRate };
  }).filter(Boolean).sort((a: any, b: any) => b.evalAmt - a.evalAmt);

  // 시장별 분류
  const krHoldings = holdingsData.filter((h: any) => h.stock.market === '한국');
  const usHoldings = holdingsData.filter((h: any) => h.stock.market === '미국');
  const krEval = krHoldings.reduce((sum: number, h: any) => sum + h.evalAmt, 0);
  const usEval = usHoldings.reduce((sum: number, h: any) => sum + h.evalAmt, 0);

  const totalEval = krEval + usEval;
  const krPct = totalEval > 0 ? ((krEval / totalEval) * 100).toFixed(1) : '0.0';
  const usPct = totalEval > 0 ? ((usEval / totalEval) * 100).toFixed(1) : '0.0';

  // 자산 구성 바 비율
  const cashRatio = totalValue > 0 ? balance / totalValue : 1;
  const investRatio = totalValue > 0 ? portfolioValue / totalValue : 0;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>

      {/* ── 헤더 ────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>자산 상세</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* ── 총 자산 카드 ─────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>총 자산</Text>
          <Text style={styles.totalValue}>
            ₩{Math.round(totalValue).toLocaleString()}
          </Text>
          <View style={styles.profitRow}>
            <Text style={[styles.profitAmt, { color: isUp ? Colors.green : Colors.red }]}>
              {isUp ? '+' : ''}₩{Math.round(profit).toLocaleString()}
            </Text>
            <View style={[
              styles.rateBadge,
              { backgroundColor: isUp ? Colors.greenBg : Colors.redBg },
            ]}>
              <Text style={[styles.rateText, { color: isUp ? Colors.green : Colors.red }]}>
                {isUp ? '▲' : '▼'} {Math.abs(returnRate).toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>

        {/* ── 자산 구성 바 ─────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>자산 구성</Text>

          {/* 바 */}
          <View style={styles.compositionBar}>
            <View style={[styles.barSegmentCash, { flex: cashRatio }]} />
            <View style={[styles.barSegmentInvest, { flex: investRatio }]} />
          </View>

          {/* 범례 */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendLabel}>현금</Text>
              <Text style={styles.legendValue}>
                ₩{Math.round(balance).toLocaleString()}
              </Text>
              <Text style={styles.legendPct}>({cashPercent}%)</Text>
            </View>
            <View style={styles.legendDivider} />
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
              <Text style={styles.legendLabel}>투자</Text>
              <Text style={styles.legendValue}>
                ₩{Math.round(portfolioValue).toLocaleString()}
              </Text>
              <Text style={styles.legendPct}>({investPercent}%)</Text>
            </View>
          </View>
        </View>

        {/* ── 시장별 평가금 ─────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>시장별 평가금</Text>

          <View style={[styles.marketRow, styles.marketRowBorder]}>
            <Text style={styles.marketFlag}>🇰🇷</Text>
            <Text style={styles.marketName}>국내</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.marketAmt}>
              ₩{Math.round(krEval).toLocaleString()}
            </Text>
            <Text style={styles.marketPct}>{krPct}%</Text>
          </View>

          <View style={styles.marketRow}>
            <Text style={styles.marketFlag}>🇺🇸</Text>
            <Text style={styles.marketName}>미국</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.marketAmt}>
              ${usEval.toFixed(2)}
            </Text>
            <Text style={styles.marketPct}>{usPct}%</Text>
          </View>
        </View>

        {/* ── 보유 종목 ─────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>보유 종목 {holdingsData.length}개</Text>

          {holdingsData.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>보유 종목이 없어요</Text>
              <Text style={styles.emptyDesc}>투자를 시작해보세요!</Text>
            </View>
          ) : (
            holdingsData.map((h: any, idx: number) => {
              const isPnlUp = h.pnlRate >= 0;
              return (
                <View
                  key={h.ticker}
                  style={[
                    styles.holdingRow,
                    idx < holdingsData.length - 1 && styles.holdingRowBorder,
                  ]}
                >
                  <StockLogo ticker={h.ticker} size={40} />
                  <View style={styles.holdingInfo}>
                    <Text style={styles.holdingName} numberOfLines={1}>
                      {h.stock.name}
                    </Text>
                    <Text style={styles.holdingQty}>{h.qty}주</Text>
                  </View>
                  <View style={styles.holdingRight}>
                    <Text style={styles.holdingEval}>
                      {h.stock.krw
                        ? `₩${Math.round(h.evalAmt).toLocaleString()}`
                        : `$${h.evalAmt.toFixed(2)}`}
                    </Text>
                    <Text style={[
                      styles.holdingPnl,
                      { color: isPnlUp ? Colors.green : Colors.red },
                    ]}>
                      {isPnlUp ? '+' : ''}{h.pnlRate.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── 액션 버튼 ─────────────────────────── */}
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => navigation.navigate('거래내역')}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnPrimaryText, { color: theme.bgCard }]}>거래내역 보기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnOutline}
          onPress={() => navigation.getParent()?.navigate('투자Tab')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnOutlineText}>투자하러 가기</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // ── 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  headerPlaceholder: {
    width: 36,
  },

  // ── 스크롤
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 12,
  },

  // ── 카드 공통
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
  },

  // ── 총 자산 카드
  cardLabel: {
    fontSize: 13,
    color: Colors.textSub,
    marginBottom: 6,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Courier',
    color: Colors.text,
    marginBottom: 10,
  },
  profitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profitAmt: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Courier',
  },
  rateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rateText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // ── 자산 구성 바
  compositionBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 14,
  },
  barSegmentCash: {
    height: 12,
    backgroundColor: Colors.primary,
  },
  barSegmentInvest: {
    height: 12,
    backgroundColor: '#FF9500',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  legendItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 13,
    color: Colors.textSub,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'Courier',
  },
  legendPct: {
    fontSize: 12,
    color: Colors.textSub,
  },
  legendDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },

  // ── 시장별
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    gap: 8,
  },
  marketRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  marketFlag: {
    fontSize: 20,
  },
  marketName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    width: 36,
  },
  marketAmt: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Courier',
    textAlign: 'right',
  },
  marketPct: {
    fontSize: 12,
    color: Colors.textSub,
    width: 44,
    textAlign: 'right',
  },

  // ── 보유 종목
  holdingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  holdingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  holdingInfo: {
    flex: 1,
    gap: 3,
  },
  holdingName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  holdingQty: {
    fontSize: 12,
    color: Colors.textSub,
  },
  holdingRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  holdingEval: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Courier',
  },
  holdingPnl: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── 빈 상태
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.textSub,
  },

  // ── 버튼
  btnPrimary: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
  },
  btnOutline: {
    height: 52,
    backgroundColor: Colors.card,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  btnOutlineText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
});
