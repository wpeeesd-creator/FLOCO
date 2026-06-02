import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Text } from '../components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import {
  CATEGORIES,
  CATEGORY_META,
  learningContent,
  LEVEL_EMOJI,
  type CategoryId,
  type Level,
} from '../data/learningContent';
import { getLearningData, estimateUserLevel, type LearningData } from '../lib/learningService';
import DailyQuizCard from '../components/DailyQuizCard';
import { Flame, Heart, CheckCircle2, NotebookPen, BookOpen, Newspaper, Flag, BarChart3, Building2, Brain, Landmark, PieChart, Calculator } from 'lucide-react-native';

const CATEGORY_ICONS: Record<string, any> = {
  BookOpen, Newspaper, Flag, BarChart3, Building2, Brain, Landmark, PieChart, Calculator,
};

const CATEGORY_DESCRIPTIONS: Record<CategoryId, string> = {
  vocabulary: '시가, 종가, PER, PBR 등 필수 용어',
  newsLearning: '뉴스가 주가에 미치는 영향 분석',
  ktrend: 'K-pop, 게임, 좋아하는 브랜드와 주식',
  chartAnalysis: '캔들차트, 이동평균선, RSI 분석',
  companyAnalysis: '재무제표 읽기, 해자 분석',
  psychology: '공포와 탐욕, 손실회피 편향',
  macro: '금리, 환율, 경기 사이클',
  portfolio: 'MPT, CAPM, 샤프비율, 자산배분',
  quant: '팩터 투자, 백테스팅, 퀀트 전략',
};

