/**
 * 레슨 상세 화면 — 듀오링고 스타일 학습 + 퀴즈
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore, LESSONS } from '../store/appStore';
import { Colors, Typography, Button, Badge, BottomSheet, Hearts } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

export default function LessonDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const lessonId = route.params?.lessonId ?? '';
  const { completeLesson, loseHeart, hearts, getLessonStatus, completedLessons } = useAppStore();

  const lesson = LESSONS.find(l => l.id === lessonId);
  const [phase, setPhase] = useState<'learn' | 'quiz' | 'result'>('learn');
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [resultData, setResultData] = useState<{ xpGained: number; levelUp: boolean; streakBonus: boolean } | null>(null);
  const [showReward, setShowReward] = useState(false);

  if (!lesson) {
    return (
      <View style={styles.container}>
        <Text style={Typography.h2}>레슨을 찾을 수 없어요</Text>
        <Button title="돌아가기" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const isCompleted = completedLessons.includes(lessonId);

  function handleAnswer(idx: number) {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);

    if (idx !== lesson.quiz.ans) {
      loseHeart();
    }
  }

  function handleFinish() {
    if (!answered || selected === null) return;

    if (selected === lesson.quiz.ans) {
      const result = completeLesson(lessonId);
      setResultData(result);
      setShowReward(true);
    } else {
      Alert.alert('다시 도전해봐요!', '정답이 아니에요. 내용을 다시 읽고 도전해보세요!', [
        { text: '다시 학습', onPress: () => { setPhase('learn'); setSelected(null); setAnswered(false); } },
      ]);
    }
  }

  function handleComplete() {
    setShowReward(false);
    navigation.goBack();
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 16, paddingBottom: 12,
      backgroundColor: theme.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    backBtn: { padding: 4 },
    backText: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
    progressBar: { height: 4, backgroundColor: Colors.border },
    progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
    content: { padding: 20, gap: 16 },
    emojiBox: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
    emojiText: { fontSize: 34 },
    conceptBox: { backgroundColor: theme.bgCard, borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: Colors.primary },
    conceptText: { fontSize: 15, lineHeight: 24, color: Colors.text },
    highlightBox: { backgroundColor: Colors.goldBg, borderRadius: 10, padding: 14 },
    highlightText: { fontSize: 14, fontWeight: '700', color: Colors.gold, lineHeight: 22 },
    exampleBox: { backgroundColor: Colors.bg, borderRadius: 10, padding: 14 },
    keypointsBox: { backgroundColor: theme.bgCard, borderRadius: 12, padding: 16 },
    keypointRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
    keypointDot: { fontSize: 14, color: Colors.green, fontWeight: '700', marginTop: 1 },
    quizLabel: { fontSize: 12, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
    optionBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      borderWidth: 2, borderRadius: 12, padding: 16, marginBottom: 10,
    },
    optionLetter: { fontSize: 16, fontWeight: '800', width: 24, textAlign: 'center' },
    rewardContent: { alignItems: 'center', gap: 12, paddingBottom: 8 },
    rewardEmoji: { fontSize: 56 },
    xpRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  });

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Hearts count={hearts} />
      </View>

      {/* 진행 바 */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: phase === 'learn' ? '50%' : '100%' }]} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {phase === 'learn' ? (
          // 학습 단계
          <View style={styles.content}>
            <View style={[styles.emojiBox, { backgroundColor: lesson.color }]}>
              <Text style={styles.emojiText}>{lesson.emoji}</Text>
            </View>
            <Text style={[Typography.h2, { textAlign: 'center', marginBottom: 4 }]}>{lesson.title}</Text>
            <Text style={[Typography.body2, { textAlign: 'center', marginBottom: 24 }]}>{lesson.sub}</Text>

            <View style={styles.conceptBox}>
              <Text style={styles.conceptText}>{lesson.concept}</Text>
            </View>

            <View style={styles.highlightBox}>
              <Text style={styles.highlightText}>{lesson.hl}</Text>
            </View>

            <View style={styles.exampleBox}>
              <Text style={[Typography.body2, { fontStyle: 'italic' }]}>{lesson.eg}</Text>
            </View>

            <View style={styles.keypointsBox}>
              <Text style={[Typography.h3, { marginBottom: 8 }]}>핵심 포인트</Text>
              {lesson.keypoints.map((kp, i) => (
                <View key={i} style={styles.keypointRow}>
                  <Text style={styles.keypointDot}>✓</Text>
                  <Text style={[Typography.body1, { flex: 1 }]}>{kp}</Text>
                </View>
              ))}
            </View>

            <Badge label={`+${lesson.xp} XP 획득 예정`} type="info" />

            <Button
              title="퀴즈 풀기 →"
              onPress={() => setPhase('quiz')}
              variant="primary"
              size="lg"
              fullWidth
            />
          </View>
        ) : (
          // 퀴즈 단계
          <View style={styles.content}>
            <Text style={styles.quizLabel}>퀴즈</Text>
            <Text style={[Typography.h2, { marginBottom: 24, lineHeight: 30 }]}>{lesson.quiz.q}</Text>

            {lesson.quiz.opts.map((opt, i) => {
              let bgColor = Colors.card;
              let borderColor = Colors.border;
              let textColor = Colors.text;

              if (answered) {
                if (i === lesson.quiz.ans) {
                  bgColor = Colors.greenBg;
                  borderColor = Colors.green;
                  textColor = Colors.green;
                } else if (i === selected) {
                  bgColor = Colors.redBg;
                  borderColor = Colors.red;
                  textColor = Colors.red;
                }
              } else if (selected === i) {
                borderColor = Colors.primary;
                bgColor = '#EAF4FF';
              }

              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.optionBtn, { backgroundColor: bgColor, borderColor }]}
                  onPress={() => handleAnswer(i)}
                  disabled={answered}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionLetter, { color: borderColor }]}>
                    {String.fromCharCode(65 + i)}
                  </Text>
                  <Text style={[Typography.body1, { flex: 1, color: textColor }]}>{opt}</Text>
                  {answered && i === lesson.quiz.ans && <Text style={{ fontSize: 18 }}>✅</Text>}
                  {answered && i === selected && i !== lesson.quiz.ans && <Text style={{ fontSize: 18 }}>❌</Text>}
                </TouchableOpacity>
              );
            })}

            {answered && (
              <Button
                title={selected === lesson.quiz.ans ? '완료하기 🎉' : '다시 도전'}
                onPress={handleFinish}
                variant={selected === lesson.quiz.ans ? 'primary' : 'danger'}
                size="lg"
                fullWidth
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* 보상 Bottom Sheet */}
      <BottomSheet visible={showReward} onClose={handleComplete} title="🎉 레슨 완료!">
        <View style={styles.rewardContent}>
          <Text style={styles.rewardEmoji}>{lesson.reward.type === 'badge' ? '🏅' : '💰'}</Text>
          <Text style={[Typography.h2, { textAlign: 'center', marginBottom: 4 }]}>{lesson.reward.label}</Text>
          <Text style={[Typography.body2, { textAlign: 'center', marginBottom: 12 }]}>{lesson.reward.desc}</Text>
          {resultData && (
            <View style={styles.xpRow}>
              <Badge label={`+${resultData.xpGained} XP`} type="success" />
              {resultData.streakBonus && <Badge label="🔥 스트릭 보너스!" type="warning" />}
              {resultData.levelUp && <Badge label="⬆️ 레벨업!" type="info" />}
            </View>
          )}
          <Button title="계속하기" onPress={handleComplete} variant="primary" size="lg" fullWidth />
        </View>
      </BottomSheet>
    </View>
  );
}

