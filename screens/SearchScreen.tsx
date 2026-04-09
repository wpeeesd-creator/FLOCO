/**
 * 종목 검색 화면
 * - 티커/종목명 실시간 필터링
 * - 검색창 포커스 시 머니몽 말풍선 표시
 * - 선택 시 종목 상세 페이지로 이동
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STOCKS } from '../store/appStore';
import type { Stock } from '../store/appStore';
import { Colors, Typography, EmptyState } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

// ── 머니몽 말풍선 ──────────────────────────────
const MONEYMONG_TIPS = [
  "어떤 종목이 궁금해? 같이 찾아보자!",
  "티커나 이름으로 검색해봐!",
  "AAPL은 애플이야.. 알고 있었어?",
  "검색하면서 공부하는 거야! 멋지다!",
];

function MoneymongBubble({ visible }: { visible: boolean }) {
  const { theme, isDark } = useTheme();
  if (!visible) return null;
  const tip = MONEYMONG_TIPS[Math.floor(Math.random() * MONEYMONG_TIPS.length)];
  return (
    <View style={styles.bubbleWrap}>
      <View style={styles.bubble}>
        <Text style={[styles.bubbleText, { color: theme.bgCard }]}>{tip}</Text>
      </View>
      <Text style={styles.bubbleTail}>▼</Text>
      <Text style={styles.moneymong}>🐾</Text>
    </View>
  );
}

// ── 종목 행 ────────────────────────────────────
function StockRow({ stock, onPress }: { stock: Stock; onPress: () => void }) {
  const isUp = stock.change >= 0;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowLogo}>
        <Text style={styles.logoText}>{stock.logo}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTicker}>{stock.ticker}</Text>
        <Text style={styles.rowName}>{stock.name}</Text>
      </View>
      <View style={styles.rowPrice}>
        <Text style={styles.priceText}>
          {stock.krw ? `₩${Math.round(stock.price).toLocaleString()}` : `$${stock.price.toFixed(2)}`}
        </Text>
        <Text style={[styles.changeText, { color: isUp ? Colors.green : Colors.red }]}>
          {isUp ? '▲' : '▼'} {Math.abs(stock.change).toFixed(2)}%
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── 검색 화면 ──────────────────────────────────
export default function SearchScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const filtered = STOCKS.filter(s =>
    s.ticker.toUpperCase().includes(query.toUpperCase()) ||
    s.name.includes(query)
  );

  const handleSelect = useCallback((ticker: string) => {
    Keyboard.dismiss();
    navigation.navigate('종목상세', { ticker });
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={[Typography.h2, { flex: 1 }]}>종목 검색</Text>
      </View>

      {/* 검색창 */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="티커 또는 종목명 (예: AAPL, 삼성)"
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="characters"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 머니몽 말풍선 */}
      <MoneymongBubble visible={focused && query.length === 0} />

      {/* 결과 목록 */}
      <ScrollView
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {query.length === 0 && (
          <Text style={styles.sectionLabel}>전체 종목 ({STOCKS.length})</Text>
        )}
        {filtered.length === 0 ? (
          <EmptyState
            emoji="🔍"
            title={`"${query}"에 해당하는 종목이 없어`}
            desc="티커나 한글 이름으로 다시 검색해봐!"
          />
        ) : (
          filtered.map(stock => (
            <StockRow
              key={stock.ticker}
              stock={stock}
              onPress={() => handleSelect(stock.ticker)}
            />
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 8, gap: 8,
  },
  backBtn: { padding: 4, minWidth: 44, minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 22, color: Colors.primary, fontWeight: '600' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: 16, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, gap: 8,
    marginBottom: 8,
  },
  searchIcon: { fontSize: 16 },
  input: {
    flex: 1, fontSize: 15, color: Colors.text,
    minHeight: 24,
  },
  clearBtn: { fontSize: 14, color: Colors.textMuted, padding: 4 },

  // ── 머니몽 말풍선 ──
  bubbleWrap: {
    alignItems: 'center', paddingVertical: 8,
  },
  bubble: {
    backgroundColor: Colors.primary,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10,
    maxWidth: '80%',
  },
  bubbleText: {
    fontSize: 13, fontWeight: '600', textAlign: 'center',
  },
  bubbleTail: {
    color: Colors.primary, fontSize: 10, marginTop: -4,
  },
  moneymong: { fontSize: 28, marginTop: -2 },

  sectionLabel: {
    fontSize: 12, color: Colors.textSub, fontWeight: '600',
    paddingHorizontal: 16, paddingVertical: 8,
  },

  // ── 종목 행 ──
  list: { flex: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    minHeight: 64,
  },
  rowLogo: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 22 },
  rowInfo: { flex: 1 },
  rowTicker: { fontSize: 15, fontWeight: '700', color: Colors.text },
  rowName: { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  rowPrice: { alignItems: 'flex-end', gap: 3 },
  priceText: { fontSize: 14, fontWeight: '700', color: Colors.text, fontFamily: 'Courier' },
  changeText: { fontSize: 12, fontWeight: '600' },
});
