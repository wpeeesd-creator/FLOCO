/**
 * 이벤트 & 챌린지 메인 화면
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/ui';
import { getEvents, joinEvent, type AppEvent } from '../lib/adminService';

// ── 더미 데이터 ────────────────────────────────────
const DUMMY_EVENTS: AppEvent[] = [
  {
    id: 'event_1',
    title: '🏆 3월 수익률 챌린지',
    description: '이번 달 가장 높은 수익률을 달성한 투자자에게 보상을 드립니다!',
    type: 'profit_rate',
    startDate: Date.now() - 86400000 * 27,
    endDate: Date.now() + 86400000 * 3,
    rewards: [{ rank: 1, amount: 500000 }, { rank: 2, amount: 300000 }, { rank: 3, amount: 100000 }],
    participants: [],
    status: 'active',
    createdAt: Date.now() - 86400000 * 27,
  },
  {
    id: 'event_2',
    title: '📚 7일 연속 학습 챌린지',
    description: '7일 연속으로 학습을 완료하면 보상을 드려요!',
    type: 'learning_streak',
    startDate: Date.now() - 86400000 * 3,
    endDate: Date.now() + 86400000 * 33,
    rewards: [{ rank: 1, amount: 200000 }, { rank: 2, amount: 100000 }, { rank: 3, amount: 50000 }],
    participants: [],
    status: 'active',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'event_3',
    title: '💰 거래왕 챌린지',
    description: '이번 주 가장 많이 거래한 투자자에게 보상!',
    type: 'trade_count',
    startDate: Date.now() - 86400000 * 4,
    endDate: Date.now() + 86400000 * 2,
    rewards: [{ rank: 1, amount: 150000 }, { rank: 2, amount: 80000 }, { rank: 3, amount: 30000 }],
    participants: [],
    status: 'active',
    createdAt: Date.now() - 86400000 * 4,
  },
];

const REWARD_EMOJIS = ['🥇', '🥈', '🥉'];

// ── 유틸 ──────────────────────────────────────────
function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getDaysLeft(endDate: number): string {
  const days = Math.ceil((endDate - Date.now()) / 86400000);
  return days > 0 ? `D-${days}` : '마감';
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

// ── 이벤트 카드 ───────────────────────────────────
interface EventCardProps {
  event: AppEvent;
  userId: string | undefined;
  onJoin: (eventId: string) => void;
  onPress: (event: AppEvent) => void;
}

function EventCard({ event, userId, onJoin, onPress }: EventCardProps) {
  const isJoined = userId ? event.participants.includes(userId) : false;
  const daysLeft = getDaysLeft(event.endDate);

  const badgeStyle =
    event.status === 'active'
      ? styles.badgeActive
      : event.status === 'upcoming'
      ? styles.badgeUpcoming
      : styles.badgeEnded;

  const badgeText =
    event.status === 'active' ? '진행중' : event.status === 'upcoming' ? '예정' : '종료';

  const isEnded = event.status === 'ended';

  return (
    <TouchableOpacity
      style={[styles.card, isEnded && styles.cardEnded]}
      onPress={() => onPress(event)}
      activeOpacity={0.85}
    >
      {/* 제목 + 상태 뱃지 */}
      <View style={styles.cardTitleRow}>
        <Text style={[styles.cardTitle, isEnded && styles.textMuted]} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={[styles.badge, badgeStyle]}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      </View>

      {/* 설명 */}
      <Text style={styles.cardDesc} numberOfLines={2}>
        {event.description}
      </Text>

      {/* 보상 */}
      <View style={styles.rewardsRow}>
        {event.rewards.slice(0, 3).map((r, i) => (
          <View key={r.rank} style={styles.rewardItem}>
            <Text style={styles.rewardEmoji}>{REWARD_EMOJIS[i] ?? ''}</Text>
            <Text style={styles.rewardAmount}>{formatAmount(r.amount)}</Text>
            <Text style={styles.rewardRank}>{r.rank}위</Text>
          </View>
        ))}
      </View>

      {/* 하단 행: 마감일 + 버튼 */}
      <View style={styles.cardFooter}>
        <Text style={styles.deadlineText}>
          {isEnded ? `종료: ${formatDate(event.endDate)}` : `마감 ${daysLeft} · ${formatDate(event.endDate)}`}
        </Text>
        {!isEnded && (
          <TouchableOpacity
            style={[styles.joinBtn, isJoined && styles.joinBtnJoined]}
            onPress={(e) => {
              e.stopPropagation();
              if (!isJoined) onJoin(event.id);
            }}
            activeOpacity={0.8}
            disabled={isJoined}
          >
            <Text style={[styles.joinBtnText, isJoined && styles.joinBtnTextJoined]}>
              {isJoined ? '참여중 ✅' : '참여하기'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── 메인 화면 ─────────────────────────────────────
export default function EventScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const fetched = await getEvents();
      setEvents(fetched.length > 0 ? fetched : DUMMY_EVENTS);
    } catch {
      setEvents(DUMMY_EVENTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadEvents();
  }, [loadEvents]);

  const handleJoinEvent = async (eventId: string) => {
    if (!user?.id) return;
    try {
      setEvents(prev =>
        prev.map(e =>
          e.id === eventId ? { ...e, participants: [...e.participants, user.id] } : e,
        ),
      );
      try {
        await joinEvent(eventId, user.id);
      } catch {}
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('참여 완료!', '이벤트에 참여했어요! 열심히 투자하세요!');
    } catch {}
  };

  const handlePressEvent = (event: AppEvent) => {
    navigation.navigate('이벤트상세', { event });
  };

  const activeEvents = events.filter(e => e.status === 'active');
  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const endedEvents = events.filter(e => e.status === 'ended');

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>이벤트 & 챌린지 🏆</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ fontSize: 14, color: Colors.textSub, marginTop: 12 }}>이벤트를 불러오는 중...</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🏆</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text }}>아직 진행 중인 이벤트가 없어요</Text>
          <Text style={{ fontSize: 14, color: Colors.textSub, marginTop: 6 }}>곧 새로운 이벤트가 열릴 예정이에요!</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          <Text style={styles.subtitle}>참여하고 보상을 받아보세요!</Text>

          {/* 진행중 */}
          {activeEvents.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>🔴 진행중</Text>
              {activeEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  userId={user?.id}
                  onJoin={handleJoinEvent}
                  onPress={handlePressEvent}
                />
              ))}
            </>
          )}

          {/* 예정된 이벤트 */}
          {upcomingEvents.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>📅 예정된 이벤트</Text>
              {upcomingEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  userId={user?.id}
                  onJoin={handleJoinEvent}
                  onPress={handlePressEvent}
                />
              ))}
            </>
          )}

          {/* 종료된 이벤트 */}
          {endedEvents.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>✅ 종료된 이벤트</Text>
              {endedEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  userId={user?.id}
                  onJoin={handleJoinEvent}
                  onPress={handlePressEvent}
                />
              ))}
            </>
          )}

          {events.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>진행 중인 이벤트가 없어요</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── 스타일 ────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerRight: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSub,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  // 카드
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardEnded: {
    opacity: 0.6,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 22,
  },
  textMuted: {
    color: Colors.textMuted,
  },
  cardDesc: {
    fontSize: 14,
    color: Colors.textSub,
    lineHeight: 20,
    marginBottom: 14,
  },
  // 뱃지
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeActive: {
    backgroundColor: '#FEE2E2',
  },
  badgeUpcoming: {
    backgroundColor: '#FEF3C7',
  },
  badgeEnded: {
    backgroundColor: Colors.border,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  // 보상
  rewardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  rewardItem: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 2,
  },
  rewardEmoji: {
    fontSize: 18,
  },
  rewardAmount: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  rewardRank: {
    fontSize: 10,
    color: Colors.textSub,
  },
  // 카드 하단
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deadlineText: {
    fontSize: 13,
    color: Colors.textSub,
  },
  joinBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinBtnJoined: {
    backgroundColor: Colors.border,
  },
  joinBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  joinBtnTextJoined: {
    color: Colors.textSub,
  },
  // 빈 상태
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textMuted,
  },
});
