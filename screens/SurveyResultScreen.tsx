/**
 * 투자 유형 분석 결과 화면
 * LinearGradient 헤더 + 점수 바 차트 + 강점/약점 + 추천 전략/종목 + 유명 투자자
 */

import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/ui';

// ── 타입 ──────────────────────────────────────────
interface InvestmentType {
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  gradient: readonly [string, string];
  mbti: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  strategy: string;
  recommend: { domestic: string[]; overseas: string[]; ratio: string };
  famous: string;
  famousQuote: string;
  warning: string;
}

// ── 8가지 투자 유형 ──────────────────────────────
const TYPES: Record<string, InvestmentType> = {
  aggressive: {
    emoji: '🦁', title: '공격형 투자자', subtitle: 'HIGH-RISK 고수익 추구형',
    color: '#FF3B30', gradient: ['#FF3B30', '#FF6B35'] as const, mbti: 'ENTP형 투자자',
    description: '높은 수익을 위해 큰 위험도 과감히 감수하는 타입이에요. 변동성이 큰 종목을 선호하고 빠른 판단력이 강점이에요.',
    strengths: ['빠른 결단력과 실행력', '높은 수익 잠재성', '트렌드 파악 능력', '손실을 두려워하지 않는 배짱'],
    weaknesses: ['감정적 매매로 인한 손실 위험', '과도한 집중 투자 위험', '단기 변동성에 취약', '리스크 관리 소홀 가능성'],
    strategy: '성장주와 테마주 중심으로 투자하되 반드시 손절 원칙 준수. 전체 자산의 10~20%는 반드시 현금으로 보유.',
    recommend: { domestic: ['POSCO홀딩스', '크래프톤', '에코프로'], overseas: ['NVIDIA', 'Tesla', 'Palantir'], ratio: '성장주 70% + 테마주 20% + 현금 10%' },
    famous: '조지 소로스', famousQuote: '"위험을 피하려 하지 말고, 위험을 이해하라"',
    warning: '투자 원금의 30% 이상 손실 시 반드시 포트폴리오 재검토 필요',
  },
  balanced: {
    emoji: '🦊', title: '균형형 투자자', subtitle: 'BALANCED 안정성장 추구형',
    color: '#0066FF', gradient: ['#0066FF', '#0052CC'] as const, mbti: 'INFJ형 투자자',
    description: '안정성과 수익성의 균형을 추구하는 현명한 타입이에요. 장기적 관점으로 꾸준한 수익을 목표로 해요.',
    strengths: ['균형 잡힌 포트폴리오 구성', '안정적이고 꾸준한 수익', '감정에 흔들리지 않는 원칙', '리스크 대비 수익률 우수'],
    weaknesses: ['큰 수익 기회를 놓칠 수 있음', '결정이 느릴 수 있음', '트렌드에 늦게 반응', '보수적 접근으로 초기 수익 낮음'],
    strategy: '우량주 50% + 성장주 30% + 채권/현금 20% 비율 유지. 분기별 리밸런싱.',
    recommend: { domestic: ['삼성전자', 'NAVER', 'LG에너지솔루션'], overseas: ['Apple', 'Microsoft', 'Google'], ratio: '우량주 50% + 성장주 30% + 현금 20%' },
    famous: '피터 린치', famousQuote: '"10루타 종목을 찾으려면 기업을 이해해야 한다"',
    warning: '시장 급락 시 리밸런싱 기회로 활용하세요',
  },
  safe: {
    emoji: '🐻', title: '안정형 투자자', subtitle: 'SAFE-GUARD 원금보존 추구형',
    color: '#34C759', gradient: ['#34C759', '#28A745'] as const, mbti: 'ISTJ형 투자자',
    description: '원금 보존을 최우선으로 하는 안전 지향 타입이에요. 꾸준한 배당과 안정적 수익을 선호해요.',
    strengths: ['손실 최소화 능력', '심리적 안정감 유지', '배당 수익으로 꾸준한 현금흐름', '시장 하락 시 상대적 방어력'],
    weaknesses: ['인플레이션 대비 낮은 실질 수익', '성장주 수익 기회 놓침', '너무 보수적인 접근', '장기 복리 효과 제한적'],
    strategy: '고배당주 40% + ETF 40% + 채권/현금 20%. 월배당 ETF 적극 활용.',
    recommend: { domestic: ['KT&G', '삼성생명', 'KB금융'], overseas: ['Visa', 'Johnson & Johnson', 'JPMorgan'], ratio: '배당주 40% + ETF 40% + 현금 20%' },
    famous: '워런 버핏', famousQuote: '"첫 번째 규칙: 돈을 잃지 마라"',
    warning: '너무 안전한 투자는 인플레이션에 지는 투자일 수 있어요',
  },
  analytical: {
    emoji: '🦅', title: '분석형 투자자', subtitle: 'DATA-DRIVEN 데이터 기반형',
    color: '#5856D6', gradient: ['#5856D6', '#3634A3'] as const, mbti: 'INTJ형 투자자',
    description: '철저한 데이터 분석을 바탕으로 투자하는 전략가 타입이에요. 감정을 배제한 냉철한 판단이 강점이에요.',
    strengths: ['철저한 기업 분석 능력', '감정 배제한 객관적 판단', '장기적으로 높은 성공률', '리스크 사전 파악 능력'],
    weaknesses: ['분석 과다로 매매 타이밍 놓침', '시간 투자 많이 필요', '단기 모멘텀 무시 경향', '완벽주의로 인한 결정 지연'],
    strategy: 'PER 15 이하 + ROE 15% 이상 기업 중심. 분기 실적 발표 시 적극 대응.',
    recommend: { domestic: ['삼성바이오로직스', 'SK하이닉스', 'POSCO홀딩스'], overseas: ['NVIDIA', 'Apple', 'Berkshire Hathaway'], ratio: '가치주 40% + 성장주 40% + 현금 20%' },
    famous: '벤저민 그레이엄', famousQuote: '"주가는 단기적으로 투표 기계이지만 장기적으로 저울이다"',
    warning: '분석에만 집중하다 좋은 매수 타이밍을 놓칠 수 있어요',
  },
  trader: {
    emoji: '🐯', title: '트레이더형', subtitle: 'SPEED-TRADER 단기 차익 추구형',
    color: '#FF9500', gradient: ['#FF9500', '#FF6B00'] as const, mbti: 'ESTP형 투자자',
    description: '빠른 매매로 단기 수익을 추구하는 액션파 타입이에요. 차트와 기술적 지표에 능숙해요.',
    strengths: ['빠른 시장 반응 속도', '차트 분석 능력', '단기 수익 실현', '엄격한 손절 원칙'],
    weaknesses: ['높은 거래 비용', '심리적 스트레스', '장기 복리 효과 제한', '시장 모니터링에 많은 시간'],
    strategy: '이동평균선 + 거래량 기반 매매. 손절 -5% 원칙 철저 준수.',
    recommend: { domestic: ['SK하이닉스', '카카오', '삼성SDI'], overseas: ['Tesla', 'AMD', 'NVIDIA'], ratio: '모멘텀주 60% + 현금 40%' },
    famous: '제시 리버모어', famousQuote: '"주식 시장은 절대 틀리지 않는다. 틀리는 것은 투자자뿐이다"',
    warning: '모의투자에서도 반드시 손절 원칙을 연습하세요',
  },
  longterm: {
    emoji: '🦋', title: '장기투자형', subtitle: 'LONG-TERM 복리 극대화형',
    color: '#FF2D55', gradient: ['#FF2D55', '#CC0033'] as const, mbti: 'INFP형 투자자',
    description: '복리의 마법을 믿고 장기적 관점에서 투자하는 인내형 타입이에요. 기업의 본질적 가치를 중시해요.',
    strengths: ['복리 효과 극대화', '거래 비용 최소화', '심리적 안정감', '시간이 지날수록 유리'],
    weaknesses: ['단기 기회 놓침', '보유 중 큰 손실 구간 경험', '매도 타이밍 잡기 어려움', '인내심 필요'],
    strategy: '우량 성장주 매월 정액 적립. 배당 재투자. 5년 이상 보유 계획으로 매수.',
    recommend: { domestic: ['삼성전자', 'LG에너지솔루션', 'NAVER'], overseas: ['Apple', 'Microsoft', 'Amazon'], ratio: '핵심 성장주 80% + 현금 20%' },
    famous: '워런 버핏', famousQuote: '"10년 보유할 생각이 없다면 10분도 보유하지 마라"',
    warning: '장기 투자도 기업 펀더멘털 변화 시 재검토 필요',
  },
  contrarian: {
    emoji: '🦚', title: '역발상 투자자', subtitle: 'CONTRARIAN 역발상 가치 추구형',
    color: '#00C7BE', gradient: ['#00C7BE', '#008F8A'] as const, mbti: 'ENTP형 투자자',
    description: '남들이 외면할 때 사고, 남들이 탐욕스러울 때 파는 역발상 투자자예요.',
    strengths: ['저점 매수 고점 매도', '군중 심리 역이용', '높은 수익 잠재성', '독립적 사고력'],
    weaknesses: ['타이밍 잡기 매우 어려움', '군중과 반대로 가는 심리적 압박', '하락장에서 손실 확대 위험', '너무 이른 진입 가능성'],
    strategy: '공포 탐욕 지수 활용. RSI 30 이하 구간 매수. 분할 매수로 타이밍 리스크 분산.',
    recommend: { domestic: ['실적 대비 저평가 종목'], overseas: ['S&P 500 공포 구간 ETF'], ratio: '역발상 종목 50% + 현금 대기 50%' },
    famous: '하워드 막스', famousQuote: '"가장 위험한 것은 모든 사람이 안전하다고 생각할 때다"',
    warning: '역발상은 근거 있는 분석이 뒷받침되어야 해요',
  },
  passive: {
    emoji: '🌸', title: '학습형 투자자', subtitle: 'LEARNER 성장 잠재력형',
    color: '#AF52DE', gradient: ['#AF52DE', '#8A2BE2'] as const, mbti: 'ISFP형 투자자',
    description: '아직 투자 경험을 쌓아가는 성장 단계의 타입이에요. 꾸준한 학습으로 훌륭한 투자자가 될 잠재력이 있어요.',
    strengths: ['학습 의지와 성장 가능성', '실수에서 배우는 자세', '무리한 투자 안 함', '체계적 학습으로 기초 탄탄'],
    weaknesses: ['경험 부족으로 판단 기준 미확립', '시장 변동성에 불안감', '좋은 종목 발굴 어려움', '매수/매도 타이밍 미숙'],
    strategy: 'FLOCO 학습 탭 매일 활용. 소액으로 다양한 종목 경험. ETF로 분산 투자 시작.',
    recommend: { domestic: ['삼성전자', 'KODEX 200 ETF'], overseas: ['SPY (S&P500 ETF)', 'QQQ (나스닥 ETF)'], ratio: 'ETF 60% + 우량주 20% + 현금 20%' },
    famous: '존 보글', famousQuote: '"투자의 첫 번째 원칙은 단순함이다"',
    warning: '지금은 학습이 가장 중요해요. FLOCO에서 매일 공부하세요!',
  },
};

