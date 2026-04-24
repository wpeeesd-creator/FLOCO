/**
 * MBTI → 투자 성향 매핑 & 유명 투자자 포트폴리오
 */

// ── 타입 ──────────────────────────────────────────

export interface PortfolioItem {
  ticker: string;
  weight: number;
  desc: string;
}

export interface InvestorProfile {
  id: string;
  name: string;
  style: string;
  portfolio: PortfolioItem[];
  quote: string;
  returnRate: string;
}

export interface MbtiMapping {
  type: string;
  animal: string;
  name: string;
  icon: string;
  keywords: [string, string, string];
}

export interface InvestTypeInfo {
  title: string;
  subtitle: string;
  color: string;
  gradient: readonly [string, string];
  description: string;
  strengths: [string, string];
  weaknesses: [string, string];
  strategy: string;
  recommendedStocks: Array<{ ticker: string; reason: string }>;
  warning: string;
}

// ── MBTI → 투자유형 매핑 (16개) ──────────────────

export const MBTI_MAP: Record<string, MbtiMapping> = {
  ENTJ: { type: 'aggressive', animal: '🦁', name: '황소형', icon: '조지 소로스', keywords: ['확신', '과감함', '승부사'] },
  ENTP: { type: 'aggressive', animal: '🐯', name: '호랑이형', icon: '드러켄밀러', keywords: ['기회포착', '혁신', '속도전'] },
  ESTP: { type: 'trader',     animal: '⚡', name: '번개형', icon: '폴 튜더 존스', keywords: ['순발력', '단기집중', '직감'] },
  ESTJ: { type: 'aggressive', animal: '🦅', name: '독수리형', icon: '칼 아이칸', keywords: ['실행력', '목표지향', '체계적'] },
  ENFJ: { type: 'growth',     animal: '🚀', name: '로켓형', icon: '캐시 우드', keywords: ['미래지향', '혁신믿음', '집중투자'] },
  ENFP: { type: 'growth',     animal: '🦋', name: '나비형', icon: '피터 린치', keywords: ['스토리텔링', '트렌드감지', '낙관주의'] },
  INFJ: { type: 'balanced',   animal: '🦊', name: '여우형', icon: '레이 달리오', keywords: ['균형감각', '장기비전', '원칙주의'] },
  INFP: { type: 'value',      animal: '🌱', name: '씨앗형', icon: '세스 클라만', keywords: ['가치중심', '신중함', 'ESG관심'] },
  INTJ: { type: 'value',      animal: '🦉', name: '올빼미형', icon: '워런 버핏', keywords: ['분석력', '장기보유', '독립적사고'] },
  INTP: { type: 'analytical',  animal: '🔭', name: '망원경형', icon: '짐 사이먼스', keywords: ['데이터분석', '시스템', '퀀트적사고'] },
  ISTJ: { type: 'dividend',   animal: '🏦', name: '금고형', icon: '존 네프', keywords: ['안정추구', '배당선호', '규칙준수'] },
  ISFJ: { type: 'dividend',   animal: '🐢', name: '거북이형', icon: '존 보글', keywords: ['꾸준함', '인덱스선호', '복리믿음'] },
  ESFJ: { type: 'balanced',   animal: '🐬', name: '돌고래형', icon: '데이비드 스웬슨', keywords: ['분산투자', '커뮤니티중시', '안정성장'] },
  ESFP: { type: 'momentum',   animal: '🦜', name: '앵무새형', icon: '데이비드 테퍼', keywords: ['트렌드추종', '사교적', '모멘텀'] },
  ISTP: { type: 'trader',     animal: '🐺', name: '늑대형', icon: '스티브 코헨', keywords: ['냉철함', '기술분석', '독립적'] },
  ISFP: { type: 'value',      animal: '🌿', name: '새싹형', icon: '필립 피셔', keywords: ['직관적', '성장주선호', '장기보유'] },
};

// ── 8가지 투자 유형 정보 ─────────────────────────

