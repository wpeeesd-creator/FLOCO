/**
 * 모의투자 화면 — 토스 스타일
 * - Bottom Sheet 매수/매도
 * - 실시간 수익률
 * - 종목 검색
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useAppStore, STOCKS } from '../store/appStore';
import {
  Colors, Typography, Card, Badge, ReturnBadge,
  BottomSheet, Button, SectionHeader, EmptyState, Toast,
} from '../components/ui';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

// ── 미니 차트 ──────────────────────────────────
function SparkLine({ up, width = 80, height = 30 }: { up: boolean; width?: number; height?: number }) {
  const pts = up
    ? [height, height * 0.8, height * 0.7, height * 0.5, height * 0.4, height * 0.2, height * 0.1]
    : [height * 0.1, height * 0.3, height * 0.2, height * 0.5, height * 0.6, height * 0.8, height];
  const step = width / (pts.length - 1);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${p}`).join(' ');
  const color = up ? Colors.green : Colors.red;
  return (
    <Svg width={width} height={height}>
      <Path d={path} stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── 종목 행 ──────────────────────────────────
function StockRow({ stock, onPress, holding }: any) {
  const isUp = stock.change >= 0;
  const pct = holding ? ((stock.price - holding.avgPrice) / holding.avgPrice * 100) : null;

  return (
    <TouchableOpacity style={styles.stockRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.stockLogo, { backgroundColor: stock.krw ? '#EAF6FF' : '#FFF3D6' }]}>
        <Text style={{ fontSize: 18 }}>{stock.logo}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[Typography.body1, { fontWeight: '700', fontFamily: 'Courier' }]}>{stock.ticker}</Text>
          <Badge label={stock.market} type="default" size="sm" />
        </View>
        <Text style={Typography.caption}>{stock.name}{holding ? ` · ${holding.qty}주` : ''}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={[Typography.body1, { fontWeight: '700', fontFamily: 'Courier' }]}>
          {stock.krw ? `₩${stock.price.toLocaleString()}` : `$${stock.price.toFixed(2)}`}
        </Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color: isUp ? Colors.green : Colors.red }}>
          {isUp ? '▲' : '▼'} {Math.abs(pct ?? stock.change).toFixed(2)}%
        </Text>
      </View>
      <SparkLine up={isUp} />
    </TouchableOpacity>
  );
}

// ── 종목 상세 화면 ──────────────────────────────
export function StockDetailScreen({ route }: any) {
  const { ticker } = route.params;
  const navigation = useNavigation();
  const stock = STOCKS.find(s => s.ticker === ticker);
  const { holdings, cash, buyStock, sellStock } = useAppStore();
  const safeHoldings = holdings ?? [];
  const holding = safeHoldings.find(h => h.ticker === ticker);

  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [qty, setQty] = useState(1);
  const [showSheet, setShowSheet] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as const });

  if (!stock) {
    return (
      <View style={styles.container}>
        <Text style={{ padding: 20, textAlign: 'center' }}>종목을 찾을 수 없어요</Text>
      </View>
    );
  }

  const totalAmt = stock.price * qty;
  const fee = totalAmt * 0.001;
  const totalWithFee = totalAmt + fee;

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ visible: true, message, type: type as any });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000);
  };

  const handleConfirm = async () => {
    // Optimistic UI: 먼저 Sheet를 닫고 결과를 Toast로 피드백
    setShowSheet(false);
    const result = await (tab === 'buy'
      ? buyStock(ticker, qty, stock.price)
      : sellStock(ticker, qty, stock.price));
    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        tab === 'buy' ? '✅ 매수 완료' : '✅ 매도 완료',
        result.message,
      );
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(result.message, 'error');
    }
  };

  const isUp = stock.change >= 0;

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Text style={{ fontSize: 22, color: Colors.text }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[styles.stockLogo, { backgroundColor: stock.krw ? '#EAF6FF' : '#FFF3D6' }]}>
            <Text style={{ fontSize: 18 }}>{stock.logo}</Text>
          </View>
          <View>
            <Text style={[Typography.h3]}>{stock.name}</Text>
            <Text style={[Typography.caption, { fontFamily: 'Courier' }]}>{stock.ticker}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* 현재가 카드 */}
        <Card>
          <Text style={[Typography.caption, { marginBottom: 4 }]}>현재가</Text>
          <Text style={[Typography.monoLg, { fontSize: 32, marginBottom: 8 }]}>
            {stock.krw ? `₩${stock.price.toLocaleString()}` : `$${stock.price.toFixed(2)}`}
          </Text>
          <ReturnBadge value={stock.change} />

          {/* 미니 차트 */}
          <View style={{ marginTop: 16, height: 80, alignItems: 'center' }}>
            <SparkLine up={isUp} width={320} height={70} />
          </View>

          {/* 기간 필터 */}
          <View style={styles.periodFilter}>
            {['1일', '1주', '1개월', '3개월', '1년'].map(p => (
              <TouchableOpacity key={p} style={[styles.periodBtn, p === '1개월' && styles.periodBtn_active]}>
                <Text style={[styles.periodText, p === '1개월' && styles.periodText_active]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* 지표 3개 */}
        <View style={styles.metricsRow}>
          {[
            { label: '시가', value: stock.krw ? `₩${(stock.price * 0.98).toFixed(0)}` : `$${(stock.price * 0.98).toFixed(2)}` },
            { label: '고가', value: stock.krw ? `₩${(stock.price * 1.02).toFixed(0)}` : `$${(stock.price * 1.02).toFixed(2)}` },
            { label: '52주 최고', value: stock.krw ? `₩${(stock.price * 1.15).toFixed(0)}` : `$${(stock.price * 1.15).toFixed(2)}` },
          ].map(m => (
            <Card key={m.label} style={{ flex: 1, margin: 0, marginRight: 8, padding: 12 }}>
              <Text style={Typography.caption}>{m.label}</Text>
              <Text style={[Typography.body2, { fontWeight: '700', fontFamily: 'Courier', marginTop: 4 }]}>{m.value}</Text>
            </Card>
          ))}
        </View>

        {/* 보유 현황 */}
        {holding && (
          <Card>
            <Text style={[Typography.h3, { marginBottom: 10 }]}>보유 현황</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={Typography.caption}>보유 수량</Text>
                <Text style={[Typography.body1, { fontWeight: '700' }]}>{holding.qty}주</Text>
              </View>
              <View>
                <Text style={Typography.caption}>평균 단가</Text>
                <Text style={[Typography.body1, { fontWeight: '700', fontFamily: 'Courier' }]}>
                  {stock.krw ? `₩${holding.avgPrice.toLocaleString()}` : `$${holding.avgPrice.toFixed(2)}`}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={Typography.caption}>평가 수익</Text>
                <ReturnBadge value={(stock.price - holding.avgPrice) / holding.avgPrice * 100} />
              </View>
            </View>
          </Card>
        )}

        {/* 매수/매도 버튼 */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="매수" onPress={() => { setTab('buy'); setShowSheet(true); }} variant="primary" fullWidth />
          {holding && <Button title="매도" onPress={() => { setTab('sell'); setShowSheet(true); }} variant="danger" fullWidth />}
        </View>

        {/* 잔고 */}
        <Text style={[Typography.caption, { textAlign: 'center' }]}>
          사용 가능 잔고: ₩{Math.round(cash).toLocaleString()}
        </Text>
      </ScrollView>

      {/* 매수/매도 Bottom Sheet (토스 스타일) */}
      <BottomSheet visible={showSheet} onClose={() => setShowSheet(false)} title={tab === 'buy' ? '매수 주문' : '매도 주문'}>
        <View style={{ gap: 16 }}>
          <View style={styles.sheetRow}>
            <Text style={Typography.body2}>{stock.name}</Text>
            <Text style={[Typography.body1, { fontWeight: '700', fontFamily: 'Courier' }]}>
              {stock.krw ? `₩${stock.price.toLocaleString()}` : `$${stock.price.toFixed(2)}`}
            </Text>
          </View>

          {/* 수량 입력 */}
          <View>
            <Text style={[Typography.caption, { marginBottom: 6 }]}>수량</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(Math.max(1, qty - 1))}>
                <Text style={{ fontSize: 20, color: Colors.primary }}>−</Text>
              </TouchableOpacity>
              <Text style={[Typography.h2, { flex: 1, textAlign: 'center' }]}>{qty}주</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(qty + 1)}>
                <Text style={{ fontSize: 20, color: Colors.primary }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 금액 요약 */}
          <View style={styles.summaryBox}>
            <View style={styles.sheetRow}>
              <Text style={Typography.body2}>주문 금액</Text>
              <Text style={[Typography.body1, { fontFamily: 'Courier' }]}>₩{Math.round(totalAmt).toLocaleString()}</Text>
            </View>
            <View style={styles.sheetRow}>
              <Text style={Typography.caption}>수수료 (0.1%)</Text>
              <Text style={[Typography.caption, { fontFamily: 'Courier' }]}>₩{Math.round(fee).toLocaleString()}</Text>
            </View>
            <View style={[styles.sheetRow, { paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border }]}>
              <Text style={[Typography.body1, { fontWeight: '700' }]}>총 {tab === 'buy' ? '결제' : '수령'} 금액</Text>
              <Text style={[Typography.h3, { fontFamily: 'Courier', color: tab === 'buy' ? Colors.primary : Colors.green }]}>
                ₩{Math.round(tab === 'buy' ? totalWithFee : totalAmt - fee).toLocaleString()}
              </Text>
            </View>
          </View>

          <Button
            title={`확인 ${tab === 'buy' ? '매수' : '매도'}`}
            onPress={handleConfirm}
            variant={tab === 'buy' ? 'primary' : 'danger'}
            fullWidth
            size="lg"
          />
        </View>
      </BottomSheet>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </View>
  );
}

