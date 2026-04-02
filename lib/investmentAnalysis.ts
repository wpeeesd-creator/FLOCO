/**
 * AI 투자 유형 분석 서비스
 * Claude API 호출 → 실패 시 더미 결과 반환
 */

import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// ── 타입 ──────────────────────────────────────
export interface InvestmentTypeResult {
  type: string;
  emoji: string;
  title: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  strategy: string;
  recommended_stocks: string[];
  mbti_like: string;
}

export interface StoredInvestmentType {
  type: string;
  emoji: string;
  title: string;
  mbtiLike: string;
  analyzedAt: number;
}

// ── 설문 문항 ──────────────────────────────────
export interface SurveyQuestion {
  id: number;
  question: string;
  options: { label: string; value: string }[];
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 1,
    question: '갑자기 투자한 주식이 20% 하락했어요.\n어떻게 할까요?',
    options: [
      { label: '즉시 팔아서 손실을 줄인다', value: 'A' },
      { label: '조금 더 지켜본다', value: 'B' },
      { label: '오히려 더 산다', value: 'C' },
      { label: '아무것도 안 한다', value: 'D' },
    ],
  },
  {
    id: 2,
    question: '투자할 때 가장 중요한 건?',
    options: [
      { label: '안전하게 지키는 것', value: 'A' },
      { label: '꾸준한 수익', value: 'B' },
      { label: '높은 수익률', value: 'C' },
      { label: '빠른 수익', value: 'D' },
    ],
  },
  {
    id: 3,
    question: '주식 공부를 얼마나 하나요?',
    options: [
      { label: '거의 안 한다', value: 'A' },
      { label: '가끔 뉴스 본다', value: 'B' },
      { label: '매일 공부한다', value: 'C' },
      { label: '전문가 수준', value: 'D' },
    ],
  },
  {
    id: 4,
    question: '한 종목에 얼마나 집중 투자할 수 있나요?',
    options: [
      { label: '전체의 10% 이하', value: 'A' },
      { label: '전체의 30%', value: 'B' },
      { label: '전체의 50%', value: 'C' },
      { label: '전부 다', value: 'D' },
    ],
  },
  {
    id: 5,
    question: '투자 기간은?',
    options: [
      { label: '1개월 이내', value: 'A' },
      { label: '6개월~1년', value: 'B' },
      { label: '1~3년', value: 'C' },
      { label: '3년 이상', value: 'D' },
    ],
  },
  {
    id: 6,
    question: '손실이 얼마나 나면 잠을 못 자나요?',
    options: [
      { label: '1% 이상', value: 'A' },
      { label: '5% 이상', value: 'B' },
      { label: '20% 이상', value: 'C' },
      { label: '50% 이상', value: 'D' },
    ],
  },
  {
    id: 7,
    question: '새로운 종목 발굴을 즐기나요?',
    options: [
      { label: '전혀 안 좋아한다', value: 'A' },
      { label: '가끔 찾아본다', value: 'B' },
      { label: '자주 새 종목 찾는다', value: 'C' },
      { label: '매일 분석한다', value: 'D' },
    ],
  },
  {
    id: 8,
    question: '투자 결정 시 가장 중요한 건?',
    options: [
      { label: '전문가 추천', value: 'A' },
      { label: '뉴스/트렌드', value: 'B' },
      { label: '재무제표', value: 'C' },
      { label: '차트 분석', value: 'D' },
    ],
  },
  {
    id: 9,
    question: '급등 종목을 봤을 때?',
    options: [
      { label: '위험해 보여서 패스', value: 'A' },
      { label: '조금만 사본다', value: 'B' },
      { label: '적극적으로 진입', value: 'C' },
      { label: '이미 늦었다고 생각', value: 'D' },
    ],
  },
  {
    id: 10,
    question: '투자로 얻고 싶은 것은?',
    options: [
      { label: '용돈 조금 더', value: 'A' },
      { label: '학비 마련', value: 'B' },
      { label: '큰 부자', value: 'C' },
      { label: '경험과 공부', value: 'D' },
    ],
  },
];

