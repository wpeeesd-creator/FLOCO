/**
 * 학교/기수 설정 화면
 * Firestore users/{uid}.school 필드에 저장
 * - 대안학교(NCS): 기수 선택 / 일반 중·고: 학년 + 반 입력
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import {
  type School,
  type SchoolType,
  SCHOOL_TYPE_LABELS,
  getSchoolDisplayType,
  buildClassId,
} from '../lib/school';

const COHORTS = ['1기', '2기', '3기'];
const GRADES = [1, 2, 3];

const SCHOOL_TYPE_OPTIONS: { id: SchoolType; label: string }[] = [
  { id: 'alternative', label: SCHOOL_TYPE_LABELS.alternative },
  { id: 'middle', label: SCHOOL_TYPE_LABELS.middle },
  { id: 'high', label: SCHOOL_TYPE_LABELS.high },
];

const NAME_PLACEHOLDERS: Record<SchoolType, string> = {
  alternative: '예) 넥스트챌린지스쿨',
  middle: '예) ○○중학교',
  high: '예) ○○고등학교',
};

export default function SchoolSetupScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [schoolType, setSchoolType] = useState<SchoolType | null>(null);
  const [schoolName, setSchoolName] = useState('');
  const [cohort, setCohort] = useState('');
  const [grade, setGrade] = useState<number | null>(null);
  const [classNum, setClassNum] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 기존 설정 로드 (type 없는 기존 데이터는 cohort 기반으로 대안학교 간주)
  useEffect(() => {
    if (!user?.id) return;
    getDoc(doc(db, 'users', user.id)).then((snap) => {
      if (snap.exists()) {
        const school = snap.data()?.school;
        if (school) {
          setSchoolType(getSchoolDisplayType(school));
          setSchoolName(school.name ?? '');
          setCohort(school.cohort ?? '');
          setGrade(typeof school.grade === 'number' ? school.grade : null);
          setClassNum(typeof school.classNum === 'number' ? school.classNum : null);
        }
      }
    }).catch(() => {});
  }, [user?.id]);

  const isAlternative = schoolType === 'alternative';
  const isRegular = schoolType === 'middle' || schoolType === 'high';
  const isReady =
    !!schoolType &&
    !!schoolName.trim() &&
    (isAlternative ? !!cohort : !!grade && !!classNum);

  const saveSchoolInfo = async () => {
    if (!user?.id) return;
    if (!schoolType) {
      Alert.alert('알림', '학교 유형을 선택해주세요');
      return;
    }
    const trimmedName = schoolName.trim();
    if (!trimmedName) {
      Alert.alert('알림', '학교명을 입력해주세요');
      return;
    }

    const school: School = { name: trimmedName, type: schoolType, classId: '' };

    if (schoolType === 'alternative') {
      if (!cohort) {
        Alert.alert('알림', '기수를 선택해주세요');
        return;
      }
      school.cohort = cohort;
      school.classId = buildClassId(trimmedName, schoolType, { cohort });
    } else {
      if (!grade || !classNum) {
        Alert.alert('알림', '학년과 반을 입력해주세요');
        return;
      }
      school.grade = grade;
      school.classNum = classNum;
      school.classId = buildClassId(trimmedName, schoolType, { grade, classNum });
    }

    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.id), { school });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const suffix = schoolType === 'alternative' ? cohort : `${grade}학년 ${classNum}반`;
      Alert.alert(
        '설정 완료!',
        `${trimmedName} ${suffix} 친구들과 랭킹 경쟁을 시작해요!`,
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
    saveBtn: {
      backgroundColor: Colors.border, borderRadius: 16, height: 56,
      justifyContent: 'center', alignItems: 'center', marginTop: 12, marginBottom: 40,
    },
    saveBtnActive: { backgroundColor: Colors.primary },
    saveBtnText: { color: Colors.textSub, fontSize: 16, fontWeight: '700' },
    saveBtnTextActive: { color: theme.bgCard },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>학교/기수 설정</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.emoji}>🏫</Text>
        <Text style={styles.title}>같은 반 친구들과 경쟁해요!</Text>
        <Text style={styles.description}>
          같은 학교/기수·반 친구들끼리{'\n'}별도 랭킹을 확인할 수 있어요
        </Text>

        {/* 학교 유형 */}
        <Text style={styles.label}>학교 유형</Text>
        <View style={styles.chipRow}>
          {SCHOOL_TYPE_OPTIONS.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setSchoolType(t.id)}
              style={[styles.chip, schoolType === t.id && styles.chipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, schoolType === t.id && styles.chipTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 학교명 */}
        <Text style={styles.label}>학교명</Text>
        <TextInput
          value={schoolName}
          onChangeText={setSchoolName}
          placeholder={schoolType ? NAME_PLACEHOLDERS[schoolType] : '학교 유형을 먼저 선택해주세요'}
          placeholderTextColor={Colors.textSub}
          style={[styles.input, schoolName ? styles.inputActive : null]}
        />

        {/* 대안학교: 기수 */}
        {isAlternative && (
          <>
            <Text style={styles.label}>기수</Text>
            <View style={styles.chipRow}>
              {COHORTS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCohort(c)}
                  style={[styles.chip, cohort === c && styles.chipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, cohort === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* 일반 중·고: 학년 + 반 */}
        {isRegular && (
          <>
            <Text style={styles.label}>학년</Text>
            <View style={styles.chipRow}>
              {GRADES.map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGrade(g)}
                  style={[styles.chip, grade === g && styles.chipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, grade === g && styles.chipTextActive]}>{g}학년</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>반</Text>
            <TextInput
              value={classNum != null ? String(classNum) : ''}
              onChangeText={(t) => {
                const n = parseInt(t, 10);
                setClassNum(Number.isFinite(n) && n > 0 ? n : null);
              }}
              placeholder="예) 3"
              placeholderTextColor={Colors.textSub}
              keyboardType="numeric"
              maxLength={2}
              style={[styles.input, classNum ? styles.inputActive : null]}
            />
          </>
        )}

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
