/**
 * 오늘의 질문 — 주니몽이 묻는 하루 1문제 금융 퀴즈
 * 날짜 기반 순환 (dayIndex % length)
 */

export type DailyQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  floReward: number;
};

export const DAILY_QUESTIONS: DailyQuestion[] = [
  {
    id: 'dq_01',
    question: '주식의 PER(주가수익비율)이 낮을수록 무엇을 의미해?',
    options: ['주가가 이익 대비 저평가', '회사가 적자', '배당금이 높음', '부채가 많음'],
    correctIndex: 0,
    explanation: 'PER = 주가 ÷ EPS(주당순이익). 낮을수록 이익 대비 주가가 싸다는 뜻이야! 단, 업종마다 기준이 달라 비교할 땐 같은 업종끼리 봐야 해.',
    floReward: 15,
  },
  {
    id: 'dq_02',
    question: '복리(複利)란 무엇일까?',
    options: ['원금에만 이자 적용', '이자에도 이자가 붙는 것', '연 2번 이자 지급', '세금이 두 번 붙는 것'],
    correctIndex: 1,
    explanation: '복리는 원금 + 이자에 다시 이자가 붙는 마법! 72의 법칙: 72 ÷ 연이율 = 원금이 2배 되는 기간(년)이야.',
    floReward: 10,
  },
  {
    id: 'dq_03',
    question: '인플레이션이 높아지면 일반적으로 어떻게 될까?',
    options: ['화폐 가치 상승', '금리 인하', '화폐 가치 하락', '주가 무조건 상승'],
    correctIndex: 2,
    explanation: '인플레이션 = 물가 상승 = 화폐 가치 하락. 같은 돈으로 살 수 있는 것이 줄어드는 거야. 그래서 중앙은행은 인플레이션을 잡으려 금리를 올려!',
    floReward: 10,
  },
  {
    id: 'dq_04',
    question: '분산투자(Diversification)의 핵심 목적은?',
    options: ['수익 극대화', '리스크 분산', '거래 비용 절감', '세금 절약'],
    correctIndex: 1,
    explanation: '"계란을 한 바구니에 담지 마라!" 여러 자산에 나눠 투자하면 한 종목이 폭락해도 전체 손실을 줄일 수 있어.',
    floReward: 10,
  },
  {
    id: 'dq_05',
    question: 'ETF(상장지수펀드)의 특징으로 맞지 않는 것은?',
    options: ['주식처럼 실시간 매매 가능', '여러 종목에 분산투자', '반드시 원금 보장', '운용 수수료가 낮음'],
    correctIndex: 2,
    explanation: 'ETF는 원금을 보장하지 않아! 주가가 떨어지면 손실이 날 수 있어. 하지만 분산투자 효과와 낮은 수수료가 장점이야.',
    floReward: 15,
  },
  {
    id: 'dq_06',
    question: '채권과 금리의 관계로 옳은 것은?',
    options: ['금리 상승 → 채권 가격 상승', '금리 하락 → 채권 가격 하락', '금리 상승 → 채권 가격 하락', '금리와 채권은 무관'],
    correctIndex: 2,
    explanation: '채권 가격과 금리는 시소 관계! 금리가 오르면 기존 채권의 낮은 이자가 매력 없어져서 가격이 떨어져. 반대로 금리가 내리면 채권 가격이 올라.',
    floReward: 20,
  },
  {
    id: 'dq_07',
    question: '코스피(KOSPI)는 무엇을 나타내?',
    options: ['미국 주요 500개 기업 지수', '한국 코스닥 기술주 지수', '한국 유가증권시장 종합주가지수', '일본 닛케이 지수'],
    correctIndex: 2,
    explanation: 'KOSPI = Korea Composite Stock Price Index. 한국 유가증권시장(KRX)에 상장된 모든 종목의 시가총액을 기준으로 계산해!',
    floReward: 10,
  },
  {
    id: 'dq_08',
    question: '배당주 투자의 주요 장점은?',
    options: ['단기 시세차익 극대화', '정기적인 현금 배당 수익', '원금 보장', '세금 면제'],
    correctIndex: 1,
    explanation: '배당주는 회사가 이익의 일부를 주주에게 현금으로 나눠주는 거야. 주가가 크게 오르지 않아도 배당 수익으로 꾸준한 현금 흐름을 만들 수 있어!',
    floReward: 10,
  },
  {
    id: 'dq_09',
    question: '달러 강세(원화 약세)일 때 유리한 것은?',
    options: ['수입 기업', '해외여행', '달러 자산 보유자', '국내 소비재 기업'],
    correctIndex: 2,
    explanation: '달러가 강해지면(원/달러 환율 상승) 달러 자산의 원화 환산 가치가 올라가! 반면 수입 원가가 올라 수입 기업엔 불리하고, 수출 기업엔 유리해.',
    floReward: 15,
  },
  {
    id: 'dq_10',
    question: '시가총액(Market Cap)이란?',
    options: ['하루 거래 금액', '주가 × 발행 주식 수', '연간 순이익', '총 자산에서 부채를 뺀 값'],
    correctIndex: 1,
    explanation: '시가총액 = 주가 × 총 발행 주식 수. 회사의 시장 가치를 나타내! 삼성전자 시가총액이 400조라면 시장이 그만큼의 가치를 인정한다는 뜻이야.',
    floReward: 10,
  },
];