// ── 컴포넌트 ──────────────────────────────────────
export default function SurveyResultScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();

  const resultType: string = route.params?.resultType ?? 'balanced';
  const scores: Record<string, number> = route.params?.scores ?? {};
  const secondType: string = route.params?.secondType ?? 'safe';

  const type = TYPES[resultType] ?? TYPES.balanced;
  const second = TYPES[secondType] ?? TYPES.safe;

  // 점수 → 퍼센트
  const totalScore = Math.max(Object.values(scores).reduce((a, b) => a + b, 0), 1);
  const scorePercents = Object.entries(scores)
    .map(([key, value]) => ({
      key,
      label: TYPES[key]?.title ?? key,
      emoji: TYPES[key]?.emoji ?? '📊',
      percent: Math.round((value / totalScore) * 100),
      color: TYPES[key]?.color ?? '#8B95A1',
    }))
    .sort((a, b) => b.percent - a.percent);

  // Firestore 저장
  useEffect(() => {
    if (!user?.id) return;
    updateDoc(doc(db, 'users', user.id), {
      investmentType: {
        type: resultType, secondType,
        emoji: type.emoji, title: type.title, subtitle: type.subtitle,
        color: type.color, mbti: type.mbti, scores,
        analyzedAt: new Date().toISOString(),
      },
      surveyCompleted: true,
    }).catch((e) => console.error('투자유형 저장 오류:', e));
  }, [user?.id]);

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gradient Header */}
        <LinearGradient colors={[...type.gradient]} style={s.gradientHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtnAbsolute}>
            <Text style={{ color: '#FFFFFF', fontSize: 22 }}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={s.headerEmoji}>{type.emoji}</Text>
          <Text style={s.headerTitle}>{type.title}</Text>
          <Text style={s.headerSub}>{type.subtitle}</Text>
          <View style={s.mbtiBadge}>
            <Text style={s.mbtiText}>{type.mbti}</Text>
          </View>
        </LinearGradient>

        {/* Description */}
        <View style={s.card}>
          <Text style={s.descText}>{type.description}</Text>
        </View>

        {/* Score Chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>나의 투자 성향 분석</Text>
          {scorePercents.slice(0, 5).map((item) => (
            <View key={item.key} style={{ marginBottom: 14 }}>
              <View style={s.scoreRow}>
                <Text style={s.scoreLabel}>{item.emoji} {item.label}</Text>
                <Text style={[s.scorePct, { color: item.color }]}>{item.percent}%</Text>
              </View>
              <View style={s.barBg}>
                <View style={[s.barFill, { width: `${item.percent}%` as any, backgroundColor: item.color }]} />
              </View>
            </View>
          ))}
          {/* 2nd type */}
          <View style={[s.secondBadge, { backgroundColor: second.color + '15' }]}>
            <Text style={{ fontSize: 24, marginRight: 8 }}>{second.emoji}</Text>
            <View>
              <Text style={[s.secondTitle, { color: second.color }]}>2순위: {second.title}</Text>
              <Text style={s.secondSub}>{second.subtitle}</Text>
            </View>
          </View>
        </View>

        {/* Strengths */}
        <View style={s.card}>
          <Text style={s.cardTitle}>강점</Text>
          {type.strengths.map((str, i) => (
            <View key={i} style={s.listItem}>
              <View style={[s.numCircle, { backgroundColor: type.color }]}>
                <Text style={s.numText}>{i + 1}</Text>
              </View>
              <Text style={s.listText}>{str}</Text>
            </View>
          ))}
        </View>

        {/* Weaknesses */}
        <View style={s.card}>
          <Text style={s.cardTitle}>주의점</Text>
          {type.weaknesses.map((w, i) => (
            <View key={i} style={s.listItem}>
              <Text style={{ color: '#FF9500', fontSize: 16, marginRight: 10 }}>{'•'}</Text>
              <Text style={s.listText}>{w}</Text>
            </View>
          ))}
        </View>

        {/* Strategy */}
        <View style={s.card}>
          <Text style={s.cardTitle}>맞춤 투자 전략</Text>
          <Text style={s.strategyText}>{type.strategy}</Text>
          <Text style={s.ratioLabel}>추천 포트폴리오 비율</Text>
          <View style={[s.ratioBadge, { backgroundColor: type.color + '15' }]}>
            <Text style={[s.ratioText, { color: type.color }]}>{type.recommend.ratio}</Text>
          </View>
        </View>

        {/* Recommended Stocks */}
        <View style={s.card}>
          <Text style={s.cardTitle}>추천 종목</Text>
          <Text style={s.chipLabel}>국내주식</Text>
          <View style={s.chipRow}>
            {type.recommend.domestic.map((stock) => (
              <View key={stock} style={[s.chip, { backgroundColor: '#F0F4FF' }]}>
                <Text style={[s.chipText, { color: '#0066FF' }]}>{stock}</Text>
              </View>
            ))}
          </View>
          <Text style={[s.chipLabel, { marginTop: 12 }]}>해외주식</Text>
          <View style={s.chipRow}>
            {type.recommend.overseas.map((stock) => (
              <View key={stock} style={[s.chip, { backgroundColor: '#FFF8F0' }]}>
                <Text style={[s.chipText, { color: '#FF9500' }]}>{stock}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Famous Investor */}
        <View style={[s.quoteCard, { borderLeftColor: type.color }]}>
          <Text style={[s.quoteAuthor, { color: type.color }]}>나와 닮은 투자자: {type.famous}</Text>
          <Text style={s.quoteText}>{type.famousQuote}</Text>
        </View>

        {/* Warning */}
        <View style={s.warningCard}>
          <Text style={s.warningText}>{type.warning}</Text>
        </View>

        {/* Buttons */}
        <View style={s.btnWrap}>
          <TouchableOpacity
            style={[s.primaryBtn, { backgroundColor: type.color }]}
            onPress={() => {
              try { navigation.getParent()?.navigate('홈Tab'); } catch { navigation.goBack(); }
            }}
            activeOpacity={0.85}
          >
            <Text style={s.primaryBtnText}>투자 시작하기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.ghostBtn}
            onPress={() => navigation.navigate('투자유형설문')}
            activeOpacity={0.7}
          >
            <Text style={s.ghostBtnText}>다시 분석하기</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── 스타일 ────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F4F6' },

  gradientHeader: { paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  backBtnAbsolute: { position: 'absolute', top: 16, left: 16, padding: 8 },
  headerEmoji: { fontSize: 80 },
  headerTitle: { color: '#FFF', fontSize: 26, fontWeight: '800', marginTop: 16, textAlign: 'center' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 },
  mbtiBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 12 },
  mbtiText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  card: { backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 12, borderRadius: 20, padding: 20 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 14 },

  descText: { fontSize: 15, color: Colors.text, lineHeight: 26 },

  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  scoreLabel: { fontSize: 13, color: Colors.text },
  scorePct: { fontSize: 13, fontWeight: '700' },
  barBg: { height: 8, backgroundColor: '#F2F4F6', borderRadius: 4 },
  barFill: { height: 8, borderRadius: 4 },

  secondBadge: { borderRadius: 12, padding: 12, marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  secondTitle: { fontWeight: '700', fontSize: 14 },
  secondSub: { color: Colors.textSub, fontSize: 12 },

  listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  numCircle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 1 },
  numText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  listText: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 22 },

  strategyText: { fontSize: 14, color: Colors.text, lineHeight: 24, marginBottom: 16 },
  ratioLabel: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  ratioBadge: { borderRadius: 12, padding: 12 },
  ratioText: { fontWeight: '700', fontSize: 14 },

  chipLabel: { fontSize: 13, color: Colors.textSub, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontWeight: '700', fontSize: 13 },

  quoteCard: { backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 12, borderRadius: 20, padding: 20, borderLeftWidth: 4 },
  quoteAuthor: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  quoteText: { fontSize: 14, color: Colors.text, fontStyle: 'italic', lineHeight: 22 },

  warningCard: { backgroundColor: '#FFF8E7', marginHorizontal: 16, marginTop: 12, borderRadius: 20, padding: 16, borderLeftWidth: 4, borderLeftColor: '#FF9500' },
  warningText: { fontSize: 13, color: Colors.text, lineHeight: 20 },

  btnWrap: { marginHorizontal: 16, marginTop: 20, gap: 12 },
  primaryBtn: { borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  ghostBtn: { backgroundColor: '#F2F4F6', borderRadius: 16, height: 48, justifyContent: 'center', alignItems: 'center' },
  ghostBtnText: { color: Colors.textSub, fontSize: 15 },
});
