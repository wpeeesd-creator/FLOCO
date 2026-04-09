import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

export default function RealNameVerifyScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { user: currentUser } = useAuth();

  const [realName, setRealName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = realName.trim().length > 0 && studentId.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid || !currentUser?.id) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.id), {
        realName: realName.trim(),
        studentId: studentId.trim(),
        realNameVerified: true,
      });
      Alert.alert('완료', '실명 인증이 완료됐어요!', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('오류', '인증 중 문제가 발생했어요. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>실명 인증</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.container}>
        {/* Icon + title */}
        <Text style={styles.emoji}>🪪</Text>
        <Text style={styles.title}>실명 인증</Text>
        <Text style={styles.description}>
          학생 이름과 학번을 입력하면{'\n'}실명 인증 배지가 프로필에 표시돼요.
        </Text>

        {/* Fields */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>이름</Text>
          <TextInput
            style={styles.input}
            value={realName}
            onChangeText={setRealName}
            placeholder="실명을 입력해주세요"
            placeholderTextColor={Colors.textMuted}
            autoCorrect={false}
            returnKeyType="next"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>학번</Text>
          <TextInput
            style={styles.input}
            value={studentId}
            onChangeText={setStudentId}
            placeholder="학번을 입력해주세요"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={!isValid || isSubmitting}
        >
          <Text style={[styles.submitBtnText, { color: theme.bgCard }]}>
            {isSubmitting ? '인증 중...' : '인증 완료'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: Colors.textSub,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
