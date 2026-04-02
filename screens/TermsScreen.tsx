/**
 * 서비스 이용약관 화면
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../components/ui';

const SECTIONS = [
  {
    title: '제 1조 (목적)',
    content: '본 약관은 FLOCO(이하 "서비스")의 이용 조건 및 절차, 회사와 이용자 간의 권리와 의무를 규정함을 목적으로 합니다.',
  },
  {
    title: '제 2조 (서비스 정의)',
    content: 'FLOCO는 청소년을 대상으로 하는 모의투자 교육 플랫폼입니다.\n\n• 실제 주식 거래가 아닌 가상 거래 서비스\n• 금융 학습 콘텐츠 제공\n• 커뮤니티 서비스\n• AI 기반 투자 유형 분석',
  },
  {
    title: '제 3조 (이용 자격)',
    content: '• 만 14세 이상 누구나 이용 가능\n• 만 14세 미만은 법정대리인 동의 필요\n• 타인의 정보로 가입 불가\n• 1인 1계정 원칙',
  },
  {
    title: '제 4조 (금지 행위)',
    content: '다음 행위는 금지됩니다.\n\n• 타인을 사칭하거나 허위 정보 등록\n• 서비스 운영 방해\n• 비속어/혐오 표현 사용\n• 스팸 게시물 작성\n• 버그를 이용한 부당 이득 취득\n• 상업적 목적의 광고 게시',
  },
  {
    title: '제 5조 (서비스 중단)',
    content: '다음의 경우 서비스가 중단될 수 있습니다.\n\n• 시스템 점검\n• 천재지변\n• 서비스 종료\n\n중요한 변경사항은 사전에 공지합니다.',
  },
  {
    title: '제 6조 (면책)',
    content: 'FLOCO는 교육 목적의 모의투자 서비스입니다.\n\n• 실제 투자 손실에 대해 책임지지 않습니다\n• 서비스 내 정보는 투자 권유가 아닙니다\n• 실제 투자는 전문가와 상담 후 결정하세요',
  },
];

export default function TermsScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>서비스 이용약관</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll}>
        <Text style={styles.date}>최종 수정일: 2026년 3월 30일</Text>

        {SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  scroll: { padding: 20 },
  date: { color: Colors.textSub, fontSize: 13, marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  sectionContent: { fontSize: 14, color: '#4B5563', lineHeight: 24 },
});
