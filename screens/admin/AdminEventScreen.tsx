/**
 * 관리자 — 이벤트 관리 화면
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, RefreshControl, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import {
  getEvents, createEvent, deleteEvent,
  type AppEvent, type EventType,
} from '../../lib/adminService';

const TYPE_LABELS: Record<EventType, string> = {
  profit_rate: '수익률 챌린지',
  trade_count: '거래 횟수',
  learning_streak: '학습 스트릭',
};


const STATUS_LABELS: Record<string, string> = {
  active: '진행중',
  upcoming: '예정',
  ended: '종료',
};

export default function AdminEventScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const STATUS_COLORS: Record<string, string> = {
    active: theme.green,
    upcoming: '#FF9500',
    ended: Colors.textSub,
  };
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // 폼 상태
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EventType>('profit_rate');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reward1, setReward1] = useState('');
  const [reward2, setReward2] = useState('');
  const [reward3, setReward3] = useState('');
  const [creating, setCreating] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEvents();
      setEvents(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const parseDate = (str: string): number => {
    // MM/DD 형식 파싱, 현재 연도 사용
    const parts = str.split('/');
    if (parts.length === 2) {
      const year = new Date().getFullYear();
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    return Date.now();
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('알림', '이벤트 제목을 입력해주세요.');
      return;
    }
    if (!startDate.trim() || !endDate.trim()) {
      Alert.alert('알림', '시작일과 종료일을 입력해주세요. (MM/DD 형식)');
      return;
    }

    setCreating(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const rewards = [
        { rank: 1, amount: parseInt(reward1, 10) || 0 },
        { rank: 2, amount: parseInt(reward2, 10) || 0 },
        { rank: 3, amount: parseInt(reward3, 10) || 0 },
      ].filter(r => r.amount > 0);

      await createEvent({
        title: title.trim(),
        description: description.trim(),
        type,
        startDate: parseDate(startDate),
        endDate: parseDate(endDate),
        rewards,
        status: 'upcoming',
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // 폼 초기화
      setTitle('');
      setDescription('');
      setType('profit_rate');
      setStartDate('');
      setEndDate('');
      setReward1('');
      setReward2('');
      setReward3('');
      setShowCreate(false);
      await loadEvents();
    } catch {
      Alert.alert('오류', '이벤트 생성에 실패했어요. 다시 시도해주세요.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (event: AppEvent) => {
    Alert.alert(
      '이벤트 삭제',
      `"${event.title}" 이벤트를 삭제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(event.id);
              setEvents(prev => prev.filter(e => e.id !== event.id));
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch {
              Alert.alert('오류', '삭제에 실패했어요.');
            }
          },
        },
      ],
    );
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('ko-KR');

  const EVENT_TYPES: EventType[] = ['profit_rate', 'trade_count', 'learning_streak'];

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.card,
      borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    createBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, gap: 12 },
    loadingWrap: { paddingVertical: 40, alignItems: 'center' },

    // 생성 폼
    createForm: {
      backgroundColor: Colors.card, borderRadius: 12, padding: 16,
      shadowColor: theme.text, shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
      gap: 4,
    },
    formTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10 },
    inputLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSub, marginBottom: 4, marginTop: 8 },
    textInput: {
      borderWidth: 1, borderColor: Colors.border, borderRadius: 8,
      paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text,
      backgroundColor: Colors.bg,
    },
    textArea: { minHeight: 72, textAlignVertical: 'top' },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    typePill: {
      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
      borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg,
    },
    typePillActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
    typePillText: { fontSize: 12, fontWeight: '600', color: Colors.textSub },
    typePillTextActive: { color: Colors.primary },
    dateRow: { flexDirection: 'row', gap: 10 },
    dateField: { flex: 1 },
    rewardRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    rewardField: { flex: 1 },
    rewardRankLabel: { fontSize: 12, fontWeight: '600', color: Colors.text, marginBottom: 4 },
    createSubmitBtn: {
      backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 14,
      alignItems: 'center', marginTop: 16,
    },
    createSubmitText: { color: theme.bgCard, fontSize: 16, fontWeight: '700' },

    // 이벤트 카드
    eventCard: {
      backgroundColor: Colors.card, borderRadius: 12, padding: 16,
      shadowColor: theme.text, shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
      gap: 6,
    },
    eventCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusBadgeText: { fontSize: 12, fontWeight: '700' },
    deleteBtn: { padding: 6 },
    eventTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
    eventDesc: { fontSize: 13, color: Colors.textSub, lineHeight: 18 },
    typeBadge: {
      alignSelf: 'flex-start',
      backgroundColor: Colors.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    },
    typeBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
    eventPeriod: { fontSize: 12, color: Colors.textSub },
    eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    participantText: { fontSize: 13, color: Colors.textSub },
    rewardText: { fontSize: 13, fontWeight: '700', color: Colors.text },

    // 빈 상태
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
        <Text style={styles.headerTitle}>이벤트 관리</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setShowCreate(v => !v)}
        >
          <Ionicons name={showCreate ? 'close' : 'add'} size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 이벤트 생성 폼 */}
          {showCreate && (
            <View style={styles.createForm}>
              <Text style={styles.formTitle}>새 이벤트 만들기</Text>

              <Text style={styles.inputLabel}>이벤트 제목</Text>
              <TextInput
                style={styles.textInput}
                placeholder="이벤트 제목을 입력하세요"
                placeholderTextColor={Colors.textSub}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>설명</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="이벤트 설명을 입력하세요"
                placeholderTextColor={Colors.textSub}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>이벤트 유형</Text>
              <View style={styles.typeRow}>
                {EVENT_TYPES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typePill, type === t && styles.typePillActive]}
                    onPress={() => setType(t)}
                  >
                    <Text style={[styles.typePillText, type === t && styles.typePillTextActive]}>
                      {TYPE_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.dateRow}>
                <View style={styles.dateField}>
                  <Text style={styles.inputLabel}>시작일</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="MM/DD"
                    placeholderTextColor={Colors.textSub}
                    value={startDate}
                    onChangeText={setStartDate}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
                <View style={styles.dateField}>
                  <Text style={styles.inputLabel}>종료일</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="MM/DD"
                    placeholderTextColor={Colors.textSub}
                    value={endDate}
                    onChangeText={setEndDate}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>리워드</Text>
              <View style={styles.rewardRow}>
                <View style={styles.rewardField}>
                  <Text style={styles.rewardRankLabel}>🥇 1등</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="₩ 금액"
                    placeholderTextColor={Colors.textSub}
                    value={reward1}
                    onChangeText={setReward1}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.rewardField}>
                  <Text style={styles.rewardRankLabel}>🥈 2등</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="₩ 금액"
                    placeholderTextColor={Colors.textSub}
                    value={reward2}
                    onChangeText={setReward2}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.rewardField}>
                  <Text style={styles.rewardRankLabel}>🥉 3등</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="₩ 금액"
                    placeholderTextColor={Colors.textSub}
                    value={reward3}
                    onChangeText={setReward3}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.createSubmitBtn, creating && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color={theme.bgCard} />
                ) : (
                  <Text style={styles.createSubmitText}>이벤트 생성</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* 이벤트 목록 */}
          {loading && events.length === 0 ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : events.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🎪</Text>
              <Text style={styles.emptyText}>등록된 이벤트가 없어요</Text>
            </View>
          ) : (
            events.map(event => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventCardTop}>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[event.status] + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[event.status] }]}>
                      {STATUS_LABELS[event.status]}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(event)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.eventTitle}>{event.title}</Text>
                {event.description ? (
                  <Text style={styles.eventDesc} numberOfLines={2}>{event.description}</Text>
                ) : null}

                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{TYPE_LABELS[event.type]}</Text>
                </View>

                <Text style={styles.eventPeriod}>
                  {formatDate(event.startDate)} ~ {formatDate(event.endDate)}
                </Text>

                <View style={styles.eventFooter}>
                  <Text style={styles.participantText}>
                    참여자 {event.participants?.length ?? 0}명
                  </Text>
                  {event.rewards?.length > 0 && (
                    <Text style={styles.rewardText}>
                      1등: ₩{(event.rewards[0]?.amount ?? 0).toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

