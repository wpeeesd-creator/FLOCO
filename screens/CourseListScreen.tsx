/**
 * 코스 목록 화면 — 레벨별 코스 리스트
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { getCoursesByLevel, LEVEL_COLOR, LEVEL_EMOJI, type Level, type Course } from '../data/learningContent';
import { Colors, Typography } from '../components/ui';

export default function CourseListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { level } = route.params as { level: Level };
  const { user } = useAuth();

  const courses = getCoursesByLevel(level);
  const [progress, setProgress] = useState<Record<string, { completed: boolean; score: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getDocs(collection(db, 'users', user.id, 'progress'))
      .then(snap => {
        const map: Record<string, { completed: boolean; score: number }> = {};
        snap.forEach(d => { map[d.id] = d.data() as any; });
        setProgress(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  // 첫 번째 코스는 항상 잠금 해제, 이후는 이전 코스 완료 시 잠금 해제
  function isUnlocked(idx: number): boolean {
    if (idx === 0) return true;
    return !!progress[courses[idx - 1].id]?.completed;
  }

  const color = LEVEL_COLOR[level];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: color, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerEmoji}>{LEVEL_EMOJI[level]} {level}</Text>
          <Text style={styles.headerSub}>{courses.length}개 코스</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {courses.map((course, idx) => {
            const unlocked = isUnlocked(idx);
            const done = !!progress[course.id]?.completed;
            const score = progress[course.id]?.score ?? 0;
            return (
              <TouchableOpacity
                key={course.id}
                style={[styles.card, done && styles.cardDone, !unlocked && styles.cardLocked]}
                onPress={() => unlocked && navigation.navigate('레슨', { courseId: course.id })}
                activeOpacity={unlocked ? 0.8 : 1}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={[styles.iconBox, { backgroundColor: done ? color + '20' : '#F0F0F0' }]}>
                    <Text style={styles.icon}>{unlocked ? course.emoji : '🔒'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.courseTitle, !unlocked && styles.lockedText]}>{course.title}</Text>
                    <Text style={styles.courseDesc}>{course.desc}</Text>
                    {done && (
                      <Text style={[styles.scoreText, { color }]}>✅ 완료 · {score}/{course.quizzes.length} 정답</Text>
                    )}
                    {!unlocked && (
                      <Text style={styles.lockedHint}>이전 코스를 먼저 완료하세요</Text>
                    )}
                  </View>
                  {unlocked && (
                    <Text style={[styles.arrow, { color }]}>›</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 18,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 22, color: '#fff', fontWeight: '600' },
  headerEmoji: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  scroll: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardDone: { borderWidth: 1.5, borderColor: '#E0FFE8' },
  cardLocked: { opacity: 0.6 },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 24 },
  courseTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  courseDesc: { fontSize: 13, color: Colors.textSub, marginTop: 2 },
  scoreText: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  lockedText: { color: Colors.textMuted },
  lockedHint: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  arrow: { fontSize: 28, fontWeight: '300' },
});
