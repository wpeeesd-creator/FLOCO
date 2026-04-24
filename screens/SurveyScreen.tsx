/**
 * 투자유형 분석 — 간편/상세 듀얼모드
 * 진입: 간편(1분) vs 상세(5분) 선택
 * 간편: MBTI선택/퀵테스트 → 투자5문항 → 간편결과
 * 상세: 투자특화 20문항 → 심층결과
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { MBTI_MAP } from '../data/investorProfiles';

// ═══════════════════════════════════════════════════
//  데이터
// ═══════════════════════════════════════════════════

// MBTI 그룹
const MBTI_GROUPS = [
  { label: '분석가', color: '#8B5CF6', types: ['INTJ', 'INTP', 'ENTJ', 'ENTP'] },
  { label: '외교관', color: '#10B981', types: ['INFJ', 'INFP', 'ENFJ', 'ENFP'] },
  { label: '관리자', color: '#3B82F6', types: ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'] },
  { label: '탐험가', color: '#F59E0B', types: ['ISTP', 'ISFP', 'ESTP', 'ESFP'] },
];

// 4문항 퀵테스트
const QUICK_QS = [
  { id: 'EI', text: '사람들과 어울린 후 나는...', A: { label: '활기가 넘쳐요', value: 'E' }, B: { label: '혼자 쉬고 싶어요', value: 'I' } },
  { id: 'SN', text: '주식을 고를 때 나는...', A: { label: '데이터와 수치를 봐요', value: 'S' }, B: { label: '느낌과 가능성을 봐요', value: 'N' } },
  { id: 'TF', text: '주가가 -10% 떨어지면...', A: { label: '원칙대로 손절해요', value: 'T' }, B: { label: '기회다 싶어 더 사요', value: 'F' } },
  { id: 'JP', text: '투자 계획을 세울 때...', A: { label: '미리 목표를 정해요', value: 'J' }, B: { label: '상황 보면서 결정해요', value: 'P' } },
];

// 투자 특화 5문항 (간편)
type InvestKey = 'amount' | 'loss' | 'period' | 'focus' | 'news';
interface InvestOpt { label: string; value: number | string }
interface InvestQ { id: InvestKey; text: string; options: InvestOpt[] }

const INVEST_QS: InvestQ[] = [
  { id: 'amount', text: '한 번에 얼마까지 투자할 수 있어요?', options: [
    { label: '10만원 미만', value: 1 }, { label: '10~50만원', value: 2 },
    { label: '50~200만원', value: 3 }, { label: '200만원 이상', value: 4 },
  ]},
  { id: 'loss', text: '손실이 몇 %가 되면 팔고 싶어요?', options: [
    { label: '-5% 이하', value: 1 }, { label: '-10% 정도', value: 2 },
    { label: '-20% 정도', value: 3 }, { label: '안 팔아요', value: 4 },
  ]},
  { id: 'period', text: '투자 기간은 어느 정도 생각해요?', options: [
    { label: '1개월 이내', value: 1 }, { label: '1~6개월', value: 2 },
    { label: '6개월~2년', value: 3 }, { label: '2년 이상', value: 4 },
  ]},
  { id: 'focus', text: '어떤 종목에 끌려요?', options: [
    { label: '삼성전자 같은 대형주', value: 'balanced' },
    { label: 'AI·반도체 성장주', value: 'growth' },
    { label: '배당 많이 주는 주식', value: 'dividend' },
    { label: '급등 가능한 소형주', value: 'aggressive' },
  ]},
  { id: 'news', text: '뉴스에서 "OO 폭락" 나오면?', options: [
    { label: '바로 팔아요', value: 1 }, { label: '일단 지켜봐요', value: 2 },
    { label: '분석 후 결정해요', value: 3 }, { label: '오히려 사요', value: 4 },
  ]},
];

// 상세 20문항
type TypeKey = 'aggressive' | 'growth' | 'balanced' | 'value' | 'analytical' | 'trader' | 'dividend' | 'momentum';
interface DeepOpt { label: string; score: Partial<Record<TypeKey, number>> }
interface DeepQ { category: string; emoji: string; text: string; options: DeepOpt[] }

const DEEP_QS: DeepQ[] = [
  // 에너지 (2)
  { category: '에너지', emoji: '⚡', text: '투자 아이디어를 얻는 방식은?', options: [
    { label: '직접 리서치해요', score: { analytical: 3, value: 1 } },
    { label: '지인 추천', score: { balanced: 2, momentum: 1 } },
    { label: '뉴스/SNS', score: { momentum: 3, trader: 1 } },
    { label: '차트만 봐요', score: { trader: 3 } },
  ]},
  { category: '에너지', emoji: '⚡', text: '포트폴리오를 얼마나 자주 확인해요?', options: [
    { label: '실시간으로', score: { trader: 3 } },
    { label: '하루 1~2번', score: { balanced: 2, growth: 1 } },
    { label: '일주일에 한번', score: { value: 2, dividend: 1 } },
    { label: '거의 안봐요', score: { dividend: 3 } },
  ]},
  // 위험 (4)
  { category: '위험', emoji: '🎯', text: '한 종목에 최대 얼마까지 집중해요?', options: [
    { label: '전체의 10% 이하', score: { balanced: 3, dividend: 1 } },
    { label: '10~30%', score: { value: 2, growth: 1 } },
    { label: '30~50%', score: { aggressive: 2, growth: 1 } },
    { label: '몰빵도 가능', score: { aggressive: 3 } },
  ]},
  { category: '위험', emoji: '🎯', text: '손실이 얼마면 잠을 못 자요?', options: [
    { label: '-5%', score: { dividend: 3, balanced: 1 } },
    { label: '-10%', score: { balanced: 2 } },
    { label: '-20%', score: { growth: 2, value: 1 } },
    { label: '-30% 넘어야', score: { aggressive: 3 } },
  ]},
  { category: '위험', emoji: '🎯', text: '투자 실패했을 때 나는...', options: [
    { label: '바로 원인 분석', score: { analytical: 3 } },
    { label: '잠시 쉬어요', score: { balanced: 2 } },
    { label: '잊으려 노력', score: { dividend: 2 } },
    { label: '다음 기회로', score: { aggressive: 2, momentum: 1 } },
  ]},
  { category: '위험', emoji: '🎯', text: '레버리지 투자에 대해 어떻게 생각해요?', options: [
    { label: '절대 안해요', score: { dividend: 3, value: 1 } },
    { label: '신중하게 소액', score: { balanced: 2, analytical: 1 } },
    { label: '적극 활용', score: { aggressive: 3, trader: 1 } },
    { label: '모르겠어요', score: { balanced: 1 } },
  ]},
  // 스타일 (4)
  { category: '스타일', emoji: '📈', text: '가장 끌리는 투자 방식은?', options: [
    { label: '가치투자', score: { value: 3 } },
    { label: '성장주', score: { growth: 3 } },
    { label: '배당주', score: { dividend: 3 } },
    { label: '단기트레이딩', score: { trader: 3 } },
  ]},
  { category: '스타일', emoji: '📈', text: '주식을 얼마나 오래 보유해요?', options: [
    { label: '1주 이내', score: { trader: 3 } },
    { label: '1개월', score: { momentum: 2, trader: 1 } },
    { label: '6개월~1년', score: { growth: 2, balanced: 1 } },
    { label: '3년 이상', score: { value: 3, dividend: 1 } },
  ]},
  { category: '스타일', emoji: '📈', text: '분산투자 vs 집중투자?', options: [
    { label: '10종목 이상', score: { balanced: 3, dividend: 1 } },
    { label: '5~10종목', score: { balanced: 2, value: 1 } },
    { label: '2~4종목', score: { growth: 2, value: 1 } },
    { label: '1~2종목', score: { aggressive: 3 } },
  ]},
  { category: '스타일', emoji: '📈', text: '주가 떨어질 때 나는...', options: [
    { label: '즉시 손절', score: { trader: 3 } },
    { label: '일단 관망', score: { balanced: 2 } },
    { label: '추가 매수', score: { value: 3, momentum: 1 } },
    { label: '패닉셀', score: { dividend: 1 } },
  ]},
  // 정보 (3)
  { category: '정보', emoji: '🔍', text: '매수 전 얼마나 분석해요?', options: [
    { label: '당일 바로', score: { trader: 2, aggressive: 1 } },
    { label: '1~3일', score: { momentum: 2, growth: 1 } },
    { label: '1주일 이상', score: { analytical: 2, value: 1 } },
    { label: '한달 이상', score: { analytical: 3 } },
  ]},
  { category: '정보', emoji: '🔍', text: '주로 어떤 정보를 봐요?', options: [
    { label: '재무제표', score: { analytical: 3, value: 1 } },
    { label: '차트/기술적', score: { trader: 3 } },
    { label: '뉴스/트렌드', score: { momentum: 2, growth: 1 } },
    { label: 'AI 추천', score: { balanced: 2 } },
  ]},
  { category: '정보', emoji: '🔍', text: '"전문가 추천"을 들으면?', options: [
    { label: '직접 검증', score: { analytical: 3 } },
    { label: '참고만 해요', score: { balanced: 2, value: 1 } },
    { label: '바로 매수', score: { aggressive: 2, momentum: 1 } },
    { label: '무시해요', score: { trader: 2 } },
  ]},
  // 심리 (4)
  { category: '심리', emoji: '🧠', text: '수익이 20% 났을 때?', options: [
    { label: '바로 팔아요', score: { trader: 3 } },
    { label: '목표까지 보유', score: { value: 2, growth: 1 } },
    { label: '일부만 매도', score: { balanced: 3 } },
    { label: '더 기다려요', score: { growth: 2, aggressive: 1 } },
  ]},
  { category: '심리', emoji: '🧠', text: '주변이 다 사는 종목이 있으면?', options: [
    { label: '따라 사요', score: { momentum: 3 } },
    { label: '분석 후 결정', score: { analytical: 2, value: 1 } },
    { label: '절대 안 사요', score: { value: 2 } },
    { label: '관심만 가져요', score: { balanced: 2 } },
  ]},
  { category: '심리', emoji: '🧠', text: '투자에서 가장 중요한 건?', options: [
    { label: '수익률', score: { aggressive: 3, trader: 1 } },
    { label: '리스크 관리', score: { balanced: 2, analytical: 1 } },
    { label: '꾸준함', score: { dividend: 3, value: 1 } },
    { label: '타이밍', score: { trader: 2, momentum: 1 } },
  ]},
  { category: '심리', emoji: '🧠', text: '나의 투자 목표는?', options: [
    { label: '단기 수익', score: { trader: 3, aggressive: 1 } },
    { label: '노후 준비', score: { dividend: 3, balanced: 1 } },
    { label: '재미/경험', score: { momentum: 2, growth: 1 } },
    { label: '경제적 자유', score: { growth: 2, value: 1 } },
  ]},
  // 포트폴리오 (3)
  { category: '포트폴리오', emoji: '💼', text: '이상적인 포트폴리오 구성은?', options: [
    { label: '국내주식 100%', score: { balanced: 1, dividend: 1 } },
    { label: '해외주식 포함', score: { growth: 2, aggressive: 1 } },
    { label: 'ETF 위주', score: { balanced: 3 } },
    { label: '섹터 분산', score: { analytical: 2, balanced: 1 } },
  ]},
  { category: '포트폴리오', emoji: '💼', text: '현금 비중을 얼마나 유지해요?', options: [
    { label: '0% (풀투자)', score: { aggressive: 3 } },
    { label: '10~20%', score: { growth: 2, balanced: 1 } },
    { label: '30~50%', score: { value: 2, balanced: 1 } },
    { label: '50% 이상', score: { dividend: 2, balanced: 1 } },
  ]},
  { category: '포트폴리오', emoji: '💼', text: '리밸런싱은 얼마나 자주?', options: [
    { label: '매일', score: { trader: 3 } },
    { label: '매달', score: { momentum: 2, balanced: 1 } },
    { label: '분기별', score: { balanced: 2, value: 1 } },
    { label: '거의 안해요', score: { dividend: 2, value: 1 } },
  ]},
];

const PRAISE = [
  { at: 5, text: '절반 가까이 왔어요! 잘하고 있어요 🔥' },
  { at: 10, text: '딱 절반! 거의 다 왔어요 💪' },
  { at: 15, text: '마지막 스퍼트! 5문제만 더 🚀' },
];

// ═══════════════════════════════════════════════════
//  결과 계산
// ═══════════════════════════════════════════════════

function calcQuick(mbti: string, ans: Record<string, number | string>): string {
  const sc: Record<TypeKey, number> = { aggressive: 0, growth: 0, balanced: 0, value: 0, analytical: 0, trader: 0, dividend: 0, momentum: 0 };
  const base = MBTI_MAP[mbti]?.type as TypeKey | undefined;
  if (base && sc[base] !== undefined) sc[base] += 8;
  const { amount, loss, period, focus, news } = ans;
  if ((amount as number) >= 4) { sc.aggressive += 4; sc.growth += 2; }
  else if ((amount as number) === 3) { sc.growth += 3; sc.momentum += 2; }
  else if ((amount as number) === 2) { sc.balanced += 3; sc.value += 1; }
  else { sc.dividend += 3; sc.balanced += 2; }
  if ((loss as number) === 4) { sc.value += 3; sc.growth += 2; }
  else if ((loss as number) === 3) { sc.aggressive += 2; sc.momentum += 2; }
  else if ((loss as number) === 2) { sc.balanced += 3; }
  else { sc.trader += 4; sc.dividend += 1; }
  if ((period as number) >= 4) { sc.value += 3; sc.dividend += 3; }
  else if ((period as number) === 3) { sc.growth += 3; sc.balanced += 2; }
  else if ((period as number) === 2) { sc.momentum += 3; }
  else { sc.trader += 4; sc.aggressive += 1; }
  if (typeof focus === 'string' && focus in sc) sc[focus as TypeKey] += 5;
  if ((news as number) === 4) { sc.value += 3; }
  else if ((news as number) === 3) { sc.analytical += 4; }
  else if ((news as number) === 2) { sc.balanced += 3; }
  else { sc.trader += 3; sc.aggressive += 1; }
  return Object.entries(sc).sort(([, a], [, b]) => b - a)[0][0];
}

function calcDeep(answers: number[]): { type: string; scores: Record<string, number> } {
  const sc: Record<TypeKey, number> = { aggressive: 0, growth: 0, balanced: 0, value: 0, analytical: 0, trader: 0, dividend: 0, momentum: 0 };
  answers.forEach((optIdx, qIdx) => {
    const q = DEEP_QS[qIdx];
    if (!q) return;
    const opt = q.options[optIdx];
    if (!opt) return;
    Object.entries(opt.score).forEach(([k, v]) => { sc[k as TypeKey] += v; });
  });
  const type = Object.entries(sc).sort(([, a], [, b]) => b - a)[0][0];
  return { type, scores: sc };
}

// ═══════════════════════════════════════════════════
//  컴포넌트
// ═══════════════════════════════════════════════════

type Phase = 'mode' | 'mbtiChoice' | 'mbti' | 'quick' | 'invest' | 'deep' | 'praise';

export default function SurveyScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [phase, setPhase] = useState<Phase>('mode');
  const [analysisMode, setAnalysisMode] = useState<'quick' | 'deep'>('quick');
  const [mbtiPath, setMbtiPath] = useState<'mbti' | 'quick'>('mbti');
  const [mbti, setMbti] = useState('');
  const [quickIdx, setQuickIdx] = useState(0);
  const [quickLetters, setQuickLetters] = useState<string[]>([]);
  const [investIdx, setInvestIdx] = useState(0);
  const [investAns, setInvestAns] = useState<Record<string, number | string>>({});
  const [deepIdx, setDeepIdx] = useState(0);
  const [deepAns, setDeepAns] = useState<number[]>([]);
  const [sel, setSel] = useState<any>(null);
  const [praiseText, setPraiseText] = useState('');

  // 진행률
  let progress = 0;
  if (phase === 'mbti' || phase === 'mbtiChoice') progress = 5;
  else if (phase === 'quick') progress = Math.round(((quickIdx) / 9) * 100);
  else if (phase === 'invest') progress = Math.round(((mbtiPath === 'mbti' ? 1 : 4) + investIdx) / (mbtiPath === 'mbti' ? 6 : 9) * 100);
  else if (phase === 'deep') progress = Math.round(((deepIdx) / DEEP_QS.length) * 100);
  else if (phase === 'praise') progress = Math.round(((deepIdx) / DEEP_QS.length) * 100);

  const fade = (cb: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      cb();
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  };

  // 결과 이동
  const goResult = (mode: 'quick' | 'deep', finalMbti: string, investType: string, scores?: Record<string, number>) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate('투자유형결과', { mode, mbti: finalMbti, investType, scores });
  };

  // 뒤로가기
  const handleBack = () => {
    if (phase === 'deep' && deepIdx > 0) { fade(() => { setDeepIdx(deepIdx - 1); setDeepAns(deepAns.slice(0, -1)); setSel(null); }); }
    else if (phase === 'invest' && investIdx > 0) { fade(() => { setInvestIdx(investIdx - 1); setSel(null); }); }
    else if (phase === 'invest') { fade(() => { setPhase(mbtiPath === 'mbti' ? 'mbti' : 'quick'); setSel(null); }); }
    else if (phase === 'quick' && quickIdx > 0) { fade(() => { setQuickIdx(quickIdx - 1); setQuickLetters(quickLetters.slice(0, -1)); setSel(null); }); }
    else if (phase === 'mbti' || phase === 'quick' || phase === 'mbtiChoice') { fade(() => { setPhase('mode'); setSel(null); }); }
    else if (phase === 'deep') { fade(() => { setPhase('mode'); setSel(null); }); }
    else { navigation.goBack(); }
  };

  // MBTI 선택
  const pickMbti = (m: string) => {
    if (sel !== null) return;
    setSel(m); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => { setMbti(m); fade(() => { setPhase('invest'); setInvestIdx(0); setSel(null); }); }, 300);
  };

  // 퀵테스트
  const pickQuick = (letter: string) => {
    if (sel !== null) return;
    setSel(letter); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nl = [...quickLetters, letter];
    setTimeout(() => {
      if (quickIdx < QUICK_QS.length - 1) { fade(() => { setQuickIdx(quickIdx + 1); setQuickLetters(nl); setSel(null); }); }
      else { const est = nl.join(''); setMbti(est); setQuickLetters(nl); fade(() => { setPhase('invest'); setInvestIdx(0); setSel(null); }); }
    }, 300);
  };

  // 간편 투자질문
  const pickInvest = (value: number | string) => {
    if (sel !== null) return;
    setSel(value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const q = INVEST_QS[investIdx];
    const na = { ...investAns, [q.id]: value };
    setTimeout(() => {
      if (investIdx < INVEST_QS.length - 1) { fade(() => { setInvestIdx(investIdx + 1); setInvestAns(na); setSel(null); }); }
      else { setInvestAns(na); const t = calcQuick(mbti, na); goResult('quick', mbti, t); }
    }, 300);
  };

  // 상세 질문
  const pickDeep = (optIdx: number) => {
    if (sel !== null) return;
    setSel(optIdx); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const na = [...deepAns, optIdx];
    setTimeout(() => {
      const praise = PRAISE.find(p => p.at === deepIdx + 1);
      if (praise) {
        setPraiseText(praise.text);
        fade(() => { setDeepAns(na); setSel(null); setPhase('praise'); });
        return;
      }
      if (deepIdx < DEEP_QS.length - 1) { fade(() => { setDeepIdx(deepIdx + 1); setDeepAns(na); setSel(null); }); }
      else {
        setDeepAns(na);
        const { type, scores } = calcDeep(na);
        // MBTI 추정: 가장 가까운 MBTI 찾기
        const mbtiEntry = Object.entries(MBTI_MAP).find(([, v]) => v.type === type);
        goResult('deep', mbtiEntry?.[0] ?? 'INFJ', type, scores);
      }
    }, 300);
  };

  // 칭찬 후 계속
  const continuePraise = () => {
    fade(() => { setDeepIdx(deepIdx + 1); setPhase('deep'); });
  };

  // ── 스타일 ──
  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { padding: 4, width: 40 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
    headerRight: { width: 40 },
    progressBg: { height: 4, backgroundColor: '#F0F0F0', marginHorizontal: 16 },
    progressFill: { height: 4, borderRadius: 2 },
    // 모드 선택
    modeWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
    modeEmoji: { fontSize: 56, textAlign: 'center' },
    modeTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginTop: 16 },
    modeSub: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 6 },
    modeCards: { marginTop: 36, gap: 14 },
    modeCard: { borderRadius: 20, padding: 20, borderWidth: 2 },
    modeCardTitle: { fontSize: 17, fontWeight: '700' },
    modeCardDesc: { fontSize: 13, color: '#888', marginTop: 4 },
    modeCardBadge: { position: 'absolute', top: 12, right: 12, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    // MBTI 선택
    mbtiScroll: { flex: 1, paddingTop: 20 },
    mbtiTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginBottom: 24 },
    groupWrap: { paddingHorizontal: 16, marginBottom: 20 },
    groupLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
    groupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    mbtiBtn: { width: '22.5%' as any, aspectRatio: 1.5, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, backgroundColor: '#fff' },
    mbtiBtnAnimal: { fontSize: 18, marginBottom: 1 },
    mbtiBtnText: { fontSize: 14, fontWeight: '800' },
    // 질문 공통
    qWrap: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
    qCategory: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    qCategoryText: { fontSize: 13, fontWeight: '700', color: '#3B82F6' },
    qText: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', lineHeight: 32, marginBottom: 32 },
    // A/B 버튼
    abWrap: { gap: 14 },
    abBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 20, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: '#fff' },
    abBtnSel: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    abCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    abCircleSel: { backgroundColor: '#3B82F6' },
    abLabel: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', flex: 1 },
    abLabelSel: { color: '#3B82F6', fontWeight: '700' },
    // 4지선다
    optWrap: { gap: 12 },
    optBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 18, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: '#fff', gap: 14 },
    optBtnSel: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    optCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    optCircleSel: { backgroundColor: '#3B82F6' },
    optText: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
    optTextSel: { fontWeight: '700', color: '#3B82F6' },
    // 칭찬
    praiseWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    praiseEmoji: { fontSize: 64 },
    praiseText: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginTop: 16, lineHeight: 30 },
    praiseBtn: { marginTop: 32, backgroundColor: '#3B82F6', borderRadius: 16, height: 52, paddingHorizontal: 40, justifyContent: 'center', alignItems: 'center' },
    praiseBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    // MBTI 선택 진입
    choiceWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
    choiceTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginBottom: 32 },
    choiceBtn: { borderRadius: 16, height: 60, justifyContent: 'center', alignItems: 'center', borderWidth: 2, marginBottom: 14 },
    choiceBtnText: { fontSize: 16, fontWeight: '700' },
  });

  const pColor = analysisMode === 'deep' ? '#8B5CF6' : '#3B82F6';

  // ════════════════════════════════════════════
  //  모드 선택
  // ════════════════════════════════════════════
  if (phase === 'mode') return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Ionicons name="chevron-back" size={24} color="#1A1A1A" /></TouchableOpacity>
        <Text style={s.headerTitle}>투자유형 분석</Text>
        <View style={s.headerRight} />
      </View>
      <View style={s.modeWrap}>
        <Text style={s.modeEmoji}>🧬</Text>
        <Text style={s.modeTitle}>나만의 투자 DNA{'\n'}찾으러 가볼까요?</Text>
        <Text style={s.modeSub}>분석 방식을 선택해주세요</Text>
        <View style={s.modeCards}>
          <TouchableOpacity
            style={[s.modeCard, { borderColor: '#3B82F6' }]}
            onPress={() => { setAnalysisMode('quick'); setPhase('mbtiChoice'); }}
            activeOpacity={0.8}
          >
            <Text style={[s.modeCardTitle, { color: '#3B82F6' }]}>⚡ 간편 분석</Text>
            <Text style={s.modeCardDesc}>MBTI + 투자 질문 5개 · 약 1분</Text>
            <View style={[s.modeCardBadge, { backgroundColor: '#EFF6FF' }]}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#3B82F6' }}>빠르게</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.modeCard, { borderColor: '#8B5CF6' }]}
            onPress={() => { setAnalysisMode('deep'); setPhase('deep'); setDeepIdx(0); setDeepAns([]); }}
            activeOpacity={0.8}
          >
            <Text style={[s.modeCardTitle, { color: '#8B5CF6' }]}>🔬 상세 분석</Text>
            <Text style={s.modeCardDesc}>투자 특화 20문항 · 약 5분</Text>
            <View style={[s.modeCardBadge, { backgroundColor: '#F3F0FF' }]}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#8B5CF6' }}>정확도 높음</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  // ════════════════════════════════════════════
  //  MBTI 알아요/몰라요 선택
  // ════════════════════════════════════════════
  if (phase === 'mbtiChoice') return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={handleBack} style={s.backBtn}><Ionicons name="chevron-back" size={24} color="#1A1A1A" /></TouchableOpacity>
        <Text style={s.headerTitle}>간편 분석</Text>
        <View style={s.headerRight} />
      </View>
      <View style={s.progressBg}><View style={[s.progressFill, { width: '5%', backgroundColor: pColor }]} /></View>
      <View style={s.choiceWrap}>
        <Text style={s.choiceTitle}>MBTI를 알고 있나요?</Text>
        <TouchableOpacity style={[s.choiceBtn, { borderColor: '#3B82F6', backgroundColor: '#3B82F6' }]} onPress={() => { setMbtiPath('mbti'); setPhase('mbti'); }} activeOpacity={0.8}>
          <Text style={[s.choiceBtnText, { color: '#fff' }]}>네, 알아요!</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.choiceBtn, { borderColor: '#E5E7EB' }]} onPress={() => { setMbtiPath('quick'); setPhase('quick'); setQuickIdx(0); setQuickLetters([]); }} activeOpacity={0.8}>
          <Text style={[s.choiceBtnText, { color: '#666' }]}>아니요, 모르겠어요</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // ════════════════════════════════════════════
  //  칭찬 화면 (상세 모드 중간)
  // ════════════════════════════════════════════
  if (phase === 'praise') return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={handleBack} style={s.backBtn}><Ionicons name="chevron-back" size={24} color="#1A1A1A" /></TouchableOpacity>
        <Text style={s.headerTitle}>상세 분석</Text>
        <View style={s.headerRight} />
      </View>
      <View style={s.progressBg}><View style={[s.progressFill, { width: `${progress}%` as any, backgroundColor: '#8B5CF6' }]} /></View>
      <Animated.View style={[s.praiseWrap, { opacity: fadeAnim }]}>
        <Text style={s.praiseEmoji}>🎉</Text>
        <Text style={s.praiseText}>{praiseText}</Text>
        <TouchableOpacity style={s.praiseBtn} onPress={continuePraise} activeOpacity={0.85}>
          <Text style={s.praiseBtnText}>계속하기</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );

  // ════════════════════════════════════════════
  //  공통 헤더 + 진행률
  // ════════════════════════════════════════════
  const phaseLabel = phase === 'mbti' ? 'MBTI 선택' : phase === 'quick' ? '간단 테스트' : phase === 'invest' ? '투자 성향' : '상세 분석';

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={handleBack} style={s.backBtn}><Ionicons name="chevron-back" size={24} color="#1A1A1A" /></TouchableOpacity>
        <Text style={s.headerTitle}>{phaseLabel}</Text>
        <Text style={{ width: 40, textAlign: 'right', fontSize: 13, color: '#888', fontWeight: '600' }}>
          {phase === 'deep' ? `${deepIdx + 1}/${DEEP_QS.length}` : phase === 'invest' ? `${investIdx + 1}/${INVEST_QS.length}` : ''}
        </Text>
      </View>
      <View style={s.progressBg}><View style={[s.progressFill, { width: `${Math.max(progress, 3)}%` as any, backgroundColor: pColor }]} /></View>

      {/* MBTI 그리드 */}
      {phase === 'mbti' && (
        <ScrollView style={s.mbtiScroll} showsVerticalScrollIndicator={false}>
          <Text style={s.mbtiTitle}>당신의 MBTI는?</Text>
          {MBTI_GROUPS.map((g) => (
            <View key={g.label} style={s.groupWrap}>
              <Text style={[s.groupLabel, { color: g.color }]}>{g.label}</Text>
              <View style={s.groupGrid}>
                {g.types.map((m) => {
                  const mp = MBTI_MAP[m]; const isSel = sel === m;
                  return (
                    <TouchableOpacity key={m} style={[s.mbtiBtn, { borderColor: isSel ? g.color : g.color + '30' }]} onPress={() => pickMbti(m)} activeOpacity={0.7} disabled={sel !== null}>
                      <Text style={s.mbtiBtnAnimal}>{mp?.animal}</Text>
                      <Text style={[s.mbtiBtnText, { color: g.color }]}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* 퀵테스트 A/B */}
      {phase === 'quick' && (
        <Animated.View style={[s.qWrap, { opacity: fadeAnim }]}>
          <Text style={s.qCategoryText}>Q{quickIdx + 1} / {QUICK_QS.length}</Text>
          <Text style={s.qText}>{QUICK_QS[quickIdx].text}</Text>
          <View style={s.abWrap}>
            {(['A', 'B'] as const).map((side) => {
              const opt = QUICK_QS[quickIdx][side]; const isSel = sel === opt.value;
              return (
                <TouchableOpacity key={side} style={[s.abBtn, isSel && s.abBtnSel]} onPress={() => pickQuick(opt.value)} activeOpacity={0.8} disabled={sel !== null}>
                  <View style={[s.abCircle, isSel && s.abCircleSel]}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: isSel ? '#fff' : '#9CA3AF' }}>{side}</Text>
                  </View>
                  <Text style={[s.abLabel, isSel && s.abLabelSel]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      )}

      {/* 간편 투자 질문 */}
      {phase === 'invest' && (
        <Animated.ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={s.qCategoryText}>Q{investIdx + 1} / {INVEST_QS.length}</Text>
            <Text style={s.qText}>{INVEST_QS[investIdx].text}</Text>
            <View style={s.optWrap}>
              {INVEST_QS[investIdx].options.map((opt, i) => {
                const isSel = sel === opt.value;
                return (
                  <TouchableOpacity key={i} style={[s.optBtn, isSel && s.optBtnSel]} onPress={() => pickInvest(opt.value)} activeOpacity={0.8} disabled={sel !== null}>
                    <View style={[s.optCircle, isSel && s.optCircleSel]}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isSel ? '#fff' : '#9CA3AF' }}>{String.fromCharCode(65 + i)}</Text>
                    </View>
                    <Text style={[s.optText, isSel && s.optTextSel]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </Animated.ScrollView>
      )}

      {/* 상세 20문항 */}
      {phase === 'deep' && (
        <Animated.ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={s.qCategory}>
              <Text style={{ fontSize: 16, marginRight: 6 }}>{DEEP_QS[deepIdx].emoji}</Text>
              <Text style={[s.qCategoryText, { color: '#8B5CF6' }]}>{DEEP_QS[deepIdx].category}</Text>
            </View>
            <Text style={s.qText}>{DEEP_QS[deepIdx].text}</Text>
            <View style={s.optWrap}>
              {DEEP_QS[deepIdx].options.map((opt, i) => {
                const isSel = sel === i;
                return (
                  <TouchableOpacity key={i} style={[s.optBtn, isSel && { borderColor: '#8B5CF6', backgroundColor: '#F3F0FF' }]} onPress={() => pickDeep(i)} activeOpacity={0.8} disabled={sel !== null}>
                    <View style={[s.optCircle, isSel && { backgroundColor: '#8B5CF6' }]}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isSel ? '#fff' : '#9CA3AF' }}>{String.fromCharCode(65 + i)}</Text>
                    </View>
                    <Text style={[s.optText, isSel && { fontWeight: '700', color: '#8B5CF6' }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
}
