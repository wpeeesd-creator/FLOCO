/**
 * 레슨 화면 — 텍스트 학습 + OX/4지선다 퀴즈
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Animated, Vibration,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { COURSES, LEVEL_COLOR } from '../data/learningContent';
import { Colors, Typography, Button } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

type Phase = 'lesson' | 'quiz' | 'result';

export default function LessonScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const courseId = route.params?.courseId ?? '';
  const { user } = useAuth();

  const course = COURSES.find(c => c.id === courseId);

  const [phase, setPhase] = useState<Phase>('lesson');
  const [pageIdx, setPageIdx] = useState(0);
  const [quizIdx, setQuizIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);

  if (!course) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#8E8E93' }}>코스를 찾을 수 없어요</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text style={{ color: theme.primary, fontSize: 15, fontWeight: '600' }}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const color = LEVEL_COLOR[course.level];
  const currentPage = course.pages[pageIdx];
  const currentQuiz = course.quizzes[quizIdx];

  function handleNextPage() {
    if (pageIdx < course.pages.length - 1) {
      setPageIdx(p => p + 1);
    } else {
      setPhase('quiz');
    }
  }

  function handleAnswer(id: string) {
    if (answered) return;
    setSelected(id);
    setAnswered(true);
    const correct = id === currentQuiz.answer;
    if (correct) {
      Vibration.vibrate(40);
      setScore(s => s + 1);
    } else {
      Vibration.vibrate([0, 80, 40, 80]);
      setWrongAnswers(w => [...w, currentQuiz.id]);
    }
  }

  function handleNextQuiz() {
    if (quizIdx < course.quizzes.length - 1) {
      setQuizIdx(q => q + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      finishLesson();
    }
  }

  function calculateReward(correct: number, total: number): number {
    const rate = correct / total;
    if (rate === 1.0) return 100000;
    if (rate >= 0.8) return 70000;
    if (rate >= 0.6) return 50000;
    if (rate >= 0.4) return 30000;
    return 10000;
  }

  async function finishLesson() {
    const finalScore = score + (selected === currentQuiz.answer ? 1 : 0);
    if (user) {
      try {
        const reward = calculateReward(finalScore, course.quizzes.length);
        await setDoc(doc(db, 'users', user.id, 'progress', courseId), {
          courseId,
          completed: true,
          score: finalScore,
          reward,
          completedAt: Date.now(),
        });
      } catch { /* 오프라인 시 무시 */ }
    }
    setPhase('result');
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 16, paddingBottom: 16,
    },
    backBtn: { padding: 4 },
    backText: { fontSize: 22, color: theme.bgCard, fontWeight: '600' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: theme.bgCard },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
    progressBg: { height: 4, backgroundColor: Colors.border },
    progressFill: { height: '100%' },
    content: { padding: 20, paddingBottom: 100 },
    pageEmoji: { fontSize: 52, textAlign: 'center', marginBottom: 12 },
    pageTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 16 },
    pageContent: { fontSize: 16, lineHeight: 26, color: Colors.text },
    bottomBar: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: 16, paddingBottom: 30, backgroundColor: theme.bgCard,
      borderTopWidth: 1, borderTopColor: Colors.border,
    },
    quizBadge: {
      alignSelf: 'flex-start', backgroundColor: '#EEF6FF',
      borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 16,
    },
    quizBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
    question: { fontSize: 18, fontWeight: '700', color: Colors.text, lineHeight: 26, marginBottom: 20 },
    oxRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    oxBtn: {
      flex: 1, aspectRatio: 1, borderRadius: 16, borderWidth: 2,
      alignItems: 'center', justifyContent: 'center',
    },
    oxText: { fontSize: 56, fontWeight: '900' },
    optionBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: theme.bgCard, borderRadius: 12, borderWidth: 1.5,
      padding: 14,
    },
    optionNum: {
      width: 28, height: 28, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
    },
    optionNumText: { color: theme.bgCard, fontSize: 13, fontWeight: '800' },
    optionText: { flex: 1, fontSize: 15, color: Colors.text },
    explanationBox: {
      marginTop: 20, backgroundColor: '#F8F9FA', borderRadius: 12,
      padding: 16, borderLeftWidth: 4,
    },
    explanationTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 6 },
    explanationText: { fontSize: 14, lineHeight: 22, color: Colors.textSub },
    resultMsgBox: {
      backgroundColor: '#F0F7FF', borderRadius: 12, padding: 16,
      marginVertical: 16, width: '100%',
    },
    resultMsg: { fontSize: 15, color: Colors.primary, textAlign: 'center', fontWeight: '600' },
    rewardBox: {
      backgroundColor: '#EBF5FF', borderRadius: 12, padding: 16,
      alignItems: 'center', marginTop: 12, width: '100%',
    },
  });

  if (phase === 'lesson') {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: color, paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{course.title}</Text>
            <Text style={styles.headerSub}>{pageIdx + 1} / {course.pages.length}</Text>
          </View>
        </View>

        {/* 진행 바 */}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, {
            width: `${((pageIdx + 1) / course.pages.length) * 100}%` as any,
            backgroundColor: color,
          }]} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.pageEmoji}>{currentPage.emoji}</Text>
          <Text style={styles.pageTitle}>{currentPage.title}</Text>
          <Text style={styles.pageContent}>{currentPage.content}</Text>
        </ScrollView>

        <View style={styles.bottomBar}>
          <Button
            title={pageIdx < course.pages.length - 1 ? '다음 →' : '퀴즈 시작 →'}
            onPress={handleNextPage}
            variant="primary"
            size="lg"
            fullWidth
          />
        </View>
      </View>
    );
  }

  if (phase === 'quiz') {
    const isCorrect = answered && selected === currentQuiz.answer;
    const isWrong = answered && selected !== currentQuiz.answer;

    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: color, paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>퀴즈 {quizIdx + 1} / {course.quizzes.length}</Text>
            <Text style={styles.headerSub}>{score}점 획득 중</Text>
          </View>
        </View>

        <View style={styles.progressBg}>
          <View style={[styles.progressFill, {
            width: `${(quizIdx / course.quizzes.length) * 100}%` as any,
            backgroundColor: color,
          }]} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.quizBadge}>
            <Text style={styles.quizBadgeText}>{currentQuiz.type === 'ox' ? 'OX 퀴즈' : '4지선다'}</Text>
          </View>
          <Text style={styles.question}>{currentQuiz.question}</Text>

          {/* OX 퀴즈 */}
          {currentQuiz.type === 'ox' && (
            <View style={styles.oxRow}>
              {(['O', 'X'] as const).map(opt => {
                const sel = selected === opt;
                const correct = currentQuiz.answer === opt;
                let bg = theme.bgCard;
                if (answered) {
                  if (correct) bg = '#E8FFF0';
                  else if (sel) bg = theme.redLight;
                }
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.oxBtn, { backgroundColor: bg, borderColor: answered ? (correct ? Colors.green : (sel ? Colors.red : Colors.border)) : (sel ? color : Colors.border) }]}
                    onPress={() => handleAnswer(opt)}
                    disabled={answered}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.oxText, { color: answered ? (correct ? Colors.green : (sel ? Colors.red : Colors.textMuted)) : (sel ? color : Colors.text) }]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* 4지선다 */}
          {currentQuiz.type === 'multiple' && (
            <View style={{ gap: 10 }}>
              {(currentQuiz.options ?? []).map(opt => {
                const sel = selected === opt.id;
                const correct = currentQuiz.answer === opt.id;
                let bg = theme.bgCard;
                let borderColor = Colors.border;
                if (answered) {
                  if (correct) { bg = '#E8FFF0'; borderColor = Colors.green; }
                  else if (sel) { bg = theme.redLight; borderColor = Colors.red; }
                } else if (sel) {
                  borderColor = color;
                }
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.optionBtn, { backgroundColor: bg, borderColor }]}
                    onPress={() => handleAnswer(opt.id)}
                    disabled={answered}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.optionNum, { backgroundColor: answered && correct ? Colors.green : (answered && sel ? Colors.red : color) }]}>
                      <Text style={styles.optionNumText}>{opt.id.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.optionText}>{opt.text}</Text>
                    {answered && correct && <Text style={{ marginLeft: 'auto' as any }}>✅</Text>}
                    {answered && sel && !correct && <Text style={{ marginLeft: 'auto' as any }}>❌</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* 해설 */}
          {answered && (
            <View style={[styles.explanationBox, { borderLeftColor: isCorrect ? Colors.green : Colors.red }]}>
              <Text style={styles.explanationTitle}>{isCorrect ? '✅ 정답!' : '❌ 오답'}</Text>
              <Text style={styles.explanationText}>{currentQuiz.explanation}</Text>
            </View>
          )}
        </ScrollView>

        {answered && (
          <View style={styles.bottomBar}>
            <Button
              title={quizIdx < course.quizzes.length - 1 ? '다음 문제 →' : '결과 보기 →'}
              onPress={handleNextQuiz}
              variant="primary"
              size="lg"
              fullWidth
            />
          </View>
        )}
      </View>
    );
  }

  // 결과 화면
  const total = course.quizzes.length;
  const pct = Math.round((score / total) * 100);
  const isPerfect = score === total;

  return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
      <Text style={{ fontSize: 72, marginBottom: 16 }}>{isPerfect ? '🏆' : score >= total * 0.6 ? '🎉' : '📖'}</Text>
      <Text style={[Typography.h2, { textAlign: 'center', marginBottom: 8 }]}>{course.title}</Text>
      <Text style={[Typography.h1, { color, fontSize: 48, fontWeight: '900' }]}>{score} / {total}</Text>
      <Text style={[Typography.body1, { color: Colors.textSub, marginTop: 4 }]}>정답률 {pct}%</Text>
      <View style={styles.rewardBox}>
        <Text style={{ fontSize: 13, color: '#8E8E93' }}>퀴즈 보상</Text>
        <Text style={{ fontSize: 24, fontWeight: '800', color: theme.primary }}>
          +₩{calculateReward(score, total).toLocaleString()}
        </Text>
      </View>

      <View style={styles.resultMsgBox}>
        <Text style={styles.resultMsg}>
          {isPerfect ? '완벽해요! 모든 문제를 맞혔어요 🎯' :
           score >= total * 0.6 ? '잘했어요! 다음 코스도 도전해봐요 💪' :
           '조금 더 복습하면 완벽해질 거예요 📚'}
        </Text>
      </View>

      <View style={{ width: '100%', gap: 12, marginTop: 8 }}>
        <Button title="다음 코스로" onPress={() => navigation.goBack()} variant="primary" size="lg" fullWidth />
        <Button title="다시 풀기" onPress={() => {
          setPhase('lesson'); setPageIdx(0);
          setQuizIdx(0); setSelected(null);
          setAnswered(false); setScore(0); setWrongAnswers([]);
        }} variant="outline" size="lg" fullWidth />
      </View>
    </View>
  );
}

