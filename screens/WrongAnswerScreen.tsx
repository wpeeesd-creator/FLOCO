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

interface WrongAnswer {
  id: string;
  addedAt?: string;
}

export default function WrongAnswerScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    getLearningData(user.id)
      .then(data => {
        const ids: string[] = data.wrongAnswers ?? [];
        setWrongAnswers(ids.map(id => ({ id })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  function renderItem({ item }: { item: WrongAnswer }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.iconBox}>
            <Text style={styles.iconEmoji}>❓</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.idText}>{item.id}</Text>
            <Text style={styles.subText}>복습이 필요한 문제예요</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.studyLink}
          onPress={() => {
            const parts = item.id.split('_');
            const categoryId = parts[0];
            const lessonId = parts.length >= 2 ? `${parts[0]}_${parts[1]}` : parts[0];
            navigation.navigate('LessonPlayer', { lessonId, categoryId });
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
    idText: { fontSize: 14, fontWeight: '600', color: Colors.text },
    subText: { fontSize: 12, color: Colors.textSub ?? '#6B7280', marginTop: 2 },
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

