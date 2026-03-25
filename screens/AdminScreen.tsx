/**
 * 관리자 화면 — Firestore 기반 유저 관리 · 거래로그 · 데이터 수정
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getAllUserProfiles, getAllPortfolios, resetPortfolio,
  updatePortfolioBalance, deleteUserProfile,
  type UserProfile, type PortfolioSnapshot,
} from '../lib/firestoreService';
import { STOCKS } from '../store/appStore';
import { Colors, Typography, Badge, Card } from '../components/ui';

type AdminTab = 'users' | 'trades' | 'data';

const INITIAL_FUND = 1_000_000;

function calcTotal(snap: PortfolioSnapshot): number {
  const safeHoldings = snap.holdings ?? [];
  return safeHoldings.reduce((sum, h) => {
    const s = STOCKS.find(st => st.ticker === h.ticker);
    return sum + (s ? (s.price ?? 0) * (h.qty ?? 0) : 0);
  }, snap.cash ?? 0);
}

interface UserWithPortfolio {
  profile: UserProfile;
  portfolio: PortfolioSnapshot | null;
}

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<AdminTab>('users');
  const [data, setData] = useState<UserWithPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editItem, setEditItem] = useState<UserWithPortfolio | null>(null);
  const [editCash, setEditCash] = useState('');
  const [tradeFilter, setTradeFilter] = useState('');

  const load = useCallback(async () => {
    try {
      const [profiles, portfolios] = await Promise.all([
        getAllUserProfiles(),
        getAllPortfolios(),
      ]);
      const merged: UserWithPortfolio[] = profiles.map(p => ({
        profile: p,
        portfolio: portfolios.find(pf => pf.uid === p.uid) ?? null,
      }));
      setData(merged);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  // 모든 거래 합산
  const allTrades = data.flatMap(d =>
    (d.portfolio?.trades ?? []).map(t => ({
      ...t,
      userName: d.profile.name,
      userEmail: d.profile.email,
    }))
  ).sort((a, b) => b.timestamp - a.timestamp);

  const filteredTrades = tradeFilter
    ? allTrades.filter(t =>
        t.userName.includes(tradeFilter) ||
        t.ticker.toUpperCase().includes(tradeFilter.toUpperCase()) ||
        t.userEmail.includes(tradeFilter)
      )
    : allTrades;

  async function handleSaveBalance() {
    if (!editItem) return;
    const val = parseFloat(editCash.replace(/,/g, ''));
    if (isNaN(val) || val < 0) { Alert.alert('오류', '올바른 금액을 입력해주세요.'); return; }
    await updatePortfolioBalance(editItem.profile.uid, val);
    setEditItem(null);
    Alert.alert('완료', '잔고가 수정되었어요.');
    load();
  }

  async function handleReset(item: UserWithPortfolio) {
    Alert.alert(
      '데이터 초기화',
      `${item.profile.name}님의 데이터를 초기화할까요?\n(초기자금 100만원으로 리셋)`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화', style: 'destructive',
          onPress: async () => {
            await resetPortfolio(item.profile.uid, item.profile.name, item.profile.email);
            Alert.alert('완료', '초기화되었어요.');
            load();
          }
        },
      ]
    );
  }

  async function handleDelete(item: UserWithPortfolio) {
    Alert.alert(
      '계정 삭제',
      `${item.profile.name}님의 계정을 삭제할까요? 되돌릴 수 없어요.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제', style: 'destructive',
          onPress: async () => {
            await deleteUserProfile(item.profile.uid);
            Alert.alert('완료', '삭제되었어요.');
            load();
          }
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>관리자 🛡️</Text>
        <Text style={styles.headerSub}>{data.length}명 등록</Text>
      </View>

      {/* 탭 */}
      <View style={styles.tabBar}>
        {(['users', 'trades', 'data'] as AdminTab[]).map(t => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'users' ? '사용자' : t === 'trades' ? '거래로그' : '데이터수정'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* ── 사용자 탭 ── */}
        {tab === 'users' && (
          <View style={styles.section}>
            {data.map(item => {
              const snap = item.portfolio;
              const total = snap ? calcTotal(snap) : INITIAL_FUND;
              const returnRate = ((total - INITIAL_FUND) / INITIAL_FUND) * 100;
              return (
                <Card key={item.profile.uid} style={styles.userCard}>
                  <View style={styles.userTop}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{item.profile.name[0]?.toUpperCase() ?? '?'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        <Text style={[Typography.body1, { fontWeight: '700' }]}>{item.profile.name}</Text>
                        <Badge
                          label={item.profile.role === 'admin' ? '관리자' : '일반'}
                          type={item.profile.role === 'admin' ? 'warning' : 'default'}
                          size="sm"
                        />
                      </View>
                      <Text style={Typography.caption}>{item.profile.email}</Text>
                    </View>
                  </View>
                  <View style={styles.statRow}>
                    <Stat label="총 자산" value={`₩${Math.round(total).toLocaleString()}`} />
                    <Stat label="수익률" value={`${returnRate >= 0 ? '+' : ''}${returnRate.toFixed(2)}%`} color={returnRate >= 0 ? Colors.green : Colors.red} />
                    <Stat label="거래" value={`${snap?.trades.length ?? 0}건`} />
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => { setEditItem(item); setEditCash(String(Math.round(snap?.cash ?? INITIAL_FUND))); }}>
                      <Text style={styles.actionBtnText}>💰 잔고</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFF3E0' }]} onPress={() => handleReset(item)}>
                      <Text style={[styles.actionBtnText, { color: Colors.gold }]}>🔄 초기화</Text>
                    </TouchableOpacity>
                    {item.profile.role !== 'admin' && (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFF0F0' }]} onPress={() => handleDelete(item)}>
                        <Text style={[styles.actionBtnText, { color: Colors.red }]}>🗑️ 삭제</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Card>
              );
            })}
            {data.length === 0 && <EmptyState icon="👥" text="등록된 사용자가 없어요" />}
          </View>
        )}

        {/* ── 거래로그 탭 ── */}
        {tab === 'trades' && (
          <View style={styles.section}>
            <TextInput
              style={styles.searchInput}
              placeholder="이름 · 티커 · 이메일 검색"
              value={tradeFilter}
              onChangeText={setTradeFilter}
            />
            {filteredTrades.map((t, i) => {
              const stock = STOCKS.find(s => s.ticker === t.ticker);
              const total = t.price * t.qty;
              return (
                <Card key={`${t.id}-${i}`} style={{ padding: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[Typography.body2, { fontWeight: '700' }]}>{t.userName} · {t.ticker}</Text>
                      <Text style={Typography.caption}>{new Date(t.timestamp).toLocaleString('ko-KR')}</Text>
                    </View>
                    <Badge label={t.type === 'buy' ? '매수' : '매도'} type={t.type === 'buy' ? 'success' : 'danger'} size="sm" />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={Typography.caption}>{t.qty}주 × {stock?.krw ? `₩${t.price.toLocaleString()}` : `$${t.price.toFixed(2)}`}</Text>
                    <Text style={[Typography.body2, { fontWeight: '700', color: t.type === 'buy' ? Colors.red : Colors.green }]}>
                      {t.type === 'buy' ? '-' : '+'}{stock?.krw ? `₩${Math.round(total).toLocaleString()}` : `$${total.toFixed(2)}`}
                    </Text>
                  </View>
                </Card>
              );
            })}
            {filteredTrades.length === 0 && <EmptyState icon="📋" text="거래 내역이 없어요" />}
          </View>
        )}

        {/* ── 데이터수정 탭 ── */}
        {tab === 'data' && (
          <View style={styles.section}>
            <Card style={{ padding: 16, gap: 12 }}>
              <Text style={Typography.h3}>전체 통계</Text>
              <View style={styles.statGrid}>
                <Stat label="총 참가자" value={`${data.length}명`} />
                <Stat label="총 거래" value={`${allTrades.length}건`} />
                <Stat label="매수" value={`${allTrades.filter(t => t.type === 'buy').length}건`} />
                <Stat label="매도" value={`${allTrades.filter(t => t.type === 'sell').length}건`} />
              </View>
            </Card>

            <Card style={{ padding: 16, borderWidth: 1.5, borderColor: Colors.red }}>
              <Text style={[Typography.h3, { color: Colors.red, marginBottom: 4 }]}>⚠️ 전체 데이터 초기화</Text>
              <Text style={[Typography.caption, { marginBottom: 12 }]}>모든 참가자를 초기자금 100만원으로 리셋합니다.</Text>
              <TouchableOpacity
                style={{ backgroundColor: Colors.red, borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
                onPress={() =>
                  Alert.alert('전체 초기화', '모든 참가자 데이터를 초기화할까요?', [
                    { text: '취소', style: 'cancel' },
                    {
                      text: '전체 초기화', style: 'destructive',
                      onPress: async () => {
                        await Promise.all(data.map(d => resetPortfolio(d.profile.uid, d.profile.name, d.profile.email)));
                        Alert.alert('완료', '전체 데이터가 초기화되었어요.');
                        load();
                      }
                    },
                  ])
                }
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>전체 초기화</Text>
              </TouchableOpacity>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* 잔고 수정 모달 */}
      <Modal visible={!!editItem} transparent animationType="slide" onRequestClose={() => setEditItem(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setEditItem(null)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <Text style={[Typography.h3, { marginBottom: 6 }]}>잔고 수정</Text>
            <Text style={[Typography.caption, { marginBottom: 14 }]}>{editItem?.profile.name}</Text>
            <TextInput
              style={styles.modalInput}
              value={editCash}
              onChangeText={setEditCash}
              keyboardType="numeric"
              placeholder="금액 입력 (원)"
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#EEF2F7' }]} onPress={() => setEditItem(null)}>
                <Text style={{ fontWeight: '700', color: Colors.textSub }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.primary, flex: 2 }]} onPress={handleSaveBalance}>
                <Text style={{ fontWeight: '700', color: '#fff' }}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 10, color: Colors.textSub }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '700', color: color ?? Colors.text, marginTop: 2 }}>{value}</Text>
    </View>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 50, gap: 8 }}>
      <Text style={{ fontSize: 40 }}>{icon}</Text>
      <Text style={{ fontSize: 15, color: Colors.textSub, fontWeight: '500' }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textSub },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: 16,
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2.5, borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  tabTextActive: { color: Colors.primary },
  section: { padding: 16, gap: 10 },
  userCard: { padding: 14, gap: 10 },
  userTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  statRow: { flexDirection: 'row', backgroundColor: Colors.bg, borderRadius: 8, padding: 10 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, backgroundColor: '#EAF4FF', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  searchInput: {
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, borderWidth: 1, borderColor: Colors.border,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 44, gap: 12,
  },
  modalInput: {
    backgroundColor: Colors.bg, borderRadius: 10, padding: 14,
    fontSize: 15, borderWidth: 1, borderColor: Colors.border,
  },
  modalBtn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
});
