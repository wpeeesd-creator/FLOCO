import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore, STOCKS } from '../store/appStore';
import StockLogo from '../components/StockLogo';

export default function MockTradeScreen() {
  const navigation = useNavigation<any>();
  const { holdings } = useAppStore();

  // Top 100 by absolute change (simulating popularity)
  const top100 = [...STOCKS]
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  // Featured stocks for horizontal scroll
  const featured = STOCKS.slice(0, 12);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>투자</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Banner */}
          <TouchableOpacity style={styles.banner} activeOpacity={0.8}>
            <View>
              <Text style={styles.bannerTitle}>관심있는 회사를 알려주세요</Text>
              <Text style={styles.bannerDesc}>맞춤 종목을 추천해드릴게요</Text>
            </View>
            <Text style={{ fontSize: 32 }}>🔍</Text>
          </TouchableOpacity>

          {/* Horizontal Stock Logos */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.logoScroll}
          >
            {featured.map(s => (
              <TouchableOpacity
                key={s.ticker}
                style={styles.logoItem}
                onPress={() => navigation.navigate('종목상세', { ticker: s.ticker })}
                activeOpacity={0.7}
              >
                <StockLogo ticker={s.ticker} size={48} />
                <Text style={styles.logoLabel} numberOfLines={1}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* TOP 100 Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>구매 TOP 100</Text>
            <Text style={styles.sectionSub}>가장 많이 거래된 종목</Text>
          </View>

          <View style={styles.listCard}>
            {top100.map((s, i) => {
              const sUp = s.change >= 0;
              const holdingQty = holdings.find(h => h.ticker === s.ticker)?.qty;
              return (
                <TouchableOpacity
                  key={s.ticker}
                  style={[styles.stockRow, i < top100.length - 1 && styles.stockBorder]}
                  onPress={() => navigation.navigate('종목상세', { ticker: s.ticker })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.rankNum}>{i + 1}</Text>
                  <StockLogo ticker={s.ticker} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stockName}>{s.name}</Text>
                    <Text style={styles.stockSub}>
                      {holdingQty ? `${holdingQty}주 보유` : s.ticker}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.stockPrice}>
                      {s.krw ? `₩${s.price.toLocaleString()}` : `$${s.price.toFixed(2)}`}
                    </Text>
                    <View style={[styles.changeBadge, { backgroundColor: sUp ? '#FFF0F1' : '#EBF2FF' }]}>
                      <Text style={[styles.changeText, { color: sUp ? '#FF3B30' : '#3182F6' }]}>
                        {sUp ? '+' : ''}{s.change.toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#191919' },

  banner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#EBF5FF', marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 20,
  },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: '#191919' },
  bannerDesc: { fontSize: 13, color: '#8E8E93', marginTop: 4 },

  logoScroll: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  logoItem: { alignItems: 'center', width: 64, gap: 6 },
  logoLabel: { fontSize: 11, color: '#8E8E93', textAlign: 'center' },

  sectionHeader: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#191919' },
  sectionSub: { fontSize: 13, color: '#8E8E93', marginTop: 2 },

  listCard: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF',
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: '#F2F2F7',
  },
  stockRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  stockBorder: { borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  rankNum: {
    width: 24, fontSize: 14, fontWeight: '800',
    color: '#0066FF', textAlign: 'center',
  },
  stockName: { fontSize: 14, fontWeight: '600', color: '#191919' },
  stockSub: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  stockPrice: { fontSize: 14, fontWeight: '600', color: '#191919', fontFamily: 'Courier' },
  changeBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2,
  },
  changeText: { fontSize: 11, fontWeight: '700' },
});
