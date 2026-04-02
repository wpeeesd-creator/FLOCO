/**
 * TransactionDetailScreen — 거래 상세 정보
 */

import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../components/ui';
import { UnifiedTransaction } from './TransactionScreen';

type RouteParams = {
  거래상세: { transaction: UnifiedTransaction };
};

function formatKRW(amount: number): string {
  return `₩${Math.round(amount).toLocaleString()}`;
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface DetailRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

function DetailRow({ label, value, isLast }: DetailRowProps) {
  return (
    <View style={[styles.detailRow, !isLast && styles.detailRowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function TransactionDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, '거래상세'>>();
  const tx = route.params?.transaction;

  if (!tx) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>거래 상세</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 15, color: Colors.textSub }}>거래 정보를 찾을 수 없어요</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isTrade = tx.type === 'buy' || tx.type === 'sell';
  const isReward = tx.type === 'reward';

  const typeLabel =
    tx.type === 'buy' ? '매수' : tx.type === 'sell' ? '매도' : '학습 보상';

  const amountValue = isTrade
    ? (tx.price ?? 0) * (tx.qty ?? 0)
    : (tx.reward ?? 0);

  const amountColor =
    tx.type === 'buy' ? '#F04452'
    : tx.type === 'sell' ? '#2175F3'
    : '#34C759';

  const amountDisplay =
    tx.type === 'buy'
      ? `-${formatKRW(amountValue)}`
      : `+${formatKRW(amountValue)}`;

  const accuracyText =
    tx.correctCount != null && tx.totalCount != null && tx.totalCount > 0
      ? `${Math.round((tx.correctCount / tx.totalCount) * 100)}%`
      : null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>거래 상세</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {/* Large amount */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>{typeLabel}</Text>
            <Text style={[styles.amountValue, { color: amountColor }]}>
              {amountDisplay}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Detail rows */}
          <DetailRow label="거래 유형" value={typeLabel} />

          {isTrade ? (
            <>
              <DetailRow label="종목명" value={tx.stockName ?? tx.ticker ?? '-'} />
              <DetailRow label="수량" value={`${tx.qty ?? 0}주`} />
              <DetailRow label="주당 가격" value={formatKRW(tx.price ?? 0)} />
              <DetailRow label="수수료 (0.1%)" value={formatKRW(tx.fee ?? 0)} />
              <DetailRow label="실제 금액" value={formatKRW(amountValue)} />
            </>
          ) : (
            <>
              <DetailRow label="레슨명" value={tx.lessonTitle ?? '-'} />
              {accuracyText != null && (
                <DetailRow label="정답률" value={accuracyText} />
              )}
              <DetailRow label="획득 보상" value={`+${formatKRW(tx.reward ?? 0)}`} />
            </>
          )}

          <DetailRow label="거래 일시" value={formatDateTime(tx.timestamp)} isLast />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  // Header
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
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },

  scrollContent: { padding: 16, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  // Amount section
  amountSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.textSub,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },

  // Detail rows
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSub,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
});
