/**
 * 종목 상세 화면 — 실시간 가격 조회 + 매수/매도 Bottom Sheet
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore, STOCKS } from '../store/appStore';
import { Colors, Typography, Button, Badge, ReturnBadge, BottomSheet, Card } from '../components/ui';
import { getCacheAge } from '../lib/priceService';
import { useStockPrice } from '../hooks/useStockPrice';
import { TERM_TO_COURSE } from '../data/learningContent';
import { StockChart } from '../components/StockChart';
import StockLogo from '../components/StockLogo';
import { fetchStockNews, formatNewsTime, type NewsItem } from '../lib/newsService';
import { Linking } from 'react-native';

export default function StockDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { ticker } = route.params;
  const { cash, holdings, buyStock, sellStock, trades } = useAppStore();

  const stock = STOCKS.find(s => s.ticker === ticker);
  const safeHoldings = holdings ?? [];
  const safeTrades = trades ?? [];
  const holding = safeHoldings.find(h => h.ticker === ticker);
  const recentTrades = safeTrades.filter(t => t.ticker === ticker).slice(-5).reverse();

  // ── 실시간 가격 (TanStack Query — 10분 캐시) ──
  const { data: priceData, isLoading: priceLoading, refetch: loadPrice } =
    useStockPrice(ticker, stock?.krw ?? false);

  // ── 주문 상태 ────────────────────────────────
  const [sheetVisible, setSheetVisible] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [qtyStr, setQtyStr] = useState('1');
  const [sellQtyError, setSellQtyError] = useState('');
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [screenLoading, setScreenLoading] = useState(true);
  const [stockNews, setStockNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    console.log('StockDetailScreen 마운트, ticker:', ticker);
    try {
      console.log('stock:', stock);
      console.log('holding:', holding);
      console.log('cash:', cash);
      setScreenLoading(false);
    } catch (error) {
      console.error('StockDetailScreen 초기화 오류:', error);
      setScreenLoading(false);
    }
  }, []);

  useEffect(() => {
    if (stock) {
      fetchStockNews(ticker, stock.name)
        .then(news => setStockNews(news.slice(0, 5)))
        .catch(() => setStockNews([]));
    }
  }, [ticker]);

  if (screenLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0066FF" />
        </View>
      </SafeAreaView>
    );
  }

  console.log('StockDetailScreen 렌더링 시작');

  const livePrice = priceData?.price ?? stock?.price ?? 0;
  const liveChange = priceData?.change ?? stock?.change ?? 0;

  if (!stock) {
    return (
      <View style={styles.container}>
        <Text style={Typography.h2}>종목을 찾을 수 없어요</Text>
        <Button title="돌아가기" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const qty = Math.max(1, parseInt(qtyStr) || 1);
  const subtotal = livePrice * qty;
  const fee = Math.round(subtotal * 0.001);
  const totalBuy = subtotal + fee;
  const totalSell = subtotal - fee;

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 2500);
  }

  function openSheet(type: 'buy' | 'sell') {
    // 공매도 방지: 보유 없이 매도 불가 (클라이언트 1차 검증)
    if (type === 'sell' && (!holding || holding.qty === 0)) {
      showToast('보유 수량이 없어요. 공매도는 불가합니다.', 'error');
      return;
    }
    setTradeType(type);
    setQtyStr('1');
    setSellQtyError('');
    setSheetVisible(true);
  }

  function handleQtyChange(val: string) {
    setQtyStr(val);
    if (tradeType === 'sell') {
      const n = parseInt(val) || 0;
      if (holding && n > holding.qty) {
        // 공매도 방지: 보유 수량 초과 즉시 경고 (클라이언트 2차 검증)
        setSellQtyError(`보유 수량(${holding.qty}주)을 초과할 수 없어요. 공매도 불가.`);
      } else {
        setSellQtyError('');
      }
    }
  }

  function handleConfirm() {
    // 매도 시 보유 초과 최종 확인
    if (tradeType === 'sell' && holding && qty > holding.qty) {
      setSellQtyError(`보유 수량(${holding.qty}주)을 초과할 수 없어요. 공매도 불가.`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setSheetVisible(false);
    setConfirmVisible(true);
  }

  async function handleExecute() {
    // Optimistic UI: 먼저 Sheet를 닫고 결과를 Toast로 피드백
    setConfirmVisible(false);
    const result = await (tradeType === 'buy'
      ? buyStock(ticker, qty, livePrice)
      : sellStock(ticker, qty, livePrice));
    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        tradeType === 'buy' ? '✅ 매수 완료' : '✅ 매도 완료',
        `${stock?.name ?? ticker} ${qty}주를 ${tradeType === 'buy' ? '매수' : '매도'}했습니다!`,
      );
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(result.message, 'error');
    }
  }

  const gainRate = holding ? ((livePrice - holding.avgPrice) / holding.avgPrice * 100) : 0;
  const gainAmt = holding ? (livePrice - holding.avgPrice) * holding.qty : 0;
  const fmt = (n: number) => stock.krw ? `₩${Math.round(n).toLocaleString()}` : `$${n.toFixed(2)}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <StockLogo ticker={ticker} size={36} />
          <View>
            <Text style={[Typography.h3]}>{stock.name}</Text>
            <Text style={[Typography.caption]}>{stock.ticker} · {stock.market}</Text>
          </View>
        </View>
        <Badge label={stock.market} type="info" size="sm" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* 현재가 카드 */}
        <View style={styles.priceCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.priceLabel}>현재가 (시장가 기준)</Text>
            {priceLoading ? (
              <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
            ) : (
              <TouchableOpacity onPress={() => loadPrice()}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                  {priceData ? `${getCacheAge(priceData.updatedAt)} 갱신` : '탭하여 새로고침'} ↺
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.priceValue}>{fmt(livePrice)}</Text>
          <ReturnBadge value={liveChange} />
          {priceData && !priceData.fromCache && (
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4 }}>
              실시간 데이터 (5~15분 지연)
            </Text>
          )}
        </View>

        {/* 주가 차트 */}
        {livePrice > 0 && (
          <StockChart basePrice={livePrice} isKrw={stock.krw} />
        )}

        {/* 보유 현황 */}
        {holding && (
          <Card style={styles.sectionCard}>
            <Text style={[Typography.h3, { marginBottom: 12 }]}>내 보유 현황</Text>
            <View style={styles.holdingGrid}>
              <View style={styles.holdingItem}>
                <Text style={Typography.caption}>보유 수량</Text>
                <Text style={[Typography.body1, { fontWeight: '700' }]}>{holding.qty}주</Text>
              </View>
              <View style={styles.holdingItem}>
                <Text style={Typography.caption}>평균 단가</Text>
                <Text style={[Typography.body1, { fontWeight: '700' }]}>{fmt(holding.avgPrice)}</Text>
              </View>
              <View style={styles.holdingItem}>
                <Text style={Typography.caption}>평가 수익</Text>
                <Text style={[Typography.body1, { fontWeight: '700', color: gainAmt >= 0 ? Colors.green : Colors.red }]}>
                  {gainAmt >= 0 ? '+' : ''}{fmt(gainAmt)}
                </Text>
              </View>
              <View style={styles.holdingItem}>
                <Text style={Typography.caption}>수익률</Text>
                <Text style={[Typography.body1, { fontWeight: '700', color: gainRate >= 0 ? Colors.green : Colors.red }]}>
                  {gainRate >= 0 ? '+' : ''}{gainRate.toFixed(2)}%
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* 종목 정보 */}
        <Card style={styles.sectionCard}>
          <Text style={[Typography.h3, { marginBottom: 12 }]}>종목 정보</Text>
          {[
            { label: '티커', value: stock.ticker },
            { label: '시장', value: stock.market },
            { label: '등락률', value: `${liveChange >= 0 ? '+' : ''}${liveChange.toFixed(2)}%` },
            { label: '수수료', value: '0.1% (시장가)' },
          ].map(item => (
            <View key={item.label} style={styles.infoRow}>
              <Text style={Typography.body2}>{item.label}</Text>
              <Text style={[Typography.body1, { fontWeight: '600' }]}>{item.value}</Text>
            </View>
          ))}
        </Card>

        {/* 투자 지표 + 학습 연결 */}
        <Card style={styles.sectionCard}>
          <Text style={[Typography.h3, { marginBottom: 12 }]}>투자 지표 <Text style={[Typography.caption, { color: Colors.primary }]}>탭해서 학습하기</Text></Text>
          {[
            { term: 'PER', label: 'PER (주가수익비율)', value: 'N/A' },
            { term: 'PBR', label: 'PBR (주가순자산비율)', value: 'N/A' },
            { term: 'ROE', label: 'ROE (자기자본이익률)', value: 'N/A' },
          ].map(item => (
            <View key={item.term} style={styles.infoRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={Typography.body2}>{item.label}</Text>
                <TouchableOpacity
                  style={styles.helpBtn}
                  onPress={() => navigation.navigate('홈Tab', {
                    screen: '레슨',
                    params: { courseId: TERM_TO_COURSE[item.term] },
                  })}
                >
                  <Text style={styles.helpBtnText}>?</Text>
                </TouchableOpacity>
              </View>
              <Text style={[Typography.body1, { fontWeight: '600', color: Colors.textMuted }]}>{item.value}</Text>
            </View>
          ))}
        </Card>

        {/* 관련 뉴스 */}
        {stockNews.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={[Typography.h3, { marginBottom: 12 }]}>📰 관련 뉴스</Text>
            {stockNews.map((news, idx) => (
              <TouchableOpacity
                key={news.id + idx}
                onPress={() => news.url ? Linking.openURL(news.url) : null}
                style={[styles.newsRow, idx < stockNews.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={styles.newsTitle} numberOfLines={2}>{news.title}</Text>
                <Text style={styles.newsMeta}>
                  {news.source} · {formatNewsTime(news.publishedAt)}
                </Text>
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* 최근 거래 내역 */}
        {recentTrades.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={[Typography.h3, { marginBottom: 12 }]}>내 거래 내역</Text>
            {recentTrades.map(t => (
              <View key={t.id} style={styles.tradeRow}>
                <Badge label={t.type === 'buy' ? '매수' : '매도'} type={t.type === 'buy' ? 'success' : 'danger'} size="sm" />
                <Text style={Typography.body2}>{t.qty}주 · {fmt(t.price)}</Text>
                <Text style={[Typography.caption, { marginLeft: 'auto' as any }]}>
                  {new Date(t.timestamp).toLocaleDateString('ko-KR')}
                </Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.bottomBtns}>
        <TouchableOpacity
          style={[styles.tradeBtn, styles.aiBtn]}
          onPress={() => navigation.navigate('AI분석', { ticker })}
        >
          <Text style={styles.aiBtnText}>🐾 AI에게 물어보기</Text>
        </TouchableOpacity>
        {holding && (
          <TouchableOpacity style={[styles.tradeBtn, styles.sellBtn]} onPress={() => navigation.navigate('거래', { ticker })}>
            <Text style={styles.tradeBtnText}>매도</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.tradeBtn, styles.buyBtn, !holding && { flex: 1 }]}
          onPress={() => navigation.navigate('거래', { ticker })}
        >
          <Text style={styles.tradeBtnText}>매수</Text>
        </TouchableOpacity>
      </View>

      {/* 토스트 */}
      {toast !== '' && (
        <View style={[styles.toast, { backgroundColor: toastType === 'success' ? Colors.green : Colors.red }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* 주문 Bottom Sheet */}
      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title={tradeType === 'buy' ? '매수 주문' : '매도 주문'}
      >
        <View style={styles.sheetContent}>
          <View style={styles.sheetRow}>
            <Text style={Typography.body2}>종목</Text>
            <Text style={[Typography.body1, { fontWeight: '700' }]}>{stock.name}</Text>
          </View>
          <View style={styles.sheetRow}>
            <Text style={Typography.body2}>현재가 (시장가)</Text>
            <Text style={[Typography.body1, { fontWeight: '700' }]}>{fmt(livePrice)}</Text>
          </View>

          {/* 수량 입력 */}
          <View style={styles.qtyRow}>
            <Text style={Typography.body2}>수량</Text>
            <View style={styles.qtyControls}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => handleQtyChange(String(Math.max(1, parseInt(qtyStr || '1') - 1)))}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.qtyInput}
                value={qtyStr}
                onChangeText={handleQtyChange}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => handleQtyChange(String(parseInt(qtyStr || '0') + 1))}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 공매도 방지 에러 */}
          {!!sellQtyError && (
            <View style={styles.sellErrorBox}>
              <Text style={styles.sellErrorText}>⚠️ {sellQtyError}</Text>
            </View>
          )}

          <View style={[styles.sheetRow, { backgroundColor: Colors.bg, borderRadius: 8, padding: 10, marginTop: 4 }]}>
            <Text style={Typography.body2}>수수료 (0.1%)</Text>
            <Text style={Typography.body2}>₩{fee.toLocaleString()}</Text>
          </View>
          <View style={[styles.sheetRow, { marginTop: 4 }]}>
            <Text style={[Typography.body1, { fontWeight: '700' }]}>
              {tradeType === 'buy' ? '총 결제액' : '예상 수령액'}
            </Text>
            <Text style={[Typography.body1, { fontWeight: '800', color: tradeType === 'buy' ? Colors.red : Colors.green }]}>
              {fmt(tradeType === 'buy' ? totalBuy : totalSell)}
            </Text>
          </View>

          {tradeType === 'buy' ? (
            <View style={[styles.remainCard, {
              backgroundColor: cash - totalBuy < 0 ? '#FFE0E0' : '#E8F5E9',
              borderColor: cash - totalBuy < 0 ? '#FF3B30' : '#34C759',
            }]}>
              <Text style={{ color: '#8E8E93', fontSize: 12 }}>구매 후 남은 현금</Text>
              <Text style={{
                fontSize: 22, fontWeight: '700', fontFamily: 'Courier',
                color: cash - totalBuy < 0 ? '#FF3B30' : '#34C759',
              }}>
                {Math.round(cash - totalBuy).toLocaleString()}원
              </Text>
            </View>
          ) : holding ? (
            <Text style={[Typography.caption, { textAlign: 'center' }]}>
              보유: {holding.qty}주
            </Text>
          ) : null}

          <Button
            title="응, 결정했어!"
            onPress={handleConfirm}
            variant={tradeType === 'buy' ? 'primary' : 'danger'}
            size="lg"
            fullWidth
          />
        </View>
      </BottomSheet>

      {/* 최종 확인 Bottom Sheet */}
      <BottomSheet
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        title="주문 최종 확인"
      >
        <View style={styles.sheetContent}>
          <Text style={[Typography.body2, { textAlign: 'center', marginBottom: 16 }]}>
            아래 내용으로 주문을 체결할까요?
          </Text>
          <View style={styles.confirmSummary}>
            {[
              { label: '종목', value: `${stock.logo} ${stock.name}` },
              { label: '유형', value: tradeType === 'buy' ? '시장가 매수' : '시장가 매도' },
              { label: '수량', value: `${qty}주` },
              { label: '단가', value: fmt(livePrice) },
              { label: '수수료 (0.1%)', value: `₩${fee.toLocaleString()}` },
            ].map(item => (
              <View key={item.label} style={styles.sheetRow}>
                <Text style={Typography.body2}>{item.label}</Text>
                <Text style={[Typography.body1, { fontWeight: '600' }]}>{item.value}</Text>
              </View>
            ))}
            <View style={[styles.sheetRow, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, marginTop: 4 }]}>
              <Text style={[Typography.body1, { fontWeight: '700' }]}>
                {tradeType === 'buy' ? '결제액' : '수령액'}
              </Text>
              <Text style={[Typography.h3, { color: tradeType === 'buy' ? Colors.red : Colors.green }]}>
                {fmt(tradeType === 'buy' ? totalBuy : totalSell)}
              </Text>
            </View>
          </View>
          <View style={styles.confirmBtns}>
            <Button title="취소" onPress={() => setConfirmVisible(false)} variant="outline" size="lg" />
            <Button
              title="응, 결정했어!"
              onPress={handleExecute}
              variant={tradeType === 'buy' ? 'primary' : 'danger'}
              size="lg"
            />
          </View>
        </View>
      </BottomSheet>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 22, color: Colors.primary, fontWeight: '600' },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerLogo: { fontSize: 24 },
  priceCard: {
    backgroundColor: Colors.navy, margin: 16, borderRadius: 16, padding: 20, gap: 8,
  },
  priceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  priceValue: { color: '#fff', fontSize: 32, fontWeight: '700', fontFamily: 'Courier', letterSpacing: -1 },
  sectionCard: { marginHorizontal: 16 },
  holdingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  holdingItem: { width: '45%', gap: 4 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tradeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  bottomBtns: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 30,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.border,
  },
  tradeBtn: {
    flex: 1, paddingVertical: 15, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  buyBtn: { backgroundColor: Colors.green },
  sellBtn: { backgroundColor: Colors.red },
  tradeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  aiBtn: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#F2F2F7' },
  aiBtnText: { color: '#191919', fontSize: 14, fontWeight: '600' },
  toast: {
    position: 'absolute', bottom: 90, left: 20, right: 20,
    borderRadius: 10, padding: 14, alignItems: 'center',
  },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  sheetContent: { gap: 12, paddingBottom: 8 },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 36, height: 36, backgroundColor: Colors.bg,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 20, fontWeight: '700', color: Colors.text },
  qtyInput: {
    width: 64, textAlign: 'center', fontSize: 16, fontWeight: '700',
    backgroundColor: Colors.bg, borderRadius: 8, paddingVertical: 6,
  },
  sellErrorBox: {
    backgroundColor: '#FFF0F0', borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: '#FFD0D0',
  },
  sellErrorText: { fontSize: 12, color: Colors.red, fontWeight: '600' },
  confirmSummary: { gap: 8 },
  confirmBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  remainCard: {
    borderRadius: 12, padding: 12, borderWidth: 2, alignItems: 'center',
  },
  newsRow: { paddingVertical: 12 },
  newsTitle: { fontSize: 14, fontWeight: '600', color: '#191919', lineHeight: 20 },
  newsMeta: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  helpBtn: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  helpBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