// ── 모의투자 메인 화면 ──────────────────────────
export default function TradeScreen() {
  const navigation = useNavigation<any>();
  const { holdings, getTotalValue, getReturnRate, cash } = useAppStore();
  const [search, setSearch] = useState('');
  const [market, setMarket] = useState<'전체' | '미국' | '한국'>('전체');
  const [tradeTab, setTradeTab] = useState<'trade' | 'portfolio'>('trade');

  console.log('TradeScreen 렌더링 시작');
  const safeHoldings = holdings ?? [];

  let totalValue = 0;
  let returnRate = 0;
  try {
    totalValue = getTotalValue() ?? 0;
    returnRate = getReturnRate() ?? 0;
  } catch (error) {
    console.error('TradeScreen 자산 계산 오류:', error);
  }

  const filtered = STOCKS
    .filter(s => market === '전체' || s.market === market)
    .filter(s => s.ticker.includes(search.toUpperCase()) || s.name.includes(search));

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={Typography.h2}>모의투자</Text>
      </View>

      {/* 포트폴리오 배너 */}
      <View style={styles.tradeBanner}>
        <View>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>총 평가잔고</Text>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700', fontFamily: 'Courier' }}>
            ₩{Math.round(totalValue).toLocaleString()}
          </Text>
        </View>
        <ReturnBadge value={returnRate} />
      </View>

      {/* 탭 */}
      <View style={styles.tradeTabBar}>
        {(['trade', 'portfolio'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tradeTab, tradeTab === t && styles.tradeTab_active]} onPress={() => setTradeTab(t)}>
            <Text style={[styles.tradeTabText, tradeTab === t && styles.tradeTabText_active]}>
              {t === 'trade' ? '거래' : '보유종목'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tradeTab === 'trade' ? (
        <>
          {/* 검색 */}
          <View style={styles.searchWrap}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="종목명, 티커 검색"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="characters"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {/* 시장 필터 */}
          <View style={styles.marketFilter}>
            {(['전체', '미국', '한국'] as const).map(m => (
              <TouchableOpacity key={m} style={[styles.filterBtn, market === m && styles.filterBtn_active]} onPress={() => setMarket(m)}>
                <Text style={[styles.filterText, market === m && styles.filterText_active]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView>
            <Card style={{ marginHorizontal: 16, padding: 0 }}>
              {filtered.map((s, i) => (
                <View key={s.ticker} style={i < filtered.length - 1 ? { borderBottomWidth: 1, borderBottomColor: Colors.border } : {}}>
                  <StockRow
                    stock={s}
                    holding={safeHoldings.find(h => h.ticker === s.ticker)}
                    onPress={() => navigation.navigate('종목상세', { ticker: s.ticker })}
                  />
                </View>
              ))}
              {filtered.length === 0 && <EmptyState emoji="🔍" title="검색 결과 없음" desc="다른 종목명이나 티커로 검색해보세요" />}
            </Card>
            <View style={{ height: 20 }} />
          </ScrollView>
        </>
      ) : (
        <ScrollView>
          {safeHoldings.length === 0 ? (
            <EmptyState emoji="📈" title="보유 종목 없음" desc="아직 투자한 종목이 없어요" action={{ label: '투자 시작하기', onPress: () => setTradeTab('trade') }} />
          ) : (
            <View style={{ margin: 16, gap: 10 }}>
              {safeHoldings.map(h => {
                const s = STOCKS.find(st => st.ticker === h.ticker);
                if (!s) return null;
                const pnl = (s.price - h.avgPrice) * h.qty;
                const pct = (s.price - h.avgPrice) / h.avgPrice * 100;
                return (
                  <Card key={h.ticker} onPress={() => navigation.navigate('종목상세', { ticker: h.ticker })}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={[styles.stockLogo, { backgroundColor: s.krw ? '#EAF6FF' : '#FFF3D6' }]}>
                        <Text style={{ fontSize: 18 }}>{s.logo}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[Typography.body1, { fontWeight: '700' }]}>{s.name}</Text>
                        <Text style={Typography.caption}>{h.qty}주 · 평균 {s.krw ? `₩${h.avgPrice.toLocaleString()}` : `$${h.avgPrice.toFixed(2)}`}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <ReturnBadge value={pct} />
                        <Text style={[Typography.caption, { color: pnl >= 0 ? Colors.green : Colors.red, marginTop: 2 }]}>
                          {pnl >= 0 ? '+' : ''}{Math.round(pnl).toLocaleString()}원
                        </Text>
                      </View>
                    </View>
                    {/* 수익률 바 */}
                    <View style={[styles.pnlBar, { marginTop: 10 }]}>
                      <View style={[styles.pnlFill, { width: `${Math.min(Math.abs(pct) * 5, 100)}%` as any, backgroundColor: pct >= 0 ? Colors.green : Colors.red }]} />
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tradeBanner: { backgroundColor: Colors.primary, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tradeTabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tradeTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tradeTab_active: { borderBottomColor: Colors.primary },
  tradeTabText: { fontSize: 14, color: Colors.textSub },
  tradeTabText_active: { color: Colors.primary, fontWeight: '700' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 12, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  marketFilter: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  filterBtn_active: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, color: Colors.textSub },
  filterText_active: { color: '#fff', fontWeight: '700' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  stockLogo: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  periodFilter: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  periodBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  periodBtn_active: { backgroundColor: Colors.primary },
  periodText: { fontSize: 12, color: Colors.textSub },
  periodText_active: { color: '#fff', fontWeight: '700' },
  metricsRow: { flexDirection: 'row', gap: 0 },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: 10, overflow: 'hidden' },
  qtyBtn: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  summaryBox: { backgroundColor: Colors.bg, borderRadius: 10, padding: 14, gap: 8 },
  pnlBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  pnlFill: { height: '100%', borderRadius: 2 },
});