/** 오늘의 질문 반환 (날짜 기반 순환) */
export function getTodayQuestion(): DailyQuestion {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return DAILY_QUESTIONS[dayIndex % DAILY_QUESTIONS.length];
}

/** 오늘 질문의 completedEvents 키 */
export function getTodayQuestionKey(): string {
  return `dq_${getTodayQuestion().id}_${new Date().toDateString()}`;
}

// ── 데일리 OX 5문제 ─────────────────────────────────
// 매일 5문제 풀고 정답 수 × 1,000원 보상.
// 풀이 가능 여부는 users/{uid}/learning/data.dailyQuiz.lastDate 비교.

export type DailyOXQuestion = {
  id: string;
  question: string;
  answer: 'O' | 'X';
  explanation: string;
};

export const DAILY_OX_POOL: DailyOXQuestion[] = [
  { id: 'ox_01', question: '주식을 사면 그 회사의 일부를 소유하는 거야.', answer: 'O', explanation: '주식 1주 = 회사 소유권의 작은 한 조각이야!' },
  { id: 'ox_02', question: 'PER이 높을수록 항상 좋은 주식이야.', answer: 'X', explanation: 'PER이 높으면 이익 대비 비싸다는 뜻. 성장 기대가 큰 경우도 있지만 무조건 좋다는 X.' },
  { id: 'ox_03', question: '한국 주식은 하루에 ±30%까지만 움직일 수 있어.', answer: 'O', explanation: '한국은 상하한가 ±30%로 제한돼. 미국은 제한 없음!' },
  { id: 'ox_04', question: '배당금은 회사가 손실 나도 무조건 줘야 해.', answer: 'X', explanation: '배당은 회사가 이익 났을 때 주주에게 나눠주는 거. 의무 X.' },
  { id: 'ox_05', question: '코스피는 한국 대형주 중심, 코스닥은 중소·벤처기업 중심이야.', answer: 'O', explanation: '맞아! 삼성전자/현대차는 코스피, 카카오게임즈/펄어비스 등은 코스닥.' },
  { id: 'ox_06', question: '한 종목에 전 재산 다 넣는 게 안전한 투자야.', answer: 'X', explanation: '"계란을 한 바구니에 담지 마라"! 분산 투자가 안전해.' },
  { id: 'ox_07', question: '금리가 오르면 일반적으로 주가는 하락 압력을 받아.', answer: 'O', explanation: '금리 ↑ → 채권 매력 ↑, 기업 차입비용 ↑, 미래이익 할인율 ↑ → 주가 ↓ 경향.' },
  { id: 'ox_08', question: 'ETF는 원금 보장 상품이야.', answer: 'X', explanation: 'ETF도 주식처럼 가격이 떨어지면 손실 봐. 원금 보장 X.' },
  { id: 'ox_09', question: '시가는 하루 거래의 첫 가격, 종가는 마지막 가격이야.', answer: 'O', explanation: '시가/종가 정의 정확해!' },
  { id: 'ox_10', question: '거래량이 많다는 것은 그 종목에 관심이 적다는 뜻이야.', answer: 'X', explanation: '반대! 거래량 많음 = 사고파는 사람 많음 = 관심 ↑.' },
  { id: 'ox_11', question: '손절은 손실을 감수하고 매도하는 거야.', answer: 'O', explanation: '미리 정한 손절선에서 빠지는 게 리스크 관리의 기본!' },
  { id: 'ox_12', question: '美 달러 강세는 한국 수출 기업에 무조건 악재야.', answer: 'X', explanation: '오히려 호재일 수 있어! 같은 달러 매출이 더 많은 원화로 환산되거든.' },
  { id: 'ox_13', question: '복리는 이자에도 이자가 붙는 마법이야.', answer: 'O', explanation: '72의 법칙: 72 ÷ 연이율 = 원금 2배 되는 기간(년)!' },
  { id: 'ox_14', question: '인플레이션이 심하면 현금의 실질 가치는 올라가.', answer: 'X', explanation: '반대! 물가 ↑ = 같은 돈으로 살 수 있는 것 ↓ = 현금 가치 ↓.' },
  { id: 'ox_15', question: '주식 분할은 1주를 여러 주로 나누는 거야.', answer: 'O', explanation: '100만원 주식을 10:1 분할하면 10만원짜리 10주가 돼. 총 가치는 같음.' },
];

/** 오늘의 OX 5문제 (날짜 기반 순환) */
export function getTodayOXQuestions(): DailyOXQuestion[] {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const start = (dayIndex * 5) % DAILY_OX_POOL.length;
  const result: DailyOXQuestion[] = [];
  for (let i = 0; i < 5; i++) {
    result.push(DAILY_OX_POOL[(start + i) % DAILY_OX_POOL.length]);
  }
  return result;
}
