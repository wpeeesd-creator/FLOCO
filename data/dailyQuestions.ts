/**
 * 오늘의 질문 — 머니몽이 묻는 하루 1문제 금융 퀴즈
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
