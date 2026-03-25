import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore, STOCKS } from '../store/appStore';
import StockLogo from '../components/StockLogo';

type CurrencyTab = '원화' | '달러';

export default function TransactionScreen() {
  const navigation = useNavigation<any>();
  const { trades, cash } = useAppStore();
  const [currTab, setCurrTab] = useState<CurrencyTab>('원화');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('TransactionScreen 마운트');
    try {
      console.log('trades:', trades);
      console.log('cash:', cash);
      setIsLoading(false);
    } catch (error) {
      console.error('TransactionScreen 초기화 오류:', error);
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0066FF" />
        </View>
      </SafeAreaView>
    );
  }

  console.log('TransactionScreen 렌더링 시작');

  const safeTrades = trades ?? [];
  const sortedTrades = [...safeTrades].reverse();

  // Filter by currency
  const filteredTrades = sortedTrades.filter(t => {
    const stock = STOCKS.find(s => s.ticker === t.ticker);
    if (currTab === '원화') return stock?.krw ?? true;
    return !(stock?.krw ?? true);
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>거래내역</Text>
          <View style={{ width: 30 }} />
        </View>

        {/* Currency Tabs */}
        <View style={styles.currTabs}>
          {(['원화', '달러'] as CurrencyTab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.currTab, currTab === t && styles.currTabActive]}
              onPress={() => setCurrTab(t)}
            >
              <Text style={[styles.currTabText, currTab === t && styles.currTabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Balance Info */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>주식 구매 가능 금액</Text>
          <Text style={styles.balanceValue}>
            {currTab === '원화' ? `₩${Math.round(cash).toLocaleString()}` : '$0.00'}
          </Text>
          <View style={styles.balanceBtns}>
            <TouchableOpacity style={styles.balanceBtn}>
              <Text style={styles.balanceBtnText}>원화로 바꾸기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.balanceBtn, styles.balanceBtnPrimary]}>
              <Text style={styles.balanceBtnTextPrimary}>달러 채우기</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fee Banner */}
        <View style={styles.feeBanner}>
          <Text style={styles.feeText}>💡 환전 수수료 0.1% · 거래 수수료 0.1%</Text>
        </View>

        {/* Transaction List */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {filteredTrades.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>📋</Text>
              <Text style={styles.emptyTitle}>거래 내역이 없어요</Text>
              <Text style={styles.emptyDesc}>투자를 시작하면 여기에 표시돼요</Text>
            </View>
          ) : (
            <View style={styles.tradeList}>
              {filteredTrades.map((t, i) => {
                const stock = STOCKS.find(s => s.ticker === t.ticker);
                const isBuy = t.type === 'buy';
                const total = t.price * t.qty;
                const date = new Date(t.timestamp);
                const dateStr = `${date.getMonth()+1}.${date.getDate()} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;

                return (
                  <View
                    key={t.id}
                    style={[styles.tradeRow, i < filteredTrades.length - 1 && styles.tradeBorder]}
                  >
                    <StockLogo ticker={t.ticker} size={40} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.tradeName}>{stock?.name ?? t.ticker}</Text>
                        <View style={[styles.typeBadge, { backgroundColor: isBuy ? '#FFF0F1' : '#EBF2FF' }]}>
                          <Text style={[styles.typeText, { color: isBuy ? '#FF3B30' : '#3182F6' }]}>
                            {isBuy ? '매수' : '매도'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.tradeDate}>{dateStr} · {t.qty}주</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.tradeAmt, { color: isBuy ? '#FF3B30' : '#3182F6' }]}>
                        {isBuy ? '-' : '+'}{stock?.krw ? `₩${Math.round(total).toLocaleString()}` : `$${total.toFixed(2)}`}
                      </Text>
                      <Text style={styles.tradeFee}>수수료 {stock?.krw ? `₩${Math.round(t.fee).toLocaleString()}` : `$${t.fee.toFixed(2)}`}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 22, color: '#0066FF', fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#191919' },

  currTabs: {
    flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8,
    borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  currTab: {
    paddingVertical: 12, paddingHorizontal: 20,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  currTabActive: { borderBottomColor: '#191919' },
  currTabText: { fontSize: 15, color: '#8E8E93', fontWeight: '500' },
  currTabTextActive: { color: '#191919', fontWeight: '700' },

  balanceCard: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: '#F8F9FA', borderRadius: 14, padding: 18,
  },
  balanceLabel: { fontSize: 13, color: '#8E8E93' },
  balanceValue: { fontSize: 24, fontWeight: '700', color: '#191919', fontFamily: 'Courier', marginTop: 4 },
  balanceBtns: { flexDirection: 'row', gap: 8, marginTop: 14 },
  balanceBtn: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: '#F2F2F7',
  },
  balanceBtnPrimary: { backgroundColor: '#0066FF', borderColor: '#0066FF' },
  balanceBtnText: { fontSize: 13, fontWeight: '600', color: '#191919' },
  balanceBtnTextPrimary: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },

  feeBanner: {
    marginHorizontal: 16, marginTop: 10,
    backgroundColor: '#FFF8E1', borderRadius: 8, padding: 10,
  },
  feeText: { fontSize: 12, color: '#8B6914', textAlign: 'center' },

  tradeList: { marginHorizontal: 16, marginTop: 12 },
  tradeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14,
  },
  tradeBorder: { borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  tradeName: { fontSize: 14, fontWeight: '600', color: '#191919' },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 10, fontWeight: '700' },
  tradeDate: { fontSize: 11, color: '#8E8E93', marginTop: 3 },
  tradeAmt: { fontSize: 14, fontWeight: '700', fontFamily: 'Courier' },
  tradeFee: { fontSize: 10, color: '#B0B8C1', marginTop: 2 },

  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#191919' },
  emptyDesc: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
});