export const INVEST_TYPES: Record<string, InvestTypeInfo> = {
  aggressive: {
    title: '공격형 투자자', subtitle: '과감한 승부사',
    color: '#FF3B30', gradient: ['#FF3B30', '#FF6B35'] as const,
    description: '높은 수익을 위해 큰 위험도 과감히 감수합니다. 변동성이 큰 종목을 선호하고 빠른 판단력이 강점이에요.',
    strengths: ['빠른 결단력과 높은 수익 잠재성', '트렌드 파악과 기회 포착 능력'],
    weaknesses: ['감정적 매매로 큰 손실 위험', '과도한 집중 투자 위험'],
    strategy: '성장주 70% + 테마주 20% + 현금 10%',
    recommendedStocks: [
      { ticker: 'NVDA', reason: 'AI 혁명의 핵심' }, { ticker: 'TSLA', reason: '전기차 성장' },
      { ticker: 'PLTR', reason: 'AI 데이터' }, { ticker: 'AMD', reason: '반도체 도전자' },
      { ticker: 'MSTR', reason: 'BTC 레버리지' }, { ticker: 'COIN', reason: '크립토 인프라' },
    ],
    warning: '원금의 30% 이상 손실 시 포트폴리오 재검토 필요',
  },
  growth: {
    title: '성장형 투자자', subtitle: '미래를 사는 혁신가',
    color: '#FF2D55', gradient: ['#FF2D55', '#FF6090'] as const,
    description: '미래 성장 가능성에 투자합니다. 혁신 기업을 발굴하고 장기 보유하며 텐배거를 꿈꿔요.',
    strengths: ['혁신 기업 발굴 능력', '미래 트렌드 예측 감각'],
    weaknesses: ['단기 수익에 취약', '과대평가 종목에 매수 위험'],
    strategy: '핵심 성장주 60% + 혁신 테마 30% + 현금 10%',
    recommendedStocks: [
      { ticker: 'AMZN', reason: '클라우드+이커머스' }, { ticker: 'MSFT', reason: 'AI+클라우드' },
      { ticker: 'NFLX', reason: '스트리밍 1위' }, { ticker: 'SHOP', reason: '이커머스 성장' },
      { ticker: 'CRWD', reason: '사이버보안' }, { ticker: 'ABNB', reason: '여행 플랫폼' },
    ],
    warning: '혁신주는 변동성이 크므로 분산 필수',
  },
  balanced: {
    title: '균형형 투자자', subtitle: '조화로운 전략가',
    color: '#0066FF', gradient: ['#0066FF', '#3399FF'] as const,
    description: '안정성과 수익성의 균형을 추구합니다. 장기적 관점으로 꾸준한 수익을 목표로 해요.',
    strengths: ['균형 잡힌 포트폴리오', '감정에 흔들리지 않는 원칙'],
    weaknesses: ['큰 수익 기회를 놓칠 수 있음', '트렌드에 늦게 반응'],
    strategy: '우량주 50% + 성장주 30% + 현금 20%',
    recommendedStocks: [
      { ticker: 'AAPL', reason: '안정적 성장' }, { ticker: 'MSFT', reason: '클라우드+AI' },
      { ticker: 'JPM', reason: '금융 안정성' }, { ticker: 'V', reason: '결제 인프라' },
      { ticker: 'HD', reason: '소비재 안정' }, { ticker: 'UNH', reason: '헬스케어 독점' },
    ],
    warning: '리밸런싱을 분기마다 체크하세요',
  },
  value: {
    title: '가치형 투자자', subtitle: '인내의 현자',
    color: '#34C759', gradient: ['#34C759', '#28A745'] as const,
    description: '기업의 본질적 가치를 분석하고 저평가된 종목에 장기 투자합니다. 안전마진을 중시해요.',
    strengths: ['철저한 기업 분석 능력', '장기적으로 높은 성공률'],
    weaknesses: ['매수 타이밍을 놓칠 수 있음', '성장주 기회 포기'],
    strategy: '가치주 50% + 우량 성장주 30% + 현금 20%',
    recommendedStocks: [
      { ticker: 'AAPL', reason: '브랜드 해자' }, { ticker: 'GOOGL', reason: '광고 독점' },
      { ticker: 'BAC', reason: '저평가 금융' }, { ticker: 'META', reason: '저PER 기술주' },
      { ticker: 'KO', reason: '배당+가치' }, { ticker: 'CVX', reason: '에너지 가치' },
    ],
    warning: '가치 함정에 빠지지 않도록 실적 추이 확인',
  },
  analytical: {
    title: '분석형 투자자', subtitle: '데이터의 마법사',
    color: '#5856D6', gradient: ['#5856D6', '#7B68EE'] as const,
    description: '데이터와 시스템으로 투자합니다. 감정을 배제한 냉철한 판단과 퀀트적 사고가 강점이에요.',
    strengths: ['데이터 기반 객관적 판단', '리스크 사전 파악 능력'],
    weaknesses: ['분석 과다로 타이밍 놓침', '직감적 기회 무시'],
    strategy: '퀀트 스크리닝 40% + 가치주 40% + 현금 20%',
    recommendedStocks: [
      { ticker: 'NVDA', reason: 'AI 데이터 처리' }, { ticker: 'MSFT', reason: 'R&D 최고' },
      { ticker: 'GOOGL', reason: '데이터 우위' }, { ticker: 'AVGO', reason: '반도체 마진' },
      { ticker: 'TMO', reason: '과학기기 독점' }, { ticker: 'ACN', reason: 'IT 컨설팅' },
    ],
    warning: '분석에만 집중하다 좋은 매수 타이밍을 놓칠 수 있어요',
  },
  trader: {
    title: '트레이더형', subtitle: '시장의 서퍼',
    color: '#FF9500', gradient: ['#FF9500', '#FFB347'] as const,
    description: '빠른 매매로 단기 수익을 추구합니다. 차트와 기술적 지표에 능숙하고 시장 흐름을 탑니다.',
    strengths: ['빠른 시장 반응 속도', '엄격한 손절 원칙'],
    weaknesses: ['높은 거래 비용과 심리적 스트레스', '장기 복리 효과 제한'],
    strategy: '모멘텀주 60% + 현금 40% (회전)',
    recommendedStocks: [
      { ticker: 'TSLA', reason: '높은 변동성' }, { ticker: 'NVDA', reason: 'AI 모멘텀' },
      { ticker: 'AMD', reason: '반도체 변동성' }, { ticker: 'COIN', reason: '크립토 연동' },
      { ticker: 'META', reason: '실적 모멘텀' }, { ticker: 'SPY', reason: '시장 방향성' },
    ],
    warning: '손절 -5% 원칙 철저 준수',
  },
  dividend: {
    title: '배당형 투자자', subtitle: '현금흐름의 달인',
    color: '#00C7BE', gradient: ['#00C7BE', '#008F8A'] as const,
    description: '안정적인 배당 수익과 복리를 추구합니다. 꾸준한 현금흐름과 원금 보존이 핵심이에요.',
    strengths: ['손실 최소화와 안정적 현금흐름', '시장 하락 시 상대적 방어력'],
    weaknesses: ['성장주 수익 기회를 놓침', '인플레이션 대비 실질수익 낮을 수 있음'],
    strategy: '고배당주 40% + 배당ETF 40% + 현금 20%',
    recommendedStocks: [
      { ticker: 'T', reason: '고배당 7%+' }, { ticker: 'VZ', reason: '통신 안정배당' },
      { ticker: 'KO', reason: '배당왕 60년' }, { ticker: 'JNJ', reason: '헬스케어 배당' },
      { ticker: 'O', reason: '월배당 리츠' }, { ticker: 'MO', reason: '고배당 담배' },
    ],
    warning: '배당률만 보지 말고 배당 지속가능성을 확인하세요',
  },
  momentum: {
    title: '모멘텀형 투자자', subtitle: '트렌드의 파도타기',
    color: '#AF52DE', gradient: ['#AF52DE', '#8A2BE2'] as const,
    description: '시장의 흐름과 트렌드를 따라갑니다. 상승 모멘텀을 포착해 올라타는 전략이에요.',
    strengths: ['트렌드 포착 능력과 유연한 대응', '상승장에서 최대 수익 가능'],
    weaknesses: ['추세 전환 시 큰 손실 위험', '과열 구간 진입 가능성'],
    strategy: '모멘텀 상위주 50% + 시장ETF 30% + 현금 20%',
    recommendedStocks: [
      { ticker: 'NVDA', reason: 'AI 슈퍼트렌드' }, { ticker: 'META', reason: '광고 회복' },
      { ticker: 'AMZN', reason: '클라우드 반등' }, { ticker: 'LLY', reason: '비만약 트렌드' },
      { ticker: 'UBER', reason: '흑자전환' }, { ticker: 'GOOGL', reason: 'AI 편승' },
    ],
    warning: '모멘텀이 꺾이면 빠르게 대응하세요',
  },
};

