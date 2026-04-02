/**
 * 투자 유형 설문 화면
 * 20문항 / 한 문항씩 / 진행률 바 / 애니메이션 / 8가지 유형
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../components/ui';

// ── 타입 ──────────────────────────────────────────
type ScoreKey = 'safe' | 'balanced' | 'aggressive' | 'analytical' | 'trader' | 'longterm' | 'passive' | 'contrarian';

interface SurveyOption {
  id: string;
  text: string;
  score: Partial<Record<ScoreKey, number>>;
}

interface SurveyQuestion {
  id: number;
  category: string;
  question: string;
  options: SurveyOption[];
}

// ── 20문항 ────────────────────────────────────────
const QUESTIONS: SurveyQuestion[] = [
  { id: 1, category: '리스크 성향', question: '주식이 갑자기 20% 하락했어요. 어떻게 할까요?', options: [
    { id: '1a', text: '즉시 팔아서 손실을 줄인다', score: { safe: 3, passive: 1 } },
    { id: '1b', text: '조금 더 지켜본다', score: { balanced: 3 } },
    { id: '1c', text: '오히려 더 산다 (물타기)', score: { aggressive: 2, contrarian: 1 } },
    { id: '1d', text: '아무것도 안 한다', score: { passive: 3 } },
  ]},
  { id: 2, category: '리스크 성향', question: '투자 손실이 얼마나 나면 잠을 못 자나요?', options: [
    { id: '2a', text: '1% 이상만 손실 나도 불안하다', score: { safe: 3 } },
    { id: '2b', text: '5~10% 손실이 나면 걱정된다', score: { balanced: 3 } },
    { id: '2c', text: '20~30% 손실까지는 버틸 수 있다', score: { aggressive: 2 } },
    { id: '2d', text: '50% 손실도 장기적으로 회복될거라 믿는다', score: { longterm: 3 } },
  ]},
  { id: 3, category: '리스크 성향', question: '한 종목에 얼마나 집중 투자할 수 있나요?', options: [
    { id: '3a', text: '전체의 10% 이하만 한 종목에 투자', score: { safe: 3 } },
    { id: '3b', text: '전체의 20~30% 정도', score: { balanced: 3 } },
    { id: '3c', text: '전체의 50% 이상도 가능', score: { aggressive: 2 } },
    { id: '3d', text: '확신이 있으면 전부 다 투자 가능', score: { aggressive: 3, contrarian: 1 } },
  ]},
  { id: 4, category: '투자 기간', question: '투자 기간은 보통 얼마나 생각하나요?', options: [
    { id: '4a', text: '1주일 이내 (단타)', score: { trader: 3 } },
    { id: '4b', text: '1~6개월 (스윙)', score: { trader: 2, balanced: 1 } },
    { id: '4c', text: '1~3년 (중기)', score: { balanced: 3 } },
    { id: '4d', text: '3년 이상 (장기)', score: { longterm: 3, safe: 1 } },
  ]},
  { id: 5, category: '투자 기간', question: '지금 산 주식이 1년 후에 봐야 오른다고 하면?', options: [
    { id: '5a', text: '1년은 너무 길다. 못 기다린다', score: { trader: 3 } },
    { id: '5b', text: '조금 힘들지만 기다릴 수 있다', score: { balanced: 2 } },
    { id: '5c', text: '1년 정도는 충분히 기다릴 수 있다', score: { longterm: 2, balanced: 1 } },
    { id: '5d', text: '5년도 기다릴 수 있다', score: { longterm: 3 } },
  ]},
  { id: 6, category: '분석 방법', question: '투자 결정 시 가장 중요하게 보는 것은?', options: [
    { id: '6a', text: '차트 패턴과 기술적 지표', score: { trader: 3 } },
    { id: '6b', text: '재무제표와 기업 실적', score: { analytical: 3 } },
    { id: '6c', text: '뉴스와 시장 트렌드', score: { balanced: 2, trader: 1 } },
    { id: '6d', text: '전문가 추천과 리포트', score: { passive: 3 } },
  ]},
  { id: 7, category: '분석 방법', question: '주식 공부를 얼마나 하나요?', options: [
    { id: '7a', text: '거의 안 한다', score: { passive: 3 } },
    { id: '7b', text: '가끔 뉴스 정도 본다', score: { balanced: 2 } },
    { id: '7c', text: '매일 1시간 이상 공부한다', score: { analytical: 3 } },
    { id: '7d', text: '하루 종일 시황을 모니터링한다', score: { trader: 3 } },
  ]},
  { id: 8, category: '분석 방법', question: 'PER, PBR, ROE 같은 투자 지표를 알고 있나요?', options: [
    { id: '8a', text: '전혀 모른다', score: { passive: 3 } },
    { id: '8b', text: '들어봤지만 잘 모른다', score: { balanced: 1 } },
    { id: '8c', text: '알고 있고 가끔 활용한다', score: { analytical: 2, balanced: 1 } },
    { id: '8d', text: '매우 잘 알고 항상 활용한다', score: { analytical: 3 } },
  ]},
  { id: 9, category: '투자 목표', question: '투자로 얻고 싶은 것은?', options: [
    { id: '9a', text: '원금 보존 + 소액 수익', score: { safe: 3 } },
    { id: '9b', text: '연 10~20% 꾸준한 수익', score: { balanced: 3 } },
    { id: '9c', text: '연 50% 이상 고수익', score: { aggressive: 3 } },
    { id: '9d', text: '투자 경험과 금융 지식', score: { analytical: 2, passive: 1 } },
  ]},
  { id: 10, category: '투자 목표', question: '투자 수익으로 무엇을 하고 싶나요?', options: [
    { id: '10a', text: '용돈 조금 더 벌기', score: { safe: 2, passive: 1 } },
    { id: '10b', text: '학비나 생활비 마련', score: { balanced: 2 } },
    { id: '10c', text: '큰 부자 되기', score: { aggressive: 3 } },
    { id: '10d', text: '재정적 자유 달성', score: { longterm: 3 } },
  ]},
  { id: 11, category: '투자 심리', question: '급등 종목을 봤을 때 어떻게 하나요?', options: [
    { id: '11a', text: '위험해 보여서 관심 없다', score: { safe: 3 } },
    { id: '11b', text: '조금만 사서 경험해본다', score: { balanced: 2 } },
    { id: '11c', text: '적극적으로 진입한다', score: { aggressive: 2, trader: 1 } },
    { id: '11d', text: '이미 늦었다고 생각해 패스한다', score: { passive: 2, contrarian: 1 } },
  ]},
  { id: 12, category: '투자 심리', question: '남들이 모두 특정 주식을 팔 때 당신은?', options: [
    { id: '12a', text: '나도 같이 판다', score: { passive: 3 } },
    { id: '12b', text: '상황을 지켜본다', score: { balanced: 2 } },
    { id: '12c', text: '오히려 매수 기회로 본다', score: { contrarian: 3 } },
    { id: '12d', text: '미리 팔고 이미 현금 보유 중', score: { safe: 2, analytical: 1 } },
  ]},
  { id: 13, category: '투자 심리', question: '손실 중인 종목이 있을 때?', options: [
    { id: '13a', text: '손절매하고 다른 종목을 찾는다', score: { trader: 2, analytical: 1 } },
    { id: '13b', text: '목표가까지 기다린다', score: { longterm: 2, balanced: 1 } },
    { id: '13c', text: '더 사서 평균 단가를 낮춘다', score: { aggressive: 2, contrarian: 1 } },
    { id: '13d', text: '아무것도 못 하고 그냥 둔다', score: { passive: 3 } },
  ]},
  { id: 14, category: '투자 심리', question: '투자할 때 감정 조절이 잘 되나요?', options: [
    { id: '14a', text: '감정에 많이 휘둘린다', score: { passive: 2 } },
    { id: '14b', text: '가끔 감정적으로 매매한다', score: { balanced: 1, trader: 1 } },
    { id: '14c', text: '대체로 원칙대로 한다', score: { analytical: 2, balanced: 1 } },
    { id: '14d', text: '항상 냉정하게 판단한다', score: { analytical: 3 } },
  ]},
  { id: 15, category: '포트폴리오', question: '이상적인 포트폴리오 종목 수는?', options: [
    { id: '15a', text: '1~2개 집중 투자', score: { aggressive: 3 } },
    { id: '15b', text: '3~5개 적당한 분산', score: { balanced: 3 } },
    { id: '15c', text: '10개 이상 분산 투자', score: { safe: 2, analytical: 1 } },
    { id: '15d', text: 'ETF로 시장 전체에 투자', score: { safe: 3, longterm: 1 } },
  ]},
  { id: 16, category: '포트폴리오', question: '국내와 해외 주식 비중은?', options: [
    { id: '16a', text: '국내 100%', score: { safe: 2, passive: 1 } },
    { id: '16b', text: '국내 70% 해외 30%', score: { balanced: 3 } },
    { id: '16c', text: '국내 30% 해외 70%', score: { aggressive: 2, analytical: 1 } },
    { id: '16d', text: '해외 100%', score: { aggressive: 3 } },
  ]},
  { id: 17, category: '선호 섹터', question: '가장 관심 있는 투자 분야는?', options: [
    { id: '17a', text: 'AI/반도체/기술주', score: { aggressive: 2, analytical: 1 } },
    { id: '17b', text: '바이오/헬스케어', score: { aggressive: 2, trader: 1 } },
    { id: '17c', text: '배당주/리츠/금융', score: { safe: 3, longterm: 1 } },
    { id: '17d', text: '소비재/생활용품', score: { balanced: 2, safe: 1 } },
  ]},
  { id: 18, category: '선호 섹터', question: '새로운 종목을 어떻게 발굴하나요?', options: [
    { id: '18a', text: '뉴스나 SNS에서 핫한 종목', score: { trader: 2, passive: 1 } },
    { id: '18b', text: '직접 재무제표 분석', score: { analytical: 3 } },
    { id: '18c', text: '전문가 리포트나 유튜브', score: { passive: 2, balanced: 1 } },
    { id: '18d', text: '일상에서 좋은 제품/서비스 발견', score: { balanced: 2, longterm: 1 } },
  ]},
  { id: 19, category: '투자 철학', question: '어떤 투자자를 더 닮고 싶나요?', options: [
    { id: '19a', text: '워런 버핏 (장기 가치 투자)', score: { longterm: 3, analytical: 1 } },
    { id: '19b', text: '피터 린치 (성장주 발굴)', score: { analytical: 3 } },
    { id: '19c', text: '조지 소로스 (매크로 트레이딩)', score: { trader: 2, aggressive: 1 } },
    { id: '19d', text: '레이 달리오 (올웨더 포트폴리오)', score: { safe: 2, balanced: 1 } },
  ]},
  { id: 20, category: '투자 철학', question: '주식 시장을 어떻게 바라보나요?', options: [
    { id: '20a', text: '위험한 도박판이다', score: { safe: 3, passive: 1 } },
    { id: '20b', text: '공부하면 수익 낼 수 있는 곳', score: { analytical: 3 } },
    { id: '20c', text: '빠르게 부자 될 수 있는 기회', score: { aggressive: 3 } },
    { id: '20d', text: '기업의 성장에 동참하는 곳', score: { longterm: 3 } },
  ]},
];

// ── 컴포넌트 ──────────────────────────────────────
export default function SurveyScreen() {
  const navigation = useNavigation<any>();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const q = QUESTIONS[current];
  const total = QUESTIONS.length;
  const progress = ((current + 1) / total) * 100;

  const animateTransition = (next: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0, duration: 150, useNativeDriver: true,
    }).start(() => {
      setCurrent(next);
      setSelected(null);
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 200, useNativeDriver: true,
      }).start();
    });
  };

  const handleSelect = (optionIndex: number) => {
    if (selected !== null) return;
    setSelected(optionIndex);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newAnswers = { ...answers, [q.id]: optionIndex };
    setAnswers(newAnswers);

    setTimeout(() => {
      if (current < total - 1) {
        animateTransition(current + 1);
      } else {
        // 점수 계산
        const scores: Record<ScoreKey, number> = {
          safe: 0, balanced: 0, aggressive: 0, analytical: 0,
          trader: 0, longterm: 0, passive: 0, contrarian: 0,
        };
        Object.entries(newAnswers).forEach(([qId, optIdx]) => {
          const question = QUESTIONS.find(qq => qq.id === parseInt(qId));
          if (!question) return;
          const opt = question.options[optIdx];
          if (!opt) return;
          Object.entries(opt.score).forEach(([key, val]) => {
            scores[key as ScoreKey] += val;
          });
        });

        const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
        const dominantType = sorted[0][0];
        const secondType = sorted[1][0];

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.navigate('투자유형결과', {
          resultType: dominantType,
          scores,
          secondType,
        });
      }
    }, 400);
  };

  const handleBack = () => {
    if (current > 0) {
      animateTransition(current - 1);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>투자 유형 분석</Text>
        <Text style={styles.headerCount}>{current + 1}/{total}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
      </View>

      {/* Question */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{q.category}</Text>
        </View>

        <Text style={styles.question}>{q.question}</Text>

        <View style={styles.optionsWrap}>
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => handleSelect(i)}
                activeOpacity={0.8}
                disabled={selected !== null}
              >
                <View style={[styles.optionCircle, isSelected && styles.optionCircleSelected]}>
                  <Text style={[styles.optionCircleText, isSelected && styles.optionCircleTextSelected]}>
                    {String.fromCharCode(65 + i)}
                  </Text>
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {opt.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

// ── 스타일 ────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  headerCount: { fontSize: 14, fontWeight: '600', color: Colors.textSub, minWidth: 40, textAlign: 'right' },
  progressBg: { height: 4, backgroundColor: '#F2F4F6', marginHorizontal: 16 },
  progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  categoryBadge: {
    alignSelf: 'flex-start', backgroundColor: '#EBF5FF',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 16,
  },
  categoryText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  question: { fontSize: 22, fontWeight: '700', color: Colors.text, lineHeight: 32, marginBottom: 32 },
  optionsWrap: { gap: 12 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#F8F9FA', borderRadius: 16, padding: 18,
    borderWidth: 2, borderColor: 'transparent',
  },
  optionSelected: { backgroundColor: '#EBF5FF', borderColor: Colors.primary },
  optionCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#E5E8EB', alignItems: 'center', justifyContent: 'center',
  },
  optionCircleSelected: { backgroundColor: Colors.primary },
  optionCircleText: { fontSize: 14, fontWeight: '700', color: Colors.textSub },
  optionCircleTextSelected: { color: '#FFFFFF' },
  optionText: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text, lineHeight: 22 },
  optionTextSelected: { fontWeight: '700', color: Colors.primary },
});
