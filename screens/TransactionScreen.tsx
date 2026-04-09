/**
 * TransactionScreen — 거래내역 (매수/매도/보상 통합)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { STOCKS } from '../store/appStore';
import { Colors } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import StockLogo from '../components/StockLogo';

export interface UnifiedTransaction {
  id: string;
  type: 'buy' | 'sell' | 'reward';
  ticker?: string;
  stockName?: string;
  qty?: number;
  price?: number;
  fee?: number;
  lessonTitle?: string;
  reward?: number;
  correctCount?: number;
  totalCount?: number;
  timestamp: number;
}

type FilterTab = '전체' | '매수' | '매도' | '보상';

const FILTER_TABS: FilterTab[] = ['전체', '매수', '매도', '보상'];

function formatDateGroup(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatKRW(amount: number): string {
  return `₩${Math.round(amount).toLocaleString()}`;
}

const EMPTY_MESSAGES: Record<FilterTab, { emoji: string; title: string; desc: string }> = {
  '전체': { emoji: '📋', title: '아직 거래 내역이 없어요', desc: '투자나 학습을 시작하면 여기에 표시돼요' },
  '매수': { emoji: '📈', title: '매수 내역이 없어요', desc: '종목을 매수하면 여기에 표시돼요' },
  '매도': { emoji: '📉', title: '매도 내역이 없어요', desc: '종목을 매도하면 여기에 표시돼요' },
  '보상': { emoji: '🎓', title: '학습 보상 내역이 없어요', desc: '퀴즈를 완료하면 보상을 받을 수 있어요' },
};

export default function TransactionScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>('전체');
  const [unified, setUnified] = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Firestore 실시간 구독 — transactions + rewardHistory
  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }

    const unsubscribe = onSnapshot(doc(db, 'users', user.id), (snap) => {
      if (!snap.exists()) { setUnified([]); setLoading(false); return; }
      const data = snap.data();

      // 매수/매도 거래
      const tradeTxs: UnifiedTransaction[] = (Array.isArray(data.transactions) ? data.transactions : [])
        .map((t: any, i: number) => {
          const stock = STOCKS.find(s => s.ticker === t.ticker);
          return {
            id: t.id ?? `tx_${i}`,
            type: t.type as 'buy' | 'sell',
            ticker: t.ticker,
            stockName: t.stockName ?? stock?.name ?? t.ticker,
            qty: t.quantity ?? t.qty,
            price: t.price,
            fee: t.fee,
            timestamp: t.createdAt ? new Date(t.createdAt).getTime() : Date.now(),
          };
        });

      // 학습 보상
      const rewardTxs: UnifiedTransaction[] = (Array.isArray(data.rewardHistory) ? data.rewardHistory : [])
        .map((r: any, i: number) => ({
          id: r.id ?? `reward_${i}`,
          type: 'reward' as const,
          lessonTitle: r.lessonTitle ?? r.title ?? '학습 완료',
          reward: r.reward ?? r.amount ?? 0,
          correctCount: r.correctCount,
          totalCount: r.totalCount,
          timestamp: r.timestamp ?? (r.createdAt ? new Date(r.createdAt).getTime() : Date.now()),
        }));

      const merged = [...tradeTxs, ...rewardTxs].sort((a, b) => b.timestamp - a.timestamp);
      setUnified(merged);
      setLoading(false);
      setRefreshing(false);
    }, () => { setLoading(false); });

    return () => unsubscribe();
  }, [user?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // onSnapshot이 자동으로 업데이트하므로 타이머로 해제
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filtered = unified.filter(tx => {
    if (activeTab === '전체') return true;
    if (activeTab === '매수') return tx.type === 'buy';
    if (activeTab === '매도') return tx.type === 'sell';
    if (activeTab === '보상') return tx.type === 'reward';
    return true;
  });

  // Summary calculations
  const totalCount = unified.length;
  const totalBuy = unified.filter(t => t.type === 'buy').reduce((s, t) => s + (t.price ?? 0) * (t.qty ?? 0), 0);
  const totalSell = unified.filter(t => t.type === 'sell').reduce((s, t) => s + (t.price ?? 0) * (t.qty ?? 0), 0);
  const totalReward = unified.filter(t => t.type === 'reward').reduce((s, t) => s + (t.reward ?? 0), 0);

  // Group by date
  const grouped: { date: string; items: UnifiedTransaction[] }[] = [];
  filtered.forEach(tx => {
    const dateLabel = formatDateGroup(tx.timestamp);
    const existing = grouped.find(g => g.date === dateLabel);
    if (existing) {
      existing.items.push(tx);
    } else {
      grouped.push({ date: dateLabel, items: [tx] });
    }
  });

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
        <Text style={styles.headerTitle}>거래내역</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>총 거래</Text>
                <Text style={[styles.summaryValue, { color: Colors.primary }]}>{totalCount}건</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>총 매수</Text>
                <Text style={[styles.summaryValue, { color: theme.red }]}>{formatKRW(totalBuy)}</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>총 매도</Text>
                <Text style={[styles.summaryValue, { color: '#2175F3' }]}>{formatKRW(totalSell)}</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>학습 보상</Text>
                <Text style={[styles.summaryValue, { color: theme.green }]}>{formatKRW(totalReward)}</Text>
              </View>
            </View>
          </View>

          {/* Date-grouped list */}
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>{EMPTY_MESSAGES[activeTab].emoji}</Text>
              <Text style={styles.emptyTitle}>{EMPTY_MESSAGES[activeTab].title}</Text>
              <Text style={styles.emptyDesc}>{EMPTY_MESSAGES[activeTab].desc}</Text>
            </View>
          ) : (
            grouped.map(group => (
              <View key={group.date}>
                <Text style={styles.dateHeader}>{group.date}</Text>
                <View style={styles.groupCard}>
                  {group.items.map((tx, idx) => (
                    <TouchableOpacity
                      key={tx.id}
                      style={[
                        styles.txRow,
                        idx < group.items.length - 1 && styles.txRowDivider,
                      ]}
                      onPress={() => navigation.navigate('거래상세', { transaction: tx })}
                      activeOpacity={0.75}
                    >
                      {/* Icon circle */}
                      <View style={[
                        styles.iconCircle,
                        {
                          backgroundColor:
                            tx.type === 'buy' ? '#FFF0F0'
                            : tx.type === 'sell' ? '#F0F4FF'
                            : '#F0FFF4',
                        },
                      ]}>
                        <Text style={styles.iconEmoji}>
                          {tx.type === 'buy' ? '📈' : tx.type === 'sell' ? '📉' : '🎓'}
                        </Text>
                      </View>

                      {/* Middle */}
                      <View style={styles.txMiddle}>
                        <Text style={styles.txName} numberOfLines={1}>
                          {tx.type === 'reward' ? tx.lessonTitle : tx.stockName}
                        </Text>
                        <Text style={styles.txSub}>
                          {tx.type === 'buy'
                            ? `매수 ${tx.qty}주`
                            : tx.type === 'sell'
                            ? `매도 ${tx.qty}주`
                            : tx.totalCount != null && tx.correctCount != null
                            ? `정답률 ${Math.round((tx.correctCount / tx.totalCount) * 100)}%`
                            : '학습 완료'}
                        </Text>
                      </View>

                      {/* Right */}
                      <View style={styles.txRight}>
                        <Text style={[
                          styles.txAmount,
                          {
                            color:
                              tx.type === 'buy' ? theme.red
                              : tx.type === 'sell' ? '#2175F3'
                              : theme.green,
                          },
                        ]}>
                          {tx.type === 'buy'
                            ? `-${formatKRW((tx.price ?? 0) * (tx.qty ?? 0))}`
                            : tx.type === 'sell'
                            ? `+${formatKRW((tx.price ?? 0) * (tx.qty ?? 0))}`
                            : `+${formatKRW(tx.reward ?? 0)}`}
                        </Text>
                        <Text style={styles.txTime}>{formatTime(tx.timestamp)}</Text>
                      </View>

                      <Ionicons name="chevron-forward" size={16} color={Colors.textSub} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
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

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '500', color: Colors.textSub },
  tabTextActive: { color: Colors.text, fontWeight: '700' },

  scrollContent: { paddingBottom: 40 },

  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Summary Card
  summaryCard: {
    margin: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryBox: {
    width: '47%',
    backgroundColor: Colors.bg,
    borderRadius: 12,
    padding: 12,
  },
  summaryLabel: { fontSize: 12, color: Colors.textSub, marginBottom: 4 },
  summaryValue: { fontSize: 15, fontWeight: '700' },

  // Date header
  dateHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSub,
  },

  // Group card
  groupCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Transaction row
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  txRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 20 },
  txMiddle: { flex: 1 },
  txName: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 3 },
  txSub: { fontSize: 12, color: Colors.textSub },
  txRight: { alignItems: 'flex-end', marginRight: 4 },
  txAmount: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  txTime: { fontSize: 11, color: Colors.textSub },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptyDesc: { fontSize: 13, color: Colors.textSub, marginTop: 4 },
});
