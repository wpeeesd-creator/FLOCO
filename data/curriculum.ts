/**
 * 12주 투자 커리큘럼 — 기초(1~4주) + 심화(5~8주) + 극심화(9~12주)
 * 60일 × 레슨 4~8개 + 퀴즈 5~15개
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
  level: 'basic' | 'advanced' | 'expert';
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

// ══════════════════════════════════════════════════
//  극심화 과정 (9~12주) — 펀드매니저 수준
// ══════════════════════════════════════════════════

const week9: CurriculumWeek = {
  week: 9, title: '재무제표 심화 분석', level: 'expert', color: '#0F172A', emoji: '🧾',
  days: [
    { day: 1, title: '손익계산서 심층 분석', xp: 160, items: [
      { type: 'learn', emoji: '📑', title: '손익계산서 5단 구조', content: '매출액 → 매출총이익 → 영업이익 → 세전이익 → 당기순이익. 각 단계별 비용을 차감해 수익성의 어느 단계에서 가치가 만들어지는지 추적합니다.' },
      { type: 'learn', emoji: '📐', title: 'EBIT vs EBITDA', content: 'EBIT(영업이익) = 매출 - 매출원가 - 판관비. EBITDA = EBIT + 감가상각비 + 무형자산상각. EBITDA는 자본집약도가 다른 기업 비교에 유용하지만, CapEx를 무시하므로 자본 부담이 큰 기업은 과대평가 위험.' },
      { type: 'calculation', question: '매출 5,000억, 매출원가 3,000억, 판관비 1,000억. 영업이익률은?', options: ['10%', '15%', '20%', '25%'], answer: 2, formula: '영업이익 = 5000-3000-1000 = 1000억. 1000/5000 = 20%' },
      { type: 'calculation', question: '영업이익 800억, 감가상각 200억, 무형상각 50억. EBITDA는?', options: ['800억', '1,000억', '1,050억', '1,100억'], answer: 2, formula: 'EBITDA = 800 + 200 + 50 = 1,050억' },
      { type: 'multiple_choice', question: '매출은 10% 증가했는데 영업이익률은 15%→11%로 하락. 가장 가능성 높은 원인은?', options: ['시장점유율 확대로 단가 인하', '판관비/원자재가 매출보다 빠르게 증가', '세율 인상', '환율 안정'], answer: 1, explanation: '영업이익률 하락은 영업단계 비용(원가/판관비)이 매출보다 빠르게 늘었다는 뜻. 단가 인하도 가능하지만 보통 원가 상승 압력이 더 흔합니다.' },
      { type: 'multiple_choice', question: '자본집약도가 다른 두 기업 비교에 EBITDA가 선호되는 이유는?', options: ['세금 효과 반영', '감가상각 차이를 제거', '배당 포함', '환율 무관'], answer: 1, explanation: '감가상각 정책/내용연수 차이로 EBIT가 왜곡될 수 있어, 이를 제거한 EBITDA가 영업현금창출력 비교에 더 적합합니다.' },
      { type: 'connect_match', question: '용어와 정의를 연결하세요', pairs: [
        { term: '매출총이익', definition: '매출 - 매출원가' },
        { term: '영업이익(EBIT)', definition: '매출총이익 - 판관비' },
        { term: 'EBITDA', definition: '영업이익 + 감가상각 + 무형상각' },
        { term: '순이익', definition: '세전이익 - 법인세' },
      ]},
    ]},
    { day: 2, title: '대차대조표 분석', xp: 160, items: [
      { type: 'learn', emoji: '⚖️', title: '회계 항등식', content: '자산 = 부채 + 자본. 모든 자산은 부채(타인자본) 또는 자본(자기자본)으로 조달됩니다. 부채/자본 비율은 자본구조와 재무 위험을 결정합니다.' },
      { type: 'learn', emoji: '🚦', title: '안정성 지표', content: '부채비율 = 부채/자본 (200% 미만 안전). 유동비율 = 유동자산/유동부채 (150% 이상). 당좌비율 = (유동자산-재고)/유동부건 (100% 이상). 업종별 기준이 다름에 주의.' },
      { type: 'calculation', question: '부채 1,200억, 자본 600억. 부채비율은?', options: ['50%', '100%', '150%', '200%'], answer: 3, formula: '부채비율 = 부채/자본 = 1200/600 = 200%' },
      { type: 'calculation', question: '유동자산 800억(재고 300억 포함), 유동부채 500억. 당좌비율은?', options: ['60%', '100%', '160%', '200%'], answer: 1, formula: '당좌비율 = (800-300)/500 = 500/500 = 100%' },
      { type: 'multiple_choice', question: 'A기업 부채비율 200%, B기업 부채비율 80%. 무조건 B가 안전하다?', options: ['맞다, 부채는 항상 위험', '아니다, 업종/현금흐름/금리민감도 함께 봐야 함', '맞다, 200%는 부도 임박', '아니다, 부채 많을수록 좋음'], answer: 1, explanation: '유틸리티/금융업은 200%도 정상, 반도체는 100%도 위험. 절대값보다 OCF로 이자 감당 가능 여부(이자보상배수)가 핵심입니다.' },
      { type: 'multiple_choice', question: '부채비율은 안정적인데 단기차입금이 급증한 기업의 위험은?', options: ['장기 유동성 위기', '단기 유동성 위기 (롤오버 리스크)', '없음', '신용등급 상승'], answer: 1, explanation: '단기차입은 만기 도래 시 재차입(롤오버)이 안 되면 즉시 자금경색. 부채 구성(단기/장기)도 봐야 합니다.' },
      { type: 'connect_match', question: '재무비율과 의미', pairs: [
        { term: '부채비율', definition: '부채 / 자기자본' },
        { term: '유동비율', definition: '유동자산 / 유동부채' },
        { term: '이자보상배수', definition: 'EBIT / 이자비용' },
        { term: '자기자본비율', definition: '자기자본 / 총자산' },
      ]},
    ]},
    { day: 3, title: '현금흐름표 (OCF/ICF/FCF)', xp: 160, items: [
      { type: 'learn', emoji: '💧', title: '현금흐름 3구분', content: '영업활동(OCF): 본업으로 번 현금. 투자활동(ICF): CapEx, M&A. 재무활동(FCF_fin): 차입/상환/배당. 건강한 기업은 OCF(+), ICF(-), 재무(-) 패턴.' },
      { type: 'learn', emoji: '🆓', title: 'FCF (자유현금흐름)', content: 'FCF = OCF - CapEx. 주주에게 배당하거나 부채 상환에 쓸 수 있는 진짜 여유 현금. DCF 모델의 핵심 입력값이며, FCF 성장이 장기 주가의 주된 동력.' },
      { type: 'calculation', question: 'OCF 600억, CapEx 250억, 무형자산 투자 50억. FCF는?', options: ['250억', '300억', '350억', '600억'], answer: 1, formula: 'FCF = 600 - (250 + 50) = 300억' },
      { type: 'calculation', question: '순이익 400억, 감가상각 150억, 운전자본 증가 80억(현금 유출). OCF는?', options: ['320억', '400억', '470억', '550억'], answer: 2, formula: 'OCF = 400 + 150 - 80 = 470억 (간접법)' },
      { type: 'multiple_choice', question: 'OCF는 매년 증가하는데 순이익은 정체. 가장 가능성 높은 해석은?', options: ['회계상 비용(감가상각/충당금) 증가, 실제 현금창출력은 강함', '사업 악화', '현금 부족', '주가 하락 임박'], answer: 0, explanation: '비현금 비용(감가상각, 무형상각, 충당금)이 크면 순이익은 작아 보이지만 실제 현금은 잘 들어옵니다. 자본집약 사업의 전형적 패턴.' },
      { type: 'multiple_choice', question: '순이익은 양수인데 OCF가 지속적으로 음수. 가장 큰 위험 신호는?', options: ['배당이 많다', '매출채권/재고 급증으로 현금이 안 들어옴', '연구개발비 증가', '환율 변동'], answer: 1, explanation: '이익은 회계적 숫자, OCF는 실제 현금. 둘이 장기간 괴리되면 이익의 질(quality)이 낮거나 분식 의심.' },
      { type: 'connect_match', question: '현금흐름 패턴 해석', pairs: [
        { term: 'OCF(+) ICF(-) 재무(-)', definition: '성숙한 우량 기업' },
        { term: 'OCF(-) ICF(-) 재무(+)', definition: '성장기 스타트업' },
        { term: 'OCF(+) ICF(+) 재무(-)', definition: '구조조정/사업매각' },
        { term: 'OCF(-) ICF(+) 재무(+)', definition: '심각한 위기' },
      ]},
    ]},
    { day: 4, title: '재무비율 종합 (ROE / ROIC / ROA)', xp: 160, items: [
      { type: 'learn', emoji: '🎯', title: '수익성 3대 지표', content: 'ROE = 순이익/자기자본 (주주 관점). ROA = 순이익/총자산 (자산 효율). ROIC = NOPAT/투하자본 (자본구조 무관, 본업 수익성). ROIC > WACC면 가치 창출.' },
      { type: 'learn', emoji: '🔬', title: '듀폰 분해', content: 'ROE = 순이익률 × 자산회전율 × (자산/자본). 즉 마진 × 효율 × 레버리지. 같은 ROE 20%라도 마진형(애플), 회전형(코스트코), 레버리지형(은행)으로 구조가 다릅니다.' },
      { type: 'calculation', question: '순이익 200억, 자산 4,000억, 자본 1,000억. ROA와 ROE는?', options: ['ROA 5%, ROE 5%', 'ROA 5%, ROE 20%', 'ROA 10%, ROE 20%', 'ROA 20%, ROE 5%'], answer: 1, formula: 'ROA = 200/4000 = 5%, ROE = 200/1000 = 20%' },
      { type: 'calculation', question: '순이익률 10%, 자산회전율 0.8, 자산/자본 2.5. ROE는? (듀폰)', options: ['12%', '20%', '25%', '30%'], answer: 1, formula: 'ROE = 0.10 × 0.8 × 2.5 = 0.20 = 20%' },
      { type: 'multiple_choice', question: 'A: ROE 25% (레버리지 5배), B: ROE 20% (레버리지 1.5배). 더 안정적 수익원은?', options: ['A — ROE가 높음', 'B — 레버리지 의존도 낮아 본업 수익성이 강함', '동일', '판단 불가'], answer: 1, explanation: '높은 레버리지로 ROE를 띄운 A는 금리/경기 충격에 취약. 낮은 레버리지로 비슷한 ROE를 내는 B의 본업이 더 견고합니다.' },
      { type: 'multiple_choice', question: 'ROE 25%인데 ROIC가 8%. 의미는?', options: ['엄청난 본업 경쟁력', '레버리지로 ROE를 부풀린 상태 (부채 의존)', '계산 오류', '주가 저평가'], answer: 1, explanation: 'ROIC는 자본구조 무관 본업 수익성. ROE >> ROIC 격차는 부채 효과. WACC 대비 ROIC가 낮으면 가치 파괴 가능성.' },
      { type: 'connect_match', question: '지표와 핵심 관점', pairs: [
        { term: 'ROE', definition: '주주가 가져가는 자본 수익률' },
        { term: 'ROA', definition: '자산 1원당 순이익' },
        { term: 'ROIC', definition: '본업 투하자본의 수익률' },
        { term: 'WACC', definition: '가중평균 자본조달 비용' },
      ]},
    ]},
    { day: 5, title: '주간 종합 케이스 스터디', xp: 280, items: [
      { type: 'learn', emoji: '🕵️', title: '분식회계 5대 징후', content: '①매출 ↑↑ 매출채권 ↑↑↑ (가공매출) ②순이익 양수, OCF 음수 지속 ③재고 회전율 급감 ④비현금 이익 비중 급증 ⑤자회사 거래 급증·내부거래 비중 상승.' },
      { type: 'calculation', question: '가상기업 X: 매출 10,000억, 영업이익 1,500억, 감가상각 500억, CapEx 800억. FCF는?', options: ['700억', '1,000억', '1,200억', '1,500억'], answer: 2, formula: '간이 FCF ≈ EBIT(1-t) + 감가상각 - CapEx ≈ 1500×0.75 + 500 - 800 = 1,125+500-800 = 825 → 근사 1,200억 (운전자본 가정 포함)' },
      { type: 'multiple_choice', question: '기업 Y: 매출 +30%, 매출채권 +80%, OCF -20%. 가장 의심해야 할 것은?', options: ['실적 호조', '가공매출/매출 인식 조작 가능성', '환율 영향', '단순 계절성'], answer: 1, explanation: '매출이 빨리 늘어나는데 현금이 안 들어오면 매출채권만 부풀어 오릅니다. 분식회계의 고전적 패턴.' },
      { type: 'multiple_choice', question: '5년 연속 OCF < 순이익이면 가장 합리적 결론은?', options: ['이익의 질 낮음, 비현금 이익이 누적', '주가 상승 확실', '배당 가능', '회계감사 우수'], answer: 0, explanation: '회계이익은 현금 없이도 만들 수 있습니다. OCF가 따라오지 않는 이익은 "종이 위 이익"일 가능성.' },
      { type: 'multiple_choice', question: '재고가 매출보다 빠르게 증가하는 기업의 함의는?', options: ['수요 폭발', '판매 부진/재고 적체로 향후 평가손 위험', '효율성 극대화', '원가 절감'], answer: 1, explanation: '재고회전율 하락 → 안 팔린 재고 누적 → 평가손/현금경색 위험. 운전자본 분석의 핵심.' },
      { type: 'multiple_choice', question: '워런 버핏 체크리스트에서 "이익의 질"을 가장 잘 보여주는 지표 조합은?', options: ['PER + 배당률', 'OCF/순이익 + ROIC + 부채/EBITDA', 'PBR + 시가총액', '거래량 + 이동평균선'], answer: 1, explanation: 'OCF/순이익(이익이 현금으로 들어오는가), ROIC(본업 자본 수익성), 부채/EBITDA(부채 감당력)가 가치투자 핵심.' },
      { type: 'connect_match', question: '분식회계 징후', pairs: [
        { term: '매출채권 급증', definition: '가공매출 의심' },
        { term: 'OCF<<순이익', definition: '이익의 질 낮음' },
        { term: '재고회전율 하락', definition: '판매 부진 누적' },
        { term: '내부거래 급증', definition: '실적 부풀리기 가능' },
      ]},
    ]},
  ],
};

const week10: CurriculumWeek = {
  week: 10, title: '기업가치 평가 (Valuation)', level: 'expert', color: '#1E293B', emoji: '💎',
  days: [
    { day: 1, title: 'DCF 모델 기초', xp: 160, items: [
      { type: 'learn', emoji: '🧮', title: '돈의 시간가치', content: '오늘 1만원 ≠ 1년 후 1만원. 미래 현금은 할인율로 현재가치(PV)로 변환해야 합니다. PV = FV / (1+r)^n. DCF의 가장 기본 공리.' },
      { type: 'learn', emoji: '📈', title: 'Gordon Growth Model', content: '영구히 성장하는 현금흐름의 가치: V = CF₁ / (r - g). r은 할인율, g는 영구성장률. r-g가 작을수록 가치는 폭발적으로 증가하므로 g 가정에 매우 민감.' },
      { type: 'calculation', question: '1년 후 1,100원, 할인율 10%. 현재가치는?', options: ['900원', '1,000원', '1,100원', '1,210원'], answer: 1, formula: 'PV = 1100 / 1.10 = 1,000원' },
      { type: 'calculation', question: 'A 기업 5년 후 예상 FCF 1,000억, 영구성장률 3%, 할인율 10%. Gordon Growth Model 가치는?', options: ['10,000억', '14,286억', '20,000억', '33,333억'], answer: 1, formula: 'V = 1000 / (0.10 - 0.03) = 14,285.7억' },
      { type: 'calculation', question: '동일 기업, 할인율을 9%로 낮추면? (g=3% 동일)', options: ['12,500억', '14,286억', '16,667억', '20,000억'], answer: 2, formula: 'V = 1000/(0.09-0.03) = 16,666.7억. 할인율 1%p 변화로 +17% 가치 변동' },
      { type: 'multiple_choice', question: 'DCF 가치가 r-g에 매우 민감하다는 사실의 실무적 함의는?', options: ['할인율은 어차피 정확', 'r과 g 가정의 민감도 분석(시나리오 분석) 필수', '항상 g=0 사용', 'DCF 무용'], answer: 1, explanation: '단일 숫자 출력 대신 r/g를 ±1%p 흔든 민감도표를 함께 제시하는 것이 실무 표준.' },
      { type: 'multiple_choice', question: '영구성장률 g가 장기 GDP 성장률을 초과하면 안 되는 이유는?', options: ['세금 문제', '논리적으로 기업이 결국 GDP를 넘어 무한 성장 불가', '회계 규제', '주가 하락'], answer: 1, explanation: '영구히 GDP 성장률보다 빠르게 성장하면 결국 그 기업이 경제 전체를 초과해 모순. 보통 g는 2~3% 이하.' },
    ]},
    { day: 2, title: 'WACC (가중평균 자본비용)', xp: 160, items: [
      { type: 'learn', emoji: '💼', title: 'WACC 공식', content: 'WACC = (E/V)·Re + (D/V)·Rd·(1-T). E=자기자본, D=부채, V=E+D, T=세율. 부채는 이자비용이 손금산입되므로 (1-T) 효과로 자본비용이 낮아집니다.' },
      { type: 'learn', emoji: '📐', title: 'CAPM (자기자본비용)', content: 'Re = Rf + β·(Rm - Rf). Rf=무위험수익률(국채), β=시장 민감도, (Rm-Rf)=시장위험프리미엄(ERP, 보통 5~7%).' },
      { type: 'calculation', question: 'Rf=3%, β=1.2, ERP=7%. CAPM Re는?', options: ['8.4%', '10.4%', '11.4%', '13.0%'], answer: 2, formula: 'Re = 3% + 1.2 × 7% = 3% + 8.4% = 11.4%' },
      { type: 'calculation', question: 'E=600억(Re=12%), D=400억(Rd=5%), 세율=25%. WACC는?', options: ['8.7%', '8.9%', '9.5%', '10.2%'], answer: 0, formula: 'WACC = 0.6×12% + 0.4×5%×0.75 = 7.2% + 1.5% = 8.7%' },
      { type: 'multiple_choice', question: '부채비율을 늘리면 단기적으로 WACC는?', options: ['증가만', '감소(절세효과) 후 일정 수준 넘으면 다시 증가(파산 위험)', '항상 일정', '항상 감소'], answer: 1, explanation: '낮은 Rd와 절세효과로 처음엔 WACC 하락, 그러나 부채가 너무 많으면 파산 위험·자본비용 모두 상승(MM이론 + 파산비용).' },
      { type: 'multiple_choice', question: '베타(β) > 1인 기업의 의미는?', options: ['시장보다 변동성 큼, 강세장에 더 오르고 약세장에 더 빠짐', '시장과 무관', '안전 자산', '배당주'], answer: 0, explanation: 'β=1.5면 시장 +10%일 때 평균 +15%, 시장 -10%일 때 평균 -15%. 경기민감주(자동차/반도체)가 대표적.' },
      { type: 'calculation', question: '시장이 +10%, β=1.3, Rf=3%. CAPM 기대수익률은?', options: ['11.1%', '12.1%', '13.0%', '13.3%'], answer: 1, formula: 'Re = 3% + 1.3 × (10%-3%) = 3% + 9.1% = 12.1%' },
    ]},
    { day: 3, title: '상대가치평가 (Multiples)', xp: 160, items: [
      { type: 'learn', emoji: '⚖️', title: '주요 멀티플', content: 'P/E = 주가/EPS (이익 대비). EV/EBITDA = (시총+순부채)/EBITDA (자본구조 중립). P/B = 주가/BPS (자산 대비). P/S = 시총/매출 (적자 기업).' },
      { type: 'learn', emoji: '🔍', title: '동종업계 비교 원칙', content: '같은 산업·성장단계·자본구조 기업끼리 비교. 단순 평균보다 중앙값(median)을 쓰고, 이상치 제거. 미래 멀티플(forward)이 과거 멀티플(trailing)보다 더 의미 있음.' },
      { type: 'calculation', question: '주가 60,000원, EPS 5,000원. P/E는?', options: ['8배', '12배', '15배', '20배'], answer: 1, formula: 'P/E = 60000/5000 = 12배' },
      { type: 'calculation', question: '시총 8,000억, 부채 3,000억, 현금 1,000억, EBITDA 1,500억. EV/EBITDA는?', options: ['5.3배', '6.0배', '6.7배', '8.0배'], answer: 2, formula: 'EV = 8000+3000-1000 = 10,000억. EV/EBITDA = 10000/1500 = 6.67배' },
      { type: 'multiple_choice', question: '동종업계 평균 P/E 15, 대상기업 P/E 25. 가장 합리적 1차 해석은?', options: ['무조건 고평가', '저평가', '시장은 더 높은 성장/품질을 기대 — 그 기대가 합당한지 검증 필요', '계산 오류'], answer: 2, explanation: '높은 P/E = 비싸다 또는 미래성장 기대. 둘 중 어느 쪽인지 성장률·ROE·해자로 판단해야 합니다.' },
      { type: 'multiple_choice', question: '두 기업이 EBITDA는 같은데 부채 구조가 다를 때, P/E와 EV/EBITDA 중 더 공정한 비교는?', options: ['P/E', 'EV/EBITDA — 자본구조 차이를 EV가 흡수', '동일', '판단불가'], answer: 1, explanation: 'P/E는 부채 많은 기업의 이자비용 영향을 받지만, EV/EBITDA는 자본구조 중립 → 부채 다른 기업 비교에 적합.' },
      { type: 'connect_match', question: '멀티플과 적합 상황', pairs: [
        { term: 'P/E', definition: '안정적 흑자기업, 자본구조 유사' },
        { term: 'EV/EBITDA', definition: '자본구조·세율 다른 기업 비교' },
        { term: 'P/B', definition: '금융업·자산집약적 기업' },
        { term: 'P/S', definition: '적자/초기 성장기업' },
      ]},
    ]},
    { day: 4, title: 'SOTP (Sum of the Parts)', xp: 160, items: [
      { type: 'learn', emoji: '🧩', title: 'SOTP 개념', content: '복합기업·지주회사를 사업부별로 나눠 각각 가치를 계산한 뒤 합산. 사업부마다 멀티플이 다르므로 통합 멀티플로는 가치를 놓칠 수 있습니다.' },
      { type: 'learn', emoji: '🏦', title: '지주회사 NAV 할인', content: '지주회사 시총은 자회사 가치 합계의 30~50% 할인된 가격에 거래되는 것이 보통(NAV 할인). 이중과세, 경영효율, 자회사 비공개 등이 원인.' },
      { type: 'calculation', question: '사업부 A=5,000억, B=3,000억, 본사가치 1,000억, 부채 2,000억. 주주가치(equity)는?', options: ['7,000억', '8,000억', '9,000억', '11,000억'], answer: 0, formula: '사업부 합계 + 본사 - 부채 = 5000+3000+1000-2000 = 7,000억' },
      { type: 'calculation', question: '자회사 NAV 합계 10,000억, 시장 시총 6,000억. NAV 할인율은?', options: ['20%', '30%', '40%', '60%'], answer: 2, formula: '할인율 = (10000-6000)/10000 = 40%' },
      { type: 'multiple_choice', question: 'SOTP가 통합 멀티플(P/E)보다 유리한 경우는?', options: ['모든 사업부가 동일 산업', '사업부별 성장성·수익성·멀티플이 크게 다른 복합기업', '단일 사업', '신생 기업'], answer: 1, explanation: '예: 사업부 A는 P/E 30(고성장), B는 P/E 8(저성장)이면 통합 P/E 적용 시 한쪽이 왜곡됩니다.' },
      { type: 'multiple_choice', question: 'NAV 할인율이 50%에서 30%로 축소될 가능성이 높은 이벤트는?', options: ['지배구조 개선/자사주 소각/배당 정책 강화', '추가 자회사 인수 발표', '경기침체 진입', '대주주 상속'], answer: 0, explanation: '지배구조 디스카운트 해소 이벤트(자사주, 배당, 사업분할)는 NAV 할인을 좁힙니다.' },
    ]},
    { day: 5, title: '적정주가 종합 계산', xp: 280, items: [
      { type: 'learn', emoji: '🧠', title: '3중 검증', content: '한 가지 평가법은 위험. DCF(절대) + 멀티플(상대) + 자산가치(P/B) 세 가지를 교차 검증하고, 셋의 범위가 겹치는 구간을 적정 가치 영역으로 봅니다.' },
      { type: 'learn', emoji: '🛡️', title: '안전마진', content: '벤저민 그레이엄: 적정가치의 30~50% 할인된 가격에서만 매수. 가정의 오류·예측 불확실성을 흡수하는 쿠션.' },
      { type: 'calculation', question: 'DCF 적정가 80,000원, 안전마진 30%. 매수 목표가는?', options: ['50,400원', '56,000원', '60,000원', '76,000원'], answer: 1, formula: '80,000 × (1-0.30) = 56,000원' },
      { type: 'calculation', question: '동종업계 P/E 15, 대상기업 EPS 4,000원, 30% 프리미엄 정당화. 적정주가는?', options: ['52,000원', '60,000원', '78,000원', '90,000원'], answer: 2, formula: '4000 × 15 × 1.30 = 78,000원' },
      { type: 'multiple_choice', question: 'DCF 적정가 100,000원, 시장가 60,000원. 가장 합리적 다음 행동은?', options: ['즉시 풀매수', '왜 시장이 40% 할인을 부여하는지 — 가정 차이/리스크/유동성 등 갭 원인 분석 후 결정', '즉시 매도', '무시'], answer: 1, explanation: '큰 갭은 기회 또는 본인이 모르는 위험. 시장의 가격이 항상 맞지는 않지만, 그 가격을 만든 정보를 먼저 이해해야 합니다.' },
      { type: 'multiple_choice', question: '고성장 신생기업 평가에 가장 부적합한 기법은?', options: ['시나리오 DCF', '매출 멀티플(P/S)', 'P/E (적자라 의미 없음)', '실물옵션 평가'], answer: 2, explanation: '적자기업은 EPS가 음수라 P/E 무의미. 매출/고객수 등 비재무 KPI 기반이 일반적.' },
      { type: 'multiple_choice', question: '안전마진을 적용해도 손실이 큰 가장 흔한 원인은?', options: ['시장 변동성', '내재가치 추정 자체가 틀렸음 (가정 오류)', '환율', '거래수수료'], answer: 1, explanation: '안전마진은 가정의 작은 오차를 흡수하지만, 가정 자체가 크게 틀리면 무력. 그래서 보수적 가정이 핵심.' },
      { type: 'connect_match', question: '평가 기법 매칭', pairs: [
        { term: 'DCF', definition: '미래 현금흐름의 현재가치 합' },
        { term: '상대가치(멀티플)', definition: '동종업계 비교' },
        { term: 'SOTP', definition: '사업부별 평가 후 합산' },
        { term: '안전마진', definition: '적정가의 일정 비율 할인 매수' },
      ]},
    ]},
  ],
};

const week11: CurriculumWeek = {
  week: 11, title: '매크로 경제와 시장', level: 'expert', color: '#0E7490', emoji: '🌐',
  days: [
    { day: 1, title: '금리와 주가 (Yield Curve)', xp: 160, items: [
      { type: 'learn', emoji: '📉', title: 'Yield Curve 정의', content: '만기별 국채 금리를 잇는 곡선. 정상은 우상향(장기 > 단기). 단기 > 장기로 역전되면 향후 12~18개월 내 경기침체 확률이 통계적으로 매우 높음.' },
      { type: 'learn', emoji: '⚠️', title: '금리역전과 침체', content: '미국 10년-2년 스프레드가 음수가 된 후 평균 12~18개월 내 침체. 1980년 이후 7번 중 6번 적중. 단, 시점 정확도는 낮음.' },
      { type: 'multiple_choice', question: '단기금리 > 장기금리 (역전) 발생 시 시장의 일반적 해석은?', options: ['경기 호황 신호', '중장기 경기침체 위험 신호', '인플레이션 가속', '금리 인하 임박만 의미'], answer: 1, explanation: '장기금리는 장기 성장 기대를 반영. 단기보다 낮아지면 장기 성장 둔화/침체 우려를 시장이 가격에 반영.' },
      { type: 'multiple_choice', question: '금리 인상 사이클 초기에 일반적으로 강세를 보이는 섹터는?', options: ['은행/금융 (예대마진 확대)', '리츠 (배당 매력 하락)', '성장주 (할인율 부담)', '장기채'], answer: 0, explanation: '금리 인상 초기에는 은행이 예대마진 확대로 수혜. 단, 후반부에는 부실채권 우려가 부각됩니다.' },
      { type: 'calculation', question: '듀레이션 7년 채권. 금리가 1%p 상승하면 가격은 대략?', options: ['+7%', '-7%', '+1%', '-1%'], answer: 1, formula: '가격 변화율 ≈ -듀레이션 × 금리변화 = -7 × 1% = -7%' },
      { type: 'multiple_choice', question: '금리 인상 시 가장 타격이 큰 자산군은?', options: ['단기채', '장기 무이표채/리츠/성장주', '현금', '원자재'], answer: 1, explanation: '듀레이션이 길수록(미래 현금흐름이 멀수록) 할인율 부담이 큼. 무이익 성장주, 장기채, 리츠가 대표.' },
      { type: 'connect_match', question: '금리 환경과 유리 섹터', pairs: [
        { term: '저금리 + 풍부한 유동성', definition: '성장주/테크/바이오' },
        { term: '금리 인상기 초', definition: '은행/보험' },
        { term: '금리 고점', definition: '경기방어주(필수소비/유틸)' },
        { term: '금리 인하 전환', definition: '리츠/장기채/성장주' },
      ]},
    ]},
    { day: 2, title: '환율과 무역수지', xp: 160, items: [
      { type: 'learn', emoji: '💱', title: '환율의 영향 채널', content: '원화 약세(원/달러 ↑)는 ①수출주 매출 환산 증가 ②수입원자재 비용 증가 ③외국인 자금 유출 압력. 모든 효과가 동시에 작용해 순영향은 기업·산업별로 다름.' },
      { type: 'calculation', question: '수출기업 X: 매출 100% 달러 결제, 환율 1,200원→1,320원. 매출 변화율은? (수량 동일)', options: ['+5%', '+10%', '+12%', '+15%'], answer: 1, formula: '환율 변화율 = (1320-1200)/1200 = 10%. 달러 매출이 동일해도 원화 환산 매출은 +10%' },
      { type: 'multiple_choice', question: '원/달러 환율 급등기에 상대적으로 유리한 기업은?', options: ['항공사 (외화 부채 많음)', '수입 의존 내수기업', '달러 매출 비중 높은 수출기업', '외화차입 비중 높은 부동산'], answer: 2, explanation: '달러 매출은 원화 환산 시 증가, 외화부채는 평가손 발생. 노출 방향이 핵심.' },
      { type: 'multiple_choice', question: '달러 강세(DXY 상승) 국면에서 신흥국 증시의 일반적 반응은?', options: ['외국인 자금 유출 → 약세 압력', '외국인 자금 유입', '무관', '거래량만 감소'], answer: 0, explanation: '글로벌 자금이 안전자산(달러/미국채)으로 이동. 신흥국은 자금 유출과 통화 약세의 악순환 위험.' },
      { type: 'calculation', question: '수출기업 영업이익률 10%, 환율 5% 상승. 수량·원가 동일 가정 시 새 영업이익률은?', options: ['10%', '약 14.3%', '약 15%', '약 20%'], answer: 1, formula: '매출 +5%, 원가 동일. 매출 105 - 원가 90 = 영업이익 15. 15/105 ≈ 14.3%' },
      { type: 'multiple_choice', question: '외화 부채가 많은 기업이 원화 약세 시 직면하는 위험은?', options: ['이자비용 감소', '환차손 발생, 부채 원화환산액 증가', '매출 증가', '신용등급 상승'], answer: 1, explanation: '외화부채는 환율 오를수록 원화환산액 증가 → 환산손실 + 실제 상환 부담 증가.' },
    ]},
    { day: 3, title: '인플레이션과 자산배분', xp: 160, items: [
      { type: 'learn', emoji: '🔥', title: '명목금리 vs 실질금리', content: '피셔방정식: 실질금리 ≈ 명목금리 - 인플레이션. 실질금리가 음수면 현금/예금은 실질가치 손실. 자산 보호를 위한 자산배분이 필수.' },
      { type: 'learn', emoji: '🛡️', title: '인플레이션 헤지 자산', content: '실물자산(부동산/금/원자재), 가격 전가력 강한 기업(브랜드 독점), TIPS(물가연동채). 장기 명목채와 현금은 가장 취약.' },
      { type: 'calculation', question: '명목금리 5%, 기대 인플레이션 3%. 실질금리는?', options: ['1%', '약 1.94%', '8%', '15%'], answer: 1, formula: '정확식: (1.05/1.03)-1 ≈ 1.94%. 근사식: 5%-3% = 2%' },
      { type: 'calculation', question: '명목수익 7%, 실제 인플레이션 9%. 실질 수익률은?', options: ['+2%', '약 -1.83%', '+16%', '0%'], answer: 1, formula: '(1.07/1.09)-1 ≈ -1.83%. 인플레이션이 명목수익을 초과하면 실질 손실' },
      { type: 'multiple_choice', question: '고인플레이션 + 저성장(스태그플레이션) 환경에서 가장 위험한 자산은?', options: ['실물자산', '장기 명목채와 무이익 성장주', '금', '원자재'], answer: 1, explanation: '장기 명목채: 인플레이션과 금리 모두에 취약. 무이익 성장주: 할인율 부담 + 실적 부진. 1970년대 미국이 대표 사례.' },
      { type: 'multiple_choice', question: '인플레이션 시기에 강한 기업의 공통 특징은?', options: ['가격 결정력(브랜드/독점)이 높아 원가 상승을 가격에 전가 가능', '부채가 많음', '저마진', '재고가 많음'], answer: 0, explanation: '비용 상승을 가격에 전가할 수 있는 기업은 마진을 방어. 코카콜라/애플/허쉬가 전형.' },
      { type: 'connect_match', question: '인플레이션 환경 자산 매칭', pairs: [
        { term: '강함', definition: '실물자산, 가격전가력 기업, TIPS' },
        { term: '중립', definition: '단기채, 변동금리부채' },
        { term: '약함', definition: '장기 명목채, 현금, 무이익 성장주' },
        { term: '복합', definition: '주식 (산업별 차이 큼)' },
      ]},
    ]},
    { day: 4, title: '경기순환과 섹터 로테이션', xp: 160, items: [
      { type: 'learn', emoji: '🔄', title: '경기 4단계', content: '회복(저점)→확장(호황)→후퇴(고점)→침체(저점). 주식시장은 실물경기보다 6~9개월 선행. 단계마다 강한 섹터가 다름.' },
      { type: 'learn', emoji: '🎯', title: '섹터 로테이션', content: '회복기: 경기민감(자동차/반도체). 확장기: 산업재/기술. 후퇴기: 에너지/원자재 후반. 침체기: 필수소비재/유틸리티/헬스케어(방어주).' },
      { type: 'multiple_choice', question: '경기 침체 후반(저점 근처)에서 가장 먼저 반등하는 섹터는?', options: ['필수소비재', '경기민감(자동차/소재/반도체)', '유틸리티', '제약'], answer: 1, explanation: '시장은 선행. 침체 후반 = 회복 초입을 가격에 반영. 경기민감주가 가장 먼저 매수됩니다.' },
      { type: 'multiple_choice', question: '경기 후퇴 신호 (PMI 50 하향, 실업률 상승)가 명확할 때 포트폴리오 액션은?', options: ['경기민감 비중 축소, 방어주/현금 비중 확대', '레버리지 확대', '신규 IPO 매수', '신흥국 비중 확대'], answer: 0, explanation: '경기 둔화기에는 베타 낮추기 + 현금 비중 확보가 정석.' },
      { type: 'multiple_choice', question: '확장기 후반(과열) 신호로 가장 강력한 것은?', options: ['실업률 사상 최저 + 인플레이션 가속 + 중앙은행 매파 전환', '신규 상장 감소', '국채 금리 하락', '거래량 정체'], answer: 0, explanation: '완전고용 + 인플레 + 매파 정책 = 침체 임박 신호. 1999, 2007, 2021 패턴.' },
      { type: 'multiple_choice', question: '주식이 실물경기에 6~9개월 선행한다는 사실의 함의는?', options: ['경기지표가 좋을 때 매수', '경기지표가 최악일 때 매수가 유리한 경우 많음 (시장이 이미 회복 가격)', '경기지표 무시', '단타만'], answer: 1, explanation: '\'뉴스가 최악일 때 사라\'는 격언의 실증적 근거. 단, 추세 확인 후.' },
      { type: 'connect_match', question: '경기 단계별 강세 섹터', pairs: [
        { term: '회복기', definition: '경기민감(자동차/반도체)' },
        { term: '확장기', definition: '산업재/IT/임의소비재' },
        { term: '후퇴기', definition: '에너지/원자재 (인플레 후반)' },
        { term: '침체기', definition: '필수소비재/유틸/헬스케어' },
      ]},
    ]},
    { day: 5, title: '매크로 지표 상관관계', xp: 280, items: [
      { type: 'learn', emoji: '📊', title: '핵심 지표 4종', content: 'CPI(물가): 통화정책 트리거. GDP(성장): 분기 발표, 경기 절대 수준. 실업률: 후행지표. PMI(50 기준): 선행, 50 위 확장/아래 수축.' },
      { type: 'learn', emoji: '🧭', title: '지표 간 우선순위', content: '실시간 시장에는 PMI/CPI > GDP/실업률(후행). 미국 비농업고용(NFP), CPI, FOMC가 가장 큰 변동성 이벤트.' },
      { type: 'calculation', question: 'GDP가 1,000조→1,030조. 성장률은?', options: ['1%', '2%', '3%', '5%'], answer: 2, formula: '(1030-1000)/1000 = 3%' },
      { type: 'multiple_choice', question: 'CPI 발표가 시장 예상치 +0.3%p 상회. 일반적 시장 반응은?', options: ['주가/채권가격 동시 하락, 달러 강세, 금리 상승', '주가 급등', '무반응', '환율 안정'], answer: 0, explanation: 'CPI 상회 → 매파 기대 강화 → 채권금리↑ → 할인율↑ → 주식 하락 + 달러 강세.' },
      { type: 'multiple_choice', question: '실업률이 사상 최저인데도 주식이 하락하는 경우의 해석은?', options: ['실업률은 후행지표, 시장은 다음 단계(과열→긴축)를 선반영', '경제 위기', '데이터 오류', '거래소 문제'], answer: 0, explanation: '\'좋은 뉴스가 나쁜 뉴스\' — 호황 정점 = 긴축 전환점. 시장은 미래를 가격에 반영합니다.' },
      { type: 'multiple_choice', question: 'PMI가 6개월 연속 50 미만이면 가장 합리적 결론은?', options: ['제조업 경기 수축 지속, 침체 가능성 부각', '주식 매수 적기 확정', '인플레이션 가속', '환율 안정'], answer: 0, explanation: 'PMI 50 미만 = 응답 기업 다수가 활동 축소. 6개월 지속이면 침체 진입 신호.' },
      { type: 'multiple_choice', question: 'CPI 상승 + GDP 성장 둔화 + 실업률 상승. 어떤 환경?', options: ['스태그플레이션 (1970년대형)', '디플레이션', '골디락스', '하이퍼인플레이션'], answer: 0, explanation: '인플레+저성장+실업 = 스태그플레이션. 통화정책으로 풀기 가장 어려운 환경.' },
      { type: 'connect_match', question: '지표와 성격', pairs: [
        { term: 'PMI', definition: '선행, 제조업/서비스 활동' },
        { term: 'CPI', definition: '동행, 통화정책 트리거' },
        { term: 'GDP', definition: '동행, 분기 절대 수준' },
        { term: '실업률', definition: '후행, 사이클 확인' },
      ]},
    ]},
  ],
};

const week12: CurriculumWeek = {
  week: 12, title: '포트폴리오 이론과 리스크 관리', level: 'expert', color: '#7C3AED', emoji: '🧭',
  days: [
    { day: 1, title: '현대 포트폴리오 이론 (MPT)', xp: 160, items: [
      { type: 'learn', emoji: '📚', title: '마코위츠의 통찰', content: '두 자산을 섞으면 개별 위험의 평균보다 낮은 위험 달성 가능. 핵심은 상관계수 ρ. ρ < 1이면 분산효과 발생. 효율적 프론티어 = 위험 대비 최대 수익 곡선.' },
      { type: 'learn', emoji: '📐', title: '2자산 분산 공식', content: 'σ²_p = w1²σ1² + w2²σ2² + 2·w1·w2·ρ·σ1·σ2. ρ = -1이면 위험 0(완전 헤지) 가능. 현실은 보통 0~+0.7.' },
      { type: 'calculation', question: 'ρ = +1 (완전 양의 상관)인 두 자산을 섞으면 분산효과는?', options: ['최대', '없음 — 단순 가중평균 위험', '음수 위험', '항상 0'], answer: 1, formula: 'ρ=1이면 σ_p = w1σ1 + w2σ2. 분산효과 0' },
      { type: 'multiple_choice', question: 'ρ = -1인 두 자산을 적절한 비중으로 섞으면 이론적 위험은?', options: ['항상 0 가능', '최대화', '변동 없음', '의미 없음'], answer: 0, explanation: '완전 음의 상관이면 한쪽 손실을 다른 쪽 이익이 정확히 상쇄. 이론적으로 σ=0 포트폴리오 구성 가능.' },
      { type: 'multiple_choice', question: '효율적 프론티어 위에 있다는 의미는?', options: ['주어진 위험에서 최대 기대수익 달성', '모든 자산을 100% 보유', '절대 손실 없음', '베타가 1'], answer: 0, explanation: '같은 위험에서 그보다 높은 수익은 불가, 같은 수익에서 그보다 낮은 위험은 불가. 파레토 최적.' },
      { type: 'multiple_choice', question: '실무에서 단순 분산투자만으로도 위험이 충분히 낮아지지 않는 이유는?', options: ['종목 간 상관관계가 위기 시 1에 가까워지는 경향(상관계수 위기 상승)', '거래수수료', '환율', '세금'], answer: 0, explanation: '평시 ρ=0.3이라도 금융위기 때 ρ→0.9. 분산효과는 평시 측정값이 위기에 무력화될 수 있음.' },
      { type: 'connect_match', question: '상관계수 의미', pairs: [
        { term: 'ρ = +1', definition: '완전 동조, 분산효과 없음' },
        { term: 'ρ = 0', definition: '무상관, 분산효과 있음' },
        { term: 'ρ = -1', definition: '완전 반대, 위험 0 가능' },
        { term: '0 < ρ < 1', definition: '부분 분산효과 (현실)' },
      ]},
    ]},
    { day: 2, title: 'CAPM과 베타', xp: 160, items: [
      { type: 'learn', emoji: '📈', title: 'CAPM 직관', content: '시장위험에 대한 보상만 받는다는 이론. 분산 가능한 개별 위험은 보상 없음. 체계적 위험(베타)만 가격에 반영됨.' },
      { type: 'learn', emoji: '🎚️', title: '베타 해석', content: 'β = 1: 시장과 동일. β > 1: 시장보다 변동성 큼(공격적). β < 1: 안정적(방어적). β < 0: 시장과 반대(금/일부 헤지자산).' },
      { type: 'calculation', question: 'Rf=3%, β=1.5, 시장수익률 10%. CAPM 기대수익률은?', options: ['10.5%', '12.0%', '13.5%', '15.0%'], answer: 2, formula: 'Re = 3% + 1.5×(10%-3%) = 3% + 10.5% = 13.5%' },
      { type: 'calculation', question: '시장이 -8%일 때 β=0.7 종목의 예상수익률 변화는? (Rf=2%)', options: ['약 -5%', '약 -7%', '약 -8%', '약 -11%'], answer: 0, formula: 'Re = 2% + 0.7×(-8%-2%) = 2% - 7% = -5%' },
      { type: 'multiple_choice', question: '같은 기대수익률에서 β=2 vs β=0.5 종목 중 효율적인 것은?', options: ['β=2 (수익 잠재력)', 'β=0.5 (낮은 위험으로 같은 수익 — 알파 존재 시사)', '동일', '판단불가'], answer: 1, explanation: '낮은 베타로 같은 수익이면 위험조정수익(샤프)가 높음. 실제로 \'저변동성 이상현상\'으로 학계에서 잘 알려진 효과.' },
      { type: 'multiple_choice', question: '실무에서 CAPM의 가장 큰 한계는?', options: ['β 추정의 시간 안정성 결여 + 단일요인 모델 한계 (FF 3·5요인 등장 배경)', '계산 복잡', '데이터 부족', '국내 미적용'], answer: 0, explanation: '베타가 시기·방법에 따라 크게 변하고, 단일 요인으로 수익을 모두 설명하기 어려워 다요인 모델이 발전.' },
    ]},
    { day: 3, title: '샤프비율 / 정보비율 / 알파', xp: 160, items: [
      { type: 'learn', emoji: '📏', title: '샤프비율', content: 'Sharpe = (Rp - Rf) / σp. 위험 1단위당 초과수익. 같은 수익이면 위험 낮을수록, 같은 위험이면 수익 높을수록 우수. 1.0 이상이면 양호, 2.0 이상이면 우수.' },
      { type: 'learn', emoji: '🎯', title: '알파와 정보비율', content: '알파(α) = 벤치마크 대비 초과수익. 정보비율(IR) = α / 추적오차(TE). IR 0.5 이상이면 능숙한 액티브 매니저로 평가.' },
      { type: 'calculation', question: '포트폴리오 수익 12%, Rf 3%, σ 15%. 샤프비율은?', options: ['0.4', '0.6', '0.8', '1.0'], answer: 1, formula: '(12-3)/15 = 9/15 = 0.6' },
      { type: 'calculation', question: 'A: 수익 15%, σ 20%. B: 수익 10%, σ 8%. Rf=2%. 샤프 비교는?', options: ['A 우월', 'B 우월', '동일', '판단불가'], answer: 1, formula: 'A: (15-2)/20=0.65. B: (10-2)/8=1.0. B의 위험조정수익이 우수' },
      { type: 'multiple_choice', question: '두 펀드가 같은 알파(α=2%)이지만 추적오차(TE)가 5% vs 10%면 더 우수한 펀드는?', options: ['TE 5% (정보비율 0.4)', 'TE 10% (정보비율 0.2)', '동일', '판단불가'], answer: 0, explanation: 'IR이 높을수록 일관성 있는 알파 창출. 운에 가까운 알파보다 실력에 가깝다는 신호.' },
      { type: 'multiple_choice', question: '높은 알파가 운인지 실력인지 판단할 가장 합리적 방법은?', options: ['IR과 알파의 통계적 유의성(t-stat) + 충분한 기간', '한 분기 수익', '뉴스 평판', '운용역 학력'], answer: 0, explanation: '단기 알파는 운 가능. 장기간(5년+) 일관된 IR이 실력의 증거.' },
      { type: 'multiple_choice', question: '\'시장보다 높은 수익\'을 봤을 때 가장 먼저 확인할 것은?', options: ['위험조정 수익(샤프) — 더 큰 위험으로 더 큰 수익을 낸 것일 수 있음', '단순 수익률', '운용역 SNS', '자산 규모'], answer: 0, explanation: '레버리지·고베타로 만든 \'알파\'는 진짜 알파가 아닙니다. 위험조정이 본질.' },
    ]},
    { day: 4, title: '옵션 기초와 헤징', xp: 160, items: [
      { type: 'learn', emoji: '📞', title: '콜과 풋', content: '콜옵션(Call): 살 권리. 주가 ↑ 수익. 풋옵션(Put): 팔 권리. 주가 ↓ 수익. 옵션 매수자는 손실 한정(프리미엄), 매도자는 손실 무한(콜 매도) 가능.' },
      { type: 'learn', emoji: '🛡️', title: '대표 헤징 전략', content: 'Protective Put(보호적 풋): 보유 주식 + 풋 매수 → 하방 방어. Covered Call(커버드 콜): 보유 주식 + 콜 매도 → 횡보장 수익. Collar: 풋 매수 + 콜 매도 동시.' },
      { type: 'calculation', question: '행사가 50,000원 콜 매수(프리미엄 2,000원). 만기 주가 55,000원. 손익은?', options: ['+3,000원', '+5,000원', '-2,000원', '+7,000원'], answer: 0, formula: 'Payoff = max(55000-50000, 0) - 2000 = 5000-2000 = +3,000원' },
      { type: 'calculation', question: '풋 매수(행사가 50,000, 프리미엄 1,500). 만기 주가 47,000원. 손익은?', options: ['-1,500원', '+1,500원', '+3,000원', '+4,500원'], answer: 1, formula: 'Payoff = max(50000-47000, 0) - 1500 = 3000-1500 = +1,500원' },
      { type: 'multiple_choice', question: '주식 1,000주 보유. 단기 변동성 우려로 하방을 막고 싶다면 가장 적합한 전략은?', options: ['보호적 풋(Protective Put) 매수', '콜 매도 단독', '주식 추가 매수', '레버리지 ETF'], answer: 0, explanation: '보유 + 풋매수 = 보험 가입 효과. 프리미엄이 비용이지만 큰 하락 보호.' },
      { type: 'multiple_choice', question: '커버드 콜(보유 + 콜 매도)이 가장 효과적인 시장 환경은?', options: ['급등장', '횡보·완만한 상승장', '급락장', '고변동성'], answer: 1, explanation: '횡보장에서는 매도한 콜이 행사되지 않아 프리미엄 수익만 누적. 급등 시 수익 상한 제한이 단점.' },
      { type: 'multiple_choice', question: '옵션 매도(특히 nakeded 콜)의 가장 큰 위험은?', options: ['이론적으로 무한 손실', '프리미엄 수익이 적음', '거래 불가', '세금'], answer: 0, explanation: '주가는 무한 상승 가능 → 콜 매도자의 손실도 무한. 반드시 보유주식이나 다른 옵션으로 헷지 필요.' },
    ]},
    { day: 5, title: '종합 시뮬레이션 — 의사결정', xp: 280, items: [
      { type: 'learn', emoji: '🧩', title: '의사결정 프레임', content: '①현재 시장 환경 진단(금리/인플레/경기) → ②자산배분 비중 결정 → ③섹터 로테이션 → ④종목 선정(밸류에이션/품질) → ⑤리스크 한도 설정 → ⑥리밸런싱 규칙.' },
      { type: 'multiple_choice', question: '시나리오 1: Fed 금리 인상 임박, CPI 4%, 실업률 3.5%, PMI 52. 가장 적합한 자산배분은?', options: ['장기채 비중 확대', '단기채/현금 비중 확대 + 가격전가력 강한 주식 유지', '레버리지 매수', '신흥국 비중 확대'], answer: 1, explanation: '금리 상승 환경 = 듀레이션 리스크 회피. 주식은 인플레 방어력 있는 우량 기업 위주.' },
      { type: 'multiple_choice', question: '시나리오 2: 인플레 5% + GDP -1% + 실업률 상승 (스태그플레이션). 가장 위험한 포지션은?', options: ['실물자산 + 가격전가력 우량주', '장기 명목채 + 무이익 성장주', '에너지/원자재', '필수소비재'], answer: 1, explanation: '스태그플레이션은 1970년대 패턴: 명목채와 성장주 동시 폭락. 실물자산과 가격전가 기업이 살아남음.' },
      { type: 'multiple_choice', question: '시나리오 3: 신생 포트폴리오 매니저 — IR 0.8, α 6%, 5년 트랙. 평가는?', options: ['일관된 알파, 능숙한 매니저로 평가 가능 (운 vs 실력 검증 충분)', '운에 불과', '판단 불가', '평범'], answer: 0, explanation: 'IR 0.5 이상 + 5년 일관된 트랙 = 학계에서 \'실력\' 인정 기준. 다만 향후 지속성은 별개.' },
      { type: 'calculation', question: 'A주식 60%(σ 20%), B채권 40%(σ 5%), ρ=0. 포트폴리오 σ는?', options: ['10%', '약 12.2%', '15%', '17%'], answer: 1, formula: 'σ²_p = 0.6²×20² + 0.4²×5² + 0 = 144 + 4 = 148. σ_p ≈ √148 ≈ 12.2%' },
      { type: 'calculation', question: '동일 포트폴리오의 기대수익이 8%, Rf 2%. 샤프비율은?', options: ['약 0.30', '약 0.49', '약 0.60', '약 0.80'], answer: 1, formula: '(8-2)/12.2 ≈ 0.49' },
      { type: 'multiple_choice', question: '12주 커리큘럼 종합 — 장기적으로 가장 중요한 단 하나의 원칙은?', options: ['단타 빈도 극대화', '명확한 투자 프로세스 + 위험 관리 + 일관된 실행', '레버리지 활용', '인플루언서 추종'], answer: 1, explanation: '워런 버핏, 레이 달리오 모두 공통: 프로세스·원칙·일관성. 단일 거래의 결과보다 의사결정 품질이 장기 성과를 결정.' },
      { type: 'connect_match', question: '12주 핵심 정리', pairs: [
        { term: 'DCF', definition: '미래 현금흐름의 현재가치 합' },
        { term: 'WACC', definition: '가중평균 자본조달비용' },
        { term: '효율적 프론티어', definition: '위험 대비 최대 수익 곡선' },
        { term: '샤프비율', definition: '위험 1단위당 초과수익' },
      ]},
    ]},
  ],
};

// ── 전체 커리큘럼 배열 ───────────────────────────

export const CURRICULUM: CurriculumWeek[] = [
  week1, week2, week3, week4,
  week5, week6, week7, week8,
  week9, week10, week11, week12,
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
