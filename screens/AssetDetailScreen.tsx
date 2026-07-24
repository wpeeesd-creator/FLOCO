/**
 * 자산 상세 화면 — 토스증권 디자인 시스템
 * 총 자산 현황, 자산 구성 바, 시장별 평가금, 보유 종목
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Text, NumberText } from '../components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAppStore, STOCKS } from '../store/appStore';
import { Colors } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import StockLogo from '../components/StockLogo';
import { fetchMultiplePrices, getExchangeRate, calculateProfit } from '../utils/priceService';

export default function AssetDetailScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  // holdings/cash는 store(zustand) 구독, initialBalance·balance는 자체 Firestore 리스너로
  // 직결 — HomeScreen 패턴과 동일한 ground-truth를 사용해 화면 간 자산 정합성 보장.
  const holdings = useAppStore(state => state.holdings);
  const cash = useAppStore(state => state.cash);

  const [livePrices, setLivePrices] = useState<Record<string, any>>({});
  const [exchangeRate, setExchangeRate] = useState(1380);
  const [firestoreBalance, setFirestoreBalance] = useState<number | null>(null);
  const [firestoreInitialBalance, setFirestoreInitialBalance] = useState<number | null>(null);

  // 실시간 환율
  useEffect(() => {
    getExchangeRate().then(setExchangeRate).catch(() => {});
  }, []);

  // 딥링크 등으로 HomeScreen을 거치지 않고 직접 진입한 경우 안전망
  // (AuthContext가 로그인 시 이미 호출하므로 보통은 no-op)
  useEffect(() => {
    if (user?.id) {
      useAppStore.getState().hydrateUserData?.(user.id);
    }
  }, [user?.id]);

  // Firestore users/{uid} 직접 구독 — HomeScreen 동일 패턴
  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.id), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data?.balance !== undefined) setFirestoreBalance(data.balance);
      if (data?.initialBalance !== undefined) setFirestoreInitialBalance(data.initialBalance);
    }, (error) => {
      console.error('자산현황 유저 실시간 리스너 오류:', error);
    });
    return () => unsubscribe();
  }, [user?.id]);

  // 실시간 시세 + 30초 폴링 (HomeScreen 패턴)
  // deps: 길이뿐 아니라 ticker 구성 변동(같은 length 추가매수/일부매도)에도 재 fetch
  useEffect(() => {
    const safeH = holdings ?? [];
    if (safeH.length === 0) return;
    const tickers = safeH.map(h => ({
      ticker: h.ticker,
      isKR: h.ticker.length === 6 && /^\d+$/.test(h.ticker),
    }));
    fetchMultiplePrices(tickers).then(setLivePrices).catch(() => {});
    const interval = setInterval(() => {
      fetchMultiplePrices(tickers).then(setLivePrices).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [holdings?.length, holdings?.map(h => h.ticker).join(',')]);

  // ── 데이터 계산 (HomeScreen과 동일 인라인 공식) ──────────────────────────
  const balance = cash !== undefined ? cash : (firestoreBalance ?? 10_000_000);
  const initialBalance = firestoreInitialBalance ?? 10_000_000;

  const portfolioValue = (holdings ?? []).reduce((sum, h) => {
    const livePrice = (livePrices[h.ticker] as any)?.price
      ?? STOCKS.find(s => s.ticker === h.ticker)?.price
      ?? 0;
    const isKR = (h as any).krw ?? STOCKS.find(s => s.ticker === h.ticker)?.krw ?? true;
    const livePriceKRW = isKR ? livePrice : Math.round(livePrice * exchangeRate);
    return sum + livePriceKRW * (h.qty ?? 0);
  }, 0);

  const totalValue = balance + portfolioValue;
  const { profit, profitRate: returnRate } = calculateProfit(totalValue, initialBalance);
  const isUp = profit >= 0;

  const cashPercent = totalValue > 0
    ? ((balance / totalValue) * 100).toFixed(1)
    : '100.0';
  const investPercent = totalValue > 0
    ? ((portfolioValue / totalValue) * 100).toFixed(1)
    : '0.0';

  // 보유 종목 데이터 (KRW 기준 통일 — 미국 주식은 환율 적용)
  const safeHoldings = holdings ?? [];
  const holdingsData = safeHoldings.map(h => {
    const stock = STOCKS.find(s => s.ticker === h.ticker);
    if (!stock) return null;
    const livePrice = (livePrices[h.ticker] as any)?.price ?? stock.price ?? 0;
    const isKR = stock.krw ?? true;
    const livePriceKRW = isKR ? livePrice : Math.round(livePrice * exchangeRate);
    const evalAmt = livePriceKRW * (h.qty ?? 0);
    const pnlRate = (h.avgPrice ?? 0) > 0
      ? ((livePriceKRW - (h.avgPrice ?? 0)) / (h.avgPrice ?? 0)) * 100
      : 0;
    const pnlAmt = (livePriceKRW - (h.avgPrice ?? 0)) * (h.qty ?? 0);
    return { ...h, stock, evalAmt, pnlRate, pnlAmt };
  }).filter(Boolean).sort((a: any, b: any) => b.evalAmt - a.evalAmt);

  // ── 포트폴리오 도넛 차트 세그먼트 계산 ──
  const COLORS = ['#2a78d6','#eb6834','#1baf7a','#eda100','#e87ba4','#888780','#4a3aa7','#e34948'];
  const totalEval = holdingsData.reduce((s: number, h: any) => s + h.evalAmt, 0);
  const profitRate = ((totalEval - initialBalance) / initialBalance * 100);
  const isProfit = profitRate >= 0;

  const RADIUS = 54;
  const STROKE = 18;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  let cumPct = 0;
  const segments = holdingsData.map((h: any, i: number) => {
    const pct = totalEval > 0 ? h.evalAmt / totalEval : 0;
    const dash = pct * CIRCUMFERENCE;
    const offset = -cumPct * CIRCUMFERENCE;
    cumPct += pct;
    return { ...h, pct, dash, offset, color: i < 5 ? COLORS[i] : '#888780' };
  });

  const todayPnl = holdingsData.reduce((s: number, h: any) => s + h.pnlAmt, 0);
  const usRatio = 100 - (totalEval > 0 ? holdingsData.filter((h: any) => h.stock?.krw).reduce((s: number, h: any) => s + h.evalAmt, 0) / totalEval * 100 : 0);
  const aiMessage = usRatio > 70
    ? '해외 비중이 높아요. 분산 투자로 리스크를 줄여보는 건 어떨까요?'
    : usRatio < 30
    ? '국내 비중이 높아요. 해외 주식으로 분산해보는 건 어떨까요?'
    : '국내외 균형 잡힌 포트폴리오예요. 훌륭해요! 🎉';

  // 시장별 분류
  const krHoldings = holdingsData.filter((h: any) => h.stock.market === '한국');
  const usHoldings = holdingsData.filter((h: any) => h.stock.market === '미국');
  const krEval = krHoldings.reduce((sum: number, h: any) => sum + h.evalAmt, 0);
  const usEval = usHoldings.reduce((sum: number, h: any) => sum + h.evalAmt, 0);

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
          <NumberText style={styles.totalValue}>
            ₩{Math.round(totalValue).toLocaleString()}
          </NumberText>
          <View style={styles.profitRow}>
            <NumberText style={[styles.profitAmt, { color: isUp ? Colors.green : Colors.red }]}>
              {isUp ? '+' : ''}₩{Math.round(profit).toLocaleString()}
            </NumberText>
            <View style={[
              styles.rateBadge,
              { backgroundColor: isUp ? Colors.greenBg : Colors.redBg },
            ]}>
              <NumberText style={[styles.rateText, { color: isUp ? Colors.green : Colors.red }]}>
                {isUp ? '▲' : '▼'} {Math.abs(returnRate).toFixed(2)}%
              </NumberText>
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
              <NumberText style={styles.legendValue}>
                ₩{Math.round(balance).toLocaleString()}
              </NumberText>
              <NumberText style={styles.legendPct}>({cashPercent}%)</NumberText>
            </View>
            <View style={styles.legendDivider} />
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
              <Text style={styles.legendLabel}>투자</Text>
              <NumberText style={styles.legendValue}>
                ₩{Math.round(portfolioValue).toLocaleString()}
              </NumberText>
              <NumberText style={styles.legendPct}>({investPercent}%)</NumberText>
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
            <NumberText style={styles.marketAmt}>
              ₩{Math.round(krEval).toLocaleString()}
            </NumberText>
            <NumberText style={styles.marketPct}>{krPct}%</NumberText>
          </View>

          <View style={styles.marketRow}>
            <Text style={styles.marketFlag}>🇺🇸</Text>
            <Text style={styles.marketName}>미국</Text>
            <View style={{ flex: 1 }} />
            <NumberText style={styles.marketAmt}>
              ₩{Math.round(usEval).toLocaleString()}
            </NumberText>
            <NumberText style={styles.marketPct}>{usPct}%</NumberText>
          </View>
        </View>

        {holdingsData.length > 0 && (
          <>
            {/* 히어로 헤더 */}
            <View style={{ backgroundColor: theme.bgCard, borderRadius: 22, padding: 20, marginBottom: 10, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={{ fontSize: 13, color: theme.textSecondary }}>내 포트폴리오</Text>
                <View style={{ backgroundColor: isProfit ? '#eaf3de' : '#fcebeb', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: isProfit ? '#3b6d11' : '#a32d2d' }}>
                    {isProfit ? '▲' : '▼'} 오늘 {todayPnl >= 0 ? '+' : ''}{Math.round(todayPnl).toLocaleString()}원
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 28, fontWeight: '500', color: theme.text, letterSpacing: -0.5 }}>{Math.round(totalEval).toLocaleString()}원</Text>
              <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>총 평가금액 · {holdingsData.length}종목 보유</Text>
              <View style={{ height: 0.5, backgroundColor: theme.border, marginVertical: 16 }} />
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, color: theme.textSecondary, marginBottom: 4 }}>수익률</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: isProfit ? '#3b6d11' : '#a32d2d' }}>{isProfit ? '+' : ''}{profitRate.toFixed(2)}%</Text>
                </View>
                <View style={{ width: 0.5, backgroundColor: theme.border }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, color: theme.textSecondary, marginBottom: 4 }}>국내 비중</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: theme.text }}>{(100 - usRatio).toFixed(1)}%</Text>
                </View>
                <View style={{ width: 0.5, backgroundColor: theme.border }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, color: theme.textSecondary, marginBottom: 4 }}>해외 비중</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#185fa5' }}>{usRatio.toFixed(1)}%</Text>
                </View>
              </View>
            </View>

            {/* AI 조언 배너 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.bgCard, borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.border }}>
              <Text style={{ fontSize: 20 }}>💡</Text>
              <Text style={{ flex: 1, fontSize: 12, color: theme.textSecondary, lineHeight: 18 }}>
                <Text style={{ color: theme.text, fontWeight: '600' }}>{aiMessage.split('.')[0]}.</Text>
                {aiMessage.includes('.') ? ' ' + aiMessage.split('.').slice(1).join('.').trim() : ''}
              </Text>
            </View>

            {/* 도넛 차트 */}
            <View style={{ backgroundColor: theme.bgCard, borderRadius: 22, padding: 20, marginBottom: 10, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: theme.text }}>구성 비중</Text>
                <Text style={{ fontSize: 11, color: theme.textSecondary }}>평가금액 기준</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{ position: 'relative', width: 128, height: 128 }}>
                  <Svg width={128} height={128} viewBox="0 0 128 128">
                    <Circle cx="64" cy="64" r={RADIUS} fill="none" stroke={theme.bg} strokeWidth={STROKE} />
                    {segments.map((seg: any) => (
                      <Circle key={seg.ticker} cx="64" cy="64" r={RADIUS} fill="none"
                        stroke={seg.color} strokeWidth={STROKE}
                        strokeDasharray={`${seg.dash} ${CIRCUMFERENCE}`}
                        strokeDashoffset={seg.offset}
                        transform="rotate(-90 64 64)"
                      />
                    ))}
                  </Svg>
                  <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 20, fontWeight: '500', color: isProfit ? '#3b6d11' : '#a32d2d' }}>{isProfit ? '+' : ''}{profitRate.toFixed(2)}%</Text>
                    <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>수익률</Text>
                  </View>
                </View>
                <View style={{ flex: 1, gap: 8 }}>
                  {segments.slice(0, 6).map((seg: any) => (
                    <View key={seg.ticker} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: seg.color }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '500', color: theme.text }} numberOfLines={1}>{seg.stock?.name ?? seg.ticker}</Text>
                        <Text style={{ fontSize: 10, color: theme.textSecondary }}>{Math.round(seg.evalAmt / 10000)}만원</Text>
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textSecondary }}>{(seg.pct * 100).toFixed(1)}%</Text>
                    </View>
                  ))}
                </View>
              </View>
              {/* 비율 바 */}
              <View style={{ flexDirection: 'row', height: 7, borderRadius: 99, overflow: 'hidden', gap: 2, marginTop: 16 }}>
                {segments.map((seg: any) => (
                  <View key={seg.ticker} style={{ flex: seg.pct * 100, backgroundColor: seg.color }} />
                ))}
              </View>
            </View>

            {/* 트리맵 */}
            <View style={{ backgroundColor: theme.bgCard, borderRadius: 22, padding: 20, marginBottom: 10, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: theme.text }}>비중 블록</Text>
                <Text style={{ fontSize: 11, color: theme.textSecondary }}>크기 = 평가금액</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {segments.map((seg: any, i: number) => {
                  const pct = seg.pct * 100;
                  const w = i === 0 ? '47%' : i === 1 ? '49%' : i === 2 ? '31%' : i === 3 ? '23%' : i === 4 ? '20%' : '17%';
                  const h = i < 2 ? 110 : i < 5 ? 72 : 52;
                  const bgMap: Record<string,string> = { '#2a78d6': '#e6f1fb', '#eb6834': '#faeeda', '#1baf7a': '#eaf3de', '#eda100': '#faeeda', '#e87ba4': '#fbeaf0', '#888780': '#f1efe8' };
                  const textMap: Record<string,string> = { '#2a78d6': '#0c447c', '#eb6834': '#633806', '#1baf7a': '#27500a', '#eda100': '#633806', '#e87ba4': '#4b1528', '#888780': '#2c2c2a' };
                  const bg = bgMap[seg.color] ?? '#f1efe8';
                  const tc = textMap[seg.color] ?? '#2c2c2a';
                  return (
                    <View key={seg.ticker} style={{ width: w, height: h, backgroundColor: bg, borderRadius: 16, padding: 11, justifyContent: 'flex-end', overflow: 'hidden' }}>
                      <Text style={{ fontSize: h > 80 ? 12 : 11, fontWeight: '500', color: tc }} numberOfLines={2}>{seg.stock?.name ?? seg.ticker}</Text>
                      <Text style={{ fontSize: 11, color: tc, opacity: 0.8, marginTop: 3 }}>{pct.toFixed(1)}%</Text>
                      {h > 80 && <Text style={{ fontSize: 10, color: tc, opacity: 0.55, marginTop: 1 }}>{Math.round(seg.evalAmt / 10000)}만원</Text>}
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

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
                    <NumberText style={styles.holdingQty}>{h.qty}주</NumberText>
                  </View>
                  <View style={styles.holdingRight}>
                    <NumberText style={styles.holdingEval}>
                      ₩{Math.round(h.evalAmt).toLocaleString()}
                    </NumberText>
                    <NumberText style={[
                      styles.holdingPnl,
                      { color: isPnlUp ? Colors.green : Colors.red },
                    ]}>
                      {isPnlUp ? '+' : ''}{h.pnlRate.toFixed(2)}%
                    </NumberText>
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
