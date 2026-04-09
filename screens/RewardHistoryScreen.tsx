import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

interface RewardEntry {
  lessonId: string;
  lessonTitle: string;
  reward: number;
  correctCount: number;
  totalCount: number;
  completedAt: string;
}

export default function RewardHistoryScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [rewards, setRewards] = useState<RewardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.id, 'learning', 'data'));
        if (snap.exists()) {
          const data = snap.data();
          const history: RewardEntry[] = data.rewardHistory ?? [];
          setRewards(history.sort((a, b) =>
            new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
          ));
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [user?.id]);

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors.bg,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: Colors.card,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: Colors.text,
    },
    summaryCard: {
      flexDirection: 'row',
      backgroundColor: Colors.primary,
      borderRadius: 16,
      marginHorizontal: 16,
      marginTop: 16,
      paddingVertical: 24,
      paddingHorizontal: 20,
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryDivider: {
      width: 1,
      backgroundColor: 'rgba(255,255,255,0.3)',
      marginVertical: 4,
    },
    summaryLabel: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)',
      marginBottom: 6,
    },
    summaryValue: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.bgCard,
    },
    rewardHint: {
      fontSize: 12,
      color: Colors.textSub,
      textAlign: 'center',
      marginTop: 12,
      marginBottom: 4,
    },
    emptyBox: {
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 32,
      backgroundColor: Colors.card,
      borderRadius: 16,
      paddingVertical: 48,
      paddingHorizontal: 24,
    },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
    emptyDesc: { fontSize: 13, color: Colors.textSub, marginTop: 4 },
    emptyBtn: {
      marginTop: 20,
      backgroundColor: Colors.primary,
      borderRadius: 10,
      paddingHorizontal: 28,
      height: 44,
      justifyContent: 'center',
    },
    emptyBtnText: { color: theme.bgCard, fontWeight: '700', fontSize: 14 },
    listCard: {
      backgroundColor: Colors.card,
      borderRadius: 16,
      marginHorizontal: 16,
      marginTop: 12,
      overflow: 'hidden',
      shadowColor: theme.text,
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    rowIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowMeta: {
      flex: 1,
    },
    rowTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.text,
    },
    rowSubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    rowDate: {
      fontSize: 12,
      color: Colors.textSub,
    },
    rateBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    rateText: {
      fontSize: 11,
      fontWeight: '700',
    },
    rowReward: {
      fontSize: 15,
      fontWeight: '700',
      color: '#58CC02',
    },
  });

  const totalReward = rewards.reduce((sum, r) => sum + r.reward, 0);
  const totalLessons = rewards.length;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>학습 보상 내역</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>총 획득 보상</Text>
              <Text style={styles.summaryValue}>
                {totalReward.toLocaleString()}원
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>완료 레슨</Text>
              <Text style={styles.summaryValue}>{totalLessons}개</Text>
            </View>
          </View>

          <Text style={styles.rewardHint}>
            💡 학습을 완료하면 정답률에 따라 보상이 지급돼요
          </Text>

          {/* Reward List */}
          {rewards.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>📚</Text>
              <Text style={styles.emptyTitle}>아직 완료한 학습이 없어요</Text>
              <Text style={styles.emptyDesc}>학습하고 보상 받아보세요!</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => {
                  navigation.goBack();
                  setTimeout(() => {
                    navigation.getParent()?.navigate('학습Tab');
                  }, 100);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyBtnText}>학습하러 가기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.listCard}>
              {rewards.map((r, i) => {
                const rate = r.totalCount > 0
                  ? Math.round((r.correctCount / r.totalCount) * 100)
                  : 0;
                return (
                  <View
                    key={`${r.lessonId}_${i}`}
                    style={[
                      styles.row,
                      i < rewards.length - 1 && styles.rowBorder,
                    ]}
                  >
                    <View style={styles.rowIcon}>
                      <Text style={{ fontSize: 24 }}>🎓</Text>
                    </View>
                    <View style={styles.rowMeta}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {r.lessonTitle || r.lessonId}
                      </Text>
                      <View style={styles.rowSubRow}>
                        <Text style={styles.rowDate}>
                          {formatDate(r.completedAt)}
                        </Text>
                        <View style={[
                          styles.rateBadge,
                          { backgroundColor: rate >= 80 ? '#D7FFB8' : rate >= 60 ? '#FFF3D6' : '#FFE0E0' },
                        ]}>
                          <Text style={[
                            styles.rateText,
                            { color: rate >= 80 ? '#58CC02' : rate >= 60 ? '#FF9500' : '#FF4B4B' },
                          ]}>
                            정답률 {rate}%
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.rowReward}>
                      +{r.reward.toLocaleString()}원
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