// ── 투자유형별 투자자 매핑 ───────────────────────

const INVESTORS: Record<string, InvestorProfile> = {
  soros: {
    id: 'soros', name: '조지 소로스', style: '반사성 이론',
    portfolio: [
      { ticker: 'NVDA', weight: 18, desc: 'AI 붐 편승' },
      { ticker: 'AMZN', weight: 14, desc: '클라우드 모멘텀' },
      { ticker: 'ELV', weight: 12, desc: '헬스케어 트렌드' },
      { ticker: 'LLY', weight: 10, desc: '비만약 모멘텀' },
      { ticker: 'SPY', weight: 8, desc: '시장 방향성' },
    ],
    quote: '시장은 항상 어느 방향으로 편향되어 있다',
    returnRate: '+30%/년',
  },
  druckenmiller: {
    id: 'druckenmiller', name: '드러켄밀러', style: '매크로 모멘텀',
    portfolio: [
      { ticker: 'NVDA', weight: 20, desc: 'AI 모멘텀 1위' },
      { ticker: 'MSFT', weight: 15, desc: 'AI 수혜' },
      { ticker: 'META', weight: 12, desc: '광고 모멘텀' },
      { ticker: 'AAPL', weight: 10, desc: '서비스 전환' },
      { ticker: 'AMZN', weight: 10, desc: '클라우드 성장' },
    ],
    quote: '틀렸을 때 빨리 인정하고 포지션을 바꿔라',
    returnRate: '+30%/년',
  },
  cathie_wood: {
    id: 'cathie_wood', name: '캐시 우드', style: '파괴적 혁신',
    portfolio: [
      { ticker: 'TSLA', weight: 12, desc: '에너지 전환 핵심' },
      { ticker: 'COIN', weight: 8, desc: '크립토 인프라' },
      { ticker: 'PLTR', weight: 7, desc: 'AI 데이터' },
      { ticker: 'NVDA', weight: 6, desc: 'AI 가속기' },
      { ticker: 'U', weight: 5, desc: '3D 플랫폼' },
    ],
    quote: '혁신은 지수적으로 성장한다',
    returnRate: '+149%/−75%',
  },
  peter_lynch: {
    id: 'peter_lynch', name: '피터 린치', style: '텐배거 사냥꾼',
    portfolio: [
      { ticker: 'SBUX', weight: 20, desc: '직접 보고 발굴' },
      { ticker: 'MCD', weight: 15, desc: '성장형 소비재' },
      { ticker: 'NFLX', weight: 12, desc: '린치식 스토리' },
      { ticker: 'WMT', weight: 10, desc: '소매 성장' },
      { ticker: 'HD', weight: 8, desc: '확장 가능 모델' },
    ],
    quote: '알고 있는 것에 투자하라',
    returnRate: '+29%/년',
  },
  buffett: {
    id: 'buffett', name: '워런 버핏', style: '가치투자의 아버지',
    portfolio: [
      { ticker: 'AAPL', weight: 45, desc: '브랜드 해자' },
      { ticker: 'BAC', weight: 10, desc: '금융 안정성' },
      { ticker: 'AXP', weight: 8, desc: '50년 보유' },
      { ticker: 'KO', weight: 7, desc: '30년 보유' },
      { ticker: 'CVX', weight: 5, desc: '에너지 헤지' },
    ],
    quote: '좋은 기업을 적당한 가격에 사라',
    returnRate: '+20%/년',
  },
  klarman: {
    id: 'klarman', name: '세스 클라만', style: '안전마진 절대주의',
    portfolio: [
      { ticker: 'META', weight: 20, desc: '저평가 시 매수' },
      { ticker: 'QRVO', weight: 15, desc: '반도체 틈새' },
      { ticker: 'NXPI', weight: 10, desc: '차량용 반도체' },
      { ticker: 'INTC', weight: 10, desc: '가치 반도체' },
      { ticker: 'GOOGL', weight: 8, desc: '독점 플랫폼' },
    ],
    quote: '손실을 피하는 것이 수익보다 중요하다',
    returnRate: '+20%/년',
  },
  philip_fisher: {
    id: 'philip_fisher', name: '필립 피셔', style: '성장주 장기보유',
    portfolio: [
      { ticker: 'MSFT', weight: 25, desc: 'R&D 최강' },
      { ticker: 'AMZN', weight: 20, desc: '확장하는 해자' },
      { ticker: 'GOOGL', weight: 18, desc: '기술 독점' },
      { ticker: 'NVDA', weight: 15, desc: 'AI 인프라' },
      { ticker: 'META', weight: 12, desc: '네트워크 효과' },
    ],
    quote: '훌륭한 기업은 절대 팔지 마라',
    returnRate: '+20%/년 이상',
  },
  dalio: {
    id: 'dalio', name: '레이 달리오', style: '올웨더 포트폴리오',
    portfolio: [
      { ticker: 'SPY', weight: 30, desc: '주식 30%' },
      { ticker: 'TLT', weight: 40, desc: '장기채 40%' },
      { ticker: 'IEF', weight: 15, desc: '중기채 15%' },
      { ticker: 'GLD', weight: 8, desc: '금 8%' },
      { ticker: 'QQQ', weight: 7, desc: '기술주 7%' },
    ],
    quote: '어떤 경제 환경에서도 생존하라',
    returnRate: '+7~12%/년',
  },
  swensen: {
    id: 'swensen', name: '데이비드 스웬슨', style: '예일 모델',
    portfolio: [
      { ticker: 'VTI', weight: 30, desc: '미국 주식' },
      { ticker: 'VEU', weight: 15, desc: '해외 선진국' },
      { ticker: 'VWO', weight: 10, desc: '신흥국' },
      { ticker: 'VNQ', weight: 20, desc: '부동산 리츠' },
      { ticker: 'IEF', weight: 15, desc: '미국채' },
    ],
    quote: '분산은 공짜 점심이다',
    returnRate: '+13.7%/년',
  },
  simons: {
    id: 'simons', name: '짐 사이먼스', style: '퀀트 투자의 신',
    portfolio: [
      { ticker: 'NVDA', weight: 15, desc: 'AI 데이터' },
      { ticker: 'MSFT', weight: 12, desc: '클라우드 인프라' },
      { ticker: 'GOOGL', weight: 10, desc: '검색 데이터' },
      { ticker: 'AVGO', weight: 8, desc: '반도체 마진' },
      { ticker: 'META', weight: 8, desc: '광고 알고리즘' },
    ],
    quote: '시장에서 패턴을 찾아내라',
    returnRate: '+66%/년',
  },
  tudor_jones: {
    id: 'tudor_jones', name: '폴 튜더 존스', style: '기술적 분석 + 매크로',
    portfolio: [
      { ticker: 'SPY', weight: 30, desc: '코어 포지션' },
      { ticker: 'QQQ', weight: 25, desc: '기술주 모멘텀' },
      { ticker: 'TLT', weight: 20, desc: '금리 방향성' },
      { ticker: 'GLD', weight: 10, desc: '인플레이션 헤지' },
      { ticker: 'EEM', weight: 10, desc: '신흥국 알파' },
    ],
    quote: '승자는 손실을 증오한다',
    returnRate: '+20%/년 이상',
  },
  steve_cohen: {
    id: 'steve_cohen', name: '스티브 코헨', style: '퀀트+재량 단기',
    portfolio: [
      { ticker: 'NVDA', weight: 15, desc: 'AI 모멘텀' },
      { ticker: 'MSFT', weight: 12, desc: 'AI 핵심' },
      { ticker: 'AMZN', weight: 10, desc: '클라우드 성장' },
      { ticker: 'META', weight: 8, desc: '광고 회복' },
      { ticker: 'LLY', weight: 7, desc: '비만약 트렌드' },
    ],
    quote: '시장은 매일 새로운 기회를 준다',
    returnRate: '+30%/년',
  },
  john_neff: {
    id: 'john_neff', name: '존 네프', style: '저PER 고배당',
    portfolio: [
      { ticker: 'T', weight: 20, desc: '고배당 통신' },
      { ticker: 'VZ', weight: 15, desc: '안정 배당' },
      { ticker: 'MO', weight: 12, desc: '담배 고배당' },
      { ticker: 'KO', weight: 10, desc: '배당 귀족' },
      { ticker: 'JNJ', weight: 10, desc: '60년 연속 배당' },
    ],
    quote: '저평가된 배당주가 최고의 투자다',
    returnRate: '+13.7%/년',
  },
  bogle: {
    id: 'bogle', name: '존 보글', style: '인덱스 투자의 아버지',
    portfolio: [
      { ticker: 'SPY', weight: 60, desc: 'S&P500 인덱스' },
      { ticker: 'QQQ', weight: 20, desc: '나스닥 인덱스' },
      { ticker: 'IEF', weight: 20, desc: '채권' },
    ],
    quote: '투자의 첫 번째 원칙은 단순함이다',
    returnRate: '+10%/년',
  },
  tepper: {
    id: 'tepper', name: '데이비드 테퍼', style: '위기 역발상',
    portfolio: [
      { ticker: 'META', weight: 20, desc: '2023 최대 수혜' },
      { ticker: 'AMZN', weight: 15, desc: '클라우드 반등' },
      { ticker: 'GOOGL', weight: 12, desc: '광고 회복' },
      { ticker: 'MSFT', weight: 10, desc: 'AI 모멘텀' },
      { ticker: 'UBER', weight: 8, desc: '흑자전환' },
    ],
    quote: '공포에 사고 탐욕에 팔아라',
    returnRate: '+120% (2009)',
  },
};

