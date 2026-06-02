import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { isDailyQuizDoneToday, type LearningData } from '../lib/learningService';
import { Target } from 'lucide-react-native';

interface Props {
  learningData: LearningData | null;
}

export default function DailyQuizCard({ learningData }: Props) {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const done = isDailyQuizDoneToday(learningData?.dailyQuiz);
  const dq = learningData?.dailyQuiz;

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.bgCard,
      marginHorizontal: 16,
      marginTop: 12,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    label: { color: theme.textSecondary, fontSize: 12, fontWeight: '600' },
    title: { color: theme.text, fontSize: 16, fontWeight: '700', marginTop: 4 },
    sub: { color: theme.textSecondary, fontSize: 12, marginTop: 4 },
    btn: { backgroundColor: theme.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
    btnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    doneText: { color: theme.green ?? '#22C55E', fontSize: 14, fontWeight: '700' },
  });

  if (done && dq) {
    return (
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Target size={16} color={theme.primary} />
          <Text style={styles.label}>오늘의 OX</Text>
        </View>
        <Text style={styles.title}>
          오늘 {dq.correctCount}/{dq.totalCount} 완료!
        </Text>
        <Text style={styles.sub}>내일 또 도전해봐</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('데일리OX')}
      activeOpacity={0.85}
    >
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Target size={16} color={theme.primary} />
            <Text style={styles.label}>오늘의 OX</Text>
          </View>
          <Text style={styles.title}>OX 5문제 풀고 보상받기</Text>
          <Text style={styles.sub}>정답 1개당 1,000원!</Text>
        </View>
        <View style={styles.btn}>
          <Text style={styles.btnText}>도전 →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
