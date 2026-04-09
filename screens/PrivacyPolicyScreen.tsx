/**
 * 개인정보처리방침 화면
 */

import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

const SECTIONS = [
  {
    title: '1. 개인정보 수집 항목',
    content: 'FLOCO(이하 "회사")는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.\n\n필수 수집 항목:\n• 이메일 주소\n• 닉네임\n• 학교/학년/반 (선택)\n\n자동 수집 항목:\n• 앱 사용 기록\n• 모의투자 거래 내역\n• 기기 정보 (푸시 알림 토큰)',
  },
  {
    title: '2. 개인정보 수집 목적',
    content: '수집한 개인정보는 다음 목적으로만 사용됩니다.\n\n• 회원 식별 및 서비스 제공\n• 모의투자 서비스 운영\n• 학습 현황 관리\n• 랭킹 서비스 제공\n• 푸시 알림 발송\n• 서비스 개선 및 통계 분석',
  },
  {
    title: '3. 개인정보 보유 기간',
    content: '회원 탈퇴 시까지 보유합니다.\n\n단, 관계 법령에 따라 아래 정보는 해당 기간 동안 보존됩니다.\n\n• 소비자 불만 및 분쟁 처리: 3년\n• 서비스 이용 기록: 1년',
  },
  {
    title: '4. 개인정보 제3자 제공',
    content: '회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.\n\n단, 다음의 경우는 예외입니다.\n\n• 법령에 의해 요구되는 경우\n• 이용자가 사전에 동의한 경우',
  },
  {
    title: '5. 모의투자 서비스 안내',
    content: 'FLOCO는 교육 목적의 모의투자 서비스입니다.\n\n• 실제 주식 거래가 아닙니다\n• 가상의 자산으로 투자를 연습합니다\n• 실제 금전적 손익이 발생하지 않습니다\n• 만 14세 미만은 보호자 동의가 필요합니다\n\n⚠️ 실제 투자 시 손실이 발생할 수 있으며 투자 결정은 본인 책임입니다.',
  },
  {
    title: '6. 청소년 보호',
    content: 'FLOCO는 청소년 보호를 위해 아래와 같이 운영합니다.\n\n• 만 14세 미만 가입 시 법정대리인 동의 필요\n• 부적절한 커뮤니티 게시물 신고 및 제재\n• 금융 교육 목적의 건전한 콘텐츠만 제공\n• 개인정보 수집 최소화',
  },
  {
    title: '7. 개인정보 보호 책임자',
    content: '개인정보 관련 문의사항은 아래로 연락해주세요.\n\n책임자: FLOCO 운영팀\n이메일: privacy@floco.app\n처리 기간: 영업일 기준 3일 이내',
  },
  {
    title: '8. 이용자 권리',
    content: '이용자는 언제든지 아래 권리를 행사할 수 있습니다.\n\n• 개인정보 열람 요청\n• 개인정보 수정 요청\n• 개인정보 삭제 요청 (회원 탈퇴)\n• 개인정보 처리 정지 요청\n\n요청은 앱 내 MY 탭 또는 이메일로 가능합니다.',
  },
  {
    title: '9. 개인정보 처리방침 변경',
    content: '본 방침은 법령 또는 서비스 변경에 따라 업데이트될 수 있습니다.\n\n변경 시 앱 내 공지사항을 통해 사전 안내드립니다.',
  },
];

export default function PrivacyPolicyScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgCard }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>개인정보처리방침</Text>
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

        <TouchableOpacity
          onPress={() => Linking.openURL('mailto:privacy@floco.app')}
          style={styles.contactBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.contactBtnText}>개인정보 관련 문의하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
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
  contactBtn: {
    backgroundColor: Colors.bg, borderRadius: 16, height: 52,
    justifyContent: 'center', alignItems: 'center', marginBottom: 40,
  },
  contactBtnText: { color: Colors.primary, fontWeight: '700' },
});