export const TYPE_TO_INVESTORS: Record<string, string[]> = {
  aggressive:  ['soros', 'druckenmiller', 'cathie_wood'],
  growth:      ['cathie_wood', 'peter_lynch', 'philip_fisher'],
  balanced:    ['dalio', 'swensen', 'peter_lynch'],
  value:       ['buffett', 'klarman', 'philip_fisher'],
  analytical:  ['simons', 'buffett', 'klarman'],
  trader:      ['tudor_jones', 'steve_cohen', 'tepper'],
  dividend:    ['john_neff', 'bogle', 'buffett'],
  momentum:    ['tepper', 'druckenmiller', 'soros'],
};

export function getInvestorsForType(typeKey: string): InvestorProfile[] {
  const ids = TYPE_TO_INVESTORS[typeKey] ?? TYPE_TO_INVESTORS.balanced;
  return ids.map(id => INVESTORS[id]).filter(Boolean);
}

// ── 보유종목 궁합 점수 ──────────────────────────

const SECTOR_AFFINITY: Record<string, Record<string, number>> = {
  aggressive:  { '기술': 95, '반도체': 90, 'AI': 95, '전기차': 85, '클라우드': 88, '핀테크': 82, '이커머스': 80 },
  growth:      { '기술': 90, '클라우드': 92, '이커머스': 88, '소비재': 75, '미디어': 80, '헬스케어': 72 },
  balanced:    { '기술': 80, '금융': 82, '소비재': 85, '헬스케어': 80, 'ETF': 90, '반도체': 75 },
  value:       { '금융': 90, '소비재': 85, '에너지': 82, '헬스케어': 80, '기술': 75, '소재': 78 },
  analytical:  { '반도체': 92, '기술': 90, '헬스케어': 85, '클라우드': 88, '금융': 78, 'AI': 95 },
  trader:      { '반도체': 88, '기술': 85, '전기차': 82, 'AI': 90, '금융': 75, 'ETF': 80 },
  dividend:    { '금융': 92, '통신': 90, '에너지': 85, '소비재': 88, '헬스케어': 82, '부동산': 90 },
  momentum:    { '기술': 92, 'AI': 95, '헬스케어': 80, '소비재': 78, '반도체': 88, '클라우드': 85 },
};

export function getStockCompatibility(ticker: string, investType: string, sector?: string): number {
  const typeInfo = INVEST_TYPES[investType];
  if (!typeInfo) return 60;
  if (typeInfo.recommendedStocks.some(s => s.ticker === ticker)) return 92 + Math.floor(Math.random() * 6);
  const affinity = SECTOR_AFFINITY[investType];
  if (affinity && sector && affinity[sector]) return affinity[sector];
  return 55 + Math.floor(Math.random() * 15);
}
