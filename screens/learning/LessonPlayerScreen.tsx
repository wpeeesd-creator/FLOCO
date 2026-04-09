import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../store/appStore';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { completeLesson, loseHeart, saveWrongAnswer } from '../../lib/learningService';
import {
  learningContent,
  REWARDS,
  type DuoLesson,
  type CategoryId,
} from '../../data/learningContent';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RouteParams = {
  categoryId: string;
  levelId: string;
  lessons: DuoLesson[];
  levelTitle: string;
};

export default function LessonPlayerScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = (route.params ?? {}) as Partial<RouteParams>;
  const categoryId = params.categoryId ?? '';
  const levelId = params.levelId ?? '';
  const lessons = params.lessons ?? [];
  const levelTitle = params.levelTitle ?? '';
  const { user } = useAuth();
  const appStoreCash = useAppStore((s) => s.cash);

  // Core state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hearts, setHearts] = useState(3);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);

  // Matching state
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [shuffledDefs, setShuffledDefs] = useState<number[]>([]);

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Edge case: empty lessons
  if (!lessons || lessons.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>레슨을 찾을 수 없어요</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.emptyBack}>
            <Text style={styles.emptyBackText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentLesson = lessons[currentIndex];
  const totalLessons = lessons.length;

  // Shuffle definitions on lesson change for matching type
  useEffect(() => {
    if (currentLesson.type === 'matching') {
      const indices = currentLesson.pairs.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledDefs(indices);
    }
    setSelectedTerm(null);
    setMatchedPairs([]);
  }, [currentIndex]);

  // Completion handler — reward based on accuracy
  const handleCompletion = useCallback(async () => {
    const quizLessons = lessons.filter((l) => l.type !== 'learn');
    const totalQuizCount = quizLessons.length;
    const correctCount = totalQuizCount - wrongIds.length;
    const rate = totalQuizCount > 0 ? correctCount / totalQuizCount : 1;

    // Reward based on accuracy
    let reward = 10000;
    if (rate === 1.0) reward = 100000;
    else if (rate >= 0.8) reward = 70000;
    else if (rate >= 0.6) reward = 50000;
    else if (rate >= 0.4) reward = 30000;

    const lessonKey = `${categoryId}_${levelId}`;

    if (user?.id) {
      // 중복 보상 방지
      const dedupeSnap = await getDoc(doc(db, 'users', user.id, 'learning', 'data'));
      const alreadyCompleted = (dedupeSnap.data()?.completedLessons ?? []).includes(lessonKey);
      if (alreadyCompleted) {
        Alert.alert('알림', '이미 완료한 레슨이에요. 보상은 한 번만 지급돼요.');
        return;
      }

      // Save lesson completion + points
      await completeLesson(
        user.id,
        lessonKey,
        categoryId,
        reward,
        wrongIds.length > 0 ? wrongIds : undefined,
      );

      // Save reward history + update balance/totalAsset in user doc
      try {
        const userRef = doc(db, 'users', user.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const currentBalance = userData.balance ?? 1_000_000;
          const currentTotalAsset = userData.totalAsset ?? 1_000_000;
          const currentInitialBalance = userData.initialBalance ?? 1_000_000;
          await updateDoc(userRef, {
            balance: currentBalance + reward,
            totalAsset: currentTotalAsset + reward,
            initialBalance: currentInitialBalance + reward,
          });
          // Zustand 로컬 상태도 즉시 반영
          useAppStore.setState({ cash: appStoreCash + reward });
        }
        // Save to learning/data rewardHistory
        const learningRef = doc(db, 'users', user.id, 'learning', 'data');
        await updateDoc(learningRef, {
          rewardHistory: arrayUnion({
            lessonId: lessonKey,
            lessonTitle: levelTitle,
            reward,
            correctCount,
            totalCount: totalQuizCount,
            completedAt: new Date().toISOString(),
          }),
        });
      } catch (e) {
        console.error('보상 저장 오류:', e);
      }
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const cat = learningContent[categoryId as CategoryId];
    if (cat) {
      const currentLevelIdx = cat.levels.findIndex((l) => l.id === levelId);
      const nextLevel = cat.levels[currentLevelIdx + 1];

      if (nextLevel) {
        Alert.alert(
          '🎉 레슨 완료!',
          `정답률 ${Math.round(rate * 100)}%\n+${reward.toLocaleString()}원 지급!\n\n다음 레슨으로 이동할까요?`,
          [
            {
              text: '다음 레슨 →',
              onPress: () => {
                navigation.replace('레슨플레이어', {
                  categoryId,
                  levelId: nextLevel.id,
                  lessons: nextLevel.lessons,
                  levelTitle: nextLevel.title,
                });
              },
            },
            { text: '나중에', onPress: () => navigation.goBack() },
          ],
        );
      } else {
        Alert.alert(
          '🏆 카테고리 완료!',
          `모든 레슨을 완료했어요!\n정답률 ${Math.round(rate * 100)}%\n+${reward.toLocaleString()}원 지급!`,
          [{ text: '확인', onPress: () => navigation.goBack() }],
        );
      }
    } else {
      navigation.goBack();
    }
  }, [wrongIds, lessons, user, categoryId, levelId, levelTitle, navigation]);

  // Next lesson logic
  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= totalLessons) {
      setCompleted(true);
      handleCompletion();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setIsCorrect(false);
      setSelectedTerm(null);
      setMatchedPairs([]);
      feedbackOpacity.setValue(0);
      Animated.timing(progressAnim, {
        toValue: (currentIndex + 2) / totalLessons,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [currentIndex, totalLessons, handleCompletion, progressAnim, feedbackOpacity]);

  // Correct feedback
  const showCorrectFeedback = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsCorrect(true);
    setIsAnswered(true);
    setEarnedPoints((prev) => prev + 100);
    Animated.sequence([
      Animated.timing(feedbackOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(feedbackOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [feedbackOpacity]);

  // Wrong feedback
  const showWrongFeedback = useCallback(
    (questionId: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsCorrect(false);
      setIsAnswered(true);
      setHearts((prev) => Math.max(0, prev - 1));
      if (user?.id) {
        loseHeart(user.id);
        saveWrongAnswer(user.id, questionId);
      }
      setWrongIds((prev) => [...prev, questionId]);
      // Shake
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      // Show feedback
      Animated.timing(feedbackOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    },
    [user, shakeAnim, feedbackOpacity],
  );

  // Quiz / FillBlank answer handler
  const handleSelectAnswer = useCallback(
    (index: number, correct: boolean) => {
      if (isAnswered) return;
      setSelectedAnswer(index);
      const questionId = `${categoryId}_${levelId}_${currentIndex}`;
      if (correct) {
        showCorrectFeedback();
      } else {
        showWrongFeedback(questionId);
      }
    },
    [isAnswered, categoryId, levelId, currentIndex, showCorrectFeedback, showWrongFeedback],
  );

  // Matching handlers
  const handleTermTap = useCallback(
    (termIndex: number) => {
      if (matchedPairs.includes(termIndex)) return;
      setSelectedTerm(termIndex);
    },
    [matchedPairs],
  );

  const handleDefTap = useCallback(
    (defShuffledIndex: number) => {
      if (selectedTerm === null) return;
      const originalDefIndex = shuffledDefs[defShuffledIndex];
      if (matchedPairs.includes(selectedTerm)) return;

      if (originalDefIndex === selectedTerm) {
        const newMatched = [...matchedPairs, selectedTerm];
        setMatchedPairs(newMatched);
        setSelectedTerm(null);
        setEarnedPoints((prev) => prev + 50);

        if (currentLesson.type === 'matching' && newMatched.length === currentLesson.pairs.length) {
          setTimeout(() => handleNext(), 800);
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
        setSelectedTerm(null);
        setHearts((prev) => Math.max(0, prev - 1));
        if (user?.id) loseHeart(user.id);
      }
    },
    [selectedTerm, shuffledDefs, matchedPairs, currentLesson, shakeAnim, user, handleNext],
  );

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Completion screen
  if (completed) {
    const correctCount = lessons.filter(
      (_, i) => !wrongIds.includes(`${categoryId}_${levelId}_${i}`),
    ).length;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.completionTitle}>레슨 완료!</Text>
          <View style={styles.completionPointsBox}>
            <Text style={styles.completionPointsLabel}>획득 포인트</Text>
            <Text style={styles.completionPoints}>⭐ +{earnedPoints.toLocaleString()}</Text>
          </View>
          <View style={[styles.completionStats, { backgroundColor: theme.bgCard }]}>
            <Text style={styles.completionStatsText}>
              {correctCount} / {totalLessons} 정답
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentStep = currentIndex + 1;
  const explanation =
    currentLesson.type === 'quiz' || currentLesson.type === 'fillblank'
      ? currentLesson.explanation
      : '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Progress header */}
      <View style={[styles.header, { backgroundColor: theme.bgCard }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={Colors.textSub} />
        </TouchableOpacity>
        <View style={[styles.progressBg, { backgroundColor: theme.bg }]}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.stepCounter}>
          {currentStep}/{totalLessons}
        </Text>
      </View>

      {/* Hearts */}
      <View style={[styles.heartsRow, { backgroundColor: theme.bgCard }]}>
        {[0, 1, 2].map((i) => (
          <Text key={i} style={styles.heartIcon}>
            {i < hearts ? '❤️' : '🖤'}
          </Text>
        ))}
      </View>

      {/* Lesson content */}
      <Animated.View style={[styles.flex, { transform: [{ translateX: shakeAnim }] }]}>
        {currentLesson.type === 'learn' && (
          <LearnCard lesson={currentLesson} onNext={handleNext} />
        )}
        {currentLesson.type === 'quiz' && (
          <QuizCard
            lesson={currentLesson}
            selectedAnswer={selectedAnswer}
            isAnswered={isAnswered}
            isCorrect={isCorrect}
            feedbackOpacity={feedbackOpacity}
            explanation={explanation}
            onSelectAnswer={handleSelectAnswer}
            onNext={handleNext}
          />
        )}
        {currentLesson.type === 'fillblank' && (
          <FillBlankCard
            lesson={currentLesson}
            selectedAnswer={selectedAnswer}
            isAnswered={isAnswered}
            isCorrect={isCorrect}
            feedbackOpacity={feedbackOpacity}
            explanation={explanation}
            onSelectAnswer={handleSelectAnswer}
            onNext={handleNext}
          />
        )}
        {currentLesson.type === 'matching' && (
          <MatchingCard
            lesson={currentLesson}
            selectedTerm={selectedTerm}
            matchedPairs={matchedPairs}
            shuffledDefs={shuffledDefs}
            onTermTap={handleTermTap}
            onDefTap={handleDefTap}
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

// ── LearnCard ─────────────────────────────────────────────────────────────────
type LearnCardProps = {
  lesson: import('../../data/learningContent').LearnLesson;
  onNext: () => void;
};

function LearnCard({ lesson, onNext }: LearnCardProps) {
  const { theme, isDark } = useTheme();
  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.learnEmoji}>{lesson.emoji}</Text>
        <Text style={styles.learnTitle}>{lesson.title}</Text>
        <Text style={styles.learnContent}>{lesson.content}</Text>
      </ScrollView>
      <View style={[styles.bottomBar, { backgroundColor: theme.bgCard }]}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onNext} activeOpacity={0.85}>
          <Text style={[styles.primaryBtnText, { color: theme.bgCard }]}>계속</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── FeedbackBar ───────────────────────────────────────────────────────────────
type FeedbackBarProps = {
  isCorrect: boolean;
  feedbackOpacity: Animated.Value;
  explanation: string;
  onNext: () => void;
};

function FeedbackBar({ isCorrect, feedbackOpacity, explanation, onNext }: FeedbackBarProps) {
  const { theme, isDark } = useTheme();
  return (
    <Animated.View
      style={[
        styles.feedbackContainer,
        {
          opacity: feedbackOpacity,
          backgroundColor: isCorrect ? '#D7FFB8' : '#FFE0E0',
          borderLeftColor: isCorrect ? '#58CC02' : '#FF4B4B',
        },
      ]}
    >
      <Text
        style={[
          styles.feedbackTitle,
          { color: isCorrect ? '#58CC02' : '#FF4B4B' },
        ]}
      >
        {isCorrect ? '🎉 정답이에요!' : '💔 틀렸어요!'}
      </Text>
      {explanation ? (
        <Text style={styles.feedbackExplanation}>{explanation}</Text>
      ) : null}
      <TouchableOpacity
        style={[
          styles.feedbackNextBtn,
          { backgroundColor: isCorrect ? '#58CC02' : '#FF4B4B' },
        ]}
        onPress={onNext}
        activeOpacity={0.85}
      >
        <Text style={[styles.feedbackNextBtnText, { color: theme.bgCard }]}>다음</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── QuizCard ──────────────────────────────────────────────────────────────────
type QuizCardProps = {
  lesson: import('../../data/learningContent').QuizLesson;
  selectedAnswer: number | null;
  isAnswered: boolean;
  isCorrect: boolean;
  feedbackOpacity: Animated.Value;
  explanation: string;
  onSelectAnswer: (index: number, correct: boolean) => void;
  onNext: () => void;
};

function QuizCard({
  lesson,
  selectedAnswer,
  isAnswered,
  isCorrect,
  feedbackOpacity,
  explanation,
  onSelectAnswer,
  onNext,
}: QuizCardProps) {
  const { theme, isDark } = useTheme();
  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.questionText}>{lesson.question}</Text>
        <View style={styles.optionsContainer}>
          {lesson.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isAnswerCorrect = index === lesson.answer;
            let borderColor = Colors.border;
            let bgColor = theme.bgCard;

            if (isAnswered) {
              if (isAnswerCorrect) {
                borderColor = '#58CC02';
                bgColor = '#D7FFB8';
              } else if (isSelected) {
                borderColor = '#FF4B4B';
                bgColor = '#FFE0E0';
              }
            } else if (isSelected) {
              borderColor = Colors.primary;
              bgColor = '#EEF4FF';
            }

            return (
              <TouchableOpacity
                key={index}
                style={[styles.optionBtn, { borderColor, backgroundColor: bgColor }]}
                onPress={() => onSelectAnswer(index, index === lesson.answer)}
                disabled={isAnswered}
                activeOpacity={0.8}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {isAnswered && (
        <FeedbackBar
          isCorrect={isCorrect}
          feedbackOpacity={feedbackOpacity}
          explanation={explanation}
          onNext={onNext}
        />
      )}
    </View>
  );
}

// ── FillBlankCard ─────────────────────────────────────────────────────────────
type FillBlankCardProps = {
  lesson: import('../../data/learningContent').FillBlankLesson;
  selectedAnswer: number | null;
  isAnswered: boolean;
  isCorrect: boolean;
  feedbackOpacity: Animated.Value;
  explanation: string;
  onSelectAnswer: (index: number, correct: boolean) => void;
  onNext: () => void;
};

function FillBlankCard({
  lesson,
  selectedAnswer,
  isAnswered,
  isCorrect,
  feedbackOpacity,
  explanation,
  onSelectAnswer,
  onNext,
}: FillBlankCardProps) {
  const { theme, isDark } = useTheme();
  const questionParts = lesson.question.split('___');
  const selectedText = selectedAnswer !== null ? lesson.options[selectedAnswer] : null;

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fillBlankQuestion}>
          {questionParts.map((part, i) => (
            <React.Fragment key={i}>
              <Text style={styles.questionText}>{part}</Text>
              {i < questionParts.length - 1 && (
                <View style={styles.blankUnderline}>
                  <Text style={styles.blankText}>{selectedText ?? '        '}</Text>
                </View>
              )}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.chipGrid}>
          {lesson.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isAnswerCorrect = option === lesson.answer;
            let borderColor = Colors.border;
            let bgColor = theme.bgCard;

            if (isAnswered) {
              if (isAnswerCorrect) {
                borderColor = '#58CC02';
                bgColor = '#D7FFB8';
              } else if (isSelected) {
                borderColor = '#FF4B4B';
                bgColor = '#FFE0E0';
              }
            } else if (isSelected) {
              borderColor = Colors.primary;
              bgColor = '#EEF4FF';
            }

            return (
              <TouchableOpacity
                key={index}
                style={[styles.chipBtn, { borderColor, backgroundColor: bgColor }]}
                onPress={() => onSelectAnswer(index, option === lesson.answer)}
                disabled={isAnswered}
                activeOpacity={0.8}
              >
                <Text style={styles.chipText}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {isAnswered && (
        <FeedbackBar
          isCorrect={isCorrect}
          feedbackOpacity={feedbackOpacity}
          explanation={explanation}
          onNext={onNext}
        />
      )}
    </View>
  );
}

// ── MatchingCard ──────────────────────────────────────────────────────────────
type MatchingCardProps = {
  lesson: import('../../data/learningContent').MatchingLesson;
  selectedTerm: number | null;
  matchedPairs: number[];
  shuffledDefs: number[];
  onTermTap: (index: number) => void;
  onDefTap: (shuffledIndex: number) => void;
};

function MatchingCard({
  lesson,
  selectedTerm,
  matchedPairs,
  shuffledDefs,
  onTermTap,
  onDefTap,
}: MatchingCardProps) {
  const { theme, isDark } = useTheme();
  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.matchingInstruction}>용어와 설명을 연결하세요</Text>
        <Text style={styles.questionText}>{lesson.question}</Text>
        <View style={styles.matchingGrid}>
          {/* Left: terms */}
          <View style={styles.matchingColumn}>
            {lesson.pairs.map((pair, index) => {
              const isMatched = matchedPairs.includes(index);
              const isSelected = selectedTerm === index;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.matchingCard,
                    { backgroundColor: theme.bgCard },
                    isMatched && styles.matchingCardMatched,
                    isSelected && styles.matchingCardSelected,
                  ]}
                  onPress={() => !isMatched && onTermTap(index)}
                  disabled={isMatched}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.matchingCardText,
                      isMatched && styles.matchingCardTextMatched,
                    ]}
                  >
                    {pair.term}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Right: shuffled definitions */}
          <View style={styles.matchingColumn}>
            {shuffledDefs.map((originalIndex, shuffledIndex) => {
              const isMatched = matchedPairs.includes(originalIndex);
              return (
                <TouchableOpacity
                  key={shuffledIndex}
                  style={[
                    styles.matchingCard,
                    { backgroundColor: theme.bgCard },
                    isMatched && styles.matchingCardMatched,
                    selectedTerm !== null && !isMatched && styles.matchingCardHighlightable,
                  ]}
                  onPress={() => !isMatched && onDefTap(shuffledIndex)}
                  disabled={isMatched}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.matchingCardText,
                      isMatched && styles.matchingCardTextMatched,
                    ]}
                  >
                    {lesson.pairs[originalIndex].definition}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSub,
  },
  emptyBack: {
    marginTop: 16,
  },
  emptyBackText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  closeBtn: {
    padding: 4,
  },
  progressBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  stepCounter: {
    fontSize: 13,
    color: Colors.textSub,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'right',
  },

  // Hearts
  heartsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 4,
  },
  heartIcon: {
    fontSize: 20,
  },

  // Scroll content
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },

  // Learn card
  learnEmoji: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 12,
  },
  learnTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  learnContent: {
    fontSize: 16,
    lineHeight: 26,
    color: Colors.text,
  },

  // Bottom bar (learn)
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Question
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 30,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 10,
  },
  optionBtn: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
  },
  optionText: {
    fontSize: 15,
    color: Colors.text,
  },

  // Feedback
  feedbackContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 0,
    borderLeftWidth: 4,
    paddingBottom: 28,
  },
  feedbackTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  feedbackExplanation: {
    fontSize: 14,
    color: '#4B4B4B',
    lineHeight: 20,
    marginBottom: 12,
  },
  feedbackNextBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  feedbackNextBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // FillBlank
  fillBlankQuestion: {
    marginBottom: 28,
  },
  blankUnderline: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    minWidth: 80,
    paddingBottom: 2,
    marginVertical: 4,
  },
  blankText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    minHeight: 26,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipBtn: {
    width: (SCREEN_WIDTH - 48 - 10) / 2,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  chipText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Matching
  matchingInstruction: {
    fontSize: 14,
    color: Colors.textSub,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  matchingGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  matchingColumn: {
    flex: 1,
    gap: 10,
  },
  matchingCard: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    minHeight: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchingCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF4FF',
  },
  matchingCardMatched: {
    borderColor: '#58CC02',
    backgroundColor: '#D7FFB8',
  },
  matchingCardHighlightable: {
    borderColor: '#B0C4DE',
  },
  matchingCardText: {
    fontSize: 13,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  matchingCardTextMatched: {
    color: '#58CC02',
  },

  // Completion screen
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  completionEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 24,
  },
  completionPointsBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  completionPointsLabel: {
    fontSize: 13,
    color: Colors.textSub,
    marginBottom: 4,
  },
  completionPoints: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F59E0B',
  },
  completionStats: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  completionStatsText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
});
