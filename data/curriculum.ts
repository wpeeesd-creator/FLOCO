/**
 * 8주 투자 커리큘럼 — 기초(1~4주) + 심화(5~8주)
 * 40일 × 레슨 4~7개 + 퀴즈 5~15개
 */

// ── 타입 ──────────────────────────────────────────

export type QuizType = 'multiple_choice' | 'connect_match' | 'calculation';

export interface LearnCard {
  type: 'learn';
  emoji: string;
  title: string;
  content: string;
}

export interface MCQuiz {
  type: 'multiple_choice';
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface MatchQuiz {
  type: 'connect_match';
  question: string;
  pairs: Array<{ term: string; definition: string }>;
}

export interface CalcQuiz {
  type: 'calculation';
  question: string;
  options: string[];
  answer: number;
  formula: string;
}

export type CurriculumItem = LearnCard | MCQuiz | MatchQuiz | CalcQuiz;

export interface CurriculumDay {
  day: number;
  title: string;
  items: CurriculumItem[];
  xp: number;
}

export interface CurriculumWeek {
  week: number;
  title: string;
  level: 'basic' | 'advanced';
  color: string;
  emoji: string;
  days: CurriculumDay[];
}

// ── 레벨 시스템 ──────────────────────────────────

export const LEVELS = [
  { level: 1, name: '주린이',          minXp: 0,    maxXp: 200,   emoji: '🐣' },
  { level: 2, name: '투자 입문자',     minXp: 200,  maxXp: 500,   emoji: '📚' },
  { level: 3, name: '시장 탐험가',     minXp: 500,  maxXp: 1000,  emoji: '🧭' },
  { level: 4, name: '차트 분석가',     minXp: 1000, maxXp: 2000,  emoji: '📊' },
  { level: 5, name: '가치 투자자',     minXp: 2000, maxXp: 3500,  emoji: '💎' },
  { level: 6, name: '포트폴리오 매니저', minXp: 3500, maxXp: 5500, emoji: '🏦' },
  { level: 7, name: '펀드매니저',      minXp: 5500, maxXp: 8000,  emoji: '🎯' },
  { level: 8, name: '워런 버핏',       minXp: 8000, maxXp: 99999, emoji: '👑' },
];

export function getLevelInfo(xp: number) {
  const lv = LEVELS.find(l => xp >= l.minXp && xp < l.maxXp) ?? LEVELS[LEVELS.length - 1];
  const progress = (xp - lv.minXp) / (lv.maxXp - lv.minXp);
  return { ...lv, progress: Math.min(progress, 1) };
}

// ── 칭찬 메시지 ──────────────────────────────────

export const PRAISE_MESSAGES = {
  streak3: '완벽해요! 🔥',
  wrong: '아깝다! 다시 해볼까요?',
  dayComplete: '오늘도 해냈어요!',
  weekComplete: '주차 완료! 배지 획득 🏆',
  halfWay: '절반 왔어요! 💪',
};

// ══════════════════════════════════════════════════
//  기초 과정 (1~4주)
// ══════════════════════════════════════════════════

const week1: CurriculumWeek = {
  week: 1, title: '주식 투자 첫걸음', level: 'basic', color: '#3B82F6', emoji: '📘',
  days: [
    { day: 1, title: '주식이란 무엇인가', xp: 50, items: [
      { type: 'learn', emoji: '📜', title: '주식의 탄생', content: '주식은 기업의 소유권을 나타내는 증서입니다. 주식을 보유하면 그 기업의 주주(소유자)가 되어 회사의 성장에 동참할 수 있습니다.' },
      { type: 'learn', emoji: '🏢', title: '주주의 권리', content: '주주가 되면 배당금(이익 분배)을 받을 수 있고, 주주총회에서 의결권을 행사할 수 있습니다. 기업이 성장하면 주가도 올라갑니다.' },
      { type: 'multiple_choice', question: '주식을 보유하면 얻는 권리가 아닌 것은?', options: ['배당금 수령', '의결권 행사', '회사 임원 자동 취임', '주가 상승 시 차익'], answer: 2, explanation: '주식 보유만으로 임원이 되지는 않습니다. 배당금, 의결권, 시세차익이 주주의 기본 권리입니다.' },
      { type: 'learn', emoji: '🏛️', title: '증권거래소', content: '주식은 증권거래소에서 사고팝니다. 한국에는 코스피(KOSPI)와 코스닥(KOSDAQ), 미국에는 뉴욕증권거래소(NYSE)와 나스닥(NASDAQ)이 있습니다.' },
      { type: 'learn', emoji: '⏰', title: '거래시간', content: '한국: 오전 9시~오후 3시 30분, 미국: 오후 11시 30분~오전 6시(한국 시간). 각 시장마다 거래시간이 다릅니다.' },
      { type: 'multiple_choice', question: '한국 주식시장의 정규 거래시간은?', options: ['오전 8시~오후 2시', '오전 9시~오후 3시 30분', '오전 10시~오후 4시', '24시간'], answer: 1, explanation: '한국 주식시장(코스피/코스닥)은 오전 9시에 개장하고 오후 3시 30분에 마감합니다.' },
      { type: 'multiple_choice', question: '코스피에 상장된 대표 기업은?', options: ['삼성전자', '카카오게임즈', '에코프로', '크래프톤'], answer: 0, explanation: '삼성전자는 코스피 시가총액 1위 기업입니다. 카카오게임즈, 에코프로, 크래프톤은 코스닥 종목입니다.' },
      { type: 'connect_match', question: '시장과 설명을 연결하세요', pairs: [
        { term: 'KOSPI', definition: '한국 대형주 시장' },
        { term: 'KOSDAQ', definition: '한국 중소·벤처 시장' },
        { term: 'NYSE', definition: '미국 뉴욕증권거래소' },
        { term: 'NASDAQ', definition: '미국 기술주 중심 시장' },
      ]},
      { type: 'multiple_choice', question: '다음 중 "시가총액"의 올바른 정의는?', options: ['하루 거래된 총 금액', '주가 × 발행주식수', '기업의 매출액 합계', '주가의 52주 평균'], answer: 1, explanation: '시가총액 = 주가 × 발행주식수입니다. 기업의 전체 가치를 나타내는 지표입니다.' },
    ]},
    { day: 2, title: '주가는 왜 움직이나', xp: 50, items: [
      { type: 'learn', emoji: '⚖️', title: '수요와 공급', content: '주가는 사려는 사람(수요)과 팔려는 사람(공급)의 균형으로 결정됩니다. 사려는 사람이 많으면 주가가 오르고, 팔려는 사람이 많으면 내립니다.' },
      { type: 'learn', emoji: '📰', title: '뉴스의 영향', content: '좋은 뉴스(호재)가 나오면 매수세가 강해져 주가가 오르고, 나쁜 뉴스(악재)가 나오면 매도세가 강해져 주가가 내립니다.' },
      { type: 'multiple_choice', question: '주가가 상승하는 근본적인 이유는?', options: ['정부의 명령', '수요가 공급보다 많아서', '기업이 직접 올려서', '증권사의 결정'], answer: 1, explanation: '주가는 시장에서 자유롭게 결정됩니다. 사려는 사람(수요)이 팔려는 사람(공급)보다 많으면 주가가 오릅니다.' },
      { type: 'learn', emoji: '💰', title: '실적의 중요성', content: '기업의 매출과 이익이 증가하면 주가가 오르는 경향이 있습니다. 반대로 실적이 나빠지면 주가가 하락합니다. 분기별 실적 발표를 주목하세요.' },
      { type: 'learn', emoji: '🌍', title: '거시경제 영향', content: '금리, 환율, 물가 등 거시경제 지표도 주가에 영향을 줍니다. 예를 들어 금리가 오르면 기업의 대출 비용이 증가해 주가에 부정적입니다.' },
      { type: 'multiple_choice', question: '금리가 오르면 주식시장에 미치는 일반적인 영향은?', options: ['주가 상승', '주가 하락', '아무 영향 없음', '거래량만 증가'], answer: 1, explanation: '금리가 오르면 예금 매력이 높아지고, 기업의 이자 비용이 늘어 주가에 부정적입니다.' },
      { type: 'connect_match', question: '용어와 뜻을 연결하세요', pairs: [
        { term: '호재', definition: '주가에 긍정적인 뉴스' },
        { term: '악재', definition: '주가에 부정적인 뉴스' },
        { term: '상한가', definition: '하루 최대 상승폭(30%)' },
        { term: '하한가', definition: '하루 최대 하락폭(30%)' },
      ]},
      { type: 'multiple_choice', question: '기업의 분기별 실적이 예상보다 좋으면?', options: ['무조건 주가 하락', '일반적으로 주가 상승', '주가에 영향 없음', '거래 정지'], answer: 1, explanation: '실적이 시장 예상(컨센서스)을 넘으면 "어닝 서프라이즈"라고 하며 주가가 상승하는 경향이 있습니다.' },
      { type: 'multiple_choice', question: '주가에 영향을 주지 않는 것은?', options: ['기업 실적 발표', '중앙은행 금리 결정', '대표이사 취미 생활', '환율 급변동'], answer: 2, explanation: '대표이사의 개인 취미는 주가에 직접 영향을 주지 않습니다. 실적, 금리, 환율 등은 모두 중요한 영향 요인입니다.' },
    ]},
    { day: 3, title: '시장의 종류', xp: 50, items: [
      { type: 'learn', emoji: '🇰🇷', title: '한국 주식시장', content: '코스피(KOSPI)는 대형 우량기업 중심, 코스닥(KOSDAQ)은 중소·벤처기업 중심 시장입니다. 삼성전자, 현대차는 코스피, 카카오게임즈, 에코프로는 코스닥에 상장되어 있습니다.' },
      { type: 'learn', emoji: '🇺🇸', title: '미국 주식시장', content: 'NYSE(뉴욕증권거래소)는 세계 최대 거래소, NASDAQ은 기술주 중심입니다. 애플, 구글, 테슬라 등이 미국 시장에 상장되어 있습니다.' },
      { type: 'learn', emoji: '📊', title: 'ETF란', content: 'ETF는 주식처럼 거래되는 펀드입니다. S&P 500 ETF(SPY)를 사면 미국 500대 기업에 한꺼번에 투자하는 효과가 있습니다.' },
      { type: 'multiple_choice', question: 'ETF의 장점이 아닌 것은?', options: ['분산투자 효과', '낮은 운용보수', '개별 종목보다 항상 높은 수익', '실시간 매매 가능'], answer: 2, explanation: 'ETF는 분산투자와 편리성이 장점이지만, 개별 종목보다 항상 높은 수익을 보장하지는 않습니다.' },
      { type: 'learn', emoji: '💱', title: '해외 투자 시 환율', content: '미국 주식에 투자하려면 원화를 달러로 환전해야 합니다. 환율이 1,300원일 때 $100 주식을 사면 13만원이 필요합니다.' },
      { type: 'multiple_choice', question: '원/달러 환율이 1,200원에서 1,400원으로 올랐을 때, 미국 주식 투자자에게 미치는 영향은?', options: ['원화 기준 손실', '원화 기준 추가 이익', '아무 영향 없음', '주식 자동 매도'], answer: 1, explanation: '환율이 오르면(원화 약세) 같은 달러 자산의 원화 가치가 올라 환차익이 발생합니다.' },
      { type: 'connect_match', question: '시장과 대표 종목을 연결하세요', pairs: [
        { term: '코스피', definition: '삼성전자, 현대차' },
        { term: '코스닥', definition: '에코프로, 크래프톤' },
        { term: 'NYSE', definition: '버크셔, JPMorgan' },
        { term: 'NASDAQ', definition: '애플, 테슬라' },
      ]},
      { type: 'multiple_choice', question: 'S&P 500 지수란?', options: ['한국 500대 기업 지수', '미국 500대 기업 지수', '세계 500대 기업 지수', '기술주 500개 지수'], answer: 1, explanation: 'S&P 500은 미국 시가총액 상위 500대 기업으로 구성된 대표 지수입니다.' },
      { type: 'multiple_choice', question: '코스닥 시장의 특징은?', options: ['대형 우량주 중심', '중소·벤처기업 중심', '해외 기업만 상장', '파생상품만 거래'], answer: 1, explanation: '코스닥(KOSDAQ)은 기술 중심의 중소·벤처기업이 주로 상장된 시장입니다.' },
    ]},
    { day: 4, title: '매수와 매도', xp: 50, items: [
      { type: 'learn', emoji: '🛒', title: '매수란', content: '매수는 주식을 사는 것입니다. "이 기업이 성장할 것"이라고 판단하면 매수합니다. 시장가 주문은 현재 가격으로 즉시, 지정가 주문은 원하는 가격에 맞춰 체결됩니다.' },
      { type: 'learn', emoji: '💸', title: '매도란', content: '매도는 주식을 파는 것입니다. 목표 수익에 도달하거나, 기업 가치가 떨어졌다고 판단하면 매도합니다.' },
      { type: 'learn', emoji: '📋', title: '주문 유형', content: '시장가 주문: 현재 가격으로 즉시 체결. 지정가 주문: 원하는 가격을 지정해서 그 가격이 되면 체결. 초보자는 지정가 주문을 추천합니다.' },
      { type: 'multiple_choice', question: '지정가 주문의 특징은?', options: ['현재 가격으로 즉시 체결', '원하는 가격에 도달해야 체결', '다음 날에만 체결', '관리자 승인 후 체결'], answer: 1, explanation: '지정가 주문은 투자자가 원하는 가격을 지정하고, 시장 가격이 해당 가격에 도달하면 체결됩니다.' },
      { type: 'learn', emoji: '💰', title: '수수료와 세금', content: '주식 거래 시 증권사 수수료(약 0.01~0.3%)와 매도 시 세금(증권거래세 0.23%)이 붙습니다. 수수료를 고려해 매매 전략을 세워야 합니다.' },
      { type: 'multiple_choice', question: '주식 매도 시 부과되는 세금은?', options: ['부가가치세', '증권거래세', '소득세만', '세금 없음'], answer: 1, explanation: '한국 주식 매도 시 증권거래세(코스피 0.03% + 농특세 0.15%, 코스닥 0.23%)가 부과됩니다.' },
      { type: 'multiple_choice', question: '잦은 매매의 단점은?', options: ['수수료/세금 누적', '경험이 쌓임', '포트폴리오 분산', '수익률 상승'], answer: 0, explanation: '잦은 매매는 수수료와 세금이 누적되어 순수익을 줄입니다. 신중한 매매가 중요합니다.' },
      { type: 'connect_match', question: '주문 유형을 연결하세요', pairs: [
        { term: '시장가 주문', definition: '현재 가격으로 즉시 체결' },
        { term: '지정가 주문', definition: '원하는 가격 도달 시 체결' },
        { term: '손절 주문', definition: '일정 손실 시 자동 매도' },
        { term: '예약 주문', definition: '시간 외 미리 주문 설정' },
      ]},
      { type: 'multiple_choice', question: '초보 투자자에게 추천하는 주문 방식은?', options: ['시장가 주문', '지정가 주문', '공매도', '레버리지'], answer: 1, explanation: '지정가 주문은 원하는 가격에 매수/매도할 수 있어 초보자가 가격 관리를 하기 좋습니다.' },
    ]},
    { day: 5, title: '수익률 계산', xp: 60, items: [
      { type: 'learn', emoji: '📐', title: '수익률 공식', content: '수익률 = (매도가 - 매수가) / 매수가 × 100%. 10,000원에 사서 12,000원에 팔면 수익률은 (12000-10000)/10000 × 100 = 20%입니다.' },
      { type: 'calculation', question: '10,000원에 매수, 13,000원에 매도한 수익률은?', options: ['20%', '25%', '30%', '35%'], answer: 2, formula: '(13,000 - 10,000) / 10,000 × 100 = 30%' },
      { type: 'learn', emoji: '📊', title: '복리의 마법', content: '복리는 이자에 이자가 붙는 것입니다. 연 10% 수익이면 7.2년 후 원금이 2배(72의 법칙). 장기투자의 핵심입니다.' },
      { type: 'calculation', question: '100만원을 연 10% 복리로 2년 투자하면?', options: ['110만원', '120만원', '121만원', '130만원'], answer: 2, formula: '100만 × 1.1 × 1.1 = 121만원 (복리 효과로 단리 120만보다 1만원 더)' },
      { type: 'learn', emoji: '⚠️', title: '손실의 비대칭성', content: '50% 손실 후 원금 회복하려면 100% 수익이 필요합니다. 100만원 → 50만원(-50%) → 다시 100만원(+100%). 손실 관리가 중요한 이유입니다.' },
      { type: 'calculation', question: '주가가 50% 하락 후 원금을 회복하려면 필요한 수익률은?', options: ['50%', '75%', '100%', '150%'], answer: 2, formula: '50만원에서 100만원으로 = +100% 필요' },
      { type: 'multiple_choice', question: '"72의 법칙"에서 연 6% 수익률이면 원금이 2배 되는 데 걸리는 시간은?', options: ['6년', '10년', '12년', '15년'], answer: 2, explanation: '72 ÷ 6 = 12년. 72를 수익률로 나누면 원금 2배 달성 기간을 알 수 있습니다.' },
      { type: 'calculation', question: '50,000원에 매수한 주식이 현재 45,000원이면 손실률은?', options: ['-5%', '-8%', '-10%', '-15%'], answer: 2, formula: '(45,000 - 50,000) / 50,000 × 100 = -10%' },
      { type: 'connect_match', question: '개념을 연결하세요', pairs: [
        { term: '단리', definition: '원금에만 이자가 붙음' },
        { term: '복리', definition: '이자에도 이자가 붙음' },
        { term: '72의 법칙', definition: '원금 2배 기간 추정' },
        { term: '손실 비대칭', definition: '-50% 후 +100% 필요' },
      ]},
      { type: 'multiple_choice', question: '장기투자에서 가장 큰 무기는?', options: ['높은 레버리지', '복리 효과', '잦은 매매', '단타 기술'], answer: 1, explanation: '복리 효과는 시간이 지날수록 커지며, 워런 버핏도 "복리는 세계 8번째 불가사의"라고 했습니다.' },
    ]},
  ],
};

const week2: CurriculumWeek = {
  week: 2, title: '차트와 지표 기초', level: 'basic', color: '#10B981', emoji: '📊',
  days: [
    { day: 1, title: '캔들차트 읽기', xp: 60, items: [
      { type: 'learn', emoji: '🕯️', title: '캔들차트란', content: '캔들(봉)차트는 시가, 고가, 저가, 종가 4가지 가격을 하나의 봉으로 표현합니다. 양봉(빨간색)은 상승, 음봉(파란색)은 하락을 의미합니다.' },
      { type: 'learn', emoji: '📈', title: '양봉과 음봉', content: '양봉: 시가 < 종가 (상승 마감). 음봉: 시가 > 종가 (하락 마감). 봉의 몸통이 길수록 변동폭이 큽니다.' },
      { type: 'learn', emoji: '📏', title: '꼬리(위꼬리/아래꼬리)', content: '위꼬리: 장중 고가까지 올랐다가 내려옴 (매도 압력). 아래꼬리: 장중 저가까지 내렸다가 올라옴 (매수 압력).' },
      { type: 'multiple_choice', question: '긴 아래꼬리가 있는 양봉의 의미는?', options: ['강한 매도 압력', '매수세가 밀어올림', '거래량 급감', '시장 마감'], answer: 1, explanation: '긴 아래꼬리는 장중 하락했지만 매수세가 강해 다시 올렸다는 의미로 "망치형(해머)"이라 합니다.' },
      { type: 'multiple_choice', question: '양봉에서 "몸통"이 나타내는 것은?', options: ['시가와 종가의 차이', '거래량', '배당금', '시가총액'], answer: 0, explanation: '양봉의 몸통은 시가(아래)~종가(위) 구간으로, 실제 가격 상승폭을 나타냅니다.' },
      { type: 'connect_match', question: '캔들 패턴을 연결하세요', pairs: [
        { term: '장대양봉', definition: '강한 상승세' },
        { term: '장대음봉', definition: '강한 하락세' },
        { term: '십자형(도지)', definition: '매수/매도 팽팽' },
        { term: '망치형', definition: '반등 가능 신호' },
      ]},
    ]},
    { day: 2, title: '거래량의 의미', xp: 60, items: [
      { type: 'learn', emoji: '📊', title: '거래량이란', content: '거래량은 일정 기간 동안 매매된 주식 수입니다. 거래량이 많으면 관심이 높다는 뜻이고, 적으면 관심이 낮다는 뜻입니다.' },
      { type: 'learn', emoji: '🔍', title: '거래량과 주가', content: '주가 상승 + 거래량 증가 = 강한 상승. 주가 상승 + 거래량 감소 = 약한 상승(곧 반전 가능). 거래량은 "주가의 체온계"입니다.' },
      { type: 'multiple_choice', question: '주가가 오르는데 거래량이 줄어들면?', options: ['매우 긍정적', '상승세 약화 신호', '무조건 더 오름', '아무 의미 없음'], answer: 1, explanation: '가격은 오르지만 참여자가 줄어드는 것은 상승 모멘텀이 약해지는 신호입니다.' },
      { type: 'multiple_choice', question: '폭발적 거래량 증가와 함께 급등한 종목, 다음 행동은?', options: ['바로 매수', '거래량 유지 여부 확인 후 판단', '무조건 매도', '무시'], answer: 1, explanation: '거래량 동반 급등 후에는 지속성을 확인해야 합니다. 일시적 급등 후 급락하는 경우도 많습니다.' },
      { type: 'connect_match', question: '거래량 패턴을 연결하세요', pairs: [
        { term: '거래량 급증 + 상승', definition: '강한 매수세 진입' },
        { term: '거래량 급증 + 하락', definition: '대량 투매 (패닉셀)' },
        { term: '거래량 감소 + 횡보', definition: '관심 감소, 에너지 축적' },
        { term: '거래량 점증 + 상승', definition: '건강한 상승 추세' },
      ]},
    ]},
    { day: 3, title: '이동평균선 기초', xp: 60, items: [
      { type: 'learn', emoji: '〰️', title: '이동평균선이란', content: '일정 기간의 종가 평균을 선으로 이은 것입니다. 5일선(단기), 20일선(중기), 60일선(장기), 200일선(초장기)이 대표적입니다.' },
      { type: 'learn', emoji: '✨', title: '골든크로스 & 데드크로스', content: '골든크로스: 단기 이평선이 장기 이평선을 위로 돌파 → 상승 신호. 데드크로스: 단기가 장기를 아래로 돌파 → 하락 신호.' },
      { type: 'multiple_choice', question: '5일 이동평균선이 20일 이동평균선을 위로 돌파하면?', options: ['데드크로스', '골든크로스', '하락 신호', '거래 정지'], answer: 1, explanation: '단기선이 장기선을 위로 돌파하는 것을 골든크로스라 하며 상승 전환 신호입니다.' },
      { type: 'multiple_choice', question: '200일 이동평균선의 의미는?', options: ['단기 추세', '초장기 추세 (약 1년)', '거래량 평균', '배당 주기'], answer: 1, explanation: '200일선은 약 1년(200영업일)의 추세를 보여주며 장기 투자자들이 주로 참고합니다.' },
      { type: 'connect_match', question: '이평선을 연결하세요', pairs: [
        { term: '5일선', definition: '초단기(1주) 추세' },
        { term: '20일선', definition: '단기(1개월) 추세' },
        { term: '60일선', definition: '중기(3개월) 추세' },
        { term: '200일선', definition: '장기(1년) 추세' },
      ]},
    ]},
    { day: 4, title: '지지선과 저항선', xp: 60, items: [
      { type: 'learn', emoji: '🛡️', title: '지지선이란', content: '주가가 하락하다가 반등하는 가격대입니다. 이 가격에서 매수세가 강해 "바닥"처럼 작용합니다. 지지선이 뚫리면 추가 하락 가능성이 높아집니다.' },
      { type: 'learn', emoji: '🚧', title: '저항선이란', content: '주가가 상승하다가 하락하는 가격대입니다. 이 가격에서 매도세가 강해 "천장"처럼 작용합니다. 저항선을 돌파하면 추가 상승 가능성이 높아집니다.' },
      { type: 'multiple_choice', question: '저항선을 강한 거래량으로 돌파하면?', options: ['반드시 하락', '추가 상승 가능성 높음', '아무 의미 없음', '무조건 매도'], answer: 1, explanation: '강한 거래량으로 저항선을 돌파하면 매수세가 매도세를 압도한 것으로 추가 상승 가능성이 높습니다.' },
      { type: 'multiple_choice', question: '지지선이 여러 번 테스트되면 어떻게 될까?', options: ['더 강해짐', '결국 깨질 가능성 높아짐', '아무 변화 없음', '자동 상승'], answer: 1, explanation: '지지선이 반복적으로 테스트되면 매수세가 약해져 결국 하방 돌파될 가능성이 높아집니다.' },
      { type: 'connect_match', question: '개념을 연결하세요', pairs: [
        { term: '지지선 이탈', definition: '추가 하락 경고' },
        { term: '저항선 돌파', definition: '추가 상승 기대' },
        { term: '지지선 반등', definition: '매수 기회' },
        { term: '저항선 되돌림', definition: '매도 고려' },
      ]},
    ]},
    { day: 5, title: '주간 복습 퀴즈', xp: 100, items: [
      { type: 'multiple_choice', question: '캔들차트에서 양봉의 의미는?', options: ['하락 마감', '상승 마감', '변동 없음', '거래 없음'], answer: 1, explanation: '양봉은 시가보다 종가가 높은 것으로 상승 마감을 의미합니다.' },
      { type: 'multiple_choice', question: '골든크로스란?', options: ['장기선이 단기선 돌파', '단기선이 장기선 위로 돌파', '거래량 폭발', '배당 지급일'], answer: 1, explanation: '단기 이평선이 장기 이평선을 위로 돌파하는 것입니다.' },
      { type: 'calculation', question: '20,000원에 매수, 현재 24,000원이면 수익률은?', options: ['10%', '15%', '20%', '25%'], answer: 2, formula: '(24,000-20,000)/20,000 × 100 = 20%' },
      { type: 'multiple_choice', question: '거래량 없이 주가가 오르면?', options: ['강한 상승', '약한 상승 (지속성 의문)', '정상적', '매도 신호'], answer: 1, explanation: '거래량 없는 상승은 참여자가 적어 지속성이 의문시됩니다.' },
      { type: 'multiple_choice', question: 'ETF의 가장 큰 장점은?', options: ['무조건 수익', '분산투자 효과', '세금 면제', '레버리지'], answer: 1, explanation: 'ETF는 여러 종목에 한번에 투자하는 분산투자 효과가 가장 큰 장점입니다.' },
      { type: 'connect_match', question: '1~2주차 핵심 용어를 연결하세요', pairs: [
        { term: '시가총액', definition: '주가 × 발행주식수' },
        { term: '이동평균선', definition: '일정 기간 종가의 평균' },
        { term: '지지선', definition: '하락을 막는 가격대' },
        { term: '저항선', definition: '상승을 막는 가격대' },
      ]},
      { type: 'calculation', question: '100만원 연 8% 복리, 72의 법칙으로 2배 걸리는 시간?', options: ['7년', '8년', '9년', '10년'], answer: 2, formula: '72 ÷ 8 = 9년' },
      { type: 'multiple_choice', question: '증권거래세는 언제 부과되나?', options: ['매수 시', '매도 시', '매수+매도 모두', '연 1회'], answer: 1, explanation: '증권거래세는 매도(주식을 팔 때)할 때만 부과됩니다.' },
    ]},
  ],
};

const week3: CurriculumWeek = {
  week: 3, title: '종목 고르기', level: 'basic', color: '#F59E0B', emoji: '🎯',
  days: [
    { day: 1, title: '섹터와 업종 이해', xp: 70, items: [
      { type: 'learn', emoji: '🏭', title: '섹터란', content: '산업을 큰 분류로 나눈 것입니다. 기술, 금융, 헬스케어, 에너지, 소비재 등이 대표적입니다. 같은 섹터 종목은 비슷한 요인에 영향받습니다.' },
      { type: 'learn', emoji: '🔄', title: '섹터 로테이션', content: '경기 순환에 따라 주도 섹터가 바뀝니다. 경기 회복기에는 기술/소비재, 침체기에는 유틸리티/헬스케어가 강세입니다.' },
      { type: 'multiple_choice', question: '경기 침체기에 상대적으로 강한 섹터는?', options: ['기술주', '여행/레저', '유틸리티/헬스케어', '건설'], answer: 2, explanation: '유틸리티(전기/가스)와 헬스케어는 경기에 관계없이 수요가 안정적이라 침체기 방어주로 불립니다.' },
      { type: 'multiple_choice', question: 'AI 반도체 붐의 최대 수혜 섹터는?', options: ['에너지', '기술(반도체)', '금융', '부동산'], answer: 1, explanation: 'AI 발전은 반도체 수요를 폭발적으로 늘려 NVIDIA, AMD 등 기술/반도체 섹터가 최대 수혜입니다.' },
      { type: 'connect_match', question: '섹터와 대표 기업을 연결하세요', pairs: [
        { term: '기술', definition: '삼성전자, 애플' },
        { term: '금융', definition: 'JPMorgan, KB금융' },
        { term: '헬스케어', definition: '셀트리온, 화이자' },
        { term: '에너지', definition: '엑슨모빌, SK이노' },
      ]},
    ]},
    { day: 2, title: '대형주 vs 소형주', xp: 70, items: [
      { type: 'learn', emoji: '🏢', title: '대형주', content: '시가총액 상위 기업. 안정적이지만 성장성은 상대적으로 낮음. 삼성전자, 애플, 마이크로소프트 등.' },
      { type: 'learn', emoji: '🌱', title: '소형주', content: '시가총액이 작은 기업. 변동성이 크지만 성장 잠재력 높음. 급등 가능성도 있지만 급락 위험도 큼.' },
      { type: 'multiple_choice', question: '초보 투자자에게 먼저 추천하는 것은?', options: ['소형 급등주', '대형 우량주', '비상장 주식', '선물/옵션'], answer: 1, explanation: '대형 우량주는 안정적이고 정보 접근성이 좋아 초보자 학습에 적합합니다.' },
      { type: 'multiple_choice', question: '소형주의 리스크가 아닌 것은?', options: ['유동성 부족', '정보 비대칭', '거래량 항상 풍부', '변동성 높음'], answer: 2, explanation: '소형주는 거래량이 적어 원하는 가격에 사고팔기 어려울 수 있습니다.' },
      { type: 'connect_match', question: '특성을 연결하세요', pairs: [
        { term: '대형주', definition: '안정적, 배당 가능성 높음' },
        { term: '중형주', definition: '성장+안정의 균형' },
        { term: '소형주', definition: '고성장 잠재력, 고위험' },
        { term: '초소형주', definition: '매우 높은 변동성' },
      ]},
    ]},
    { day: 3, title: '배당주 이해', xp: 70, items: [
      { type: 'learn', emoji: '💵', title: '배당이란', content: '기업이 이익의 일부를 주주에게 나눠주는 것입니다. 배당수익률 = 주당배당금 / 주가 × 100%. 연 3~5% 배당을 주는 종목은 고배당주입니다.' },
      { type: 'learn', emoji: '👑', title: '배당 귀족', content: '25년 이상 연속 배당 인상한 기업을 "배당 귀족"이라 합니다. 코카콜라(60년+), 존슨앤드존슨(60년+) 등이 대표적입니다.' },
      { type: 'calculation', question: '주가 50,000원, 주당 배당금 2,000원이면 배당수익률은?', options: ['2%', '3%', '4%', '5%'], answer: 2, formula: '2,000 / 50,000 × 100 = 4%' },
      { type: 'multiple_choice', question: '배당락일에 주가는 보통?', options: ['상승', '배당금만큼 하락', '변동 없음', '거래 정지'], answer: 1, explanation: '배당락일에는 배당금만큼 주가가 조정(하락)됩니다. 이를 "배당 갭다운"이라 합니다.' },
      { type: 'multiple_choice', question: '배당투자의 핵심 장점은?', options: ['단기 급등', '안정적 현금흐름', '레버리지 효과', '세금 면제'], answer: 1, explanation: '배당투자는 주가 변동과 별개로 정기적 현금흐름을 제공하는 것이 핵심 장점입니다.' },
    ]},
    { day: 4, title: '성장주 vs 가치주', xp: 70, items: [
      { type: 'learn', emoji: '🚀', title: '성장주', content: '매출/이익이 빠르게 성장하는 기업. PER이 높지만 미래 성장 기대가 높음. NVIDIA, 테슬라 등.' },
      { type: 'learn', emoji: '💎', title: '가치주', content: '현재 실적 대비 주가가 저렴한 기업. PER이 낮고 배당수익률이 높은 경우가 많음. 버핏이 선호하는 스타일.' },
      { type: 'multiple_choice', question: 'PER이 50인 기업은?', options: ['저평가 가치주', '고평가 or 고성장 기대', '파산 위험', '배당주'], answer: 1, explanation: 'PER 50은 현재 이익의 50배 가격이므로, 그만큼 미래 성장을 기대하는 것입니다. 성장주에서 흔합니다.' },
      { type: 'multiple_choice', question: '가치 투자의 핵심 원칙은?', options: ['추세 추종', '안전마진 확보 후 매수', '단기 모멘텀', '레버리지 활용'], answer: 1, explanation: '가치투자는 기업의 내재가치보다 싸게 살 수 있을 때(안전마진) 매수하는 것이 핵심입니다.' },
      { type: 'connect_match', question: '투자 스타일을 연결하세요', pairs: [
        { term: '성장투자', definition: '미래 매출/이익 성장에 베팅' },
        { term: '가치투자', definition: '현재 저평가된 종목 매수' },
        { term: '배당투자', definition: '안정적 현금흐름 추구' },
        { term: '모멘텀투자', definition: '상승 추세에 편승' },
      ]},
    ]},
    { day: 5, title: '분산투자 전략', xp: 80, items: [
      { type: 'learn', emoji: '🧺', title: '달걀을 한 바구니에 담지 마라', content: '분산투자는 여러 종목/섹터/국가에 나눠 투자해 리스크를 줄이는 전략입니다. 한 종목이 하락해도 다른 종목이 보완해줍니다.' },
      { type: 'learn', emoji: '📊', title: '포트폴리오 구성', content: '추천 구성 예시: 대형주 40% + 성장주 25% + 배당주 20% + ETF 10% + 현금 5%. 개인 성향에 맞게 조정하세요.' },
      { type: 'multiple_choice', question: '적절한 분산투자 종목 수는?', options: ['1~2개', '5~15개', '50개 이상', '100개 이상'], answer: 1, explanation: '5~15개가 적당합니다. 너무 적으면 집중 위험, 너무 많으면 관리가 어렵고 시장 수익률과 비슷해집니다.' },
      { type: 'multiple_choice', question: '모두 기술주로 10종목에 분산투자했다면?', options: ['완벽한 분산', '섹터 분산 부족', '너무 많은 종목', '최고의 전략'], answer: 1, explanation: '같은 섹터 내 분산은 진정한 분산이 아닙니다. 다른 섹터/국가에도 분산해야 합니다.' },
      { type: 'calculation', question: '포트폴리오 100만원 중 주식 70%, 현금 30%일 때 주식 평가금은?', options: ['50만원', '60만원', '70만원', '80만원'], answer: 2, formula: '100만원 × 70% = 70만원' },
      { type: 'connect_match', question: '분산 전략을 연결하세요', pairs: [
        { term: '종목 분산', definition: '여러 종목에 투자' },
        { term: '섹터 분산', definition: '여러 산업에 투자' },
        { term: '국가 분산', definition: '여러 국가에 투자' },
        { term: '시간 분산', definition: '분할매수(DCA)' },
      ]},
    ]},
  ],
};

const week4: CurriculumWeek = {
  week: 4, title: '투자 심리와 전략', level: 'basic', color: '#EF4444', emoji: '🧠',
  days: [
    { day: 1, title: '탐욕과 공포 지수', xp: 80, items: [
      { type: 'learn', emoji: '😱', title: '공포와 탐욕', content: '시장은 공포와 탐욕 두 감정에 지배됩니다. CNN Fear & Greed Index가 0이면 극도의 공포, 100이면 극도의 탐욕입니다.' },
      { type: 'learn', emoji: '🔄', title: '역발상 투자', content: '워런 버핏: "남들이 두려워할 때 탐욕스러워라, 남들이 탐욕스러울 때 두려워하라." 공포 지수가 극단적일 때 기회가 됩니다.' },
      { type: 'multiple_choice', question: '공포 지수가 10(극도의 공포)일 때 버핏의 전략은?', options: ['전량 매도', '매수 기회 탐색', '관망', '공매도'], answer: 1, explanation: '극도의 공포는 주가가 과매도되었을 가능성이 높아 가치투자자에게 매수 기회입니다.' },
      { type: 'multiple_choice', question: '개인 투자자가 흔히 빠지는 심리적 함정은?', options: ['매수 후 장기 보유', '분산투자', '고점 매수 저점 매도 (FOMO)', '적립식 투자'], answer: 2, explanation: '상승장에서 뒤늦게 매수하고(FOMO) 하락장에서 공포에 매도하는 것이 가장 흔한 실수입니다.' },
      { type: 'connect_match', question: '심리와 행동을 연결하세요', pairs: [
        { term: 'FOMO', definition: '놓칠까봐 뒤늦게 매수' },
        { term: '패닉셀', definition: '공포에 투매' },
        { term: '확증편향', definition: '내 판단에 맞는 정보만 수집' },
        { term: '앵커링', definition: '매수가에 집착' },
      ]},
    ]},
    { day: 2, title: '손절과 익절 기준', xp: 80, items: [
      { type: 'learn', emoji: '🛑', title: '손절이란', content: '손해를 보고 파는 것입니다. -5~10%를 손절 기준으로 정하고 반드시 지키는 것이 중요합니다. "계좌를 지키는 보험"입니다.' },
      { type: 'learn', emoji: '🎯', title: '익절이란', content: '수익을 확정하고 파는 것입니다. 목표가를 미리 정하거나, 추세가 꺾이면 매도합니다. 모든 수익을 다 먹으려 하면 오히려 놓칩니다.' },
      { type: 'multiple_choice', question: '손절의 가장 중요한 원칙은?', options: ['감정에 따라 유연하게', '미리 정한 기준을 반드시 실행', '절대 손절하지 않기', '남들이 팔 때 같이'], answer: 1, explanation: '사전에 정한 손절 기준을 감정 없이 실행하는 것이 핵심입니다. 미리 정하지 않으면 손실이 커집니다.' },
      { type: 'calculation', question: '10,000원에 매수, 손절 기준 -8%이면 손절가는?', options: ['9,000원', '9,200원', '9,500원', '8,000원'], answer: 1, formula: '10,000 × (1 - 0.08) = 9,200원' },
      { type: 'multiple_choice', question: '"물타기"의 위험은?', options: ['수익 극대화', '평균 매수가 하락', '손실 확대 가능성', '항상 유리함'], answer: 2, explanation: '하락 중 추가 매수(물타기)는 평단가를 낮추지만, 근본 원인이 해결되지 않으면 손실만 확대됩니다.' },
    ]},
    { day: 3, title: '분할매수 전략', xp: 80, items: [
      { type: 'learn', emoji: '📅', title: 'DCA란', content: 'Dollar Cost Averaging(정기 정액 매수). 매월 같은 금액을 투자해 평균 매수가를 낮추는 전략입니다. 타이밍을 잡지 않아도 됩니다.' },
      { type: 'learn', emoji: '📉', title: '하락장에서의 DCA', content: '하락장에서 DCA는 같은 금액으로 더 많은 주식을 살 수 있어 회복 시 수익이 극대화됩니다. 인내가 필요합니다.' },
      { type: 'calculation', question: '매월 100만원씩 3개월 투자. 주가가 10만→8만→10만이면 총 주식 수는?', options: ['28주', '30주', '32.5주', '35주'], answer: 2, formula: '10주 + 12.5주 + 10주 = 32.5주 (평균단가 약 9.23만원)' },
      { type: 'multiple_choice', question: 'DCA의 장점이 아닌 것은?', options: ['타이밍 걱정 감소', '심리적 안정', '항상 최저가 매수 보장', '장기 평균단가 하락'], answer: 2, explanation: 'DCA는 타이밍에 대한 부담을 줄여주지만 항상 최저가에 살 수 있는 것은 아닙니다.' },
    ]},
    { day: 4, title: '장기투자 마인드셋', xp: 90, items: [
      { type: 'learn', emoji: '🕰️', title: '시간의 힘', content: 'S&P 500에 20년 투자하면 손실 확률이 거의 0%입니다. 단기 변동을 견디는 인내가 장기 수익의 핵심입니다.' },
      { type: 'learn', emoji: '📖', title: '버핏의 철학', content: '버핏의 자산 99%는 50세 이후에 만들어졌습니다. "주식시장은 인내심 없는 사람에게서 인내심 있는 사람에게로 돈을 이동시키는 장치"라고 했습니다.' },
      { type: 'multiple_choice', question: 'S&P 500에 20년 이상 장기투자 시 역사적 손실 확률은?', options: ['약 30%', '약 15%', '약 5%', '거의 0%'], answer: 3, explanation: '역사적으로 S&P 500에 20년 이상 투자하면 손실을 본 적이 거의 없습니다.' },
      { type: 'multiple_choice', question: '장기투자의 최대 적은?', options: ['시장 하락', '높은 수수료', '투자자의 조급함', '인플레이션'], answer: 2, explanation: '시장 하락은 일시적이지만, 조급함에 의한 매도는 복리 효과를 끊어버립니다.' },
      { type: 'connect_match', question: '투자 격언을 완성하세요', pairs: [
        { term: '시간은 투자자의', definition: '가장 큰 무기이다' },
        { term: '주식시장은 인내심 없는 사람에게서', definition: '인내심 있는 사람에게 돈을 이동' },
        { term: '10년 보유할 주식이 아니면', definition: '10분도 보유하지 마라' },
        { term: '복리는', definition: '세계 8번째 불가사의' },
      ]},
    ]},
    { day: 5, title: '기초 과정 최종시험', xp: 150, items: [
      { type: 'multiple_choice', question: '주가 = ?', options: ['수요와 공급의 균형', '기업이 정한 가격', 'CEO 연봉', '증권사 결정'], answer: 0, explanation: '주가는 시장에서 매수(수요)와 매도(공급)의 균형으로 결정됩니다.' },
      { type: 'calculation', question: '시가총액 100조, 발행주식 10억주이면 주가는?', options: ['10만원', '100만원', '1만원', '50만원'], answer: 0, formula: '100조 ÷ 10억 = 10만원' },
      { type: 'multiple_choice', question: '데드크로스란?', options: ['단기선이 장기선 위로', '단기선이 장기선 아래로', '거래량 폭증', '배당락'], answer: 1, explanation: '단기 이평선이 장기 이평선을 아래로 돌파하는 하락 신호입니다.' },
      { type: 'multiple_choice', question: '분산투자의 핵심은?', options: ['같은 섹터에 집중', '다양한 자산/섹터에 배분', '1종목 올인', '단타 반복'], answer: 1, explanation: '종목/섹터/국가/시간을 분산해 리스크를 줄이는 것이 핵심입니다.' },
      { type: 'calculation', question: 'DCA로 매월 50만원, 주가 5만→4만→5만이면 총 보유 주식?', options: ['27.5주', '30주', '32.5주', '35주'], answer: 2, formula: '10주 + 12.5주 + 10주 = 32.5주' },
      { type: 'multiple_choice', question: '가치투자의 핵심 원칙은?', options: ['차트 추세 추종', '내재가치보다 싸게 매수', '고PER 종목 매수', '레버리지 활용'], answer: 1, explanation: '기업의 내재가치보다 주가가 낮을 때(안전마진) 매수하는 것이 가치투자입니다.' },
      { type: 'multiple_choice', question: '배당수익률 공식은?', options: ['주가÷배당금', '배당금÷주가×100', '이익÷주가', '주가÷이익'], answer: 1, explanation: '배당수익률 = 주당배당금 ÷ 주가 × 100%입니다.' },
      { type: 'connect_match', question: '기초 과정 핵심 정리', pairs: [
        { term: 'PER', definition: '주가 ÷ 주당순이익' },
        { term: '배당수익률', definition: '배당금 ÷ 주가 × 100' },
        { term: '골든크로스', definition: '단기선 → 장기선 위로' },
        { term: '안전마진', definition: '내재가치와 주가의 괴리' },
      ]},
      { type: 'multiple_choice', question: '초보 투자자에게 가장 중요한 것은?', options: ['단기 고수익', '원칙과 인내', '레버리지', '정보 독점'], answer: 1, explanation: '투자 원칙을 세우고 인내심을 가지는 것이 장기적으로 가장 중요합니다.' },
      { type: 'multiple_choice', question: '복리 효과가 극대화되려면?', options: ['잦은 매매', '장기 보유', '레버리지', '단타'], answer: 1, explanation: '복리는 시간이 지날수록 효과가 커지므로 장기 보유가 핵심입니다.' },
    ]},
  ],
};

// ── 심화 과정 (5~8주) ────────────────────────────

const week5: CurriculumWeek = {
  week: 5, title: '재무제표 완전정복', level: 'advanced', color: '#8B5CF6', emoji: '📑',
  days: [
    { day: 1, title: '손익계산서 심화', xp: 100, items: [
      { type: 'learn', emoji: '📊', title: '손익계산서 구조', content: '매출액 → 매출원가 → 매출총이익 → 판관비 → 영업이익 → 영업외손익 → 세전이익 → 법인세 → 순이익. 각 단계에서 수익성을 확인할 수 있습니다.' },
      { type: 'learn', emoji: '💰', title: '매출총이익률', content: '매출총이익률 = (매출 - 매출원가) / 매출 × 100. 원가 관리 능력을 보여줍니다. 30% 이상이면 양호, 50% 이상이면 우수합니다.' },
      { type: 'learn', emoji: '🏢', title: '영업이익률', content: '영업이익률 = 영업이익 / 매출 × 100. 본업에서의 수익성을 보여줍니다. 업종별 평균과 비교하세요.' },
      { type: 'calculation', question: '매출 1000억, 매출원가 600억, 판관비 200억이면 영업이익률은?', options: ['10%', '15%', '20%', '25%'], answer: 2, formula: '영업이익 = 1000-600-200 = 200억. 200/1000×100 = 20%' },
      { type: 'learn', emoji: '📈', title: 'YoY 성장률', content: 'Year over Year. 전년 동기 대비 성장률입니다. 매출 YoY +30%는 전년보다 30% 성장했다는 뜻입니다. 분기별 추세가 중요합니다.' },
      { type: 'multiple_choice', question: '영업이익은 좋은데 순이익이 나쁜 기업은?', options: ['사업이 잘되는 기업', '영업외 손실(이자/환손실)이 큰 기업', '분석 불가', '최고의 투자처'], answer: 1, explanation: '본업(영업이익)은 좋지만 부채 이자나 환율 손실 등 영업외 비용이 크다는 의미입니다.' },
      { type: 'multiple_choice', question: '매출은 감소하지만 영업이익률이 개선되면?', options: ['무조건 부정적', '비용 효율화 성공 신호', '데이터 오류', '분석 불가'], answer: 1, explanation: '매출 감소에도 이익률 개선은 불필요한 비용 절감, 고수익 제품 집중 등 구조조정 성공 신호일 수 있습니다.' },
      { type: 'connect_match', question: '지표를 연결하세요', pairs: [
        { term: '매출총이익률', definition: '원가 관리 능력' },
        { term: '영업이익률', definition: '본업 수익성' },
        { term: '순이익률', definition: '최종 수익성' },
        { term: 'YoY 성장률', definition: '전년 대비 성장' },
      ]},
    ]},
    { day: 2, title: '대차대조표 심화', xp: 100, items: [
      { type: 'learn', emoji: '⚖️', title: '자산 = 부채 + 자본', content: '대차대조표의 핵심 등식입니다. 자산(기업이 가진 것) = 부채(빚) + 자본(순수 주주 몫).' },
      { type: 'learn', emoji: '💳', title: '부채비율', content: '부채비율 = 부채 / 자본 × 100. 100% 이하면 양호, 200% 이상이면 재무건전성 주의. 업종별로 평균이 다릅니다.' },
      { type: 'learn', emoji: '💧', title: '유동비율', content: '유동비율 = 유동자산 / 유동부채 × 100. 200% 이상이면 양호. 100% 이하면 단기 자금 부족 위험.' },
      { type: 'calculation', question: '자본 500억, 부채 750억이면 부채비율은?', options: ['100%', '125%', '150%', '200%'], answer: 2, formula: '750/500 × 100 = 150%' },
      { type: 'multiple_choice', question: '유동비율이 80%인 기업의 리스크는?', options: ['매우 안정적', '단기 부채 상환 어려움', '과도한 현금 보유', '투자 부족'], answer: 1, explanation: '유동비율 100% 미만은 유동부채를 유동자산으로 갚지 못해 단기 유동성 위험이 있습니다.' },
      { type: 'connect_match', question: '재무 지표를 연결하세요', pairs: [
        { term: '부채비율', definition: '재무 레버리지 수준' },
        { term: '유동비율', definition: '단기 지급 능력' },
        { term: '자기자본비율', definition: '자산 중 자기 몫 비중' },
        { term: 'D/E Ratio', definition: '부채 대 자본 비율' },
      ]},
    ]},
    { day: 3, title: 'OCF FCF 분석', xp: 100, items: [
      { type: 'learn', emoji: '💵', title: '영업현금흐름(OCF)', content: '기업의 본업에서 실제로 들어온 현금입니다. 순이익이 높아도 OCF가 낮으면 "이익의 질"이 낮은 것입니다.' },
      { type: 'learn', emoji: '🆓', title: '잉여현금흐름(FCF)', content: 'FCF = OCF - 설비투자(CAPEX). 기업이 자유롭게 쓸 수 있는 현금입니다. 배당, 자사주 매입, 부채 상환에 사용됩니다.' },
      { type: 'calculation', question: 'OCF 500억, CAPEX 200억이면 FCF는?', options: ['200억', '300억', '500억', '700억'], answer: 1, formula: 'FCF = 500억 - 200억 = 300억' },
      { type: 'multiple_choice', question: '순이익은 양수인데 OCF가 음수이면?', options: ['매우 건강한 기업', '이익의 질이 의심됨', '정상적인 상황', '투자 적기'], answer: 1, explanation: '순이익이 있지만 실제 현금이 안 들어오면 매출채권 증가, 회계 조작 등을 의심해봐야 합니다.' },
      { type: 'multiple_choice', question: 'FCF가 지속적으로 양수인 기업의 장점은?', options: ['높은 부채', '주주환원(배당/자사주) 여력', '낮은 성장성', '높은 변동성'], answer: 1, explanation: 'FCF가 풍부하면 배당, 자사주 매입, M&A 등 주주가치를 높이는 활동을 할 수 있습니다.' },
    ]},
    { day: 4, title: 'ROIC ROE ROA 비교', xp: 100, items: [
      { type: 'learn', emoji: '📊', title: 'ROE', content: 'Return on Equity = 순이익 / 자기자본. 주주 돈으로 얼마나 벌었나. 15% 이상이면 우수. 버핏의 핵심 지표.' },
      { type: 'learn', emoji: '🏗️', title: 'ROA', content: 'Return on Assets = 순이익 / 총자산. 전체 자산을 얼마나 효율적으로 활용하나. 부채가 많으면 ROE > ROA.' },
      { type: 'learn', emoji: '💡', title: 'ROIC', content: 'Return on Invested Capital = NOPAT / 투하자본. 실제 투자한 자본 대비 수익. ROIC > WACC이면 가치 창출 기업.' },
      { type: 'calculation', question: '순이익 100억, 자기자본 500억이면 ROE는?', options: ['10%', '15%', '20%', '25%'], answer: 2, formula: '100/500 × 100 = 20%' },
      { type: 'multiple_choice', question: 'ROE가 높지만 부채비율도 높은 기업은?', options: ['안전한 투자처', '레버리지로 ROE를 높인 것, 주의 필요', '무조건 좋은 기업', '투자 부적합'], answer: 1, explanation: '부채(레버리지)를 이용하면 ROE가 높아질 수 있지만, 리스크도 높아집니다. ROA와 함께 봐야 합니다.' },
      { type: 'connect_match', question: '수익성 지표를 연결하세요', pairs: [
        { term: 'ROE', definition: '자기자본 수익률' },
        { term: 'ROA', definition: '총자산 수익률' },
        { term: 'ROIC', definition: '투하자본 수익률' },
        { term: 'ROIC > WACC', definition: '가치 창출 기업' },
      ]},
    ]},
    { day: 5, title: '재무비율 통합 분석', xp: 120, items: [
      { type: 'learn', emoji: '🔍', title: '통합 분석 프레임', content: '좋은 기업 = ①높은 ROE(15%+) ②안정적 부채비율(100% 이하) ③양(+)의 FCF ④지속적 매출 성장. 한 가지만 보면 안 됩니다.' },
      { type: 'multiple_choice', question: 'A기업: ROE 25%, 부채비율 300%, FCF 음수. 평가는?', options: ['우수 기업', '고레버리지 위험 기업', '안정적 배당주', '성장주'], answer: 1, explanation: 'ROE가 높지만 부채비율이 매우 높고 FCF가 음수이므로 재무 리스크가 큽니다.' },
      { type: 'calculation', question: '매출 2000억, 영업이익 400억, 순이익 300억, 자기자본 2000억이면 ROE는?', options: ['10%', '15%', '20%', '25%'], answer: 1, formula: 'ROE = 300/2000 × 100 = 15%' },
      { type: 'multiple_choice', question: '재무 분석 시 가장 중요한 것은?', options: ['한 가지 지표에 집중', '여러 지표를 종합적으로', 'PER만 보기', '차트만 보기'], answer: 1, explanation: '어떤 지표든 단독으로는 한계가 있습니다. ROE, 부채비율, FCF, 성장률 등을 종합해야 합니다.' },
      { type: 'connect_match', question: '재무 건전성 체크리스트', pairs: [
        { term: 'ROE 15%+', definition: '우수한 자본 효율' },
        { term: '부채비율 100% 이하', definition: '안정적 재무구조' },
        { term: 'FCF 양(+)', definition: '현금창출력 양호' },
        { term: '매출 YoY 성장', definition: '사업 확장 중' },
      ]},
    ]},
  ],
};

const week6: CurriculumWeek = {
  week: 6, title: '밸류에이션 마스터', level: 'advanced', color: '#EC4899', emoji: '💎',
  days: [
    { day: 1, title: 'PER PBR PSR 심화', xp: 110, items: [
      { type: 'learn', emoji: '📊', title: 'PER 심화', content: 'PER = 주가/EPS. 업종별 평균 PER과 비교해야 합니다. 기술주 PER 30은 정상, 은행주 PER 30은 고평가. 맥락이 중요합니다.' },
      { type: 'learn', emoji: '📈', title: 'PEG Ratio', content: 'PEG = PER / EPS 성장률. PEG < 1이면 성장 대비 저평가. PER이 높아도 성장률이 더 높으면 매력적입니다.' },
      { type: 'calculation', question: 'PER 40, EPS 성장률 50%이면 PEG는?', options: ['0.6', '0.8', '1.0', '1.2'], answer: 1, formula: 'PEG = 40/50 = 0.8 (1 미만이므로 성장 대비 저평가)' },
      { type: 'multiple_choice', question: 'PBR이 0.5인 기업의 의미는?', options: ['주가가 순자산의 2배', '주가가 순자산의 반값', '매우 고평가', '투자 부적합'], answer: 1, explanation: 'PBR 0.5는 주가가 주당순자산의 50%로, 이론적으로 청산하면 2배 남는다는 뜻입니다.' },
      { type: 'connect_match', question: '밸류에이션 지표를 연결하세요', pairs: [
        { term: 'PER', definition: '이익 대비 주가 수준' },
        { term: 'PBR', definition: '순자산 대비 주가 수준' },
        { term: 'PSR', definition: '매출 대비 주가 수준' },
        { term: 'PEG', definition: '성장률 대비 PER 수준' },
      ]},
    ]},
    { day: 2, title: 'EV/EBITDA 실전', xp: 110, items: [
      { type: 'learn', emoji: '🏢', title: 'EV란', content: 'Enterprise Value = 시가총액 + 순부채. 기업 인수 시 실제로 필요한 금액입니다. 부채를 고려한 "진짜 기업가치"입니다.' },
      { type: 'learn', emoji: '📊', title: 'EV/EBITDA', content: 'EBITDA는 세금/이자/감가상각 전 이익. EV/EBITDA는 기업가치 대비 현금창출력입니다. 10 이하면 저평가, 20 이상이면 고평가 경향.' },
      { type: 'calculation', question: '시가총액 5조, 순부채 1조, EBITDA 1조이면 EV/EBITDA는?', options: ['4배', '5배', '6배', '7배'], answer: 2, formula: 'EV = 5조+1조 = 6조. EV/EBITDA = 6조/1조 = 6배' },
      { type: 'multiple_choice', question: 'EV/EBITDA가 PER보다 유용한 경우는?', options: ['단순 비교 시', '부채 구조가 다른 기업 비교 시', '배당 비교 시', '차트 분석 시'], answer: 1, explanation: 'EV/EBITDA는 부채와 감가상각을 반영하므로 자본구조가 다른 기업 간 비교에 유용합니다.' },
    ]},
    { day: 3, title: 'DCF 가치평가', xp: 120, items: [
      { type: 'learn', emoji: '🔮', title: 'DCF란', content: 'Discounted Cash Flow. 미래 현금흐름을 현재가치로 할인하는 방법입니다. 가장 이론적으로 정확한 가치평가 방법이지만 가정에 민감합니다.' },
      { type: 'learn', emoji: '📐', title: 'DCF 단계', content: '①미래 FCF 추정(5~10년) ②할인율(WACC) 결정 ③터미널 가치 계산 ④현재가치 합산 → 적정 주가 산출' },
      { type: 'learn', emoji: '⚠️', title: 'DCF의 한계', content: '성장률, 할인율 가정이 조금만 바뀌어도 결과가 크게 달라집니다. 여러 시나리오로 범위를 잡는 것이 현실적입니다.' },
      { type: 'multiple_choice', question: 'DCF에서 할인율을 높이면 적정가치는?', options: ['높아짐', '낮아짐', '변동 없음', '알 수 없음'], answer: 1, explanation: '할인율이 높아지면 미래 현금흐름의 현재가치가 줄어들어 적정 기업가치가 낮아집니다.' },
      { type: 'calculation', question: '1년 후 100억 현금흐름, 할인율 10%이면 현재가치는?', options: ['약 90.9억', '약 95억', '약 100억', '약 110억'], answer: 0, formula: '100억 / (1+0.10) = 90.9억' },
    ]},
    { day: 4, title: 'WACC 계산법', xp: 120, items: [
      { type: 'learn', emoji: '⚖️', title: 'WACC이란', content: 'Weighted Average Cost of Capital(가중평균자본비용). 자기자본비용과 타인자본비용의 가중평균입니다. DCF의 할인율로 사용됩니다.' },
      { type: 'learn', emoji: '📐', title: 'WACC 공식', content: 'WACC = E/(E+D)×Re + D/(E+D)×Rd×(1-T). E=자기자본, D=부채, Re=자기자본비용, Rd=부채비용, T=세율.' },
      { type: 'calculation', question: '자기자본 60%, Re 12%, 부채 40%, Rd 5%, 세율 25%. WACC는?', options: ['7.2%', '8.7%', '9.5%', '10.2%'], answer: 1, formula: 'WACC = 0.6×12% + 0.4×5%×(1-0.25) = 7.2% + 1.5% = 8.7%' },
      { type: 'multiple_choice', question: 'ROIC가 WACC보다 높으면?', options: ['가치 파괴', '가치 창출', '무의미', '부채 증가'], answer: 1, explanation: 'ROIC > WACC이면 투자한 자본 대비 더 높은 수익을 내므로 주주가치를 창출하는 기업입니다.' },
    ]},
    { day: 5, title: 'SOTP 분할가치평가', xp: 130, items: [
      { type: 'learn', emoji: '🧩', title: 'SOTP란', content: 'Sum of the Parts. 다양한 사업부를 가진 기업을 각 사업부별로 따로 평가한 뒤 합산하는 방법입니다. 삼성전자, GE 같은 복합기업에 유용합니다.' },
      { type: 'learn', emoji: '📊', title: 'SOTP 방법', content: '①각 사업부 매출/이익 분리 ②사업부별 적정 배수(PER, EV/EBITDA) 적용 ③합산 ④순부채 차감 → 적정 주가.' },
      { type: 'multiple_choice', question: 'SOTP가 특히 유용한 기업은?', options: ['단일 사업 기업', '다양한 사업부를 가진 복합기업', '스타트업', '미상장 기업'], answer: 1, explanation: '여러 사업부가 있으면 단일 PER로 평가하기 어려워 사업부별 SOTP가 유용합니다.' },
      { type: 'calculation', question: 'A사업부 EV 3조(EV/EBITDA 8), B사업부 EV 2조(EV/EBITDA 12), 순부채 1조이면 적정가치는?', options: ['3조', '4조', '5조', '6조'], answer: 1, formula: '3조 + 2조 - 1조 = 4조' },
      { type: 'connect_match', question: '가치평가 방법을 연결하세요', pairs: [
        { term: 'DCF', definition: '미래 현금흐름 할인' },
        { term: 'SOTP', definition: '사업부별 분할 평가' },
        { term: 'PER 상대가치', definition: '동종업계 비교' },
        { term: 'EV/EBITDA', definition: '기업가치 대비 현금창출력' },
      ]},
    ]},
  ],
};

const week7: CurriculumWeek = {
  week: 7, title: '매크로 & 시장 분석', level: 'advanced', color: '#06B6D4', emoji: '🌍',
  days: [
    { day: 1, title: '금리와 주식시장', xp: 120, items: [
      { type: 'learn', emoji: '🏦', title: '기준금리란', content: '중앙은행이 정하는 금리. 미국은 연준(Fed), 한국은 한국은행. 금리가 오르면 대출 이자가 올라 기업 비용 증가 → 주가에 부정적.' },
      { type: 'learn', emoji: '📉', title: '금리와 성장주', content: '금리 인상 시 성장주(높은 PER)가 가장 큰 타격. 미래 이익의 현재가치가 줄어들기 때문. 가치주/배당주는 상대적으로 방어적.' },
      { type: 'multiple_choice', question: '금리 인상 시 가장 큰 타격을 받는 섹터는?', options: ['유틸리티', '고PER 기술주', '은행', '에너지'], answer: 1, explanation: '금리 인상은 미래 이익 할인율을 높여 고PER 성장주(기술주)에 가장 부정적입니다.' },
      { type: 'multiple_choice', question: '금리 인하 기대가 커지면 주식시장은?', options: ['하락', '일반적으로 상승', '변동 없음', '거래 중단'], answer: 1, explanation: '금리 인하는 기업 비용 감소 + 할인율 하락으로 주가에 긍정적입니다.' },
      { type: 'connect_match', question: '금리 환경과 유리한 자산을 연결하세요', pairs: [
        { term: '금리 상승기', definition: '은행주, 가치주' },
        { term: '금리 하락기', definition: '성장주, 채권' },
        { term: '고금리 유지', definition: '배당주, 단기채' },
        { term: '금리 전환점', definition: '시장 변동성 확대' },
      ]},
    ]},
    { day: 2, title: 'CPI PPI 발표 대응', xp: 120, items: [
      { type: 'learn', emoji: '📊', title: 'CPI란', content: 'Consumer Price Index(소비자물가지수). 물가 상승률을 측정합니다. CPI가 예상보다 높으면 금리 인상 우려로 주가 하락.' },
      { type: 'learn', emoji: '🏭', title: 'PPI란', content: 'Producer Price Index(생산자물가지수). CPI의 선행지표. PPI가 오르면 향후 소비자 물가도 오를 가능성이 높습니다.' },
      { type: 'multiple_choice', question: 'CPI가 예상 3.0%인데 실제 3.5%로 나오면?', options: ['금리 인하 기대', '금리 인상 우려 → 주가 하락', '무영향', '주가 급등'], answer: 1, explanation: '예상보다 높은 CPI는 인플레이션 지속을 의미해 금리 인상 우려가 커지고 주가가 하락합니다.' },
      { type: 'multiple_choice', question: '핵심 CPI(Core CPI)에서 제외되는 항목은?', options: ['주거비', '의료비', '식료품과 에너지', '교육비'], answer: 2, explanation: '핵심 CPI는 변동성이 큰 식료품과 에너지를 제외해 기저 인플레이션 추세를 파악합니다.' },
    ]},
    { day: 3, title: '환율과 섹터별 영향', xp: 120, items: [
      { type: 'learn', emoji: '💱', title: '환율 기초', content: '원/달러 환율이 오르면(원화 약세) 수출기업에 유리, 수입기업에 불리. 반대로 환율이 내리면(원화 강세) 수입에 유리, 수출에 불리.' },
      { type: 'multiple_choice', question: '원/달러 환율이 1,200→1,400원으로 상승 시 유리한 기업은?', options: ['원재료 수입 기업', '해외 매출 비중 높은 수출 기업', '내수 소비재 기업', '부동산 기업'], answer: 1, explanation: '환율 상승(원화 약세)은 해외 매출의 원화 환산 금액을 늘려 수출기업에 유리합니다.' },
      { type: 'connect_match', question: '환율 변동과 영향을 연결하세요', pairs: [
        { term: '원화 약세(환율↑)', definition: '수출기업 수혜' },
        { term: '원화 강세(환율↓)', definition: '수입기업 수혜' },
        { term: '달러 강세', definition: '신흥국 자본 유출' },
        { term: '엔화 약세', definition: '일본 수출기업 수혜' },
      ]},
    ]},
    { day: 4, title: '연준 FOMC 의사록', xp: 130, items: [
      { type: 'learn', emoji: '🏛️', title: 'FOMC란', content: 'Federal Open Market Committee. 미국 연준의 금리 결정 기구. 연 8회 회의, 결과에 따라 글로벌 시장이 출렁입니다.' },
      { type: 'learn', emoji: '📝', title: '의사록 읽기', content: '핵심 키워드: "hawkish"(매파적, 긴축 의지) vs "dovish"(비둘기파, 완화 의지). "data-dependent"는 데이터 보고 결정이라는 뜻.' },
      { type: 'multiple_choice', question: 'FOMC 성명서에서 "hawkish" 톤이면?', options: ['금리 인하 기대', '금리 인상/유지 가능성 → 주가 하락 압력', '시장 무관심', '원자재 상승'], answer: 1, explanation: '"매파적" 발언은 긴축(금리 인상)을 시사해 주식시장에 부정적으로 작용합니다.' },
      { type: 'connect_match', question: 'FOMC 키워드를 연결하세요', pairs: [
        { term: 'Hawkish', definition: '매파적, 긴축 선호' },
        { term: 'Dovish', definition: '비둘기파, 완화 선호' },
        { term: 'Dot Plot', definition: '위원들의 금리 전망' },
        { term: 'Tapering', definition: '양적완화 축소' },
      ]},
    ]},
    { day: 5, title: '매크로 종합 실전', xp: 150, items: [
      { type: 'multiple_choice', question: '인플레이션 → 금리 인상 → 가장 타격받는 것은?', options: ['은행 예금', '고PER 성장주', '금', '단기채권'], answer: 1, explanation: '금리 인상은 성장주의 미래 이익 현재가치를 줄여 고PER 종목에 가장 부정적입니다.' },
      { type: 'calculation', question: 'CPI 전월 대비 +0.4%, 전년 동월 대비 +3.2%이면 연간 인플레이션은?', options: ['0.4%', '3.2%', '4.8%', '약 4.9%'], answer: 1, formula: '전년 동월 대비(YoY) 3.2%가 연간 인플레이션율입니다.' },
      { type: 'multiple_choice', question: '원/달러 환율 상승 + 미국 금리 인상의 조합은?', options: ['한국 수출 호재', '한국 자본유출 + 수출 호재 혼합', '무영향', '한국 주가 급등'], answer: 1, explanation: '미국 금리 인상은 달러 강세(원화 약세)를 유발해 수출에 유리하지만 자본 유출 위험도 있습니다.' },
      { type: 'connect_match', question: '매크로 시나리오를 연결하세요', pairs: [
        { term: '금리↑ + CPI↑', definition: '스태그플레이션 우려' },
        { term: '금리↓ + GDP↑', definition: '골디락스(이상적 경제)' },
        { term: '금리↑ + 달러↑', definition: '신흥국 자본 유출' },
        { term: '금리↓ + CPI↓', definition: '디플레이션 우려' },
      ]},
      { type: 'multiple_choice', question: '매크로 분석의 최종 목적은?', options: ['정확한 주가 예측', '투자 환경 파악 후 섹터/자산 배분', '뉴스 읽기', '데이트레이딩'], answer: 1, explanation: '매크로 분석은 정확한 주가 예측이 아닌, 투자 환경을 파악해 자산 배분 방향을 정하는 데 목적이 있습니다.' },
    ]},
  ],
};

const week8: CurriculumWeek = {
  week: 8, title: '실전 투자 전략', level: 'advanced', color: '#EF4444', emoji: '🏆',
  days: [
    { day: 1, title: '포트폴리오 구성 전략', xp: 140, items: [
      { type: 'learn', emoji: '📊', title: '자산배분이란', content: '주식/채권/현금/대체자산에 자금을 나누는 전략입니다. 레이 달리오의 올웨더: 주식 30% + 장기채 40% + 중기채 15% + 금 7.5% + 원자재 7.5%.' },
      { type: 'learn', emoji: '🎯', title: '코어-새틀라이트', content: '코어(핵심): 포트폴리오 70%, S&P500 ETF 같은 안정 자산. 새틀라이트(위성): 30%, 개별 성장주/테마주로 초과수익 추구.' },
      { type: 'multiple_choice', question: '공격적 포트폴리오의 주식 비중은?', options: ['30%', '50%', '70~90%', '100%'], answer: 2, explanation: '공격적 투자자는 주식 비중을 70~90%로 높이고 나머지를 채권/현금으로 배분합니다.' },
      { type: 'multiple_choice', question: '코어-새틀라이트 전략의 장점은?', options: ['전량 단타', '안정성+초과수익 동시 추구', '레버리지 극대화', '하나만 집중'], answer: 1, explanation: '코어로 시장 수익을 확보하고, 새틀라이트로 추가 수익을 추구하는 균형 전략입니다.' },
      { type: 'connect_match', question: '포트폴리오 전략을 연결하세요', pairs: [
        { term: '올웨더', definition: '모든 경제환경 대응' },
        { term: '코어-새틀라이트', definition: '안정+알파 동시 추구' },
        { term: '60/40', definition: '주식 60% 채권 40%' },
        { term: '영구 포트폴리오', definition: '4등분(주식/채권/금/현금)' },
      ]},
    ]},
    { day: 2, title: '리밸런싱 타이밍', xp: 130, items: [
      { type: 'learn', emoji: '⚖️', title: '리밸런싱이란', content: '목표 비중에서 벗어난 자산을 원래 비율로 되돌리는 것입니다. 주식 70%가 상승해 80%가 되면 일부를 매도해 70%로 복구.' },
      { type: 'learn', emoji: '📅', title: '리밸런싱 주기', content: '분기 1회 또는 비중이 5%p 이상 벗어날 때 실행. 너무 자주 하면 수수료가 쌓이고, 너무 안 하면 리스크가 커집니다.' },
      { type: 'multiple_choice', question: '리밸런싱의 핵심 효과는?', options: ['수익 극대화', '위험 관리 + 고점매도 저점매수 효과', '수수료 증가', '변동성 증가'], answer: 1, explanation: '리밸런싱은 오른 자산을 팔고 떨어진 자산을 사는 효과로, 자동으로 "고점매도 저점매수"가 됩니다.' },
      { type: 'calculation', question: '목표: 주식 60% 채권 40%. 현재 자산 1000만원(주식 700만 채권 300만). 주식을 얼마 팔아야 하나?', options: ['50만원', '80만원', '100만원', '120만원'], answer: 2, formula: '목표 주식 = 1000만×60% = 600만. 현재 700만이므로 100만원 매도.' },
    ]},
    { day: 3, title: '공매도와 헤징 전략', xp: 140, items: [
      { type: 'learn', emoji: '📉', title: '공매도란', content: '주식을 빌려서 먼저 팔고, 나중에 싸게 사서 갚는 것입니다. 주가 하락에 베팅하는 전략. 개인에게는 리스크가 매우 높습니다.' },
      { type: 'learn', emoji: '🛡️', title: '헤징이란', content: '기존 포지션의 손실을 상쇄하는 반대 포지션을 잡는 것입니다. 풋옵션 매수, 인버스 ETF, 달러 매수 등이 대표적 헤징 수단입니다.' },
      { type: 'multiple_choice', question: '인버스 ETF란?', options: ['지수와 같은 방향', '지수와 반대 방향으로 수익', '배당 2배', '장기투자용'], answer: 1, explanation: '인버스 ETF는 기초지수가 하락하면 수익이 나는 상품으로, 하락 헤징에 사용됩니다.' },
      { type: 'multiple_choice', question: '공매도의 최대 손실은 이론적으로?', options: ['투자금만큼', '투자금의 2배', '무한대', '50%'], answer: 2, explanation: '주가는 이론적으로 무한히 올라갈 수 있으므로 공매도의 손실도 무한대가 될 수 있습니다.' },
    ]},
    { day: 4, title: '워런 버핏 투자 철학', xp: 140, items: [
      { type: 'learn', emoji: '👴', title: '버핏의 4대 원칙', content: '①이해할 수 있는 사업 ②장기적 경쟁우위(해자) ③정직한 경영진 ④합리적 가격. 이 4가지를 모두 만족해야 매수합니다.' },
      { type: 'learn', emoji: '🏰', title: '경제적 해자', content: '경쟁자가 쉽게 따라올 수 없는 우위입니다. 브랜드(코카콜라), 네트워크 효과(비자), 전환비용(마이크로소프트), 규모의 경제(아마존).' },
      { type: 'multiple_choice', question: '버핏이 "영원히 보유할 주식"으로 꼽는 것은?', options: ['비트코인', '코카콜라', '테슬라', 'AMD'], answer: 1, explanation: '버핏은 코카콜라를 1988년부터 30년 넘게 보유하며 "영원히 보유할 것"이라고 말했습니다.' },
      { type: 'multiple_choice', question: '버핏의 "해자"에 해당하지 않는 것은?', options: ['강력한 브랜드', '네트워크 효과', '단기 유행', '규모의 경제'], answer: 2, explanation: '단기 유행은 지속 가능한 경쟁우위가 아니므로 해자에 해당하지 않습니다.' },
      { type: 'connect_match', question: '경제적 해자를 연결하세요', pairs: [
        { term: '브랜드 해자', definition: '코카콜라, 애플' },
        { term: '네트워크 효과', definition: '비자, 메타' },
        { term: '전환비용', definition: '마이크로소프트, 어도비' },
        { term: '규모의 경제', definition: '아마존, 코스트코' },
      ]},
    ]},
    { day: 5, title: '심화 과정 최종시험', xp: 250, items: [
      { type: 'calculation', question: '매출 5000억, 영업이익 1000억이면 영업이익률은?', options: ['15%', '20%', '25%', '30%'], answer: 1, formula: '1000/5000 × 100 = 20%' },
      { type: 'calculation', question: 'WACC = 0.7×15% + 0.3×6%×(1-0.25) = ?', options: ['10.5%', '11.85%', '12.2%', '13.5%'], answer: 1, formula: '10.5% + 1.35% = 11.85%' },
      { type: 'multiple_choice', question: 'ROIC > WACC이면?', options: ['가치 파괴', '가치 창출', '중립', '알 수 없음'], answer: 1, explanation: '투자자본수익률이 자본비용보다 높으면 기업이 주주가치를 창출하는 것입니다.' },
      { type: 'multiple_choice', question: 'DCF 분석에서 가장 민감한 가정은?', options: ['과거 매출', '할인율(WACC)과 성장률', '현재 주가', '배당률'], answer: 1, explanation: 'DCF는 할인율과 성장률 가정에 매우 민감합니다. 작은 변화로 결과가 크게 달라집니다.' },
      { type: 'multiple_choice', question: 'EV/EBITDA가 PER보다 나은 점은?', options: ['계산이 쉬움', '자본구조 차이를 반영', '배당 포함', '차트에 표시 가능'], answer: 1, explanation: 'EV/EBITDA는 부채를 포함한 기업가치를 사용해 자본구조가 다른 기업 비교에 유용합니다.' },
      { type: 'calculation', question: 'FCF 200억, 성장률 3%, 할인율 10%이면 터미널 가치는? (고든 성장 모델)', options: ['2,000억', '2,571억', '2,857억', '3,333억'], answer: 2, formula: 'TV = 200×(1+0.03) / (0.10-0.03) = 206/0.07 = 약 2,943억 → 가장 가까운 2,857억' },
      { type: 'connect_match', question: '8주 커리큘럼 핵심 정리', pairs: [
        { term: 'PER', definition: '이익 대비 주가' },
        { term: 'WACC', definition: '가중평균자본비용' },
        { term: 'FCF', definition: '잉여현금흐름' },
        { term: '해자', definition: '지속 가능한 경쟁우위' },
      ]},
      { type: 'multiple_choice', question: '투자에서 가장 중요한 것은?', options: ['정보 독점', '레버리지', '원칙 있는 꾸준한 실행', '남의 추천 따르기'], answer: 2, explanation: '자신만의 투자 원칙을 세우고 꾸준히 실행하는 것이 장기적으로 가장 중요합니다.' },
    ]},
  ],
};

// ── 전체 커리큘럼 배열 ───────────────────────────

export const CURRICULUM: CurriculumWeek[] = [
  week1, week2, week3, week4,
  week5, week6, week7, week8,
];

// ── 통계 ─────────────────────────────────────────

export function getCurriculumStats() {
  let totalDays = 0, totalItems = 0, totalXp = 0;
  CURRICULUM.forEach(w => {
    w.days.forEach(d => {
      totalDays++;
      totalItems += d.items.length;
      totalXp += d.xp;
    });
  });
  return { weeks: CURRICULUM.length, totalDays, totalItems, totalXp };
}
