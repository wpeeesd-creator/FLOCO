import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAppStore } from '../store/appStore';
import { getTodayOXQuestions } from '../data/dailyQuestions';
import { Trophy, PartyPopper, XCircle } from 'lucide-react-native';

type Phase = 'quiz' | 'result';

const REWARD_PER_CORRECT = 1000;

export default function DailyQuizScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const questions = useMemo(() => getTodayOXQuestions(), []);
  const [phase, setPhase] = useState<Phase>('quiz');
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<'O' | 'X' | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);
  const [alreadyDone, setAlreadyDone] = useState(false);

  // 진입 시 1회: 오늘 이미 풀었으면 결과 화면으로 막기
  useEffect(() => {
    let active = true;
    const checkAlreadyDone = async () => {
      if (!user?.id) {
        if (active) setChecking(false);
        return;
      }
      const today = new Date().toISOString().slice(0, 10);
      try {
        const learnRef = doc(db, 'users', user.id, 'learning', 'data');
        const snap = await getDoc(learnRef);
        const dq = snap.data()?.dailyQuiz;
        if (active && dq?.lastDate === today) {
          setCorrectCount(dq.correctCount ?? 0);
          setAlreadyDone(true);
          setPhase('result');
        }
      } catch (e) {
        console.warn('데일리 OX 진입 체크 실패:', e);
      } finally {
        if (active) setChecking(false);
      }
    };
    checkAlreadyDone();
    return () => { active = false; };
  }, [user?.id]);

  const current = questions[idx];
  const isCorrect = selected === current?.answer;

  const handleAnswer = (choice: 'O' | 'X') => {
    if (answered) return;
    setSelected(choice);
    setAnswered(true);
    if (choice === current.answer) {
      setCorrectCount((c) => c + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleNext = async () => {
    if (idx + 1 >= questions.length) {
      // 결과 화면 진입 + 보상 지급
      await submitResult();
      setPhase('result');
      return;
    }
    setIdx(idx + 1);
    setSelected(null);
    setAnswered(false);
  };

  const submitResult = async () => {
    if (!user?.id || submitting) return;
    setSubmitting(true);
    const reward = correctCount * REWARD_PER_CORRECT;
    const today = new Date().toISOString().slice(0, 10);
    try {
      // 1) users 잔고 + totalAsset
      if (reward > 0) {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, {
          balance: increment(reward),
          totalAsset: increment(reward),
        });
        // store 동기화
        const cash = useAppStore.getState().cash;
        useAppStore.setState({ cash: cash + reward });
      }
      // 2) learning/data.dailyQuiz 업데이트
      const learnRef = doc(db, 'users', user.id, 'learning', 'data');
      const snap = await getDoc(learnRef);
      if (snap.exists()) {
        await updateDoc(learnRef, {
          dailyQuiz: { lastDate: today, correctCount, totalCount: questions.length },
        });
      } else {
        await setDoc(learnRef, {
          dailyQuiz: { lastDate: today, correctCount, totalCount: questions.length },
        }, { merge: true });
      }
    } catch (e) {
      console.warn('데일리 OX 보상 저장 실패:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
    backBtn: { padding: 6 },
    title: { color: theme.text, fontSize: 16, fontWeight: '700', marginLeft: 4 },
    progress: { color: theme.textSecondary, fontSize: 13, marginLeft: 'auto' },
    container: { flex: 1, padding: 20, justifyContent: 'space-between' },
    questionWrap: { marginTop: 30 },
    questionNum: { color: theme.textSecondary, fontSize: 13, fontWeight: '600' },
    question: { color: theme.text, fontSize: 22, fontWeight: '700', marginTop: 8, lineHeight: 30 },
    oxRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 40, gap: 16 },
    oxBtn: {
      flex: 1, paddingVertical: 30, borderRadius: 16,
      backgroundColor: theme.bgCard,
      borderWidth: 2, borderColor: theme.border,
      alignItems: 'center',
    },
    oxBtnText: { fontSize: 48, fontWeight: '800' },
    feedback: { marginTop: 24, padding: 16, borderRadius: 12 },
    feedbackTitle: { fontSize: 18, fontWeight: '700' },
    feedbackText: { color: theme.text, fontSize: 14, marginTop: 6, lineHeight: 20 },
    nextBtn: { backgroundColor: theme.primary, paddingVertical: 14, borderRadius: 12, marginTop: 16 },
    nextBtnText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '700' },
    resultWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    resultEmoji: { fontSize: 80 },
    resultTitle: { color: theme.text, fontSize: 28, fontWeight: '800', marginTop: 16 },
    resultScore: { color: theme.primary, fontSize: 56, fontWeight: '900', marginTop: 12 },
    resultLabel: { color: theme.textSecondary, fontSize: 16, marginTop: 4 },
    resultReward: { color: theme.text, fontSize: 18, fontWeight: '700', marginTop: 24 },
  });

  if (checking) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'result') {
    const reward = correctCount * REWARD_PER_CORRECT;
    const allCorrect = correctCount === questions.length;
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.resultWrap}>
          <View style={{ marginBottom: 8 }}>
            {allCorrect
              ? <Trophy size={80} color="#EAB308" />
              : correctCount >= 3
                ? <PartyPopper size={80} color={theme.primary} />
                : <Trophy size={80} color={theme.textSecondary} />}
          </View>
          <Text style={styles.resultTitle}>오늘의 OX 완료!</Text>
          <Text style={styles.resultScore}>{correctCount}/{questions.length}</Text>
          <Text style={styles.resultLabel}>정답</Text>
          {alreadyDone ? (
            <Text style={[styles.resultReward, { color: theme.textSecondary }]}>오늘은 이미 완료했어요</Text>
          ) : submitting ? (
            <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 24 }} />
          ) : (
            <Text style={styles.resultReward}>+{reward.toLocaleString()}원 지급!</Text>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, { marginTop: 32, width: '80%' }]}
            onPress={() => navigation.goBack()}
            disabled={submitting}
          >
            <Text style={styles.nextBtnText}>학습으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>오늘의 OX</Text>
        <Text style={styles.progress}>{idx + 1} / {questions.length}</Text>
      </View>
      <View style={styles.container}>
        <View style={styles.questionWrap}>
          <Text style={styles.questionNum}>문제 {idx + 1}</Text>
          <Text style={styles.question}>{current.question}</Text>
          <View style={styles.oxRow}>
            <TouchableOpacity
              style={[
                styles.oxBtn,
                selected === 'O' && { borderColor: theme.green ?? '#22C55E', backgroundColor: (theme.green ?? '#22C55E') + '15' },
              ]}
              onPress={() => handleAnswer('O')}
              disabled={answered}
            >
              <Text style={[styles.oxBtnText, { color: theme.green ?? '#22C55E' }]}>O</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.oxBtn,
                selected === 'X' && { borderColor: theme.red ?? '#EF4444', backgroundColor: (theme.red ?? '#EF4444') + '15' },
              ]}
              onPress={() => handleAnswer('X')}
              disabled={answered}
            >
              <Text style={[styles.oxBtnText, { color: theme.red ?? '#EF4444' }]}>X</Text>
            </TouchableOpacity>
          </View>
          {answered && (
            <View style={[styles.feedback, { backgroundColor: isCorrect ? (theme.green ?? '#22C55E') + '15' : (theme.red ?? '#EF4444') + '15' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {isCorrect
                  ? <PartyPopper size={20} color={theme.green ?? '#22C55E'} />
                  : <XCircle size={20} color={theme.red ?? '#EF4444'} />}
                <Text style={[styles.feedbackTitle, { color: isCorrect ? (theme.green ?? '#22C55E') : (theme.red ?? '#EF4444') }]}>
                  {isCorrect ? '정답!' : `오답 (정답: ${current.answer})`}
                </Text>
              </View>
              <Text style={styles.feedbackText}>{current.explanation}</Text>
            </View>
          )}
        </View>
        {answered && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {idx + 1 >= questions.length ? '결과 보기 →' : '다음 문제 →'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
