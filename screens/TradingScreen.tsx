import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAppStore, STOCKS } from '../store/appStore';
import { Colors, Typography, Button, Card, Toast } from '../components/ui';

export default function TradingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { ticker } = route.params;
  const stock = STOCKS.find(s => s.ticker === ticker);
  const { cash, holdings, buyStock, sellStock } = useAppStore();
  const holding = holdings.find(h => h.ticker === ticker);

  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [qtyStr, setQtyStr] = useState('1');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' });

  if (!stock) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
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
  const fmt = (n: number) => stock.krw ? `₩${Math.round(n).toLocaleString()}` : `$${n.toFixed(2)}`;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  };

  const handleConfirm = async () => {
    if (tradeType === 'sell' && (!holding || holding.qty < qty)) {
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
      Alert.alert(
        tradeType === 'buy' ? '✅ 매수 완료' : '✅ 매도 완료',
        `${stock.name} ${qty}주를 ${tradeType === 'buy' ? '매수' : '매도'}했습니다!`,
      );
      setTimeout(() => navigation.goBack(), 500);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(result.message, 'error');
    }
  };

  const isUp = stock.change >= 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[Typography.h3]}>{stock.name}</Text>
            <Text style={[Typography.caption]}>{stock.ticker}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[Typography.body1, { fontWeight: '700', fontFamily: 'Courier' }]}>
              {fmt(stock.price)}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: isUp ? Colors.green : Colors.red }}>
              {isUp ? '▲' : '▼'} {Math.abs(stock.change).toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* Buy/Sell Toggle */}
        <View style={styles.toggleRow}>
          {(['buy', 'sell'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.toggleBtn, tradeType === t && (t === 'buy' ? styles.toggleBuyActive : styles.toggleSellActive)]}
              onPress={() => setTradeType(t)}
            >
              <Text style={[styles.toggleText, tradeType === t && styles.toggleTextActive]}>
                {t === 'buy' ? '매수' : '매도'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quantity */}
        <Card style={styles.card}>
          <Text style={[Typography.body2, { marginBottom: 10 }]}>수량</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQtyStr(String(Math.max(1, qty - 1)))}
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
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Summary */}
        <Card style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={Typography.body2}>주문 금액</Text>
            <Text style={[Typography.body1, { fontFamily: 'Courier' }]}>{fmt(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={Typography.caption}>수수료 (0.1%)</Text>
            <Text style={[Typography.caption, { fontFamily: 'Courier' }]}>{fmt(fee)}</Text>
          </View>
          <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, marginTop: 4 }]}>
            <Text style={[Typography.body1, { fontWeight: '700' }]}>
              총 {tradeType === 'buy' ? '결제' : '수령'} 금액
            </Text>
            <Text style={[Typography.h3, { fontFamily: 'Courier', color: tradeType === 'buy' ? Colors.primary : Colors.green }]}>
              {fmt(tradeType === 'buy' ? totalBuy : totalSell)}
            </Text>
          </View>
        </Card>

        {/* Remaining Balance */}
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
        ) : (
          <Text style={[Typography.caption, { textAlign: 'center', marginBottom: 16 }]}>
            보유 수량: {holding?.qty ?? 0}주
          </Text>
        )}

        {/* Confirm button */}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 22, color: Colors.primary, fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row', margin: 16, backgroundColor: Colors.card,
    borderRadius: 10, padding: 3, gap: 3,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8,
  },
  toggleBuyActive: { backgroundColor: Colors.green },
  toggleSellActive: { backgroundColor: Colors.red },
  toggleText: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
  toggleTextActive: { color: '#fff' },
  card: { marginHorizontal: 16, marginBottom: 12 },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10, overflow: 'hidden',
  },
  qtyBtn: {
    width: 52, height: 52, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  qtyBtnText: { fontSize: 22, fontWeight: '700', color: Colors.primary },
  qtyInput: {
    flex: 1, fontSize: 20, fontWeight: '700', color: Colors.text,
    paddingVertical: 10,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  confirmWrap: { paddingHorizontal: 16, marginTop: 'auto' as any, paddingBottom: 16 },
  remainCard: {
    borderRadius: 12, padding: 12, marginHorizontal: 16, marginBottom: 16,
    borderWidth: 2, alignItems: 'center',
  },
});
