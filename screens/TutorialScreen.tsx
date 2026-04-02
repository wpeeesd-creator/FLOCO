/**
 * 튜토리얼 화면 — 최초 로그인 후 5단계 안내
 * 완료 시 Firestore + SecureStore에 저장
 * MY 화면에서 다시 볼 수 있음
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface TutorialStep {
  id: number;
  emoji: string;
  title: string;
  description: string;
  action: string;
  tabName: string;
  color: string;
  tip: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    emoji: '💰',
    title: '첫 번째 주식을 사볼까요?',
    description: '투자 탭에서 원하는 종목을 골라\n매수 버튼을 눌러보세요!',
    action: '투자 탭으로 가기',
    tabName: '투자Tab',
    color: '#F04452',
    tip: '💡 처음엔 삼성전자나 Apple처럼\n잘 아는 기업부터 시작해보세요!',
  },
  {
    id: 2,
    emoji: '📚',
    title: '학습하고 자산을 늘려요!',
    description: '학습 탭에서 강의를 완료하면\n가상 자산이 늘어나요!',
    action: '학습 탭으로 가기',
    tabName: '학습Tab',
    color: '#0066FF',
    tip: '💡 퀴즈를 다 맞히면\n최대 10만원까지 받을 수 있어요!',
  },
  {
    id: 3,
    emoji: '🏆',
    title: '랭킹에서 1등을 노려요!',
    description: '수익률이 높을수록\n랭킹이 올라가요!',
    action: '랭킹 확인하기',
    tabName: '랭킹Tab',
    color: '#FF9500',
    tip: '💡 우리 반 친구들과\n별도 랭킹도 확인할 수 있어요!',
  },
  {
    id: 4,
    emoji: '🤖',
    title: 'AI 투자 유형을 분석받아요!',
    description: '10가지 질문으로\n나만의 투자 스타일을 찾아요!',
    action: '투자 유형 분석하기',
    tabName: '마이페이지Tab',
    color: '#FF2D55',
    tip: '💡 분석 결과에 맞는\n추천 종목도 알려드려요!',
  },
  {
    id: 5,
    emoji: '👥',
    title: '친구를 초대해요!',
    description: '친구 초대 시\n나도 친구도 보상을 받아요!',
    action: '초대 코드 공유하기',
    tabName: '마이페이지Tab',
    color: '#34C759',
    tip: '💡 친구 초대 시\n나에게 +50,000원 지급!',
  },
];

interface TutorialScreenProps {
  onComplete: () => void;
  onNavigateTab?: (tabName: string) => void;
}

export default function TutorialScreen({ onComplete, onNavigateTab }: TutorialScreenProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const step = tutorialSteps[currentStep];

  const handleNext = async () => {
    if (currentStep < tutorialSteps.length - 1) {
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: -50, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
      setCurrentStep((i) => i + 1);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      await completeTutorial();
    }
  };

  const completeTutorial = async () => {
    setSaving(true);
    try {
      if (user?.id) {
        await updateDoc(doc(db, 'users', user.id), {
          tutorialCompleted: true,
          tutorialCompletedAt: new Date().toISOString(),
        });
      }
      await SecureStore.setItemAsync('tutorialCompleted', 'true');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // 저장 실패해도 진행
      try { await SecureStore.setItemAsync('tutorialCompleted', 'true'); } catch {}
    } finally {
      setSaving(false);
    }

    Alert.alert(
      '튜토리얼 완료!',
      '이제 진짜 투자를 시작해볼까요?',
      [{ text: '시작하기!', onPress: onComplete }],
    );
  };

  const skipTutorial = () => {
    Alert.alert(
      '튜토리얼 건너뛰기',
      '나중에 MY 탭에서 다시 볼 수 있어요!',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '건너뛰기',
          onPress: async () => {
            try { await SecureStore.setItemAsync('tutorialCompleted', 'true'); } catch {}
            onComplete();
          },
        },
      ],
    );
  };

  const handleGoToTab = () => {
    onNavigateTab?.(step.tabName);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 진행률 바 + 건너뛰기 */}
      <View style={styles.topBar}>
        <View style={styles.progressRow}>
          {tutorialSteps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                { backgroundColor: i <= currentStep ? step.color : '#E5E8EB' },
              ]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={skipTutorial} style={styles.skipBtn}>
          <Text style={styles.skipText}>건너뛰기</Text>
        </TouchableOpacity>
      </View>

      {/* 메인 컨텐츠 */}
      <Animated.View style={[styles.content, { transform: [{ translateX: slideAnim }] }]}>
        {/* 이모지 원 */}
        <View style={[styles.emojiCircle, { backgroundColor: step.color + '15' }]}>
          <Text style={styles.emoji}>{step.emoji}</Text>
        </View>

        {/* 단계 */}
        <Text style={[styles.stepLabel, { color: step.color }]}>
          STEP {step.id} / {tutorialSteps.length}
        </Text>

        {/* 제목 */}
        <Text style={styles.title}>{step.title}</Text>

        {/* 설명 */}
        <Text style={styles.description}>{step.description}</Text>

        {/* 팁 카드 */}
        <View style={[styles.tipCard, { backgroundColor: step.color + '10', borderLeftColor: step.color }]}>
          <Text style={styles.tipText}>{step.tip}</Text>
        </View>
      </Animated.View>

      {/* 하단 버튼 */}
      <View style={styles.bottom}>
        {/* 탭 이동 버튼 */}
        {onNavigateTab && (
          <TouchableOpacity
            onPress={handleGoToTab}
            style={[styles.actionBtn, { borderColor: step.color }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.actionBtnText, { color: step.color }]}>
              {step.action}
            </Text>
          </TouchableOpacity>
        )}

        {/* 다음/완료 버튼 */}
        <TouchableOpacity
          onPress={handleNext}
          disabled={saving}
          style={[styles.nextBtn, { backgroundColor: step.color }]}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.nextBtnText}>
              {currentStep < tutorialSteps.length - 1 ? '다음' : '투자 시작하기!'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
  },
  progressRow: { flex: 1, flexDirection: 'row', gap: 6 },
  progressDot: { flex: 1, height: 4, borderRadius: 2 },
  skipBtn: { marginLeft: 16, padding: 4 },
  skipText: { color: '#8B95A1', fontSize: 14, fontWeight: '500' },
  content: { flex: 1, padding: 24, alignItems: 'center' },
  emojiCircle: {
    width: 140, height: 140, borderRadius: 70,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 20, marginBottom: 32,
  },
  emoji: { fontSize: 72 },
  stepLabel: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  title: {
    fontSize: 26, fontWeight: '700', color: '#191F28',
    textAlign: 'center', lineHeight: 36, marginBottom: 16,
  },
  description: {
    fontSize: 16, color: '#8B95A1', textAlign: 'center',
    lineHeight: 24, marginBottom: 32,
  },
  tipCard: {
    borderRadius: 16, padding: 16, borderLeftWidth: 4, width: '100%',
  },
  tipText: { color: '#191F28', fontSize: 14, lineHeight: 22 },
  bottom: { padding: 24, gap: 12 },
  actionBtn: {
    borderRadius: 16, height: 52, justifyContent: 'center',
    alignItems: 'center', borderWidth: 2, backgroundColor: 'transparent',
  },
  actionBtnText: { fontSize: 15, fontWeight: '700' },
  nextBtn: {
    borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center',
  },
  nextBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
