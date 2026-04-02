/**
 * ExchangeDetailScreen — 환전 거래 상세
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../components/ui';

interface ExchangeTransaction {
  type: 'krw_to_usd' | 'usd_to_krw';
  amount: number;
  currency: 'KRW' | 'USD';
  exchangeRate: number;
  date: number;
}

// Dummy data for UI demonstration
const DUMMY_TRANSACTION: ExchangeTransaction = {
  type: 'krw_to_usd',
  amount: 35.01,
  currency: 'USD',
  exchangeRate: 1391.35,
  date: Date.now() - 86400000,
};

function formatDateTime(timestamp: number): string {
  const d = new Date(timestamp);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
}

interface DetailRowProps {
  label: string;
  value: string;
  valueColor?: string;
  collapsible?: boolean;
}

function DetailRow({ label, value, valueColor, collapsible }: DetailRowProps) {
  const [expanded, setExpanded] = useState(false);

  if (collapsible) {
    return (
      <TouchableOpacity
        style={styles.detailRow}
        onPress={() => setExpanded(v => !v)}
        activeOpacity={0.8}
      >
        <Text style={styles.detailLabel}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={[styles.detailValue, valueColor ? { color: valueColor } : null]}>
            {value}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={Colors.textSub}
          />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

export default function ExchangeDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [showInHistory, setShowInHistory] = useState(true);

  const tx: ExchangeTransaction = route.params?.transaction ?? DUMMY_TRANSACTION;
  const isKrwToUsd = tx.type === 'krw_to_usd';

  const typeLabel = isKrwToUsd ? '달러로 환전' : '원화로 환전';
  const tradeTypeLabel = isKrwToUsd ? '환전거래(달러매수)' : '환전거래(달러판매)';

  const krwAmount = isKrwToUsd
    ? Math.round(tx.amount * tx.exchangeRate)
    : tx.amount;
  const usdAmount = isKrwToUsd
    ? tx.amount
    : tx.amount / tx.exchangeRate;

  const mainAmountStr = isKrwToUsd
    ? `-₩${Math.round(krwAmount).toLocaleString()}`
    : `+₩${Math.round(krwAmount).toLocaleString()}`;
  const mainColor = isKrwToUsd ? Colors.green : Colors.red;

  return (
    <SafeAreaView style={styles.root}>
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
        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Type + Amount */}
          <View style={styles.amountSection}>
            <Text style={styles.typeLabel}>{typeLabel}</Text>
            <Text style={[styles.mainAmount, { color: mainColor }]}>{mainAmountStr}</Text>
          </View>

          <View style={styles.divider} />

          {/* Detail rows */}
          <DetailRow label="거래유형" value={tradeTypeLabel} />
          <DetailRow label="환전거래일" value={formatDateTime(tx.date)} />
          <DetailRow
            label={isKrwToUsd ? '받은 달러' : '받은 원화'}
            value={isKrwToUsd
              ? `$${usdAmount.toFixed(2)}`
              : `₩${Math.round(krwAmount).toLocaleString()}`}
            valueColor={Colors.primary}
          />
          <DetailRow
            label={isKrwToUsd ? '낸 원화' : '낸 달러'}
            value={isKrwToUsd
              ? `₩${Math.round(krwAmount).toLocaleString()}`
              : `$${usdAmount.toFixed(2)}`}
          />
          <DetailRow
            label="적용환율"
            value={`${tx.exchangeRate.toLocaleString()} 원/달러`}
            collapsible
          />

          <View style={styles.divider} />

          {/* Toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>내역에서 보이기</Text>
            <Switch
              value={showInHistory}
              onValueChange={setShowInHistory}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

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

  contentCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  amountSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 14,
    color: Colors.textSub,
    marginBottom: 10,
  },
  mainAmount: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Courier',
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 0,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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

  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
});
