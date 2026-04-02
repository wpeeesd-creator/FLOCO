/**
 * 코스 목록 화면 — 카테고리별 레벨 리스트 (Duolingo 스타일)
 */
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/ui';
import {
  learningContent, CATEGORY_META,
  type CategoryId, type DuoLevel,
} from '../data/learningContent';
import { getLearningData } from '../lib/learningService';

export default function CourseListScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();

  const params = route.params as { level?: string; categoryId?: string };
  const categoryId = (params.categoryId ?? params.level ?? 'vocabulary') as CategoryId;
  const category = learningContent[categoryId];
  const meta = CATEGORY_META[categoryId];
  const levels: DuoLevel[] = category?.levels ?? [];

  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    getLearningData(user.id)
      .then(data => { setCompletedLessons(data.completedLessons ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const borderColor = meta?.color?.[0] ?? Colors.primary;

  function renderLevel({ item: level, index }: { item: DuoLevel; index: number }) {
    const isCompleted = completedLessons.includes(`${categoryId}_${level.id}`);
    const isLocked = index > 0 && !completedLessons.includes(`${categoryId}_${levels[index - 1].id}`);

    const cardBorderColor = isCompleted ? '#34C759' : isLocked ? '#E5E8EB' : borderColor;
    const iconBg = isCompleted ? '#E8FFF0' : isLocked ? '#F2F4F6' : (meta?.color?.[0] ?? Colors.primary) + '20';

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: cardBorderColor }, isLocked && styles.cardLocked]}
        activeOpacity={isLocked ? 1 : 0.8}
        onPress={() => {
          if (isLocked) {
            Alert.alert('잠김', '이전 코스를 먼저 완료해주세요!');
            return;
          }
          navigation.navigate('레슨플레이어', {
            categoryId,
            levelId: level.id,
            lessons: level.lessons,
            levelTitle: level.title,
          });
        }}
      >
        <View style={styles.cardRow}>
          <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
            {isCompleted ? (
              <Text style={styles.iconEmoji}>✅</Text>
            ) : isLocked ? (
              <Text style={styles.iconEmoji}>🔒</Text>
            ) : (
              <Text style={styles.iconEmoji}>{meta?.emoji ?? '📖'}</Text>
            )}
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.levelTitle, isLocked && styles.lockedText]}>{level.title}</Text>
            <Text style={styles.levelSub}>{level.lessons.length}개 레슨</Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: isCompleted ? '#34C759' : isLocked ? '#E5E8EB' : (meta?.color?.[0] ?? Colors.primary),
                    width: isCompleted ? '100%' : '0%',
                  },
                ]}
              />
            </View>
          </View>
          {!isLocked && (
            <Ionicons name="chevron-forward" size={20} color={isCompleted ? '#34C759' : (meta?.color?.[0] ?? Colors.primary)} />
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerEmoji}>{meta?.emoji ?? '📖'}</Text>
        <Text style={styles.headerTitle}>{meta?.title ?? categoryId}</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ fontSize: 14, color: '#8B95A1', marginTop: 12 }}>강좌를 불러오는 중...</Text>
        </View>
      ) : (
        <FlatList
          data={levels}
          keyExtractor={item => item.id}
          renderItem={renderLevel}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
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
  headerEmoji: { fontSize: 22 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, flex: 1 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderLeftWidth: 4,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLocked: { opacity: 0.6 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  iconEmoji: { fontSize: 24 },
  cardContent: { flex: 1 },
  levelTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  lockedText: { color: Colors.textMuted ?? '#9CA3AF' },
  levelSub: { fontSize: 13, color: Colors.textSub ?? '#6B7280', marginTop: 2 },
  progressBarBg: {
    height: 4, backgroundColor: '#F0F2F5', borderRadius: 2, marginTop: 8, overflow: 'hidden',
  },
  progressBarFill: { height: 4, borderRadius: 2 },
});
