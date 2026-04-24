/**
 * 오답 노트 화면 — 틀린 문제 목록 확인
 */
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getLearningData } from '../lib/learningService';
import {
  learningContent,
  CATEGORY_META,
  type CategoryId,
  type DuoLesson,
} from '../data/learningContent';

interface ParsedWrongAnswer {
  id: string;
  categoryId: string;
  levelId: string;
  questionIndex: number;
  categoryTitle: string;
  levelTitle: string;
  questionText: string;
  lessons: DuoLesson[];
}

/**
 * 오답 ID 파싱: "vocabulary_vocab_1_0"
 * → categoryId="vocabulary", levelId="vocab_1", questionIndex=0
 */
function parseWrongAnswerId(id: string): ParsedWrongAnswer | null {
  const parts = id.split('_');
  if (parts.length < 3) return null;

  const categoryId = parts[0];
  const questionIndex = parseInt(parts[parts.length - 1], 10);
  if (isNaN(questionIndex)) return null;

  const levelId = parts.slice(1, -1).join('_');

  const category = learningContent[categoryId as CategoryId];
  if (!category) return null;

  const level = category.levels.find(l => l.id === levelId);
  if (!level) return null;

  const lesson = level.lessons[questionIndex];
  let questionText = '문제 정보 없음';
  if (lesson) {
    if (lesson.type === 'quiz' || lesson.type === 'fillblank') {
      questionText = lesson.question;
    } else if (lesson.type === 'matching') {
      questionText = lesson.question || '용어 매칭';
    } else {
      questionText = lesson.title || '학습 카드';
    }
  }

  const meta = CATEGORY_META[categoryId as CategoryId];

  return {
    id,
    categoryId,
    levelId,
    questionIndex,
    categoryTitle: meta?.title ?? categoryId,
    levelTitle: level.title,
    questionText,
    lessons: level.lessons,
  };
}

export default function WrongAnswerScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [wrongAnswers, setWrongAnswers] = useState<ParsedWrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    getLearningData(user.id)
      .then(data => {
        const ids: string[] = data.wrongAnswers ?? [];
        const parsed = ids
          .map(parseWrongAnswerId)
          .filter((v): v is ParsedWrongAnswer => v !== null);
        setWrongAnswers(parsed);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  function renderItem({ item }: { item: ParsedWrongAnswer }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.iconBox}>
            <Text style={styles.iconEmoji}>❓</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.categoryLabel}>{item.categoryTitle} · {item.levelTitle}</Text>
            <Text style={styles.questionPreview} numberOfLines={2}>{item.questionText}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.studyLink}
          onPress={() => {
            navigation.navigate('레슨플레이어', {
              categoryId: item.categoryId,
              levelId: item.levelId,
              lessons: item.lessons,
              levelTitle: item.levelTitle,
              focusQuestionIndex: item.questionIndex,
            });
          }}
        >
          <Text style={styles.studyLinkText}>학습하러 가기 →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: '#F0F2F5',
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, flex: 1 },
    badge: {
      backgroundColor: '#FF3B30', borderRadius: 12,
      paddingHorizontal: 8, paddingVertical: 2,
      minWidth: 24, alignItems: 'center',
    },
    badgeText: { fontSize: 12, fontWeight: '700', color: theme.bgCard },
    list: { padding: 16, gap: 12 },
    card: {
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      borderLeftWidth: 4,
      borderLeftColor: '#FF3B30',
      padding: 16,
      shadowColor: theme.text,
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: theme.redLight, alignItems: 'center', justifyContent: 'center',
    },
    iconEmoji: { fontSize: 20 },
    cardContent: { flex: 1 },
    categoryLabel: { fontSize: 12, fontWeight: '600', color: Colors.primary ?? '#0066FF', marginBottom: 2 },
    questionPreview: { fontSize: 14, fontWeight: '600', color: Colors.text, lineHeight: 20 },
    studyLink: { marginTop: 10, alignSelf: 'flex-end' },
    studyLinkText: { fontSize: 13, fontWeight: '600', color: Colors.primary ?? '#0066FF' },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyEmoji: { fontSize: 56 },
    emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textSub ?? '#6B7280' },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📝 오답 노트</Text>
        {wrongAnswers.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{wrongAnswers.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      ) : wrongAnswers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={styles.emptyText}>오답이 없어요! 완벽해요 👍</Text>
        </View>
      ) : (
        <FlatList
          data={wrongAnswers}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}
