/**
 * 배지 화면 — 획득한 배지와 도전 중인 배지를 3열 그리드로 표시
 */

import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

// ── 배지 정의 ──────────────────────────────────────────────────────────────
interface BadgeDef {
  id: string;
  emoji: string;
  title: string;
  description: string;
  check: (data: BadgeCheckData) => boolean;
}

interface BadgeCheckData {
  tradesLength: number;
  totalValue: number;
  returnRate: number;
  holdingsLength: number;
  completedLessonsLength: number;
  streak: number;
}

export const BADGE_DEFINITIONS: BadgeDef[] = [
  {
    id: 'first_trade',
    emoji: '🌱',
    title: '첫 투자',
    description: '첫 거래를 완료하세요',
    check: ({ tradesLength }) => tradesLength >= 1,
  },
  {
    id: 'active_investor',
    emoji: '📊',
    title: '활발한 투자자',
    description: '거래 10회 달성',
    check: ({ tradesLength }) => tradesLength >= 10,
  },
  {
    id: 'profit_achieved',
    emoji: '💚',
    title: '수익 달성',
    description: '총 자산 1,000,000원 이상',
    check: ({ totalValue }) => totalValue > 1_000_000,
  },
  {
    id: 'return_10',
    emoji: '🤑',
    title: '수익률 10%',
    description: '수익률 10% 이상 달성',
    check: ({ returnRate }) => returnRate >= 10,
  },
  {
    id: 'diversified',
    emoji: '🌈',
    title: '분산 투자자',
    description: '5개 이상 종목 보유',
    check: ({ holdingsLength }) => holdingsLength >= 5,
  },
  {
    id: 'learn_start',
    emoji: '📚',
    title: '학습 시작',
    description: '레슨 1개 완료',
    check: ({ completedLessonsLength }) => completedLessonsLength >= 1,
  },
  {
    id: 'hard_learner',
    emoji: '🎓',
    title: '열공 투자자',
    description: '레슨 5개 완료',
    check: ({ completedLessonsLength }) => completedLessonsLength >= 5,
  },
  {
    id: 'streak_3',
    emoji: '🔥',
    title: '3일 연속 학습',
    description: '3일 연속으로 학습하세요',
    check: ({ streak }) => streak >= 3,
  },
  {
    id: 'streak_7',
    emoji: '⚡',
    title: '7일 연속 학습',
    description: '7일 연속으로 학습하세요',
    check: ({ streak }) => streak >= 7,
  },
  {
    id: 'streak_30',
    emoji: '💎',
    title: '30일 연속 학습',
    description: '30일 연속으로 학습하세요',
    check: ({ streak }) => streak >= 30,
  },
];

// ── 컴포넌트 ──────────────────────────────────────────────────────────────
export default function BadgeScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const { holdings, trades, completedLessons, streak, getTotalValue, getReturnRate } = useAppStore();

  const checkData: BadgeCheckData = {
    tradesLength: (trades ?? []).length,
    totalValue: getTotalValue?.() ?? 1_000_000,
    returnRate: getReturnRate?.() ?? 0,
    holdingsLength: (holdings ?? []).length,
    completedLessonsLength: (completedLessons ?? []).length,
    streak: streak ?? 0,
  };

  const earnedBadges = BADGE_DEFINITIONS.filter((b) => b.check(checkData));
  const lockedBadges = BADGE_DEFINITIONS.filter((b) => !b.check(checkData));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>나의 배지</Text>
        <Text style={styles.headerCount}>
          {earnedBadges.length}/{BADGE_DEFINITIONS.length}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 획득한 배지 */}
        {earnedBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>획득한 배지</Text>
            <View style={styles.grid}>
              {earnedBadges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} earned />
              ))}
            </View>
          </View>
        )}

        {/* 도전 중인 배지 */}
        {lockedBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>도전 중인 배지</Text>
            <View style={styles.grid}>
              {lockedBadges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} earned={false} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── 배지 카드 ─────────────────────────────────────────────────────────────
function BadgeCard({ badge, earned }: { badge: BadgeDef; earned: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.badgeCard, { shadowColor: theme.text }, !earned && styles.badgeCardLocked]}>
      <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
      <Text style={styles.badgeTitle} numberOfLines={1}>{badge.title}</Text>
      <Text style={styles.badgeDesc} numberOfLines={2}>{badge.description}</Text>
    </View>
  );
}

// ── 스타일 ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  headerCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  badgeCard: {
    width: '30.5%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  badgeCardLocked: {
    opacity: 0.6,
  },
  badgeEmoji: {
    fontSize: 36,
    marginBottom: 6,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDesc: {
    fontSize: 10,
    color: Colors.textSub,
    textAlign: 'center',
    lineHeight: 14,
  },
});