export default function LearningScreen() {
  const { theme, isDark } = useTheme();
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

  const userLevel: Level = learningData
    ? estimateUserLevel(learningData.completedLessons)
    : '입문';

  const getFirstIncomplete = () => {
    if (!learningData) return null;
    const LEVEL_ORDER: Level[] = ['입문', '초급', '중급', '고급'];
    const startIdx = LEVEL_ORDER.indexOf(userLevel);
    // 사용자 레벨부터 위로 한 단계씩 탐색 → 못 찾으면 더 높은 레벨로 fallback
    for (let i = startIdx; i < LEVEL_ORDER.length; i++) {
      const targetLevel = LEVEL_ORDER[i];
      for (const catId of CATEGORIES) {
        const cat = learningContent[catId];
        if (cat.level !== targetLevel) continue;
        for (const level of cat.levels) {
          const lessonId = `${catId}_${level.id}`;
          if (!learningData.completedLessons.includes(lessonId)) {
            return { categoryId: catId, level, lessonId };
          }
        }
      }
    }
    return null;
  };

  const firstIncomplete = learningData ? getFirstIncomplete() : null;
  const streak = learningData?.streak ?? 0;

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
      backgroundColor: theme.bgCard,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
    scrollContent: { paddingBottom: 16 },
    statusBar: {
      backgroundColor: theme.bgCard,
      marginHorizontal: 16, marginTop: 16, borderRadius: 16,
      paddingVertical: 16, paddingHorizontal: 8,
      flexDirection: 'row', alignItems: 'center',
      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    statusItem: { flex: 1, alignItems: 'center' },
    statusEmoji: { fontSize: 24, marginBottom: 4 },
    statusValue: { fontSize: 20, fontWeight: '700', color: Colors.text },
    statusLabel: { fontSize: 12, color: Colors.textSub, marginTop: 2 },
    statusDivider: { width: 1, height: 40, backgroundColor: Colors.border },
    todayCard: {
      backgroundColor: Colors.primary,
      marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 20,
    },
    todayLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 6 },
    todayTitle: { fontSize: 18, fontWeight: '700', color: theme.bgCard, marginBottom: 4 },
    todayCategoryName: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
    todayBtn: {
      backgroundColor: theme.bgCard,
      borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, alignSelf: 'flex-start',
    },
    todayBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
    sectionTitle: {
      fontSize: 17, fontWeight: '700', color: Colors.text,
      marginHorizontal: 16, marginTop: 24, marginBottom: 12,
    },
    categoryCard: {
      backgroundColor: theme.bgCard,
      marginHorizontal: 16, marginBottom: 10, borderRadius: 20, padding: 16,
      flexDirection: 'row', alignItems: 'center',
      borderLeftWidth: 4,
      shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, gap: 14,
    },
    categoryIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    categoryEmoji: { fontSize: 28 },
    categoryCenter: { flex: 1, gap: 4 },
    categoryTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
    categoryDesc: { fontSize: 13, color: Colors.textSub },
    progressBg: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginTop: 6 },
    progressFill: { height: '100%', borderRadius: 2 },
    categoryRight: { minWidth: 36, alignItems: 'center' },
    categoryDone: { fontSize: 22 },
    categoryPct: { fontSize: 14, fontWeight: '700' },
    wrongCard: {
      backgroundColor: theme.bgCard,
      marginHorizontal: 16, marginTop: 8, borderRadius: 16, padding: 16,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    wrongLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    wrongEmoji: { fontSize: 28 },
    wrongTextBlock: { gap: 2 },
    wrongTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    wrongTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
    wrongBadge: { backgroundColor: '#FF4B4B', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 },
    wrongBadgeText: { fontSize: 12, fontWeight: '700', color: theme.bgCard },
    wrongSub: { fontSize: 13, color: Colors.textSub },
  });
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
              <Flame size={20} color="#F97316" />
              <Text style={styles.statusValue}>{streak}</Text>
              <Text style={styles.statusLabel}>연속학습</Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <Heart size={20} fill="#EF4444" color="#EF4444" />
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

          {/* Daily OX */}
          <DailyQuizCard learningData={learningData} />

          {/* Today's Lesson Card */}
          {firstIncomplete && (
            <View style={styles.todayCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.todayLabel}>오늘의 레슨</Text>
                <Text style={{ color: Colors.textSub, fontSize: 12, fontWeight: '600' }}>
                  현재 레벨 {LEVEL_EMOJI[userLevel]} {userLevel}
                </Text>
              </View>
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
            // total은 learningContent에서 동적 계산 (Firestore 하드코딩 값 무시 — 50% 고정 버그 회피)
            const userProgress = learningData?.categoryProgress?.[catId];
            const completedCount = userProgress?.completed ?? 0;
            const totalLevels = learningContent[catId]?.levels?.length ?? 0;
            const pct = totalLevels > 0
              ? Math.round((completedCount / totalLevels) * 100)
              : 0;
            const allDone = totalLevels > 0 && completedCount >= totalLevels;

            return (
              <TouchableOpacity
                key={catId}
                style={[styles.categoryCard, { borderLeftColor: color }]}
                onPress={() => navigation.navigate('코스목록', { categoryId: catId })}
                activeOpacity={0.75}
              >
                <View style={[styles.categoryIcon, { backgroundColor: color + '33' }]}>
                  {(() => {
                    const iconName = learningContent[catId]?.iconName;
                    const Icon = iconName ? CATEGORY_ICONS[iconName] : null;
                    return Icon
                      ? <Icon size={32} color={color} strokeWidth={1.8} />
                      : <Text style={styles.categoryEmoji}>{meta.emoji}</Text>;
                  })()}
                </View>
                <View style={styles.categoryCenter}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.categoryTitle}>{meta.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: color + '20' }}>
                      <Text style={{ fontSize: 10 }}>{learningContent[catId].levelEmoji}</Text>
                      <Text style={{ color, fontSize: 10, fontWeight: '700' }}>{learningContent[catId].level}</Text>
                    </View>
                  </View>
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
                    <CheckCircle2 size={16} color="#22C55E" />
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
              <NotebookPen size={18} color={Colors.textSub} />
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

