/**
 * 온보딩 화면 — 최초 실행 시에만 표시
 * 4페이지 슬라이드 → 완료 시 SecureStore에 저장
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Dimensions, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  id: string;
  emoji: string;
  title: string;
  description: string;
  color: string;
}

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const slides: Slide[] = [
    { id: '1', emoji: '💰', title: '가상 100만원으로\n투자 시작', description: '실제 돈 없이 100만원으로\n주식 투자를 경험해보세요', color: theme.primary },
    { id: '2', emoji: '📚', title: '배우면서\n자산 늘리기', description: '학습을 완료하면 가상 자산이\n자동으로 늘어나요', color: theme.green },
    { id: '3', emoji: '🏆', title: '친구들과\n수익률 경쟁', description: '친구를 초대하고\n랭킹 1위를 노려보세요', color: '#FF9500' },
    { id: '4', emoji: '🤖', title: 'AI가 분석하는\n내 투자 유형', description: '10가지 질문으로\n나만의 투자 스타일을 찾아요', color: '#FF2D55' },
  ];

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bgCard },
    slide: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    skipBtn: { position: 'absolute', top: 20, right: 24, padding: 8 },
    skipText: { color: theme.textSecondary, fontSize: 15, fontWeight: '500' },
    emojiCircle: { width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
    emoji: { fontSize: 80 },
    title: { fontSize: 28, fontWeight: '700', color: theme.text, textAlign: 'center', lineHeight: 38, marginBottom: 16 },
    description: { fontSize: 16, color: theme.textSecondary, textAlign: 'center', lineHeight: 24 },
    bottom: { paddingHorizontal: 24 },
    dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24, gap: 8 },
    dot: { height: 8, borderRadius: 4 },
    nextBtn: { borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center' },
    nextText: { color: theme.bgCard, fontSize: 17, fontWeight: '700' },
  });

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const next = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      await SecureStore.setItemAsync('onboardingCompleted', 'true');
    } catch {
      // 저장 실패해도 진행
    }
    onComplete();
  };

  const currentColor = slides[currentIndex]?.color ?? '#0066FF';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            {/* 건너뛰기 */}
            <TouchableOpacity
              onPress={completeOnboarding}
              style={styles.skipBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>건너뛰기</Text>
            </TouchableOpacity>

            {/* 이모지 원 */}
            <View style={[styles.emojiCircle, { backgroundColor: item.color + '20' }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>

            {/* 텍스트 */}
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      {/* 하단 */}
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]}>
        {/* 점 인디케이터 */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === currentIndex ? 24 : 8,
                  backgroundColor: i === currentIndex ? currentColor : '#E5E8EB',
                },
              ]}
            />
          ))}
        </View>

        {/* 다음/시작 버튼 */}
        <TouchableOpacity
          onPress={handleNext}
          style={[styles.nextBtn, { backgroundColor: currentColor }]}
          activeOpacity={0.85}
        >
          <Text style={styles.nextText}>
            {currentIndex < slides.length - 1 ? '다음' : '시작하기'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