// ── Claude API 분석 ──────────────────────────
const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `당신은 청소년 투자 성향 분석 전문가입니다.
설문 답변을 분석해서 투자 유형을 진단해주세요.

투자 유형 6가지:
1. 🦁 공격형 투자자 - 고위험 고수익 추구
2. 🐯 성장형 투자자 - 성장주 중심 투자
3. 🦊 균형형 투자자 - 안정과 수익 균형
4. 🐻 안정형 투자자 - 안전 자산 선호
5. 🦅 분석형 투자자 - 데이터 기반 투자
6. 🦋 학습형 투자자 - 경험 중심 투자

반드시 JSON 형식으로만 답변:
{
  "type": "유형명",
  "emoji": "이모지",
  "title": "OO형 투자자",
  "description": "2~3문장 설명",
  "strengths": ["강점1", "강점2", "강점3"],
  "weaknesses": ["약점1", "약점2"],
  "strategy": "추천 투자 전략 2~3문장",
  "recommended_stocks": ["추천 종목 유형1", "추천 종목 유형2"],
  "mbti_like": "XXXX형 (MBTI 스타일 4글자)"
}`;

export async function analyzeSurvey(answers: string[]): Promise<InvestmentTypeResult> {
  // API 키가 없으면 더미 결과
  if (!ANTHROPIC_API_KEY) {
    console.log('Anthropic API 키 없음 → 더미 분석 결과 사용');
    return getDummyResult(answers);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `설문 답변: ${answers.join(', ')}\n\n위 답변을 분석해서 투자 유형을 JSON으로 알려주세요.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('Claude API 응답 오류:', response.status);
      return getDummyResult(answers);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';
    // JSON 블록 추출 (```json ... ``` 또는 raw JSON)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('Claude 응답에서 JSON 파싱 실패');
      return getDummyResult(answers);
    }
    return JSON.parse(jsonMatch[0]) as InvestmentTypeResult;
  } catch (error) {
    console.warn('Claude API 호출 실패:', error);
    return getDummyResult(answers);
  }
}

// ── Firestore 저장 ───────────────────────────
export async function saveInvestmentType(
  uid: string,
  result: InvestmentTypeResult,
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    investmentType: {
      type: result.type,
      emoji: result.emoji,
      title: result.title,
      mbtiLike: result.mbti_like,
      analyzedAt: Date.now(),
    } satisfies StoredInvestmentType,
  });
}

// ── 더미 분석 (API 없을 때) ──────────────────
function getDummyResult(answers: string[]): InvestmentTypeResult {
  // 답변 패턴으로 간단 분류
  const scores = { aggressive: 0, growth: 0, balanced: 0, stable: 0, analyst: 0, learner: 0 };

  answers.forEach((a, i) => {
    switch (i) {
      case 0: // 하락 대응
        if (a === 'C' || a === 'D') scores.aggressive += 2;
        else if (a === 'B') scores.balanced += 2;
        else scores.stable += 2;
        break;
      case 1: // 투자 목표
        if (a === 'C' || a === 'D') scores.aggressive += 2;
        else if (a === 'B') scores.growth += 2;
        else scores.stable += 2;
        break;
      case 2: // 공부량
        if (a === 'C' || a === 'D') scores.analyst += 2;
        else if (a === 'B') scores.growth += 1;
        else scores.learner += 2;
        break;
      case 3: // 집중 투자
        if (a === 'C' || a === 'D') scores.aggressive += 2;
        else if (a === 'B') scores.balanced += 1;
        else scores.stable += 2;
        break;
      case 4: // 투자 기간
        if (a === 'C' || a === 'D') scores.growth += 2;
        else if (a === 'B') scores.balanced += 1;
        else scores.aggressive += 1;
        break;
      case 5: // 손실 민감도
        if (a === 'A') scores.stable += 2;
        else if (a === 'B') scores.balanced += 1;
        else if (a === 'C') scores.growth += 1;
        else scores.aggressive += 2;
        break;
      case 6: // 종목 발굴
        if (a === 'C' || a === 'D') scores.analyst += 2;
        else if (a === 'B') scores.balanced += 1;
        else scores.stable += 1;
        break;
      case 7: // 결정 기준
        if (a === 'C') scores.analyst += 2;
        else if (a === 'D') scores.analyst += 2;
        else if (a === 'B') scores.growth += 1;
        else scores.learner += 1;
        break;
      case 8: // 급등 종목
        if (a === 'C') scores.aggressive += 2;
        else if (a === 'B') scores.balanced += 1;
        else if (a === 'D') scores.analyst += 1;
        else scores.stable += 1;
        break;
      case 9: // 투자 목적
        if (a === 'C') scores.aggressive += 2;
        else if (a === 'D') scores.learner += 2;
        else if (a === 'B') scores.growth += 1;
        else scores.balanced += 1;
        break;
    }
  });

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topType = sorted[0][0];

  const typeMap: Record<string, InvestmentTypeResult> = {
    aggressive: {
      type: '공격형',
      emoji: '🦁',
      title: '공격형 투자자',
      description: '높은 수익을 위해 과감한 투자를 즐기는 타입이에요. 리스크를 두려워하지 않고, 큰 기회를 잡으려는 성향이 강해요.',
      strengths: ['과감한 의사결정', '높은 수익 추구', '빠른 시장 대응'],
      weaknesses: ['손실 위험 과소평가', '충동적 투자 가능성'],
      strategy: 'ETF와 개별 종목을 7:3으로 섞어 포트폴리오를 구성하세요. 손절 기준을 반드시 정해두고, 한 종목에 30% 이상 투자하지 마세요.',
      recommended_stocks: ['성장주 ETF', '기술주', '바이오주'],
      mbti_like: 'ESTP형',
    },
    growth: {
      type: '성장형',
      emoji: '🐯',
      title: '성장형 투자자',
      description: '꾸준히 성장하는 기업에 투자하는 것을 선호해요. 장기적 관점에서 기업의 가치를 보고 투자하는 스타일이에요.',
      strengths: ['장기적 안목', '기업 성장성 분석력', '인내심'],
      weaknesses: ['단기 수익 기회 놓침', '변화 대응 느림'],
      strategy: '성장성이 검증된 대형 기술주와 ETF 중심으로 투자하세요. 분기별로 리밸런싱하고, 꾸준히 적립식 투자를 병행하세요.',
      recommended_stocks: ['대형 기술주', '성장주 ETF', '혁신 기업'],
      mbti_like: 'INTJ형',
    },
    balanced: {
      type: '균형형',
      emoji: '🦊',
      title: '균형형 투자자',
      description: '안정성과 수익성 사이에서 균형을 찾는 현명한 투자자예요. 분산 투자를 통해 리스크를 관리하면서도 적절한 수익을 추구해요.',
      strengths: ['균형 잡힌 포트폴리오', '리스크 관리 능력', '유연한 대응'],
      weaknesses: ['큰 수익 기회 놓칠 수 있음', '우유부단할 수 있음'],
      strategy: '주식 60%, 채권 30%, 현금 10%의 자산 배분을 기본으로 하세요. 시장 상황에 따라 비율을 조정하되, 급격한 변화는 피하세요.',
      recommended_stocks: ['배당주', '혼합 ETF', '우량주'],
      mbti_like: 'ISFJ형',
    },
    stable: {
      type: '안정형',
      emoji: '🐻',
      title: '안정형 투자자',
      description: '원금 보존을 최우선으로 생각하는 신중한 투자자예요. 안전한 자산을 선호하고, 큰 손실을 피하는 것이 가장 중요해요.',
      strengths: ['안전한 투자 성향', '감정적 투자 회피', '원금 보존력'],
      weaknesses: ['수익률이 낮을 수 있음', '인플레이션 리스크'],
      strategy: '채권과 예금 중심의 안전한 포트폴리오를 구성하세요. 주식 투자는 대형 우량주 위주로 소액부터 시작하세요.',
      recommended_stocks: ['국채 ETF', '배당 우량주', '예금형 상품'],
      mbti_like: 'ISTJ형',
    },
    analyst: {
      type: '분석형',
      emoji: '🦅',
      title: '분석형 투자자',
      description: '데이터와 분석을 기반으로 투자하는 이성적인 투자자예요. 재무제표와 차트를 꼼꼼히 분석한 후 투자 결정을 내려요.',
      strengths: ['체계적 분석력', '감정 배제 투자', '리서치 능력'],
      weaknesses: ['과도한 분석으로 타이밍 놓침', '정보 과부하'],
      strategy: 'PER, PBR 등 밸류에이션 지표를 활용해 저평가된 종목을 발굴하세요. 자신만의 투자 체크리스트를 만들어 기계적으로 판단하세요.',
      recommended_stocks: ['가치주', '저평가 대형주', '섹터 ETF'],
      mbti_like: 'INTP형',
    },
    learner: {
      type: '학습형',
      emoji: '🦋',
      title: '학습형 투자자',
      description: '투자를 통해 경제와 금융을 배우고 싶은 탐구형 투자자예요. 수익보다는 경험과 지식을 쌓는 것에 큰 가치를 두고 있어요.',
      strengths: ['학습 의지', '다양한 경험 추구', '겸손한 투자 태도'],
      weaknesses: ['확신 부족', '의존적 판단 가능성'],
      strategy: '소액으로 다양한 종목에 투자하며 실전 경험을 쌓으세요. 모의투자를 적극 활용하고, 투자 일지를 작성해 복기하세요.',
      recommended_stocks: ['인덱스 ETF', '대형 우량주', '교육 콘텐츠'],
      mbti_like: 'ENFP형',
    },
  };

  return typeMap[topType] ?? typeMap.balanced;
}
