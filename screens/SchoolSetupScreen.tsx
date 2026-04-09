/**
 * 학교/반 설정 화면
 * Firestore users/{uid}.school 필드에 저장
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

const GRADES = ['1학년', '2학년', '3학년'];
const CLASSES = ['1반', '2반', '3반', '4반', '5반', '6반', '7반', '8반', '9반', '10반'];

export default function SchoolSetupScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [schoolName, setSchoolName] = useState('');
  const [grade, setGrade] = useState('');
  const [classNum, setClassNum] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 기존 설정 로드
  useEffect(() => {
    if (!user?.id) return;
    getDoc(doc(db, 'users', user.id)).then((snap) => {
      if (snap.exists()) {
        const school = snap.data()?.school;
        if (school) {
          setSchoolName(school.name ?? '');
          setGrade(school.grade ?? '');
          setClassNum(school.classNum ?? '');
        }
      }
    }).catch(() => {});
  }, [user?.id]);

  const isReady = schoolName.trim() && grade && classNum;

  const saveSchoolInfo = async () => {
    if (!isReady || !user?.id) {
      Alert.alert('알림', '학교명, 학년, 반을 모두 입력해주세요');
      return;
    }

    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        school: {
          name: schoolName.trim(),
          grade,
          classNum,
          classId: `${schoolName.trim()}_${grade}_${classNum}`,
        },
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '설정 완료!',
        `${schoolName} ${grade} ${classNum} 친구들과 랭킹 경쟁을 시작해요!`,
        [{ text: '확인', onPress: () => navigation.goBack() }],
      );
    } catch {
      Alert.alert('오류', '설정 중 오류가 발생했어요');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.bgCard },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    scroll: { padding: 24 },
    emoji: { fontSize: 40, textAlign: 'center' },
    title: {
      fontSize: 22, fontWeight: '700', textAlign: 'center',
      color: Colors.text, marginTop: 12, marginBottom: 8,
    },
    description: {
      color: Colors.textSub, textAlign: 'center', marginBottom: 32, lineHeight: 22,
    },
    label: {
      fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8,
    },
    input: {
      borderWidth: 2, borderColor: Colors.border, borderRadius: 12,
      padding: 16, fontSize: 15, color: Colors.text, marginBottom: 20,
    },
    inputActive: { borderColor: Colors.primary },
    chipRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    chip: {
      flex: 1, paddingVertical: 12, borderRadius: 12,
      borderWidth: 2, borderColor: Colors.border,
      backgroundColor: theme.bgCard, alignItems: 'center',
    },
    chipActive: { borderColor: Colors.primary, backgroundColor: theme.primaryLight },
    chipText: { color: Colors.textSub, fontWeight: '500' },
    chipTextActive: { color: Colors.primary, fontWeight: '700' },
    classGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
    classChip: {
      width: '18%', paddingVertical: 12, borderRadius: 12,
      borderWidth: 2, borderColor: Colors.border,
      backgroundColor: theme.bgCard, alignItems: 'center',
    },
    classChipText: { color: Colors.textSub, fontWeight: '500', fontSize: 13 },
    saveBtn: {
      backgroundColor: Colors.border, borderRadius: 16, height: 56,
      justifyContent: 'center', alignItems: 'center', marginBottom: 40,
    },
    saveBtnActive: { backgroundColor: Colors.primary },
    saveBtnText: { color: Colors.textSub, fontSize: 16, fontWeight: '700' },
    saveBtnTextActive: { color: theme.bgCard },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>학교/반 설정</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.emoji}>🏫</Text>
        <Text style={styles.title}>우리 반 친구들과 경쟁해요!</Text>
        <Text style={styles.description}>
          같은 학교/반 친구들끼리{'\n'}별도 랭킹을 확인할 수 있어요
        </Text>

        {/* 학교명 */}
        <Text style={styles.label}>학교명</Text>
        <TextInput
          value={schoolName}
          onChangeText={setSchoolName}
          placeholder="예) 넥스트챌린지스쿨"
          placeholderTextColor={Colors.textSub}
          style={[styles.input, schoolName ? styles.inputActive : null]}
        />

        {/* 학년 */}
        <Text style={styles.label}>학년</Text>
        <View style={styles.chipRow}>
          {GRADES.map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setGrade(g)}
              style={[styles.chip, grade === g && styles.chipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, grade === g && styles.chipTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 반 */}
        <Text style={styles.label}>반</Text>
        <View style={styles.classGrid}>
          {CLASSES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setClassNum(c)}
              style={[styles.classChip, classNum === c && styles.chipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.classChipText, classNum === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 저장 버튼 */}
        <TouchableOpacity
          onPress={saveSchoolInfo}
          disabled={!isReady || isLoading}
          style={[styles.saveBtn, isReady && styles.saveBtnActive]}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.bgCard} />
          ) : (
            <Text style={[styles.saveBtnText, isReady && styles.saveBtnTextActive]}>
              설정 완료
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

