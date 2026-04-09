import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAppStore, STOCKS } from '../store/appStore';
import { Colors, Typography, Button, Card, Toast } from '../components/ui';
import { validateTradeQty } from '../lib/errorHandler';
import { useTheme } from '../context/ThemeContext';

export default function TradingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const ticker = route.params?.ticker ?? '';
  const stock = STOCKS.find(s => s.ticker === ticker);
  const { cash, holdings, buyStock, sellStock } = useAppStore();
  const holding = holdings.find(h => h.ticker === ticker);
  const { theme, isDark } = useTheme();

  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [qtyStr, setQtyStr] = useState('1');
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
  });

  if (!stock) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <View style={styles.container}>
          <Text style={Typography.h2}>종목을 찾을 수 없어요</Text>
          <Button title="돌아가기" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const qty = Math.max(1, parseInt(qtyStr) || 1);
  const subtotal = stock.price * qty;
  const fee = Math.round(subtotal * 0.001);
  const totalBuy = subtotal + fee;
  const totalSell = subtotal - fee;
  const fmt = (n: number) =>
    stock.krw ? `₩${Math.round(n).toLocaleString()}` : `$${n.toFixed(2)}`;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  };

  const handleConfirm = async () => {
    // 수량 입력값 검증
    const { qty: validQty, error: qtyError } = validateTradeQty(qtyStr);
    if (qtyError) {
      showToast(qtyError, 'error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (tradeType === 'sell' && (!holding || holding.qty < validQty)) {
      showToast('보유 수량이 부족해요', 'error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (tradeType === 'buy' && totalBuy > cash) {
      showToast('잔액이 부족해요', 'error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const result = await (tradeType === 'buy'
      ? buyStock(ticker, qty, stock.price)
      : sellStock(ticker, qty, stock.price));

    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(
        tradeType === 'buy'
          ? `✅ ${stock.name} ${qty}주 매수 완료!`
          : `✅ ${stock.name} ${qty}주 매도 완료!`,
        'success',
      );
      setTimeout(() => navigation.goBack(), 1500);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(result.message, 'error');
    }
  };

  const isUp = stock.change >= 0;
  const remainingCash = cash - totalBuy;
  const isInsufficient = tradeType === 'buy' && remainingCash < 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* ── Header ───────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerStockName}>{stock.name}</Text>
          <Text style={styles.headerTicker}>{stock.ticker}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.headerPrice}>{fmt(stock.price)}</Text>
          <Text style={[styles.headerChange, { color: isUp ? Colors.green : Colors.red }]}>
            {isUp ? '▲' : '▼'} {Math.abs(stock.change).toFixed(2)}%
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Buy / Sell Toggle ────────────────── */}
        <View style={styles.toggleRow}>
          {(['buy', 'sell'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[
                styles.toggleBtn,
                tradeType === t && (t === 'buy' ? styles.toggleBuyActive : styles.toggleSellActive),
              ]}
              onPress={() => setTradeType(t)}
              activeOpacity={0.85}
            >
              <Text style={[styles.toggleText, tradeType === t && { color: theme.bgCard }]}>
                {t === 'buy' ? '매수' : '매도'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Quantity Input ───────────────────── */}
        <Card style={styles.card}>
          <Text style={styles.cardLabel}>수량</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQtyStr(String(Math.max(1, qty - 1)))}
              activeOpacity={0.7}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.qtyInput}
              value={qtyStr}
              onChangeText={setQtyStr}
              keyboardType="numeric"
              textAlign="center"
            />
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQtyStr(String(qty + 1))}
              activeOpacity={0.7}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* ── Order Summary ────────────────────── */}
        <Card style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>주문금액</Text>
            <Text style={styles.summaryValue}>{fmt(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelSub}>수수료 (0.1%)</Text>
            <Text style={styles.summaryValueSub}>{fmt(fee)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>
              총 {tradeType === 'buy' ? '결제' : '수령'} 금액
            </Text>
            <Text style={[
              styles.summaryTotalValue,
              { color: tradeType === 'buy' ? Colors.primary : Colors.green },
            ]}>
              {fmt(tradeType === 'buy' ? totalBuy : totalSell)}
            </Text>
          </View>
        </Card>

        {/* ── Balance Info ─────────────────────── */}
        {tradeType === 'buy' ? (
          <Card style={styles.card}>
            <View style={styles.balanceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.balanceLabel}>주문가능금액</Text>
                <Text style={styles.balanceAmt}>{fmt(cash)}</Text>
              </View>
              <View style={styles.balanceDividerV} />
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.balanceLabel}>구매 후 남은 금액</Text>
                <Text style={[
                  styles.balanceRemain,
                  { color: isInsufficient ? theme.red : Colors.text },
                ]}>
                  {isInsufficient ? '−' : ''}{fmt(Math.abs(remainingCash))}
                </Text>
              </View>
            </View>

            {isInsufficient && (
              <View style={styles.warningBanner}>
                <Text style={[styles.warningText, { color: theme.red }]}>잔액이 부족해요. 수량을 줄여주세요.</Text>
              </View>
            )}
          </Card>
        ) : (
          <Card style={styles.card}>
            <View style={styles.balanceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.balanceLabel}>보유 수량</Text>
                <Text style={styles.balanceAmt}>{holding?.qty ?? 0}주</Text>
              </View>
              <View style={styles.balanceDividerV} />
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.balanceLabel}>매도 후 남은 수량</Text>
                <Text style={[
                  styles.balanceRemain,
                  { color: (holding?.qty ?? 0) < qty ? theme.red : Colors.text },
                ]}>
                  {Math.max(0, (holding?.qty ?? 0) - qty)}주
                </Text>
              </View>
            </View>

            {(holding?.qty ?? 0) < qty && (
              <View style={styles.warningBanner}>
                <Text style={[styles.warningText, { color: theme.red }]}>보유 수량이 부족해요. 수량을 줄여주세요.</Text>
              </View>
            )}
          </Card>
        )}
      </ScrollView>

      {/* ── Confirm Button ───────────────────── */}
      <View style={styles.confirmWrap}>
        <Button
          title="응, 결정했어!"
          onPress={handleConfirm}
          variant={tradeType === 'buy' ? 'primary' : 'danger'}
          fullWidth
          size="lg"
        />
      </View>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 22, color: Colors.primary, fontWeight: '600' },
  headerStockName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  headerTicker: { fontSize: 12, color: Colors.textSub, marginTop: 1 },
  headerPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Courier',
  },
  headerChange: { fontSize: 12, fontWeight: '700', marginTop: 2 },

  // Scroll
  scrollContent: { paddingTop: 16, paddingBottom: 16 },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBuyActive: { backgroundColor: Colors.green },
  toggleSellActive: { backgroundColor: Colors.red },
  toggleText: { fontSize: 15, fontWeight: '600', color: Colors.textSub },

  // Card shared
  card: { marginHorizontal: 16, marginBottom: 12 },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSub,
    marginBottom: 12,
  },

  // Quantity
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  qtyBtnText: { fontSize: 22, fontWeight: '700', color: Colors.primary },
  qtyInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    paddingVertical: 10,
    fontFamily: 'Courier',
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: { fontSize: 14, color: Colors.text },
  summaryValue: { fontSize: 14, fontWeight: '600', color: Colors.text, fontFamily: 'Courier' },
  summaryLabelSub: { fontSize: 13, color: Colors.textSub },
  summaryValueSub: { fontSize: 13, color: Colors.textSub, fontFamily: 'Courier' },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  summaryTotalLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Courier',
  },

  // Balance
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceDividerV: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  balanceLabel: { fontSize: 12, color: Colors.textSub, marginBottom: 4 },
  balanceAmt: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Courier',
  },
  balanceRemain: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Courier',
  },

  // Warning
  warningBanner: {
    marginTop: 12,
    backgroundColor: '#FFF0F1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Confirm
  confirmWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
