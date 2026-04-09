/**
 * 이벤트 상세 화면 — 리더보드 & 참여
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { joinEvent, type AppEvent } from '../lib/adminService';

// ── 타입 ──────────────────────────────────────────
interface LeaderboardEntry {
  uid: string;
  name: string;
  emoji: string;
  score: number;
}

// ── 유틸 ──────────────────────────────────────────
function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

function getDaysLeft(endDate: number): string {
  const days = Math.ceil((endDate - Date.now()) / 86400000);
  return days > 0 ? `D-${days}` : '마감';
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

function formatScore(score: number, type: AppEvent['type']): string {
  if (type === 'profit_rate') return `+${score.toFixed(1)}%`;
  if (type === 'trade_count') return `${score}회`;
  return `${score}일`;
}

function getTypeName(type: AppEvent['type']): string {
  if (type === 'profit_rate') return '수익률';
  if (type === 'trade_count') return '거래횟수';
  return '학습스트릭';
}

const REWARD_EMOJIS = ['🥇', '🥈', '🥉'];
const RANK_MEDALS = ['🥇', '🥈', '🥉'];

// ── 메인 화면 ─────────────────────────────────────
export default function EventDetailScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();

  const event: AppEvent = route.params?.event;

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(
    user?.id ? event?.participants?.includes(user.id) : false,
  );

  const fetchLeaderboard = useCallback(async () => {
    if (!event) return;
    try {
      const portfoliosSnap = await getDocs(collection(db, 'portfolios'));
      const usersSnap = await getDocs(collection(db, 'users'));

      const nameMap: Record<string, { name: string; emoji: string }> = {};
      usersSnap.docs.forEach(d => {
        const data = d.data();
        nameMap[d.id] = {
          name: data.name ?? data.nickname ?? '익명',
          emoji: data.investmentType?.emoji ?? '📊',
        };
      });

      const entries = portfoliosSnap.docs
        .map(d => {
          const data = d.data();
          const uid = d.id;
          let score = 0;

          if (event.type === 'profit_rate') {
            const total = (data.holdings ?? []).reduce(
              (sum: number, h: any) => sum + (h.qty ?? 0) * 100,
              data.cash ?? 1000000,
            );
            score = ((total - 1000000) / 1000000) * 100;
          } else if (event.type === 'trade_count') {
            score = (data.trades ?? []).length;
          } else if (event.type === 'learning_streak') {
            score = data.streak ?? 0;
          }

          return {
            uid,
            name: nameMap[uid]?.name ?? data.name ?? '익명',
            emoji: nameMap[uid]?.emoji ?? '📊',
            score,
          };
        })
        .sort((a, b) => b.score - a.score);

      setLeaderboard(entries.slice(0, 10));
      const myIdx = entries.findIndex(e => e.uid === user?.id);
      setMyRank(myIdx >= 0 ? myIdx + 1 : 0);
      setTotalParticipants(entries.length);
    } catch {
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }, [event, user?.id]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleJoin = async () => {
    if (!user?.id || !event) return;
    try {
      setIsJoined(true);
      try {
        await joinEvent(event.id, user.id);
      } catch {}
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('참여 완료!', '이벤트에 참여했어요! 열심히 투자하세요!');
    } catch {
      setIsJoined(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.bg,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    errorText: {
      fontSize: 16,
      color: Colors.textSub,
    },
    backBtnLarge: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    backBtnLargeText: {
      color: theme.bgCard,
      fontWeight: '700',
      fontSize: 15,
    },
    // 헤더
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
      fontSize: 16,
      fontWeight: '700',
      color: Colors.text,
      textAlign: 'center',
      marginHorizontal: 8,
    },
    headerRight: {
      width: 32,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    // 내 순위 카드
    myRankCard: {
      backgroundColor: Colors.primary,
      borderRadius: 20,
      margin: 16,
      padding: 24,
      alignItems: 'center',
      gap: 6,
    },
    myRankLabel: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.6)',
      fontWeight: '600',
    },
    myRankRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 6,
    },
    myRankNumber: {
      fontSize: 40,
      fontWeight: '700',
      color: theme.bgCard,
      lineHeight: 48,
    },
    myRankTotal: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.7)',
      marginBottom: 6,
    },
    myRankDeadline: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.5)',
    },
    // 이벤트 정보 카드
    infoCard: {
      backgroundColor: Colors.card,
      borderRadius: 20,
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 20,
      gap: 12,
    },
    infoDesc: {
      fontSize: 14,
      color: Colors.textSub,
      lineHeight: 22,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    typeBadge: {
      backgroundColor: Colors.bg,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    typeBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: Colors.primary,
    },
    infoPeriod: {
      fontSize: 13,
      color: Colors.textSub,
    },
    // 보상 카드
    rewardCard: {
      backgroundColor: Colors.card,
      borderRadius: 20,
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 20,
      gap: 10,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: Colors.text,
      marginBottom: 4,
    },
    rewardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    rewardEmoji: {
      fontSize: 20,
      width: 28,
      textAlign: 'center',
    },
    rewardRankText: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.textSub,
      width: 28,
    },
    rewardAmount: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: Colors.text,
      textAlign: 'right',
    },
    // 순위표
    leaderboardHeader: {
      fontSize: 15,
      fontWeight: '700',
      color: Colors.text,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 10,
    },
    loadingContainer: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    emptyLeaderboard: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: Colors.textMuted,
    },
    leaderboardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.card,
      borderRadius: 16,
      marginHorizontal: 16,
      marginBottom: 8,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 10,
    },
    leaderboardRowMine: {
      borderWidth: 2,
      borderColor: Colors.primary,
    },
    leaderboardRank: {
      fontSize: 18,
      width: 32,
      textAlign: 'center',
    },
    leaderboardEmoji: {
      fontSize: 20,
    },
    leaderboardName: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: Colors.text,
    },
    leaderboardScore: {
      fontSize: 15,
      fontWeight: '700',
      color: Colors.primary,
    },
    // 참여 버튼
    joinBtnContainer: {
      marginHorizontal: 16,
      marginTop: 20,
    },
    joinBtn: {
      backgroundColor: Colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
    },
    joinBtnJoined: {
      backgroundColor: Colors.border,
    },
    joinBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.bgCard,
    },
    joinBtnTextJoined: {
      color: Colors.textSub,
    },
  });

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>이벤트를 찾을 수 없어요</Text>
          <TouchableOpacity style={styles.backBtnLarge} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnLargeText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const daysLeft = getDaysLeft(event.endDate);

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 내 순위 카드 */}
        <View style={styles.myRankCard}>
          <Text style={styles.myRankLabel}>내 현재 순위</Text>
          <View style={styles.myRankRow}>
            <Text style={styles.myRankNumber}>{myRank > 0 ? myRank : '-'}</Text>
            {totalParticipants > 0 && (
              <Text style={styles.myRankTotal}>/ {totalParticipants}명</Text>
            )}
          </View>
          <Text style={styles.myRankDeadline}>마감 {daysLeft} · {formatDate(event.endDate)}</Text>
        </View>

        {/* 이벤트 정보 카드 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoDesc}>{event.description}</Text>
          <View style={styles.infoRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{getTypeName(event.type)}</Text>
            </View>
            <Text style={styles.infoPeriod}>
              {formatDate(event.startDate)} ~ {formatDate(event.endDate)}
            </Text>
          </View>
        </View>

        {/* 보상 카드 */}
        <View style={styles.rewardCard}>
          <Text style={styles.sectionTitle}>🏅 보상</Text>
          {event.rewards.map((r, i) => (
            <View key={r.rank} style={styles.rewardRow}>
              <Text style={styles.rewardEmoji}>{REWARD_EMOJIS[i] ?? `${r.rank}위`}</Text>
              <Text style={styles.rewardRankText}>{r.rank}위</Text>
              <Text style={styles.rewardAmount}>{formatAmount(r.amount)}</Text>
            </View>
          ))}
        </View>

        {/* 순위표 */}
        <Text style={styles.leaderboardHeader}>🏅 순위표</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : leaderboard.length === 0 ? (
          <View style={styles.emptyLeaderboard}>
            <Text style={styles.emptyText}>아직 참여자가 없어요</Text>
          </View>
        ) : (
          leaderboard.map((entry, index) => {
            const rank = index + 1;
            const isMine = entry.uid === user?.id;
            const rankDisplay = rank <= 3 ? RANK_MEDALS[rank - 1] : String(rank);

            return (
              <View
                key={entry.uid}
                style={[styles.leaderboardRow, isMine && styles.leaderboardRowMine]}
              >
                <Text style={styles.leaderboardRank}>{rankDisplay}</Text>
                <Text style={styles.leaderboardEmoji}>{entry.emoji}</Text>
                <Text style={styles.leaderboardName} numberOfLines={1}>
                  {entry.name}
                  {isMine ? ' (나)' : ''}
                </Text>
                <Text style={styles.leaderboardScore}>
                  {formatScore(entry.score, event.type)}
                </Text>
              </View>
            );
          })
        )}

        {/* 참여 버튼 */}
        {event.status !== 'ended' && (
          <View style={styles.joinBtnContainer}>
            <TouchableOpacity
              style={[styles.joinBtn, isJoined && styles.joinBtnJoined]}
              onPress={handleJoin}
              disabled={isJoined}
              activeOpacity={0.85}
            >
              <Text style={[styles.joinBtnText, isJoined && styles.joinBtnTextJoined]}>
                {isJoined ? '참여중' : '참여하기'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

