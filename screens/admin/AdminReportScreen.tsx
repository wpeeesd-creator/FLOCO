/**
 * 관리자 — 신고 관리 화면
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import {
  getReports, resolveReport, suspendUser,
  type Report,
} from '../../lib/adminService';

const TARGET_LABELS: Record<string, string> = {
  post: '게시물',
  comment: '댓글',
  user: '유저',
};

const REASON_COLORS: Record<string, string> = {
  스팸: '#FF9500',
  욕설: '#FF3B30',
  불건전: '#AF52DE',
  허위정보: Colors.primary,
  기타: Colors.textSub,
};

export default function AdminReportScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [tab, setTab] = useState<'pending' | 'resolved'>('pending');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReports(tab === 'pending' ? 'pending' : undefined);
      setReports(
        tab === 'pending'
          ? data.filter(r => r.status === 'pending')
          : data.filter(r => r.status !== 'pending'),
      );
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const handleResolve = async (id: string, status: 'resolved' | 'dismissed') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await resolveReport(id, status);
      setReports(prev => prev.filter(r => r.id !== id));
    } catch {
      Alert.alert('오류', '처리에 실패했어요. 다시 시도해주세요.');
    }
  };

  const handleSuspend = (report: Report) => {
    Alert.alert(
      '유저 정지',
      `${report.reporterNickname} 의 신고 대상 유저를 정지합니다.\n정지 기간을 선택해주세요.`,
      [
        { text: '1일', onPress: () => doSuspend(report, 1) },
        { text: '7일', onPress: () => doSuspend(report, 7) },
        { text: '30일', onPress: () => doSuspend(report, 30) },
        { text: '영구', style: 'destructive', onPress: () => doSuspend(report, 3650) },
        { text: '취소', style: 'cancel' },
      ],
    );
  };

  const doSuspend = async (report: Report, days: number) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await suspendUser(report.targetId, days, report.reason);
      await resolveReport(report.id, 'resolved', `${days}일 정지 처리`);
      setReports(prev => prev.filter(r => r.id !== report.id));
    } catch {
      Alert.alert('오류', '정지 처리에 실패했어요.');
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: Report }) => {
    const isPending = item.status === 'pending';
    return (
      <View style={styles.card}>
        <View style={styles.cardBadgeRow}>
          <View style={styles.targetBadge}>
            <Text style={styles.targetBadgeText}>{TARGET_LABELS[item.targetType] ?? item.targetType}</Text>
          </View>
          <View style={[styles.reasonBadge, { backgroundColor: (REASON_COLORS[item.reason] ?? Colors.textSub) + '20' }]}>
            <Text style={[styles.reasonBadgeText, { color: REASON_COLORS[item.reason] ?? Colors.textSub }]}>
              {item.reason}
            </Text>
          </View>
        </View>

        <View style={styles.contentPreview}>
          <Text style={styles.contentText} numberOfLines={2}>
            {item.targetContent || '(내용 없음)'}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>신고자: {item.reporterNickname}</Text>
          <Text style={styles.metaText}>{formatTime(item.createdAt)}</Text>
        </View>

        {isPending ? (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnGreen]}
              onPress={() => handleResolve(item.id, 'resolved')}
            >
              <Text style={[styles.actionBtnText, { color: theme.green }]}>✅ 삭제 처리</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnRed]}
              onPress={() => handleSuspend(item)}
            >
              <Text style={[styles.actionBtnText, { color: '#FF3B30' }]}>🚫 유저 정지</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnGray]}
              onPress={() => handleResolve(item.id, 'dismissed')}
            >
              <Text style={[styles.actionBtnText, { color: Colors.textSub }]}>❌ 기각</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statusRow}>
            {item.status === 'resolved' ? (
              <View style={[styles.statusBadge, { backgroundColor: '#E8F8EE' }]}>
                <Text style={[styles.statusBadgeText, { color: theme.green }]}>처리완료</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: Colors.bg }]}>
                <Text style={[styles.statusBadgeText, { color: Colors.textSub }]}>기각</Text>
              </View>
            )}
            {item.adminMemo ? (
              <Text style={styles.memoText}>{item.adminMemo}</Text>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.card,
      borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    tabRow: {
      flexDirection: 'row', backgroundColor: Colors.card,
      borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
    tabText: { fontSize: 15, fontWeight: '600', color: Colors.textSub },
    tabTextActive: { color: Colors.primary },
    tabUnderline: {
      position: 'absolute', bottom: 0, left: '15%', right: '15%',
      height: 2, backgroundColor: Colors.primary, borderRadius: 1,
    },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    listContent: { padding: 16, gap: 12 },
    card: {
      backgroundColor: Colors.card, borderRadius: 12, padding: 16,
      shadowColor: theme.text, shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    cardBadgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    targetBadge: {
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
      backgroundColor: Colors.primary + '15',
    },
    targetBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
    reasonBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    reasonBadgeText: { fontSize: 11, fontWeight: '700' },
    contentPreview: {
      backgroundColor: Colors.bg, borderRadius: 8, padding: 10, marginBottom: 10,
    },
    contentText: { fontSize: 13, color: Colors.text, lineHeight: 18 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    metaText: { fontSize: 12, color: Colors.textSub },
    actionRow: { flexDirection: 'row', gap: 8 },
    actionBtn: {
      flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5,
      alignItems: 'center', justifyContent: 'center',
    },
    actionBtnGreen: { borderColor: theme.green },
    actionBtnRed: { borderColor: '#FF3B30' },
    actionBtnGray: { borderColor: Colors.border },
    actionBtnText: { fontSize: 12, fontWeight: '700' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusBadgeText: { fontSize: 12, fontWeight: '700' },
    memoText: { fontSize: 12, color: Colors.textSub, flex: 1 },
    emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 8 },
    emptyEmoji: { fontSize: 36 },
    emptyText: { fontSize: 15, color: Colors.textSub, fontWeight: '500' },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>신고 관리</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 탭 */}
      <View style={styles.tabRow}>
        {(['pending', 'resolved'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={styles.tabItem}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'pending' ? '미처리' : '처리완료'}
            </Text>
            {tab === t && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {loading && reports.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>
                {tab === 'pending' ? '미처리 신고가 없어요' : '처리된 신고가 없어요'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

