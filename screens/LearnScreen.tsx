/**
 * 학습 화면 — 듀오링고 알고리즘 완전 구현
 * - 단계별 잠금해제
 * - XP + 스트릭 + 하트 시스템
 * - 퀴즈 정답/오답 피드백
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Animated, Modal, Vibration,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore, LESSONS } from '../store/appStore';
import { Colors, Typography, Card, Badge, Hearts, Streak, XpBar, SectionHeader } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

// ── 레슨 카드 ──────────────────────────────────
interface LessonCardProps {
  lesson: typeof LESSONS[0];
  status: 'completed' | 'active' | 'locked';
  onPress: () => void;
}

function LessonCard({ lesson, status, onPress }: LessonCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (status === 'locked') {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.05, duration: 100, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
      return;
    }
    onPress();
  };

  const bgColor = status === 'completed' ? '#F0FFF4' : status === 'active' ? '#EAF4FF' : '#F8F9FA';
  const borderColor = status === 'completed' ? Colors.green : status === 'active' ? Colors.primary : Colors.border;
  const opacity = status === 'locked' ? 0.5 : 1;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.lessonCard, { backgroundColor: bgColor, borderColor, opacity }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {/* 왼쪽 아이콘 */}
        <View style={[styles.lessonEmoji, { backgroundColor: lesson.color + '20' }]}>
          <Text style={{ fontSize: 22 }}>{lesson.emoji}</Text>
        </View>

        {/* 중간 정보 */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <Text style={[Typography.body1, { fontWeight: '700' }]}>{lesson.title}</Text>
          </View>
          <Text style={Typography.body2}>{lesson.sub}</Text>
        </View>

        {/* 오른쪽 상태 */}
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          {status === 'completed' && <Text style={{ fontSize: 20 }}>✅</Text>}
          {status === 'active' && <Badge label={`+${lesson.xp} XP`} type="info" size="sm" />}
          {status === 'locked' && <Text style={{ fontSize: 20 }}>🔒</Text>}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── 레슨 상세 / 퀴즈 화면 ──────────────────────
export function LessonDetailScreen({ route }: any) {
  const { theme } = useTheme();
  const { lessonId } = route.params;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { completeLesson, getLessonStatus, hearts, loseHeart } = useAppStore();
  const lesson = LESSONS.find(l => l.id === lessonId);
  const status = getLessonStatus(lessonId);

  const [tab, setTab] = useState<'concept' | 'quiz'>('concept');
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardData, setRewardData] = useState({ xpGained: 0, levelUp: false, streakBonus: false });

  const confettiAnim = useRef(new Animated.Value(0)).current;
  const xpAnim = useRef(new Animated.Value(0)).current;

  if (!lesson) {
    return (
      <View style={styles.container}>
        <Text style={{ padding: 20, textAlign: 'center' }}>레슨을 찾을 수 없어요</Text>
      </View>
    );
  }

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);

    if (idx === lesson.quiz.ans) {
      // 정답 — 듀오링고 스타일 피드백
      Vibration.vibrate(50);
      const result = completeLesson(lessonId);
      setRewardData(result);
      setTimeout(() => {
        setShowReward(true);
        Animated.parallel([
          Animated.spring(confettiAnim, { toValue: 1, useNativeDriver: true }),
          Animated.timing(xpAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]).start();
      }, 500);
    } else {
      // 오답 — 하트 감소
      Vibration.vibrate([0, 100, 50, 100]);
      loseHeart();
    }
  };

  const optionStyle = (idx: number) => {
    if (!answered) return [styles.quizOpt, { backgroundColor: theme.bgCard }];
    if (idx === lesson.quiz.ans) return [styles.quizOpt, styles.quizOpt_correct];
    if (idx === selected) return [styles.quizOpt, styles.quizOpt_wrong];
    return [styles.quizOpt, { backgroundColor: theme.bgCard, opacity: 0.5 }];
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={[styles.lessonHeader, { backgroundColor: lesson.color, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Text style={{ color: theme.bgCard, fontSize: 22 }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: theme.bgCard, fontSize: 11, opacity: 0.7 }}>STEP {lesson.step} / 8</Text>
          <Text style={{ color: theme.bgCard, fontSize: 16, fontWeight: '700' }}>{lesson.title}</Text>
        </View>
        <Hearts count={hearts} />
      </View>

      {/* 진행 탭 */}
      <View style={[styles.tabBar, { backgroundColor: theme.bgCard }]}>
        {(['concept', 'quiz'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tabItem, tab === t && styles.tabItem_active]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabText_active]}>
              {t === 'concept' ? '📖 개념' : '❓ 퀴즈'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {tab === 'concept' ? (
          <>
            {/* 핵심 포인트 */}
            <View style={styles.hlBox}>
              <Text style={[Typography.body1, { color: Colors.primary, fontWeight: '700' }]}>{lesson.hl}</Text>
            </View>

            {/* 개념 설명 */}
            <Card>
              <Text style={[Typography.h3, { marginBottom: 8 }]}>📚 개념</Text>
              <Text style={[Typography.body1, { lineHeight: 22 }]}>{lesson.concept}</Text>
            </Card>

            {/* 예시 */}
            <View style={styles.egBox}>
              <Text style={[Typography.body2, { lineHeight: 20 }]}>{lesson.eg}</Text>
            </View>

            {/* 핵심 포인트 3가지 */}
            <Card>
              <Text style={[Typography.h3, { marginBottom: 10 }]}>✅ 핵심 포인트</Text>
              {lesson.keypoints.map((kp, i) => (
                <View key={i} style={styles.keypointRow}>
                  <View style={[styles.keypointDot, { backgroundColor: Colors.primary }]} />
                  <Text style={Typography.body2}>{kp}</Text>
                </View>
              ))}
            </Card>

            {/* 보상 미리보기 */}
            <View style={styles.rewardPreview}>
              <Text style={[Typography.body2, { color: Colors.gold }]}>🎁 완료 보상: {lesson.reward.label}</Text>
            </View>

            {status !== 'completed' && (
              <TouchableOpacity style={styles.quizBtn} onPress={() => setTab('quiz')} activeOpacity={0.85}>
                <Text style={[styles.quizBtnText, { color: theme.bgCard }]}>퀴즈 풀기 →</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            {/* 퀴즈 질문 */}
            <View style={styles.quizQuestion}>
              <Text style={[Typography.h3, { color: '#fff', textAlign: 'center', lineHeight: 24 }]}>{lesson.quiz.q}</Text>
            </View>

            {/* 4지선다 */}
            <View style={{ gap: 10 }}>
              {lesson.quiz.opts.map((opt, i) => (
                <TouchableOpacity key={i} style={optionStyle(i)} onPress={() => handleAnswer(i)} activeOpacity={0.8}>
                  <View style={[styles.optLabel, { backgroundColor: answered && i === lesson.quiz.ans ? Colors.green : answered && i === selected ? Colors.red : Colors.primary }]}>
                    <Text style={{ color: theme.bgCard, fontWeight: '700', fontSize: 13 }}>{String.fromCharCode(65 + i)}</Text>
                  </View>
                  <Text style={[Typography.body1, { flex: 1 }]}>{opt}</Text>
                  {answered && i === lesson.quiz.ans && <Text>✅</Text>}
                  {answered && i === selected && i !== lesson.quiz.ans && <Text>❌</Text>}
                </TouchableOpacity>
              ))}
            </View>

            {/* 오답 힌트 */}
            {answered && selected !== lesson.quiz.ans && (
              <View style={styles.hintBox}>
                <Text style={[Typography.body2, { color: Colors.red, fontWeight: '700' }]}>다시 도전하세요! ❤️ -{hearts}개 남음</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* 보상 오버레이 (듀오링고 스타일) */}
      <Modal visible={showReward} transparent animationType="fade">
        <View style={styles.rewardOverlay}>
          <Animated.View style={[styles.rewardCard, { backgroundColor: theme.bgCard, transform: [{ scale: confettiAnim }] }]}>
            <Text style={{ fontSize: 60 }}>🎉</Text>
            <Text style={[Typography.h1, { textAlign: 'center', color: Colors.green }]}>정답!</Text>
            <Animated.View style={{ opacity: xpAnim, transform: [{ translateY: xpAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
              <Text style={[Typography.h2, { color: Colors.primary, textAlign: 'center' }]}>
                +{rewardData.xpGained} XP {rewardData.streakBonus ? '🔥 스트릭 보너스 2배!' : ''}
              </Text>
            </Animated.View>
            <View style={styles.rewardInfo}>
              <Text style={[Typography.body2, { textAlign: 'center' }]}>{lesson.reward.label}</Text>
              <Text style={[Typography.caption, { textAlign: 'center' }]}>{lesson.reward.desc}</Text>
            </View>
            {rewardData.levelUp && (
              <View style={styles.levelUpBadge}>
                <Text style={{ color: theme.bgCard, fontWeight: '700' }}>⬆️ LEVEL UP!</Text>
              </View>
            )}
            <TouchableOpacity style={styles.rewardBtn} onPress={() => { setShowReward(false); navigation.goBack(); }}>
              <Text style={{ color: theme.bgCard, fontSize: 16, fontWeight: '700' }}>계속하기 →</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// ── 학습 목록 화면 ──────────────────────────────
export default function LearnScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { xp, level, streak, hearts, completedLessons, floPoints, getLessonStatus } = useAppStore();

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: theme.bgCard }]}>
        <Text style={Typography.h2}>학습</Text>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Text style={{ fontSize: 16 }}>🔥{streak}</Text>
          <Hearts count={hearts} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 학습 대시보드 */}
        <View style={{ margin: 16 }}>
          <Card>
            <View style={styles.dashRow}>
              <View style={styles.dashItem}>
                <Text style={[Typography.monoLg, { color: Colors.gold }]}>{floPoints}</Text>
                <Text style={Typography.caption}>FLO 포인트</Text>
              </View>
              <View style={styles.dashDivider} />
              <View style={styles.dashItem}>
                <Text style={[Typography.monoLg, { color: Colors.primary }]}>Lv.{level}</Text>
                <Text style={Typography.caption}>현재 레벨</Text>
              </View>
              <View style={styles.dashDivider} />
              <View style={styles.dashItem}>
                <Text style={[Typography.monoLg, { color: Colors.green }]}>{completedLessons.length}/8</Text>
                <Text style={Typography.caption}>완료</Text>
              </View>
            </View>
            <XpBar current={xp} max={500} />
          </Card>
        </View>

        {/* 학습 단계 */}
        <SectionHeader title="학습 트랙" />
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {LESSONS.map(lesson => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              status={getLessonStatus(lesson.id)}
              onPress={() => navigation.navigate('레슨상세', { lessonId: lesson.id })}
            />
          ))}
        </View>

        {/* 전체 완료 메시지 */}
        {completedLessons.length === LESSONS.length && (
          <View style={styles.allDoneBox}>
            <Text style={{ fontSize: 40 }}>🏆</Text>
            <Text style={[Typography.h2, { color: Colors.gold }]}>모든 과정 완료!</Text>
            <Text style={Typography.body2}>투자 마스터가 되었어요</Text>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  lessonCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 2 },
  lessonEmoji: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dashRow: { flexDirection: 'row', marginBottom: 16 },
  dashItem: { flex: 1, alignItems: 'center', gap: 2 },
  dashDivider: { width: 1, backgroundColor: Colors.border },
  lessonHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItem_active: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, color: Colors.textSub },
  tabText_active: { color: Colors.primary, fontWeight: '700' },
  hlBox: { backgroundColor: '#EAF4FF', borderRadius: 10, padding: 14, borderLeftWidth: 4, borderLeftColor: Colors.primary },
  egBox: { backgroundColor: Colors.goldBg, borderRadius: 10, padding: 14, borderStyle: 'dashed', borderWidth: 1.5, borderColor: Colors.gold },
  keypointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  keypointDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  rewardPreview: { padding: 12, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.gold, alignItems: 'center' },
  quizBtn: { backgroundColor: Colors.primary, borderRadius: 10, padding: 16, alignItems: 'center' },
  quizBtnText: { fontSize: 16, fontWeight: '700' },
  quizQuestion: { backgroundColor: Colors.navy, borderRadius: 12, padding: 20 },
  quizOpt: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border },
  quizOpt_correct: { borderColor: Colors.green, backgroundColor: Colors.greenBg },
  quizOpt_wrong: { borderColor: Colors.red, backgroundColor: Colors.redBg },
  optLabel: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  hintBox: { padding: 12, borderRadius: 10, backgroundColor: Colors.redBg, borderWidth: 1, borderColor: Colors.red },
  rewardOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  rewardCard: { borderRadius: 24, padding: 32, alignItems: 'center', gap: 12, width: '100%' },
  rewardInfo: { backgroundColor: Colors.goldBg, borderRadius: 10, padding: 12, width: '100%', gap: 4 },
  levelUpBadge: { backgroundColor: Colors.gold, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  rewardBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 16, width: '100%', alignItems: 'center' },
  allDoneBox: { alignItems: 'center', padding: 32, gap: 8 },
});
