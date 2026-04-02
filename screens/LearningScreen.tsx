import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/ui';
import {
  CATEGORIES,
  CATEGORY_META,
  learningContent,
  type CategoryId,
} from '../data/learningContent';
import { getLearningData, type LearningData } from '../lib/learningService';

const CATEGORY_DESCRIPTIONS: Record<CategoryId, string> = {
  vocabulary: '시가, 종가, PER, PBR 등 필수 용어',
  newsLearning: '뉴스가 주가에 미치는 영향 분석',
  chartAnalysis: '캔들차트, 이동평균선, RSI 분석',
  companyAnalysis: '재무제표 읽기, 해자 분석',
  psychology: '공포와 탐욕, 손실회피 편향',
  macro: '금리, 환율, 경기 사이클',
};

export default function LearningScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [learningData, setLearningData] = useState<LearningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getLearningData(user.id);
      setLearningData(data);
    } catch {}
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const getFirstIncomplete = () => {
    if (!learningData) return null;
    for (const catId of CATEGORIES) {
      const cat = learningContent[catId];
      for (const level of cat.levels) {
        const lessonId = `${catId}_${level.id}`;
        if (!learningData.completedLessons.includes(lessonId)) {
          return { categoryId: catId, level, lessonId };
        }
      }
    }
    return null;
  };

  const firstIncomplete = learningData ? getFirstIncomplete() : null;
  const streak = learningData?.streak ?? 0;
  const hearts = learningData?.hearts ?? 3;
  const points = learningData?.totalPoints ?? 0;
  const wrongCount = learningData?.wrongAnswers?.length ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>학습</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ fontSize: 14, color: Colors.textSub, marginTop: 12 }}>학습 데이터를 불러오는 중...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Status Bar */}
          <View style={styles.statusBar}>
            <View style={styles.statusItem}>
              <Text style={styles.statusEmoji}>🔥</Text>
              <Text style={styles.statusValue}>{streak}</Text>
              <Text style={styles.statusLabel}>연속학습</Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <Text style={styles.statusEmoji}>❤️</Text>
              <Text style={styles.statusValue}>{hearts}/3</Text>
              <Text style={styles.statusLabel}>하트</Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <Text style={styles.statusEmoji}>⭐</Text>
              <Text style={styles.statusValue}>{points.toLocaleString()}</Text>
              <Text style={styles.statusLabel}>포인트</Text>
            </View>
          </View>

          {/* Today's Lesson Card */}
          {firstIncomplete && (
            <View style={styles.todayCard}>
              <Text style={styles.todayLabel}>오늘의 레슨</Text>
              <Text style={styles.todayTitle} numberOfLines={2}>
                {firstIncomplete.level.title}
              </Text>
              <Text style={styles.todayCategoryName}>
                {CATEGORY_META[firstIncomplete.categoryId].emoji}{' '}
                {CATEGORY_META[firstIncomplete.categoryId].title}
              </Text>
              <TouchableOpacity
                style={styles.todayBtn}
                onPress={() =>
                  navigation.navigate('레슨플레이어', {
                    categoryId: firstIncomplete.categoryId,
                    levelId: firstIncomplete.level.id,
                    lessons: firstIncomplete.level.lessons,
                    levelTitle: firstIncomplete.level.title,
                  })
                }
                activeOpacity={0.85}
              >
                <Text style={styles.todayBtnText}>학습하기 →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Category Section */}
          <Text style={styles.sectionTitle}>카테고리</Text>

          {CATEGORIES.map((catId) => {
            const meta = CATEGORY_META[catId];
            const color = meta.color[0];
            const progress = learningData?.categoryProgress?.[catId];
            const completed = progress?.completed ?? 0;
            const total = progress?.total ?? 1;
            const pct = Math.round((completed / total) * 100);
            const allDone = pct === 100;

            return (
              <TouchableOpacity
                key={catId}
                style={[styles.categoryCard, { borderLeftColor: color }]}
                onPress={() => navigation.navigate('코스목록', { categoryId: catId })}
                activeOpacity={0.75}
              >
                <View style={[styles.categoryIcon, { backgroundColor: color + '33' }]}>
                  <Text style={styles.categoryEmoji}>{meta.emoji}</Text>
                </View>
                <View style={styles.categoryCenter}>
                  <Text style={styles.categoryTitle}>{meta.title}</Text>
                  <Text style={styles.categoryDesc} numberOfLines={1}>
                    {CATEGORY_DESCRIPTIONS[catId]}
                  </Text>
                  <View style={styles.progressBg}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${pct}%` as any, backgroundColor: color },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.categoryRight}>
                  {allDone ? (
                    <Text style={styles.categoryDone}>✅</Text>
                  ) : (
                    <Text style={[styles.categoryPct, { color }]}>{pct}%</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Wrong Answers Card */}
          <TouchableOpacity
            style={styles.wrongCard}
            onPress={() => navigation.navigate('오답노트')}
            activeOpacity={0.75}
          >
            <View style={styles.wrongLeft}>
              <Text style={styles.wrongEmoji}>📝</Text>
              <View style={styles.wrongTextBlock}>
                <View style={styles.wrongTitleRow}>
                  <Text style={styles.wrongTitle}>오답 노트</Text>
                  {wrongCount > 0 && (
                    <View style={styles.wrongBadge}>
                      <Text style={styles.wrongBadgeText}>{wrongCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.wrongSub}>틀린 문제를 복습하세요</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSub} />
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollContent: {
    paddingBottom: 16,
  },

  // Status bar
  statusBar: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.textSub,
    marginTop: 2,
  },
  statusDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },

  // Today's lesson card
  todayCard: {
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
  },
  todayLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: 6,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  todayCategoryName: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  todayBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  todayBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Section title
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },

  // Category cards
  categoryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    gap: 14,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryCenter: {
    flex: 1,
    gap: 4,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  categoryDesc: {
    fontSize: 13,
    color: Colors.textSub,
  },
  progressBg: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryRight: {
    minWidth: 36,
    alignItems: 'center',
  },
  categoryDone: {
    fontSize: 22,
  },
  categoryPct: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Wrong answers card
  wrongCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  wrongLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wrongEmoji: {
    fontSize: 28,
  },
  wrongTextBlock: {
    gap: 2,
  },
  wrongTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wrongTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  wrongBadge: {
    backgroundColor: '#FF4B4B',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  wrongBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  wrongSub: {
    fontSize: 13,
    color: Colors.textSub,
  },
});
