// ── Backward-compatible legacy types ──
export type Level = '입문' | '초급' | '중급' | '고급';
export type QuizType = 'ox' | 'multiple';

export interface QuizOption { id: string; text: string; }
export interface Quiz {
  id: string; type: QuizType; question: string;
  options?: QuizOption[]; answer: string; explanation: string;
}
export interface LessonPage { title: string; content: string; emoji: string; }
export interface Course {
  id: string; title: string; desc: string; emoji: string;
  level: Level; pages: LessonPage[]; quizzes: Quiz[];
}

export const LEVELS: Level[] = ['입문', '초급', '중급', '고급'];
export const LEVEL_EMOJI: Record<Level, string> = { 입문: '🌱', 초급: '📗', 중급: '📘', 고급: '🏆' };
export const LEVEL_COLOR: Record<Level, string> = { 입문: '#2ECC71', 초급: '#1A7FD4', 중급: '#9B59B6', 고급: '#E67E22' };

export const COURSES: Course[] = [
  {
    id: 'intro_1', title: '주식이란 무엇인가', desc: '주식의 기본 개념', emoji: '📈', level: '입문',
    pages: [
      { emoji: '🏢', title: '주식이란?', content: '주식(株式)은 회사의 소유권을 나타내는 증서예요.\n\n삼성전자 주식 1주를 사면 당신은 삼성전자의 아주 작은 부분의 주인이 됩니다.\n\n주주(주식 소유자)는 두 가지 방법으로 수익을 얻어요.\n• 배당금: 회사가 이익을 낼 때 나눠주는 돈\n• 시세차익: 주가가 오를 때 팔아서 얻는 이익' },
      { emoji: '💰', title: '왜 회사는 주식을 발행할까요?', content: '회사가 성장하려면 자금이 필요해요.\n\n은행에서 빌리는 것 외에, 주식을 팔아서 투자자로부터 자금을 모을 수 있어요. 이를 IPO(기업공개)라고 해요.\n\n주식을 사는 사람은 투자자가 되고, 회사가 성장하면 함께 이익을 나눌 수 있어요.' },
      { emoji: '📊', title: '주가는 왜 변할까요?', content: '주가는 수요와 공급에 따라 결정돼요.\n\n• 사려는 사람 > 팔려는 사람 → 주가 상승 ▲\n• 팔려는 사람 > 사려는 사람 → 주가 하락 ▼\n\n회사 실적, 경제 상황, 뉴스 등 다양한 요인이 주가에 영향을 미쳐요.' },
    ],
    quizzes: [
      { id: 'q1', type: 'ox', question: '주식을 사면 그 회사의 일부를 소유하게 됩니다.', answer: 'O', explanation: '맞아요! 주식은 회사 소유권의 일부를 나타내는 증서예요.' },
      { id: 'q2', type: 'multiple', question: '주가가 상승하는 경우는?', answer: 'b',
        options: [{ id: 'a', text: '팔려는 사람이 더 많을 때' }, { id: 'b', text: '사려는 사람이 더 많을 때' }, { id: 'c', text: '거래가 없을 때' }, { id: 'd', text: '회사가 손실을 냈을 때' }],
        explanation: '수요(사려는 사람)가 공급(팔려는 사람)보다 많으면 주가가 올라요.' },
      { id: 'q3', type: 'ox', question: '회사는 주식을 팔아서 자금을 조달할 수 있습니다.', answer: 'O', explanation: 'IPO(기업공개)를 통해 주식을 팔아 자금을 모으는 방식이에요.' },
    ],
  },
  {
    id: 'intro_2', title: '주식시장의 구조', desc: '코스피, 코스닥, 나스닥', emoji: '🏛️', level: '입문',
    pages: [
      { emoji: '🏢', title: '주식시장이란?', content: '주식시장은 주식을 사고파는 공간이에요.\n\n마치 농수산물 시장에서 채소를 사고팔 듯, 주식시장에서는 기업의 주식을 사고팔아요.\n\n현재는 대부분 온라인(HTS/MTS)으로 거래가 이뤄져요.' },
      { emoji: '🇰🇷', title: '한국 주식시장', content: '한국에는 크게 두 시장이 있어요.\n\n📌 코스피(KOSPI)\n한국 대표 대형주 시장. 삼성전자, SK하이닉스, 현대차 등 대기업이 상장.\n\n📌 코스닥(KOSDAQ)\n중소·벤처기업 중심 시장. 카카오, 셀트리온 등이 있어요.' },
      { emoji: '🇺🇸', title: '미국 주식시장', content: '미국에는 세계 최대 주식시장이 있어요.\n\n📌 뉴욕증권거래소(NYSE)\n세계에서 가장 크고 오래된 거래소. JP모건, 코카콜라 등 상장.\n\n📌 나스닥(NASDAQ)\n기술주 중심. 애플, 구글, 엔비디아 등 빅테크 상장.' },
    ],
    quizzes: [
      { id: 'q1', type: 'multiple', question: '한국의 대형주 중심 주식시장은?', answer: 'c',
        options: [{ id: 'a', text: '나스닥' }, { id: 'b', text: '코스닥' }, { id: 'c', text: '코스피' }, { id: 'd', text: 'NYSE' }],
        explanation: '코스피는 삼성전자, 현대차 등 한국 대기업이 상장된 대형주 시장이에요.' },
      { id: 'q2', type: 'ox', question: '나스닥은 미국의 기술주 중심 주식시장입니다.', answer: 'O', explanation: '애플, 구글, 메타, 엔비디아 같은 기술주 중심의 미국 주식시장이에요.' },
      { id: 'q3', type: 'multiple', question: '코스닥에 대한 설명으로 올바른 것은?', answer: 'b',
        options: [{ id: 'a', text: '미국 중소기업 시장' }, { id: 'b', text: '한국 중소·벤처기업 중심 시장' }, { id: 'c', text: '한국 대형주 중심 시장' }, { id: 'd', text: '일본 주식시장' }],
        explanation: '코스닥은 한국의 중소·벤처기업 중심 주식시장이에요.' },
    ],
  },
  {
    id: 'intro_3', title: '주식 용어 기초', desc: '시가, 종가, 거래량, 시가총액', emoji: '📖', level: '입문',
    pages: [
      { emoji: '🕰️', title: '시가와 종가', content: '📌 시가(始價, Opening Price)\n하루 중 처음으로 거래된 가격\n\n📌 종가(終價, Closing Price)\n하루 중 마지막으로 거래된 가격\n\n한국 주식시장 운영 시간: 오전 9시 ~ 오후 3시 30분' },
      { emoji: '📊', title: '거래량과 시가총액', content: '📌 거래량(Volume)\n하루 동안 거래된 주식의 수량\n거래량 급증 = 투자자 관심 증가 신호\n\n📌 시가총액(Market Cap)\n현재 주가 × 총 발행 주식 수\n\n예: 삼성전자 주가 73,000원 × 60억 주 ≈ 438조원' },
      { emoji: '↕️', title: '고가와 저가', content: '📌 고가(High): 하루 중 가장 높았던 가격\n📌 저가(Low): 하루 중 가장 낮았던 가격\n\n이 네 가지 가격(시가·종가·고가·저가)을 합쳐 OHLC라고 해요.\n\n캔들 차트에서 고가·저가는 위아래 꼬리(심지)로 표현돼요.' },
    ],
    quizzes: [
      { id: 'q1', type: 'multiple', question: '하루 중 처음으로 거래된 가격은?', answer: 'b',
        options: [{ id: 'a', text: '종가' }, { id: 'b', text: '시가' }, { id: 'c', text: '고가' }, { id: 'd', text: '저가' }],
        explanation: '시가(始價)는 하루 중 처음으로 거래된 가격이에요.' },
      { id: 'q2', type: 'ox', question: '시가총액 = 현재 주가 × 총 발행 주식 수 입니다.', answer: 'O', explanation: '맞아요! 기업의 전체 가치를 나타내는 지표예요.' },
      { id: 'q3', type: 'ox', question: '거래량이 많다는 것은 투자자 관심이 낮다는 의미입니다.', answer: 'X', explanation: '거래량이 많으면 투자자들의 관심이 높다는 신호예요.' },
    ],
  },
  {
    id: 'basic_1', title: '캔들차트 보는 법', desc: '양봉, 음봉, 꼬리의 의미', emoji: '🕯️', level: '초급',
    pages: [
      { emoji: '📊', title: '캔들차트란?', content: '캔들차트(Candlestick Chart)는 주가 움직임을 시각적으로 보여주는 차트예요.\n\n하나의 캔들이 특정 기간의 4가지 가격을 담고 있어요.\n• 시가, 종가, 고가, 저가' },
      { emoji: '🔴🔵', title: '양봉과 음봉', content: '📌 양봉 (빨간색) 🔴\n종가 > 시가 → 주가 상승!\n\n📌 음봉 (파란색) 🔵\n종가 < 시가 → 주가 하락\n\n주의: 한국은 오름=빨간색, 내림=파란색\n미국은 오름=초록색, 내림=빨간색이에요.' },
      { emoji: '↕️', title: '캔들의 꼬리(심지)', content: '캔들 위아래의 얇은 선을 꼬리(심지)라고 해요.\n\n📌 위 꼬리: 고가까지 올랐다가 내려온 것 → 매도 압력\n📌 아래 꼬리: 저가까지 내렸다가 반등 → 매수 세력\n\n꼬리가 길수록 그날 가격 변동이 컸다는 의미예요.' },
    ],
    quizzes: [
      { id: 'q1', type: 'multiple', question: '양봉이 의미하는 것은?', answer: 'b',
        options: [{ id: 'a', text: '종가 < 시가' }, { id: 'b', text: '종가 > 시가' }, { id: 'c', text: '거래량 증가' }, { id: 'd', text: '시가 = 종가' }],
        explanation: '양봉은 종가가 시가보다 높을 때, 즉 주가가 상승했을 때 나타나요.' },
      { id: 'q2', type: 'ox', question: '아래 꼬리가 길수록 매수 세력이 강했다는 신호입니다.', answer: 'O', explanation: '아래 꼬리는 저가까지 내려갔다 반등한 것으로, 매수 세력이 강하다는 의미예요.' },
      { id: 'q3', type: 'multiple', question: '한국 주식시장에서 음봉의 색깔은?', answer: 'c',
        options: [{ id: 'a', text: '빨간색' }, { id: 'b', text: '초록색' }, { id: 'c', text: '파란색' }, { id: 'd', text: '노란색' }],
        explanation: '한국에서는 오름=빨간색(양봉), 내림=파란색(음봉)이에요.' },
    ],
  },
  {
    id: 'basic_2', title: '이동평균선 이해하기', desc: '5일선, 20일선, 골든크로스', emoji: '📉', level: '초급',
    pages: [
      { emoji: '📈', title: '이동평균선(MA)이란?', content: '이동평균선(Moving Average)은 일정 기간 동안의 평균 주가를 연결한 선이에요.\n\n예) 5일선 = 최근 5일 종가의 평균\n\n단기(5일, 20일), 중기(60일), 장기(120일) 이동평균선을 주로 활용해요.' },
      { emoji: '⭐', title: '골든크로스와 데드크로스', content: '📌 골든크로스 ⭐\n단기선이 장기선을 위로 돌파!\n→ 매수 신호 (상승 추세 예상)\n\n📌 데드크로스 💀\n단기선이 장기선을 아래로 돌파!\n→ 매도 신호 (하락 추세 예상)' },
      { emoji: '🎯', title: '이동평균선 활용', content: '📌 지지선 역할\n주가가 이동평균선에서 반등하는 경우가 많아요.\n\n📌 저항선 역할\n상승하던 주가가 이동평균선에서 막히는 경우도 있어요.\n\n주의: 이동평균선은 과거 데이터 기반이라 미래를 완벽히 예측하지 못해요.' },
    ],
    quizzes: [
      { id: 'q1', type: 'ox', question: '5일 이동평균선은 최근 5일 종가의 평균을 연결한 선입니다.', answer: 'O', explanation: 'n일 이동평균 = 최근 n일 종가 합계 ÷ n으로 계산해요.' },
      { id: 'q2', type: 'multiple', question: '골든크로스(Golden Cross)는?', answer: 'b',
        options: [{ id: 'a', text: '단기선이 장기선을 아래로 돌파' }, { id: 'b', text: '단기선이 장기선을 위로 돌파' }, { id: 'c', text: '주가 최고점 경신' }, { id: 'd', text: '거래량 급감' }],
        explanation: '골든크로스는 단기선이 장기선을 위로 돌파하는 매수 신호예요.' },
      { id: 'q3', type: 'ox', question: '이동평균선만으로 주가를 100% 예측할 수 있습니다.', answer: 'X', explanation: '이동평균선은 과거 데이터 기반으로 미래를 완벽히 예측할 수 없어요.' },
    ],
  },
  {
    id: 'basic_3', title: 'PER / PBR / ROE', desc: '기업 가치 평가 3대 지표', emoji: '🔢', level: '초급',
    pages: [
      { emoji: '💹', title: 'PER (주가수익비율)', content: 'PER = 주가 ÷ 주당순이익(EPS)\n\n"이 회사의 1년치 이익으로 주가를 회수하는 데 몇 년이 걸리나?"\n\nPER 10배 = 10년치 이익과 맞먹는 가격\n• PER 낮으면: 상대적 저평가\n• PER 높으면: 미래 성장 기대감 큼' },
      { emoji: '🏦', title: 'PBR (주가순자산비율)', content: 'PBR = 주가 ÷ 주당순자산(BPS)\n\n"회사가 지금 문을 닫으면 얼마나 돌려받을 수 있나?"\n\n• PBR 1배 미만: 청산가치보다 싸게 거래 (저평가)\n• PBR 1배 이상: 미래 가치 반영\n\n금융주 분석에 많이 사용해요.' },
      { emoji: '📊', title: 'ROE (자기자본이익률)', content: 'ROE = 순이익 ÷ 자기자본 × 100 (%)\n\n"내 돈으로 얼마나 효율적으로 수익을 냈나?"\n\nROE 20% = 100원 투자해서 20원 벌었다는 뜻\n\n일반적으로 ROE 15% 이상이면 우량 기업!\n워런 버핏이 가장 중요시하는 지표예요.' },
    ],
    quizzes: [
      { id: 'q1', type: 'multiple', question: 'PER의 계산식은?', answer: 'b',
        options: [{ id: 'a', text: '주가 ÷ 주당순자산' }, { id: 'b', text: '주가 ÷ 주당순이익' }, { id: 'c', text: '순이익 ÷ 자기자본' }, { id: 'd', text: '자기자본 ÷ 순이익' }],
        explanation: 'PER = 주가 ÷ EPS. 주가가 1년치 이익의 몇 배인지 나타내요.' },
      { id: 'q2', type: 'ox', question: 'PBR이 1배 미만이면 청산가치보다 싸게 거래됩니다.', answer: 'O', explanation: 'PBR < 1이면 장부상 자산가치보다 낮은 가격에 거래되는 것으로 저평가 신호예요.' },
      { id: 'q3', type: 'multiple', question: 'ROE 20%의 의미는?', answer: 'b',
        options: [{ id: 'a', text: '주가 20% 상승' }, { id: 'b', text: '자본 100원으로 20원 이익' }, { id: 'c', text: '부채 비율 20%' }, { id: 'd', text: 'PER 20배' }],
        explanation: 'ROE = 순이익 ÷ 자기자본 × 100. ROE 20%는 자기자본 100원으로 20원의 이익을 냈다는 의미예요.' },
    ],
  },
  {
    id: 'inter_1', title: '재무제표 읽는 법', desc: '손익계산서, 재무상태표, 현금흐름표', emoji: '📋', level: '중급',
    pages: [
      { emoji: '📄', title: '재무제표란?', content: '재무제표는 회사의 재정 상태를 수치로 정리한 문서예요.\n\n3가지 핵심 재무제표:\n1️⃣ 손익계산서 — "얼마나 벌었나?"\n2️⃣ 재무상태표 — "얼마나 가지고 있나?"\n3️⃣ 현금흐름표 — "현금이 어떻게 움직였나?"' },
      { emoji: '💰', title: '손익계산서', content: '매출액\n− 매출원가\n= 매출총이익\n− 판관비\n= 영업이익 ⭐ (핵심!)\n± 영업외손익\n= 세전이익\n− 법인세\n= 당기순이익\n\n영업이익이 플러스면 본업으로 돈을 잘 버는 기업이에요.' },
      { emoji: '🏦', title: '재무상태표와 현금흐름표', content: '📌 재무상태표(Balance Sheet)\n특정 시점의 자산, 부채, 자본\n자산 = 부채 + 자본\n\n부채비율 = 부채 ÷ 자본 × 100\n200% 이하면 안전한 편이에요.\n\n📌 현금흐름표\n영업현금흐름이 지속적 플러스 = 건전한 기업' },
    ],
    quizzes: [
      { id: 'q1', type: 'multiple', question: '영업이익이 의미하는 것은?', answer: 'b',
        options: [{ id: 'a', text: '주식 매각 수익' }, { id: 'b', text: '본업 활동으로 번 이익' }, { id: 'c', text: '배당금 수익' }, { id: 'd', text: '이자 수익' }],
        explanation: '영업이익은 기업의 본업에서 비용을 빼고 남은 이익으로, 핵심 사업 경쟁력을 보여줘요.' },
      { id: 'q2', type: 'ox', question: '재무상태표에서 자산 = 부채 + 자본이 성립합니다.', answer: 'O', explanation: '재무상태표의 기본 등식이에요!' },
      { id: 'q3', type: 'ox', question: '영업현금흐름이 지속적으로 마이너스여도 건전한 기업입니다.', answer: 'X', explanation: '영업현금흐름 지속 마이너스는 본업에서 현금이 빠져나가는 위험 신호예요.' },
    ],
  },
  {
    id: 'inter_2', title: '기술적 분석 기초', desc: '지지선, 저항선, 추세선', emoji: '📐', level: '중급',
    pages: [
      { emoji: '🔍', title: '기술적 분석이란?', content: '기술적 분석은 과거 주가·거래량 데이터로 미래 주가를 예측하는 방법이에요.\n\n기본 전제: "역사는 반복된다"\n\n차트의 패턴, 추세, 지지/저항선 등을 분석해요.' },
      { emoji: '📏', title: '지지선과 저항선', content: '📌 지지선(Support)\n주가가 하락하다 반등하는 가격대\n→ 매수 세력이 강한 구간\n\n📌 저항선(Resistance)\n주가가 상승하다 막히는 가격대\n→ 매도 세력이 강한 구간\n\n지지선 하향 돌파 → 새로운 저항선\n저항선 상향 돌파 → 새로운 지지선' },
      { emoji: '📈', title: '추세선', content: '📌 상승 추세선: 저점들을 연결한 선\n📌 하락 추세선: 고점들을 연결한 선\n📌 횡보(박스권): 일정 구간 내 등락 반복\n\n추세를 파악하면 매수·매도 타이밍을 잡는 데 도움이 돼요.' },
    ],
    quizzes: [
      { id: 'q1', type: 'multiple', question: '지지선(Support Line)에 대한 설명으로 올바른 것은?', answer: 'b',
        options: [{ id: 'a', text: '주가가 상승하다 막히는 가격대' }, { id: 'b', text: '주가가 하락하다 반등하는 가격대' }, { id: 'c', text: '거래량이 가장 많은 가격대' }, { id: 'd', text: '52주 최고가' }],
        explanation: '지지선은 매수 세력이 강해서 주가가 더 떨어지지 않는 구간이에요.' },
      { id: 'q2', type: 'ox', question: '저항선을 상향 돌파하면 그 가격대가 새로운 지지선이 됩니다.', answer: 'O', explanation: '지지와 저항의 역할 전환이에요!' },
      { id: 'q3', type: 'multiple', question: '상승 추세선은 무엇을 연결한 선인가요?', answer: 'b',
        options: [{ id: 'a', text: '고점들을 연결한 선' }, { id: 'b', text: '저점들을 연결한 선' }, { id: 'c', text: '이동평균값들' }, { id: 'd', text: '거래량이 많은 날들' }],
        explanation: '상승 추세선은 점차 높아지는 저점들을 연결해요.' },
    ],
  },
  {
    id: 'inter_3', title: '거시경제와 주식시장', desc: '금리, 환율, 경제지표의 영향', emoji: '🌍', level: '중급',
    pages: [
      { emoji: '💰', title: '금리와 주식시장', content: '📌 금리 인상 → 주가 하락 경향\n• 기업 이자 부담 증가 → 이익 감소\n• 예금 매력 증가 → 주식 자금 이탈\n\n📌 금리 인하 → 주가 상승 경향\n• 반대 효과!\n\n미국 연준(Fed)의 금리 결정이 전 세계 주식시장에 영향을 미쳐요.' },
      { emoji: '💱', title: '환율과 주식시장', content: '📌 원/달러 환율 상승 (원화 약세)\n• 수출 기업(삼성, 현대차): 유리\n• 수입 기업: 불리\n\n📌 원/달러 환율 하락 (원화 강세)\n• 수출 기업: 불리\n• 수입 기업: 유리\n\n해외 자금 유입 → 원화 강세 + 주가 상승 경향' },
      { emoji: '📊', title: '주요 경제지표', content: '📌 GDP 성장률\n경제 성장 → 기업 이익 증가 → 주가 상승\n\n📌 CPI (소비자물가지수)\n인플레이션 지표. 급등 시 금리 인상 압력\n\n📌 실업률\n고용 개선 → 소비 증가 → 기업 실적 개선\n\n📌 어닝 시즌\n분기마다 기업 실적 발표. 예상치 초과 시 주가 상승!' },
    ],
    quizzes: [
      { id: 'q1', type: 'multiple', question: '금리 인상이 주식시장에 미치는 일반적 영향은?', answer: 'b',
        options: [{ id: 'a', text: '주가 상승' }, { id: 'b', text: '주가 하락' }, { id: 'c', text: '영향 없음' }, { id: 'd', text: '거래량만 증가' }],
        explanation: '금리 인상은 기업 비용 증가와 예금 매력 상승으로 주가 하락 경향이 있어요.' },
      { id: 'q2', type: 'ox', question: '원/달러 환율이 오르면 수출 기업에게 불리합니다.', answer: 'X', explanation: '환율 상승(원화 약세)은 수출 기업에게 유리해요! 달러를 원화로 바꿀 때 더 많이 받아요.' },
      { id: 'q3', type: 'multiple', question: 'CPI가 급등하면 예상되는 영향은?', answer: 'b',
        options: [{ id: 'a', text: '금리 인하 압력' }, { id: 'b', text: '금리 인상 압력' }, { id: 'c', text: '환율 하락' }, { id: 'd', text: '기업 실적 개선' }],
        explanation: 'CPI 급등은 인플레이션 신호로, 중앙은행이 금리를 인상해 물가를 잡으려 해요.' },
    ],
  },
  {
    id: 'adv_1', title: '포트폴리오 분산 전략', desc: '달걀을 한 바구니에 담지 마라', emoji: '🧺', level: '고급',
    pages: [
      { emoji: '🥚', title: '분산 투자란?', content: '"달걀을 한 바구니에 담지 마라"\n\n여러 자산에 나눠 투자해 리스크를 줄이는 전략이에요.\n\n서로 다른 방향으로 움직이는 자산들을 조합하면 전체 변동성이 줄어요.\n\n예: 기술주 + 금융주 + 헬스케어 + 채권 + 현금' },
      { emoji: '🔗', title: '상관계수와 자산 배분', content: '상관계수: 두 자산이 얼마나 같은 방향으로 움직이는지\n\n• +1: 완전히 같은 방향 (분산 효과 없음)\n• 0: 무관하게 움직임\n• -1: 반대 방향 (최고의 분산!)\n\n주식과 금(Gold)은 상관계수가 낮아 함께 보유하면 좋아요.' },
      { emoji: '🎯', title: '실전 포트폴리오 전략', content: '📌 60/40 포트폴리오\n주식 60% + 채권 40% (안정적, 검증된 전략)\n\n📌 올웨더 포트폴리오 (레이 달리오)\n주식 30%, 장기채권 40%, 중기채권 15%, 금 7.5%, 원자재 7.5%\n\n📌 3-펀드 포트폴리오\n미국 주식 + 국제 주식 + 채권 인덱스펀드' },
    ],
    quizzes: [
      { id: 'q1', type: 'ox', question: '상관계수가 -1에 가까울수록 분산 효과가 커집니다.', answer: 'O', explanation: '상관계수 -1은 반대로 움직여서 하나가 하락할 때 다른 하나가 상승해 위험을 줄여줘요.' },
      { id: 'q2', type: 'multiple', question: '60/40 포트폴리오에서 40%는?', answer: 'b',
        options: [{ id: 'a', text: '부동산' }, { id: 'b', text: '채권' }, { id: 'c', text: '금' }, { id: 'd', text: '현금' }],
        explanation: '60/40은 주식 60%, 채권 40%로 구성된 전통적 포트폴리오예요.' },
      { id: 'q3', type: 'ox', question: '분산 투자를 하면 모든 리스크를 없앨 수 있습니다.', answer: 'X', explanation: '개별 리스크는 줄이지만, 시장 전체 하락(체계적 위험)은 완전히 제거할 수 없어요.' },
    ],
  },
  {
    id: 'adv_2', title: '리스크 관리 방법', desc: '손절매, 포지션 사이징, 기대값', emoji: '🛡️', level: '고급',
    pages: [
      { emoji: '✂️', title: '손절매(Stop Loss)의 중요성', content: '"먼저 살아남는 것이 투자의 첫 번째 원칙"\n\n손실 회복에 필요한 수익률:\n• -10% → 회복에 +11.1%\n• -50% → 회복에 +100%\n• -80% → 회복에 +400%!\n\n손실이 클수록 회복이 기하급수적으로 어려워요.' },
      { emoji: '⚖️', title: '포지션 사이징', content: '📌 1% 룰\n단일 종목에 전체 자산의 최대 1~2%만 리스크 감수\n\n예: 1,000만원 포트폴리오, 1% 룰\n→ 종목당 최대 손실 = 10만원\n→ 손절 -10% 설정 시 투자금 = 100만원\n\n어떤 한 번의 손실도 계좌를 치명적으로 손상하지 않도록!' },
      { emoji: '🎲', title: '기대값과 리스크/리워드', content: '기대값 = (이길 확률 × 이익) - (질 확률 × 손실)\n\n예: 승률 60%, 이익 20%, 손실 10%\n기대값 = (0.6×20%) - (0.4×10%) = 8% (+)\n\n📌 R:R 비율\n목표 수익 : 최대 손실 = 최소 2:1 이상이 좋아요.\n예: 목표 +20% / 손절 -10% = R:R 2:1' },
    ],
    quizzes: [
      { id: 'q1', type: 'multiple', question: '-50% 손실을 회복하려면 몇 %의 수익이 필요한가요?', answer: 'c',
        options: [{ id: 'a', text: '50%' }, { id: 'b', text: '75%' }, { id: 'c', text: '100%' }, { id: 'd', text: '150%' }],
        explanation: '100원 → 50원(-50%) → 다시 100원이 되려면 +100%가 필요해요.' },
      { id: 'q2', type: 'ox', question: 'R:R 2:1이면 목표 수익이 최대 손실의 2배입니다.', answer: 'O', explanation: 'R:R 2:1은 10만원 손실 감수하고 20만원 이익을 노리는 것이에요.' },
      { id: 'q3', type: 'multiple', question: '포지션 사이징의 핵심 목적은?', answer: 'b',
        options: [{ id: 'a', text: '수익 최대화' }, { id: 'b', text: '단일 손실이 계좌를 치명적으로 손상하지 않도록' }, { id: 'c', text: '세금 절감' }, { id: 'd', text: '거래 횟수 증가' }],
        explanation: '어떤 한 번의 손실도 계좌를 치명적으로 손상하지 않도록 크기를 조절하는 것이 핵심이에요.' },
    ],
  },
  {
    id: 'adv_3', title: '가치투자 vs 성장투자', desc: '워런 버핏 vs 피터 린치 스타일', emoji: '⚔️', level: '고급',
    pages: [
      { emoji: '💎', title: '가치투자란?', content: '내재가치보다 싸게 거래되는 주식을 사는 전략\n\n대표 투자자: 워런 버핏, 벤저민 그레이엄\n\n핵심 원칙:\n• 안전마진: 내재가치보다 충분히 싸야 매수\n• 장기 보유: "좋은 기업을 적정가격에 영원히 보유"\n• PER, PBR이 낮은 저평가 기업 선호' },
      { emoji: '🚀', title: '성장투자란?', content: '빠르게 성장하는 기업에 투자하는 전략\n\n대표 투자자: 피터 린치, 필립 피셔\n\n핵심 원칙:\n• 매출/이익 고성장 기업 선호\n• PER이 높아도 성장성이 있으면 투자\n• PEG 비율 활용: PER ÷ 성장률 (1 이하 = 매력적)\n\n"10루타 종목을 찾아라" — 피터 린치' },
      { emoji: '⚖️', title: '어떤 전략이 더 좋을까?', content: '두 전략 모두 장단점이 있어요.\n\n📌 가치투자\n하방 리스크 낮음, 장기 초과 수익 검증됨\n\n📌 성장투자\n고성장 기업 초기 투자 시 큰 수익 가능\n\n📌 GARP 전략\n성장(Growth)과 가치(Value)를 혼합\n\n자신의 투자 성향에 맞는 전략 선택이 중요해요!' },
    ],
    quizzes: [
      { id: 'q1', type: 'multiple', question: '가치투자의 "안전마진"이란?', answer: 'b',
        options: [{ id: 'a', text: '손절매 라인 설정' }, { id: 'b', text: '내재가치보다 충분히 낮은 가격에 매수' }, { id: 'c', text: '포트폴리오 분산' }, { id: 'd', text: '상한가 종목 매수' }],
        explanation: '안전마진은 내재가치보다 싸게 사서 오류가 있어도 크게 잃지 않는 마진을 확보하는 것이에요.' },
      { id: 'q2', type: 'ox', question: '성장투자에서는 PER이 높아도 성장성이 있으면 투자 대상이 될 수 있습니다.', answer: 'O', explanation: '성장투자는 미래 성장 가능성에 집중해요. 아마존이 대표적 사례예요.' },
      { id: 'q3', type: 'multiple', question: 'PEG 비율이 낮을수록 의미하는 것은?', answer: 'b',
        options: [{ id: 'a', text: '부채가 많다' }, { id: 'b', text: '성장률 대비 주가가 저평가' }, { id: 'c', text: '배당수익률이 높다' }, { id: 'd', text: '거래량이 많다' }],
        explanation: 'PEG = PER ÷ 성장률. PEG가 낮을수록 성장 속도 대비 주가가 저렴하다는 의미예요.' },
    ],
  },
];

export function getCoursesByLevel(level: Level): Course[] {
  return COURSES.filter(c => c.level === level);
}

/** StockDetailScreen "?" 버튼용: 용어 → 코스 ID */
export const TERM_TO_COURSE: Record<string, string> = {
  PER: 'basic_3', PBR: 'basic_3', ROE: 'basic_3',
  '이동평균선': 'basic_2', '캔들': 'basic_1',
  '지지선': 'inter_2', '저항선': 'inter_2', '재무제표': 'inter_1',
  '분산투자': 'adv_1', '손절매': 'adv_2',
};

// ── New Duolingo-style types ──
export type LessonType = 'learn' | 'quiz' | 'fillblank' | 'matching';
export type CategoryId = 'vocabulary' | 'newsLearning' | 'chartAnalysis' | 'companyAnalysis' | 'psychology' | 'macro';

export interface LearnLesson {
  type: 'learn';
  emoji: string;
  title: string;
  content: string;
}

export interface QuizLesson {
  type: 'quiz';
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface FillBlankLesson {
  type: 'fillblank';
  question: string;
  answer: string;
  options: string[];
  explanation: string;
}

export interface MatchingLesson {
  type: 'matching';
  question: string;
  pairs: { term: string; definition: string }[];
}

export type DuoLesson = LearnLesson | QuizLesson | FillBlankLesson | MatchingLesson;

export interface DuoLevel {
  id: string;
  title: string;
  lessons: DuoLesson[];
}

export interface DuoCategory {
  id: CategoryId;
  title: string;
  emoji: string;
  color: [string, string];
  levels: DuoLevel[];
}

export const CATEGORIES: CategoryId[] = ['vocabulary', 'newsLearning', 'chartAnalysis', 'companyAnalysis', 'psychology', 'macro'];

export const CATEGORY_META: Record<CategoryId, { title: string; emoji: string; color: [string, string] }> = {
  vocabulary: { title: '용어 사전', emoji: '📖', color: ['#0066FF', '#004ADD'] },
  newsLearning: { title: '뉴스 학습', emoji: '📰', color: ['#FF6B35', '#FF4500'] },
  chartAnalysis: { title: '차트 분석', emoji: '📊', color: ['#34C759', '#28A745'] },
  companyAnalysis: { title: '기업 분석', emoji: '🏢', color: ['#5856D6', '#3634A3'] },
  psychology: { title: '투자 심리', emoji: '🧠', color: ['#FF2D55', '#CC0033'] },
  macro: { title: '거시경제', emoji: '🏦', color: ['#FF9500', '#FF6B00'] },
};

// Reward constants
export const REWARDS = {
  completeLesson: 1000,
  perfectScore: 3000,
  dailyStreak3: 5000,
  dailyStreak7: 15000,
  dailyStreak30: 100000,
  firstLesson: 10000,
  categoryComplete: 50000,
};

export const learningContent: Record<CategoryId, DuoCategory> = {
  vocabulary: {
    id: 'vocabulary',
    title: '용어 사전',
    emoji: '📖',
    color: ['#0066FF', '#004ADD'],
    levels: [
      {
        id: 'vocab_1',
        title: '주식 기초 용어',
        lessons: [
          { type: 'learn', emoji: '📈', title: '시가와 종가', content: '시가(始價)는 하루 중 첫 번째로 체결된 가격이고, 종가(終價)는 마지막으로 체결된 가격입니다. 한국 주식시장은 오전 9시에 시작해 오후 3시 30분에 마감합니다.' },
          { type: 'quiz', question: '한국 주식시장의 정규 거래 마감 시간은?', options: ['오후 2시', '오후 3시', '오후 3시 30분', '오후 4시'], answer: 2, explanation: '한국거래소(KRX) 정규장은 오전 9시~오후 3시 30분입니다.' },
          { type: 'learn', emoji: '📊', title: '고가와 저가', content: '고가(高價)는 하루 중 가장 높게 거래된 가격, 저가(低價)는 가장 낮게 거래된 가격입니다. 캔들차트에서 위아래 꼬리로 표시됩니다.' },
          { type: 'quiz', question: '하루 중 가장 높게 거래된 가격을 무엇이라 하나요?', options: ['시가', '종가', '고가', '저가'], answer: 2, explanation: '고가는 당일 최고 체결 가격입니다.' },
          { type: 'learn', emoji: '💹', title: '거래량과 거래대금', content: '거래량은 하루 동안 거래된 주식 수, 거래대금은 거래량 × 가격으로 계산한 총 금액입니다. 거래량이 많을수록 시장의 관심이 높다는 신호입니다.' },
          { type: 'quiz', question: '거래대금을 구하는 공식은?', options: ['거래량 ÷ 주가', '거래량 × 주가', '주가 - 거래량', '주가 + 거래량'], answer: 1, explanation: '거래대금 = 거래량 × 주가입니다.' },
          { type: 'fillblank', question: '하루 중 처음 체결된 가격을 ___(이)라 합니다.', answer: '시가', options: ['시가', '종가', '고가', '저가'], explanation: '시가는 개장 후 첫 체결 가격입니다.' },
        ],
      },
      {
        id: 'vocab_2',
        title: '수익률과 손익',
        lessons: [
          { type: 'learn', emoji: '💰', title: '수익률 계산', content: '수익률 = (현재가 - 매수가) ÷ 매수가 × 100. 예를 들어 1만원에 산 주식이 1만2천원이 되면 수익률은 +20%입니다.' },
          { type: 'quiz', question: '10,000원에 산 주식이 12,000원이 됐을 때 수익률은?', options: ['+10%', '+15%', '+20%', '+25%'], answer: 2, explanation: '(12000-10000)÷10000×100 = 20%' },
          { type: 'learn', emoji: '📉', title: '손절과 익절', content: '손절(損切)은 손실을 감수하고 매도하는 것, 익절(益切)은 이익이 난 상태에서 매도하는 것입니다. 손절선을 미리 정해두는 것이 리스크 관리의 기본입니다.' },
          { type: 'quiz', question: '손실을 감수하고 주식을 파는 행위를 무엇이라 하나요?', options: ['익절', '손절', '매수', '홀딩'], answer: 1, explanation: '손절은 더 큰 손실을 방지하기 위한 리스크 관리 방법입니다.' },
          { type: 'learn', emoji: '🎯', title: '목표 수익률 설정', content: '투자 전 목표 수익률과 손절 기준을 미리 정해야 합니다. 일반적으로 손절선은 -5~10%, 목표 수익은 +15~30%로 설정하는 경우가 많습니다.' },
          { type: 'fillblank', question: '수익률 = (현재가 - 매수가) ÷ ___ × 100', answer: '매수가', options: ['현재가', '매수가', '시가', '종가'], explanation: '매수가 대비 얼마나 올랐는지를 계산합니다.' },
        ],
      },
      {
        id: 'vocab_3',
        title: '시장 구조 용어',
        lessons: [
          { type: 'learn', emoji: '🏛️', title: '코스피와 코스닥', content: '코스피(KOSPI)는 유가증권시장으로 삼성전자, 현대차 등 대형주가 상장됩니다. 코스닥(KOSDAQ)은 중소·벤처기업 위주의 시장입니다.' },
          { type: 'quiz', question: '삼성전자가 상장된 한국 주식시장은?', options: ['코스닥', '코스피', 'K-OTC', '코넥스'], answer: 1, explanation: '삼성전자는 코스피(유가증권시장)에 상장되어 있습니다.' },
          { type: 'learn', emoji: '🔒', title: '상한가와 하한가', content: '한국 주식시장은 하루 가격 변동폭을 ±30%로 제한합니다. 30% 오른 가격을 상한가, 30% 내린 가격을 하한가라고 합니다.' },
          { type: 'quiz', question: '한국 주식시장의 하루 가격 변동 제한폭은?', options: ['±10%', '±15%', '±20%', '±30%'], answer: 3, explanation: '2015년부터 ±30%로 확대됐습니다.' },
          { type: 'learn', emoji: '📋', title: '시가총액', content: '시가총액 = 주가 × 발행주식수. 기업의 시장 가치를 나타냅니다. 코스피 시가총액 1위는 삼성전자입니다.' },
          { type: 'fillblank', question: '시가총액 = 주가 × ___', answer: '발행주식수', options: ['거래량', '발행주식수', '자기자본', '순이익'], explanation: '시가총액은 현재 주가에 발행된 전체 주식 수를 곱한 값입니다.' },
        ],
      },
      {
        id: 'vocab_4',
        title: '주문 방법',
        lessons: [
          { type: 'learn', emoji: '🛒', title: '시장가 주문', content: '시장가 주문은 현재 시장 가격으로 즉시 체결되는 주문입니다. 빠른 매매가 가능하지만 원하는 가격보다 불리하게 체결될 수 있습니다.' },
          { type: 'quiz', question: '현재 시장 가격으로 즉시 체결되는 주문 방식은?', options: ['지정가 주문', '시장가 주문', '조건부 주문', '예약 주문'], answer: 1, explanation: '시장가 주문은 즉시 체결되지만 가격을 보장하지 않습니다.' },
          { type: 'learn', emoji: '🎯', title: '지정가 주문', content: '지정가 주문은 내가 원하는 가격을 직접 지정하는 주문입니다. 지정한 가격 이하(매수) 또는 이상(매도)에서만 체결됩니다.' },
          { type: 'quiz', question: '원하는 가격을 직접 지정해서 주문하는 방식은?', options: ['시장가 주문', '지정가 주문', '임의 주문', '일괄 주문'], answer: 1, explanation: '지정가 주문은 원하는 가격에만 체결되므로 가격 통제가 가능합니다.' },
          { type: 'fillblank', question: '시장가 주문은 현재 ___ 으로 즉시 체결됩니다.', answer: '시장 가격', options: ['시장 가격', '지정 가격', '종가', '시가'], explanation: '시장가 주문은 빠른 체결이 가능합니다.' },
        ],
      },
      {
        id: 'vocab_5',
        title: '배당과 분할',
        lessons: [
          { type: 'learn', emoji: '💵', title: '배당금', content: '배당금은 기업이 이익의 일부를 주주에게 나눠주는 것입니다. 배당수익률 = 주당배당금 ÷ 주가 × 100으로 계산합니다.' },
          { type: 'quiz', question: '배당수익률을 구하는 공식은?', options: ['주당배당금 × 주가', '주당배당금 ÷ 주가 × 100', '주가 ÷ 주당배당금', '주가 × 100'], answer: 1, explanation: '배당수익률은 현재 주가 대비 배당금 비율입니다.' },
          { type: 'learn', emoji: '✂️', title: '주식 분할', content: '주식 분할은 1주를 여러 주로 나누는 것입니다. 예를 들어 100만원짜리 주식을 10:1로 분할하면 10만원짜리 주식 10주가 됩니다. 총 가치는 변하지 않습니다.' },
          { type: 'quiz', question: '주식 분할 후 변하지 않는 것은?', options: ['주가', '주식 수', '시가총액', '거래량'], answer: 2, explanation: '주식 분할 시 주가와 주식 수는 바뀌지만 시가총액은 동일합니다.' },
          { type: 'fillblank', question: '배당금은 기업이 이익의 일부를 ___에게 나눠주는 것입니다.', answer: '주주', options: ['주주', '채권자', '직원', '고객'], explanation: '주주는 기업의 주인으로서 배당을 받을 권리가 있습니다.' },
        ],
      },
    ],
  },

  newsLearning: {
    id: 'newsLearning',
    title: '뉴스 학습',
    emoji: '📰',
    color: ['#FF6B35', '#FF4500'],
    levels: [
      {
        id: 'news_1',
        title: '뉴스와 주가의 관계',
        lessons: [
          {
            type: 'learn',
            emoji: '📰',
            title: '호재 vs 악재',
            content: '뉴스는 주가에 즉각적인 영향을 미쳐요!\n\n📌 호재 (주가 상승 요인)\n• 실적 어닝 서프라이즈 (예상치 초과)\n• 신제품 출시, 특허 획득\n• 대형 계약 수주\n• 주식 분할, 자사주 매입\n\n📌 악재 (주가 하락 요인)\n• 실적 어닝 쇼크 (예상치 하회)\n• 대규모 소송, 리콜\n• 경쟁사 등장\n• 주요 임원 사임\n\n💡 같은 뉴스도 시장 기대치에 따라 영향이 달라져요!',
          },
          {
            type: 'learn',
            emoji: '📅',
            title: '어닝시즌이란?',
            content: '어닝시즌(Earning Season)은 기업들이 분기 실적을 발표하는 기간이에요.\n\n📌 미국 어닝시즌 일정\n• 1분기: 4월 중순 ~ 5월 초\n• 2분기: 7월 중순 ~ 8월 초\n• 3분기: 10월 중순 ~ 11월 초\n• 4분기: 1월 중순 ~ 2월 초\n\n📌 핵심 체크포인트\n• EPS (주당순이익) 예상치 vs 실제\n• 매출액 예상치 vs 실제\n• 다음 분기 가이던스(전망)\n\n💡 어닝 서프라이즈 = 예상보다 좋은 실적 → 주가 급등!\n어닝 쇼크 = 예상보다 나쁜 실적 → 주가 급락!',
          },
          {
            type: 'learn',
            emoji: '🌍',
            title: '매크로 뉴스와 주식시장',
            content: '거시경제(매크로) 뉴스는 전체 시장에 영향을 미쳐요.\n\n📌 주요 매크로 이벤트\n• FOMC 금리 결정 (미국 연준)\n• CPI (소비자물가지수) 발표\n• 고용지표 (비농업부문 고용, 실업률)\n• GDP 성장률 발표\n\n📌 영향 예시\n• 금리 인상 → 전체 주식 하락 압력\n• 고용 호조 → 경기 낙관 → 주가 상승\n• 인플레이션 급등 → 긴축 우려 → 주가 하락\n\n💡 미국 경제 뉴스가 한국 주식시장에도 영향을 미쳐요!',
          },
          {
            type: 'quiz',
            question: '기업 실적이 시장 예상치를 크게 뛰어넘었을 때를 무엇이라 하나요?',
            options: ['어닝 쇼크', '어닝 서프라이즈', '블랙스완', '데드캣바운스'],
            answer: 1,
            explanation: '어닝 서프라이즈(Earning Surprise)는 실제 실적이 시장 예상치를 크게 초과하는 것으로, 일반적으로 주가 급등으로 이어져요.',
          },
          {
            type: 'quiz',
            question: 'FOMC에서 금리를 인상하면 주식시장에 어떤 영향을 미치나요?',
            options: ['주가 상승 압력', '주가 하락 압력', '거래량만 증가', '환율만 변동'],
            answer: 1,
            explanation: '금리 인상은 기업의 이자 부담 증가와 예금 매력 상승으로 주식시장에 하락 압력을 가해요.',
          },
        ],
      },
      {
        id: 'news_2',
        title: '기업 공시 읽기',
        lessons: [
          {
            type: 'learn',
            emoji: '📋',
            title: '공시란?',
            content: '공시(公示)는 기업이 중요한 정보를 투자자에게 공개적으로 알리는 것이에요.\n\n📌 공시 의무화 이유\n• 정보 비대칭 해소\n• 내부자 거래 방지\n• 투자자 보호\n\n📌 공시 확인 방법\n• 한국: DART(전자공시시스템) — dart.fss.or.kr\n• 미국: SEC EDGAR — sec.gov/edgar\n\n📌 공시의 중요성\n공시 내용에 따라 주가가 급등락할 수 있어요!\n공시 발표 전 미리 매매하면 내부자 거래로 처벌받아요.\n\n💡 DART에서 원하는 기업 이름 검색 → 최신 공시 확인!',
          },
          {
            type: 'learn',
            emoji: '📑',
            title: '주요 공시 종류',
            content: '📌 정기 공시 (반드시 제출)\n• 사업보고서: 연 1회, 전체 경영 현황\n• 반기보고서: 상반기 실적\n• 분기보고서: 1·3분기 실적\n\n📌 수시 공시 (중요 사건 발생 시)\n• 단일판매공급계약: 대형 계약 수주\n• 유상증자: 새 주식 발행 (주가 희석)\n• 자사주 취득: 회사가 자기 주식 매입 (주가 호재)\n• 최대주주 변경: 지배구조 변화\n• 임원 변경: 대표이사 교체 등\n\n💡 "유상증자"는 주식 수가 늘어 기존 주주 지분이 희석되므로 주의!',
          },
          {
            type: 'learn',
            emoji: '🔍',
            title: '공시 해석 실전',
            content: '실제 공시를 어떻게 읽을까요?\n\n📌 단일판매공급계약 공시 예시\n"OO전자, 애플과 3,000억원 규모 부품 공급 계약 체결"\n\n체크포인트:\n• 계약 금액이 연 매출의 몇 %?\n• 계약 기간은?\n• 조건부 계약인가?\n\n📌 유상증자 공시 해석\n• 주식 수가 몇 % 증가하는가?\n• 발행가가 현재 주가 대비 할인율은?\n• 조달 목적이 설비투자인가, 부채 상환인가?\n\n📌 자사주 매입 공시\n"회사가 자기 주식을 100억원어치 매입한다"\n→ 주주 가치 제고 신호 (주가 호재)\n\n💡 공시 하나로 주가 방향을 예측하기보단 전체 맥락을 봐야 해요!',
          },
          {
            type: 'quiz',
            question: 'DART(전자공시시스템)에서 확인할 수 있는 것은?',
            options: ['주가 차트', '기업 공시 서류', '애널리스트 리포트', '외국인 매매 동향'],
            answer: 1,
            explanation: 'DART(dart.fss.or.kr)는 금융감독원이 운영하는 전자공시시스템으로, 기업의 사업보고서, 공시 서류 등을 무료로 확인할 수 있어요.',
          },
          {
            type: 'quiz',
            question: '유상증자가 발표되면 기존 주주에게 어떤 영향이 있나요?',
            options: ['배당금 증가', '주식 수 증가로 기존 주주 지분 희석', '주가 자동 상승', '의결권 강화'],
            answer: 1,
            explanation: '유상증자는 새 주식을 발행해 자금을 조달하므로 전체 주식 수가 늘어 기존 주주의 지분 비율이 희석(줄어)돼요. 일반적으로 주가 하락 압력이 생겨요.',
          },
          {
            type: 'quiz',
            question: '자사주 취득(자사주 매입) 공시가 발표되면 일반적으로 어떤 영향이 있나요?',
            options: ['주가 하락 압력', '주가 상승 요인', '거래 정지', '배당 중단'],
            answer: 1,
            explanation: '자사주 매입은 회사가 시장에서 자기 주식을 사들이는 것으로 주식 수 감소 → 주당 가치 상승 효과가 있어 주가 호재로 작용해요.',
          },
        ],
      },
      {
        id: 'news_3',
        title: '섹터별 뉴스 읽기',
        lessons: [
          {
            type: 'learn',
            emoji: '🏭',
            title: '섹터(업종)란?',
            content: '주식시장은 비슷한 사업을 하는 기업들끼리 섹터(업종)로 분류해요.\n\n📌 GICS 11대 섹터\n1. 정보기술(IT) — 삼성전자, 애플\n2. 헬스케어 — 유한양행, 존슨앤존슨\n3. 금융 — KB금융, JP모건\n4. 소비재(필수) — CJ제일제당, 코카콜라\n5. 소비재(경기) — 현대차, 아마존\n6. 산업재 — 현대건설, 캐터필러\n7. 에너지 — 한국전력, 엑슨모빌\n8. 원자재 — POSCO, 뉴코\n9. 부동산 — 맥쿼리인프라\n10. 유틸리티 — 한국가스공사\n11. 통신서비스 — KT, 메타\n\n💡 섹터마다 주가를 움직이는 요인이 달라요!',
          },
          {
            type: 'learn',
            emoji: '💻',
            title: '반도체·IT 뉴스 읽기',
            content: 'IT·반도체 섹터는 한국 주식시장의 핵심이에요!\n\n📌 반도체 관련 주요 뉴스 유형\n• D램/낸드 가격 동향\n• 메모리 재고 과잉/부족\n• AI 수요 증가 → HBM(고대역폭메모리) 수혜\n• 반도체 수출 규제 (미중 갈등)\n\n📌 해석 공식\n• 반도체 가격 상승 → 삼성전자, SK하이닉스 호재\n• AI 데이터센터 투자 증가 → 엔비디아, TSMC 호재\n• 스마트폰 판매 부진 → 모바일 반도체 수요 감소\n\n💡 반도체 업황 사이클을 이해하면 투자 타이밍을 잡을 수 있어요!',
          },
          {
            type: 'quiz',
            question: '금리 상승이 가장 부정적 영향을 주는 섹터는?',
            options: ['금융(은행)', '에너지', '고성장 기술주(IT)', '필수소비재'],
            answer: 2,
            explanation: '고성장 기술주는 미래 이익에 높은 가치를 부여받는데, 금리 상승 시 미래 이익의 현재 가치(DCF)가 크게 감소해 주가 하락 영향이 커요.',
          },
          {
            type: 'quiz',
            question: 'AI 데이터센터 투자 증가 뉴스가 나오면 수혜주로 볼 수 있는 기업은?',
            options: ['항공사', '편의점 체인', '반도체·서버 기업', '음식료 기업'],
            answer: 2,
            explanation: 'AI 데이터센터 확장은 GPU, HBM 메모리, 서버 등 반도체 수요를 직접 늘려요. 엔비디아, SK하이닉스 등이 수혜주예요.',
          },
          {
            type: 'quiz',
            question: '경기침체 우려가 커질 때 상대적으로 방어적인 섹터는?',
            options: ['경기소비재(자동차, 명품)', '필수소비재(식품, 생활용품)', '정보기술(반도체)', '산업재(건설, 기계)'],
            answer: 1,
            explanation: '필수소비재는 경기와 무관하게 소비가 꾸준한 식품·생활용품 기업으로, 경기침체 시 상대적으로 방어적이에요.',
          },
        ],
      },
      {
        id: 'news_4',
        title: '실전 뉴스 해석',
        lessons: [
          {
            type: 'learn',
            emoji: '🎯',
            title: '뉴스 해석의 함정',
            content: '"좋은 뉴스가 반드시 주가 상승으로 이어지지 않는다!"\n\n📌 "Buy the rumor, Sell the news"\n소문에 사고, 뉴스에 판다\n\n예시:\n1. 애플 아이폰 신제품 출시 기대감 → 주가 상승\n2. 실제 출시 발표 → 오히려 주가 하락!\n\n이미 기대감이 주가에 반영(선반영)됐기 때문이에요.\n\n📌 컨센서스(시장 예상치)의 중요성\n• 실적 발표: 예상치 vs 실제 차이가 중요\n• 예상치 +5% → 주가 +3% (선반영 있어서)\n• 예상치 -10% → 주가 -15% (실망 매물)\n\n💡 뉴스 자체보다 "시장이 이미 얼마나 알고 있었나?"가 핵심!',
          },
          {
            type: 'learn',
            emoji: '⚡',
            title: '블랙스완과 예측 불가능한 리스크',
            content: '블랙스완(Black Swan)은 예측 불가능하지만 큰 충격을 주는 사건이에요.\n\n📌 역사적 블랙스완 사례\n• 2008년 글로벌 금융위기\n• 2020년 코로나19 팬데믹\n• 2022년 러시아-우크라이나 전쟁\n\n📌 투자에서의 대응\n• 과도한 레버리지 금지\n• 현금 비중 일부 유지\n• 분산 투자로 충격 완화\n\n📌 테일 리스크(Tail Risk)\n발생 확률은 낮지만 발생 시 큰 손실을 주는 위험\n\n💡 "내가 틀릴 수 있다"는 겸손함이 투자에서 가장 중요한 자세예요!',
          },
          {
            type: 'quiz',
            question: '"Buy the rumor, Sell the news"가 의미하는 것은?',
            options: ['뉴스 발표 직후 항상 매수', '기대감으로 오른 주가가 실제 뉴스 발표 후 하락할 수 있음', '루머는 항상 사실이 됨', '뉴스보다 소문이 더 중요함'],
            answer: 1,
            explanation: '기대감이 주가에 이미 선반영되어 있으면, 실제 좋은 뉴스가 나와도 차익 실현 매물로 주가가 하락할 수 있어요.',
          },
          {
            type: 'quiz',
            question: '기업 실적 발표에서 가장 중요한 비교 기준은?',
            options: ['작년 같은 분기 실적', '시장 예상치(컨센서스) 대비 달성 여부', '경쟁사 실적', '대표이사 코멘트'],
            answer: 1,
            explanation: '주가는 절대적인 실적보다 시장 예상치 대비 얼마나 좋은지(어닝 서프라이즈/쇼크)에 더 민감하게 반응해요.',
          },
          {
            type: 'quiz',
            question: '블랙스완(Black Swan) 이벤트에 대한 투자 대응으로 올바른 것은?',
            options: ['레버리지를 최대한 높여 수익 극대화', '분산투자와 현금 비중 유지로 충격 완화', '뉴스 발표 직전 전량 매도', '인버스 ETF에 전액 투자'],
            answer: 1,
            explanation: '예측 불가능한 블랙스완에 대응하는 가장 좋은 방법은 분산 투자, 적절한 현금 비중 유지, 과도한 레버리지 자제예요.',
          },
        ],
      },
    ],
  },

  chartAnalysis: {
    id: 'chartAnalysis',
    title: '차트 분석',
    emoji: '📊',
    color: ['#34C759', '#28A745'],
    levels: [
      {
        id: 'chart_1',
        title: '캔들차트 기초',
        lessons: [
          { type: 'learn', emoji: '🕯️', title: '캔들차트란?', content: '캔들차트는 시가, 고가, 저가, 종가를 하나의 막대로 표현합니다. 종가가 시가보다 높으면 양봉(빨간색), 낮으면 음봉(파란색)입니다.' },
          { type: 'quiz', question: '한국 주식 캔들차트에서 종가가 시가보다 높을 때 색깔은?', options: ['파란색', '빨간색', '초록색', '검은색'], answer: 1, explanation: '한국은 상승을 빨간색, 하락을 파란색으로 표시합니다.' },
          { type: 'learn', emoji: '📊', title: '캔들의 몸통과 꼬리', content: '몸통은 시가와 종가 사이의 구간, 위꼬리는 고가까지, 아래꼬리는 저가까지를 나타냅니다. 몸통이 길수록 매수/매도 세력이 강했다는 의미입니다.' },
          { type: 'quiz', question: '캔들차트에서 고가를 나타내는 부분은?', options: ['몸통 상단', '위꼬리 끝', '아래꼬리 끝', '몸통 중간'], answer: 1, explanation: '위꼬리의 끝이 당일 최고가를 나타냅니다.' },
          { type: 'fillblank', question: '캔들차트에서 시가와 종가 사이 구간을 ___(이)라 합니다.', answer: '몸통', options: ['꼬리', '몸통', '고가', '저가'], explanation: '몸통의 크기는 그날의 가격 변동 폭을 나타냅니다.' },
        ],
      },
      {
        id: 'chart_2',
        title: '이동평균선',
        lessons: [
          { type: 'learn', emoji: '📈', title: '이동평균선이란?', content: '이동평균선(MA)은 일정 기간의 종가 평균을 연결한 선입니다. 5일선, 20일선, 60일선, 120일선을 주로 사용합니다.' },
          { type: 'quiz', question: '단기 추세를 파악할 때 주로 사용하는 이동평균선은?', options: ['120일선', '60일선', '20일선', '5일선'], answer: 3, explanation: '5일선은 단기, 20일선은 중기, 60일선은 장기 추세를 나타냅니다.' },
          { type: 'learn', emoji: '⚡', title: '골든크로스와 데드크로스', content: '골든크로스는 단기 이동평균선이 장기선을 상향 돌파하는 것으로 매수 신호입니다. 데드크로스는 반대로 하향 돌파하는 것으로 매도 신호입니다.' },
          { type: 'quiz', question: '단기 이동평균선이 장기선을 상향 돌파하는 것은?', options: ['데드크로스', '골든크로스', '볼린저밴드', '지지선'], answer: 1, explanation: '골든크로스는 강세 전환 신호로 해석됩니다.' },
          { type: 'fillblank', question: '단기 이동평균선이 장기선을 하향 돌파하는 것을 ___라 합니다.', answer: '데드크로스', options: ['골든크로스', '데드크로스', '수렴', '발산'], explanation: '데드크로스는 약세 전환 신호로 해석됩니다.' },
        ],
      },
      {
        id: 'chart_3',
        title: '지지선과 저항선',
        lessons: [
          { type: 'learn', emoji: '🔲', title: '지지선이란?', content: '지지선은 주가가 하락하다가 멈추는 가격대입니다. 과거에 여러 번 반등한 가격대가 지지선이 됩니다. 지지선이 깨지면 추가 하락 가능성이 높습니다.' },
          { type: 'quiz', question: '주가가 하락하다가 반등하는 가격대를 무엇이라 하나요?', options: ['저항선', '지지선', '추세선', '이동평균선'], answer: 1, explanation: '지지선은 매수세가 강해지는 가격대입니다.' },
          { type: 'learn', emoji: '🚧', title: '저항선이란?', content: '저항선은 주가가 상승하다가 멈추는 가격대입니다. 과거에 여러 번 하락 전환된 가격대가 저항선이 됩니다. 저항선을 돌파하면 추가 상승 신호입니다.' },
          { type: 'quiz', question: '주가가 상승하다가 하락 전환되는 가격대는?', options: ['지지선', '저항선', '추세선', '기준선'], answer: 1, explanation: '저항선은 매도세가 강해지는 가격대입니다.' },
          { type: 'fillblank', question: '저항선을 상향 돌파하면 ___ 신호로 해석됩니다.', answer: '추가 상승', options: ['추가 상승', '추가 하락', '횡보', '반전'], explanation: '저항선 돌파는 강한 매수세를 의미합니다.' },
        ],
      },
      {
        id: 'chart_4',
        title: 'RSI와 MACD',
        lessons: [
          { type: 'learn', emoji: '⚖️', title: 'RSI란?', content: 'RSI(상대강도지수)는 0~100 사이 값으로 과매수/과매도를 판단합니다. 70 이상은 과매수(매도 고려), 30 이하는 과매도(매수 고려) 구간입니다.' },
          { type: 'quiz', question: 'RSI가 70 이상일 때 의미하는 것은?', options: ['과매도 구간', '과매수 구간', '중립 구간', '거래 정지'], answer: 1, explanation: 'RSI 70 이상은 과매수로 조정 가능성이 있습니다.' },
          { type: 'learn', emoji: '📉', title: 'MACD란?', content: 'MACD는 단기(12일)와 장기(26일) 이동평균선의 차이입니다. MACD가 시그널선을 상향 돌파하면 매수, 하향 돌파하면 매도 신호입니다.' },
          { type: 'quiz', question: 'RSI가 30 이하일 때 일반적인 해석은?', options: ['과매수로 매도 고려', '과매도로 매수 고려', '추세 전환 없음', '거래량 부족'], answer: 1, explanation: 'RSI 30 이하는 과매도로 반등 가능성이 있습니다.' },
          { type: 'fillblank', question: 'RSI 지표에서 과매수 기준은 ___ 이상입니다.', answer: '70', options: ['50', '60', '70', '80'], explanation: 'RSI 70 이상은 과매수, 30 이하는 과매도 구간입니다.' },
        ],
      },
      {
        id: 'chart_5',
        title: '거래량 분석',
        lessons: [
          { type: 'learn', emoji: '📦', title: '거래량의 중요성', content: '거래량은 주가 움직임의 신뢰도를 나타냅니다. 주가 상승 + 거래량 증가는 강한 상승 신호, 주가 상승 + 거래량 감소는 약한 신호입니다.' },
          { type: 'quiz', question: '강한 상승 신호는 어느 경우인가요?', options: ['주가↑ + 거래량↓', '주가↓ + 거래량↑', '주가↑ + 거래량↑', '주가↓ + 거래량↓'], answer: 2, explanation: '주가 상승과 거래량 증가가 동반될 때 신뢰도가 높습니다.' },
          { type: 'learn', emoji: '🔍', title: '거래량 급증 신호', content: '평균 거래량의 3배 이상 급증하면 세력의 개입 가능성이 있습니다. 주가 상승과 함께 거래량이 급증하면 매수 관심 신호입니다.' },
          { type: 'quiz', question: '거래량이 평균의 3배 이상 급증할 때 주로 의심하는 것은?', options: ['기업 부도', '세력 개입', '시장 폐장', '배당 지급'], answer: 1, explanation: '비정상적 거래량 급증은 세력의 개입을 의심해볼 수 있습니다.' },
          { type: 'fillblank', question: '주가 상승과 함께 거래량이 ___ 할 때 강한 상승 신호입니다.', answer: '증가', options: ['증가', '감소', '유지', '급락'], explanation: '거래량은 주가 움직임의 신뢰도를 높여줍니다.' },
        ],
      },
    ],
  },

  companyAnalysis: {
    id: 'companyAnalysis',
    title: '기업 분석',
    emoji: '🏢',
    color: ['#5856D6', '#3634A3'],
    levels: [
      {
        id: 'company_1',
        title: 'PER 이해하기',
        lessons: [
          { type: 'learn', emoji: '💼', title: 'PER이란?', content: 'PER(주가수익비율) = 주가 ÷ EPS(주당순이익). PER이 낮으면 이익 대비 주가가 저렴하다는 의미입니다. 같은 업종 내에서 비교하는 것이 중요합니다.' },
          { type: 'quiz', question: 'PER을 구하는 공식은?', options: ['EPS ÷ 주가', '주가 ÷ EPS', '주가 × EPS', '순이익 ÷ 매출'], answer: 1, explanation: 'PER = 주가 ÷ EPS(주당순이익)입니다.' },
          { type: 'learn', emoji: '📊', title: 'PER 해석', content: 'PER 10이면 현재 이익 수준으로 10년 후 투자금 회수 가능을 의미합니다. 성장주는 PER이 높고, 가치주는 낮은 편입니다. 한국 코스피 평균 PER은 약 10~15배입니다.' },
          { type: 'quiz', question: '일반적으로 PER이 낮을 때의 의미는?', options: ['주가가 고평가됨', '주가가 저평가됨', '기업이 적자임', '배당이 없음'], answer: 1, explanation: '낮은 PER은 이익 대비 주가가 저렴하다는 신호일 수 있습니다.' },
          { type: 'fillblank', question: 'PER = 주가 ÷ ___', answer: 'EPS', options: ['BPS', 'EPS', 'ROE', 'PBR'], explanation: 'EPS는 주당순이익(Earnings Per Share)입니다.' },
        ],
      },
      {
        id: 'company_2',
        title: 'PBR과 ROE',
        lessons: [
          { type: 'learn', emoji: '📚', title: 'PBR이란?', content: 'PBR(주가순자산비율) = 주가 ÷ BPS(주당순자산). PBR 1 미만이면 청산 가치보다 주가가 낮다는 의미로 저평가 신호일 수 있습니다.' },
          { type: 'quiz', question: 'PBR이 1 미만일 때 의미하는 것은?', options: ['주가가 청산 가치보다 높음', '주가가 청산 가치보다 낮음', '기업이 흑자임', '배당수익률이 높음'], answer: 1, explanation: 'PBR 1 미만은 이론상 저평가 상태입니다.' },
          { type: 'learn', emoji: '💡', title: 'ROE란?', content: 'ROE(자기자본이익률) = 순이익 ÷ 자기자본 × 100. ROE가 높을수록 자본을 효율적으로 사용해 이익을 내는 기업입니다. 워런 버핏은 ROE 15% 이상 기업을 선호합니다.' },
          { type: 'quiz', question: 'ROE를 구하는 공식은?', options: ['자기자본 ÷ 순이익 × 100', '순이익 ÷ 자기자본 × 100', '주가 ÷ 순이익', '매출 ÷ 자기자본'], answer: 1, explanation: 'ROE = 순이익 ÷ 자기자본 × 100입니다.' },
          { type: 'fillblank', question: 'ROE가 높을수록 자본을 ___ 사용하는 기업입니다.', answer: '효율적으로', options: ['비효율적으로', '효율적으로', '적게', '많이'], explanation: '높은 ROE는 주주 자본으로 많은 이익을 창출함을 의미합니다.' },
        ],
      },
      {
        id: 'company_3',
        title: '재무제표 기초',
        lessons: [
          { type: 'learn', emoji: '📋', title: '재무제표 3대장', content: '재무제표는 손익계산서(수익/비용), 재무상태표(자산/부채/자본), 현금흐름표(현금 유출입)로 구성됩니다. 투자 전 반드시 확인해야 합니다.' },
          { type: 'quiz', question: '기업의 수익과 비용을 보여주는 재무제표는?', options: ['재무상태표', '현금흐름표', '손익계산서', '자본변동표'], answer: 2, explanation: '손익계산서는 일정 기간의 수익과 비용을 보여줍니다.' },
          { type: 'learn', emoji: '💵', title: '영업이익과 순이익', content: '영업이익은 본업에서 번 이익, 순이익은 세금 등 모든 비용을 뺀 최종 이익입니다. 영업이익률 = 영업이익 ÷ 매출 × 100으로 수익성을 판단합니다.' },
          { type: 'quiz', question: '본업에서 발생한 이익을 무엇이라 하나요?', options: ['순이익', '영업이익', '매출총이익', '당기순이익'], answer: 1, explanation: '영업이익은 핵심 사업의 수익성을 보여줍니다.' },
          { type: 'fillblank', question: '영업이익률 = ___ ÷ 매출 × 100', answer: '영업이익', options: ['순이익', '영업이익', '매출총이익', '자기자본'], explanation: '영업이익률이 높을수록 수익성이 좋은 기업입니다.' },
        ],
      },
      {
        id: 'company_4',
        title: '부채와 안정성',
        lessons: [
          { type: 'learn', emoji: '⚠️', title: '부채비율', content: '부채비율 = 총부채 ÷ 자기자본 × 100. 부채비율이 높을수록 재무 위험이 큽니다. 일반적으로 200% 이하를 안정적으로 봅니다.' },
          { type: 'quiz', question: '부채비율을 구하는 공식은?', options: ['자기자본 ÷ 총부채 × 100', '총부채 ÷ 자기자본 × 100', '순이익 ÷ 총부채', '총자산 ÷ 자기자본'], answer: 1, explanation: '부채비율 = 총부채 ÷ 자기자본 × 100입니다.' },
          { type: 'learn', emoji: '🏦', title: '유동비율', content: '유동비율 = 유동자산 ÷ 유동부채 × 100. 1년 내 갚아야 할 빚을 갚을 능력을 나타냅니다. 100% 이상이면 안전, 200% 이상이면 매우 안정적입니다.' },
          { type: 'quiz', question: '유동비율이 100% 미만일 때 의미하는 것은?', options: ['단기 부채 상환 능력 충분', '단기 부채 상환에 어려움 가능', '장기 투자 여력 있음', '배당 지급 가능'], answer: 1, explanation: '유동비율 100% 미만은 단기 채무 상환 위험 신호입니다.' },
          { type: 'fillblank', question: '부채비율이 ___ 이하면 일반적으로 안정적으로 봅니다.', answer: '200%', options: ['100%', '150%', '200%', '300%'], explanation: '업종마다 다르지만 200% 이하를 일반적 기준으로 사용합니다.' },
        ],
      },
      {
        id: 'company_5',
        title: '성장성 분석',
        lessons: [
          { type: 'learn', emoji: '🚀', title: '매출 성장률', content: '매출 성장률 = (올해 매출 - 작년 매출) ÷ 작년 매출 × 100. 꾸준히 매출이 성장하는 기업이 장기 투자에 유리합니다.' },
          { type: 'quiz', question: '성장주 투자 시 가장 중요하게 보는 지표는?', options: ['배당수익률', '부채비율', '매출 성장률', 'PBR'], answer: 2, explanation: '성장주는 현재 이익보다 미래 성장 가능성을 봅니다.' },
          { type: 'learn', emoji: '📈', title: 'EPS 성장률', content: 'EPS(주당순이익) 성장률이 높을수록 주가 상승 가능성이 높습니다. 연간 EPS 성장률 15% 이상인 기업을 성장주로 분류하는 경우가 많습니다.' },
          { type: 'quiz', question: 'EPS란 무엇인가요?', options: ['주당 매출액', '주당 순이익', '주당 자산', '주당 배당금'], answer: 1, explanation: 'EPS = 순이익 ÷ 발행주식수입니다.' },
          { type: 'fillblank', question: 'EPS = 순이익 ÷ ___', answer: '발행주식수', options: ['자기자본', '발행주식수', '총자산', '매출액'], explanation: 'EPS가 증가한다는 것은 기업이 성장하고 있다는 신호입니다.' },
        ],
      },
    ],
  },

  psychology: {
    id: 'psychology',
    title: '투자 심리',
    emoji: '🧠',
    color: ['#FF2D55', '#CC0033'],
    levels: [
      {
        id: 'psych_1',
        title: '투자 심리의 함정',
        lessons: [
          { type: 'learn', emoji: '🧠', title: '손실 회피 편향', content: '인간은 이익의 기쁨보다 손실의 고통을 2배 더 크게 느낍니다. 이 때문에 손절을 못 하고 손실을 키우는 경우가 많습니다.' },
          { type: 'quiz', question: '손실 회피 편향으로 인해 발생하는 문제는?', options: ['너무 빨리 익절', '손절을 못 하고 손실 키움', '과도한 분산 투자', '배당 과대평가'], answer: 1, explanation: '손실 회피 편향은 손절 타이밍을 놓치게 만듭니다.' },
          { type: 'learn', emoji: '🎯', title: '확증 편향', content: '확증 편향은 자신이 믿고 싶은 정보만 받아들이는 것입니다. 투자한 주식에 대한 나쁜 뉴스를 무시하고 좋은 뉴스만 보는 경향이 있습니다.' },
          { type: 'quiz', question: '자신이 투자한 주식의 나쁜 뉴스를 무시하는 심리는?', options: ['손실 회피', '확증 편향', '군중 심리', '과신 편향'], answer: 1, explanation: '확증 편향은 객관적 판단을 방해합니다.' },
          { type: 'fillblank', question: '인간은 이익의 기쁨보다 손실의 고통을 ___ 배 더 크게 느낍니다.', answer: '2', options: ['1', '2', '3', '5'], explanation: '이를 손실 회피 편향이라고 합니다.' },
        ],
      },
      {
        id: 'psych_2',
        title: '군중 심리와 FOMO',
        lessons: [
          { type: 'learn', emoji: '👥', title: '군중 심리', content: '군중 심리는 다수가 하는 행동을 따라하는 것입니다. 주식시장에서 모두가 살 때 사고 모두가 팔 때 파는 행동은 고점 매수, 저점 매도로 이어질 수 있습니다.' },
          { type: 'quiz', question: '군중 심리로 인한 전형적인 투자 실수는?', options: ['저점 매수, 고점 매도', '고점 매수, 저점 매도', '분산 투자', '장기 보유'], answer: 1, explanation: '군중 심리는 감정적 투자의 원인이 됩니다.' },
          { type: 'learn', emoji: '😰', title: 'FOMO란?', content: 'FOMO(Fear Of Missing Out)는 상승장에서 나만 뒤처질까 봐 두려워 무분별하게 매수하는 심리입니다. FOMO로 매수하면 고점 매수가 되기 쉽습니다.' },
          { type: 'quiz', question: 'FOMO 심리로 인한 문제는?', options: ['너무 빨리 매도', '고점에서 무분별한 매수', '과도한 분산', '배당 무시'], answer: 1, explanation: 'FOMO는 충동적 고점 매수를 유발합니다.' },
          { type: 'fillblank', question: 'FOMO는 ___ 이 두려워 충동적으로 매수하는 심리입니다.', answer: '뒤처지는 것', options: ['손실', '뒤처지는 것', '세금', '배당 손실'], explanation: 'FOMO는 Fear Of Missing Out의 약자입니다.' },
        ],
      },
      {
        id: 'psych_3',
        title: '올바른 투자 습관',
        lessons: [
          { type: 'learn', emoji: '📝', title: '투자 원칙 세우기', content: '성공적인 투자자는 매수/매도 원칙을 미리 정해둡니다. 목표 수익률, 손절선, 투자 기간을 사전에 정하면 감정적 판단을 줄일 수 있습니다.' },
          { type: 'quiz', question: '감정적 투자를 막는 가장 효과적인 방법은?', options: ['많은 종목 매수', '사전에 매매 원칙 수립', '뉴스 매일 확인', '단기 매매'], answer: 1, explanation: '사전 원칙 수립은 감정 개입을 최소화합니다.' },
          { type: 'learn', emoji: '⏰', title: '장기 투자의 힘', content: '워런 버핏은 "10년 보유할 주식이 아니면 10분도 보유하지 말라"고 했습니다. 단기 변동성에 흔들리지 않고 기업 가치에 집중하는 것이 중요합니다.' },
          { type: 'quiz', question: '장기 투자의 핵심은?', options: ['단기 가격 예측', '기업 가치 집중', '뉴스 따라가기', '군중 심리 따르기'], answer: 1, explanation: '장기 투자는 단기 변동성을 이기는 전략입니다.' },
          { type: 'fillblank', question: '투자 전 목표 수익률과 ___ 을 미리 정해야 합니다.', answer: '손절선', options: ['배당금', '손절선', '거래량', '시가총액'], explanation: '손절선 설정은 리스크 관리의 기본입니다.' },
        ],
      },
      {
        id: 'psych_4',
        title: '분산 투자 전략',
        lessons: [
          { type: 'learn', emoji: '🥚', title: '계란을 한 바구니에 담지 마라', content: '분산 투자는 리스크를 줄이는 핵심 전략입니다. 한 종목에 몰빵하면 그 기업이 망할 경우 전 재산을 잃을 수 있습니다.' },
          { type: 'quiz', question: '분산 투자의 주된 목적은?', options: ['수익 극대화', '리스크 감소', '거래량 증가', '세금 절감'], answer: 1, explanation: '분산 투자는 한 종목의 폭락이 전체에 미치는 영향을 줄입니다.' },
          { type: 'learn', emoji: '🌍', title: '섹터 분산', content: '같은 업종끼리는 함께 오르고 함께 내리는 경향이 있습니다. IT, 금융, 소비재, 헬스케어 등 다양한 섹터에 분산하면 리스크를 더욱 줄일 수 있습니다.' },
          { type: 'quiz', question: '효과적인 분산 투자를 위해 고려해야 할 것은?', options: ['같은 업종 여러 종목', '다양한 섹터 분산', '같은 나라 주식만', '동일 시가총액 종목'], answer: 1, explanation: '섹터 분산은 업종 리스크를 줄여줍니다.' },
          { type: 'fillblank', question: '분산 투자는 ___ 을 줄이는 핵심 전략입니다.', answer: '리스크', options: ['수익', '리스크', '세금', '거래비용'], explanation: '계란을 한 바구니에 담지 말라는 투자 격언이 분산 투자의 핵심입니다.' },
        ],
      },
    ],
  },

  macro: {
    id: 'macro',
    title: '거시경제',
    emoji: '🏦',
    color: ['#FF9500', '#FF6B00'],
    levels: [
      {
        id: 'macro_1',
        title: '금리와 주식시장',
        lessons: [
          { type: 'learn', emoji: '🏦', title: '금리와 주가의 관계', content: '금리가 오르면 주가는 하락하는 경향이 있습니다. 이유는 1)채권 매력 증가 2)기업 차입 비용 증가 3)미래 이익의 현재가치 감소 때문입니다.' },
          { type: 'quiz', question: '중앙은행이 금리를 올릴 때 일반적인 주식시장 반응은?', options: ['주가 상승', '주가 하락', '거래량 증가', '변화 없음'], answer: 1, explanation: '금리 인상은 주식 투자 매력을 낮추고 채권 매력을 높입니다.' },
          { type: 'learn', emoji: '📉', title: '기준금리란?', content: '기준금리는 중앙은행이 정하는 핵심 금리로, 모든 금융거래의 기준이 됩니다. 한국의 기준금리는 한국은행 금융통화위원회가 결정합니다.' },
          { type: 'quiz', question: '한국의 기준금리를 결정하는 기관은?', options: ['기획재정부', '금융감독원', '한국은행 금융통화위원회', '코스피위원회'], answer: 2, explanation: '한국은행 금융통화위원회가 매월 기준금리를 결정합니다.' },
          { type: 'fillblank', question: '금리가 오르면 주가는 ___ 하는 경향이 있습니다.', answer: '하락', options: ['상승', '하락', '횡보', '급등'], explanation: '금리와 주가는 반대 방향으로 움직이는 경향이 있습니다.' },
        ],
      },
      {
        id: 'macro_2',
        title: '인플레이션',
        lessons: [
          { type: 'learn', emoji: '💸', title: '인플레이션이란?', content: '인플레이션은 물가가 지속적으로 오르는 현상입니다. 연 2% 정도는 건전한 인플레이션이지만, 지나치면 구매력이 떨어져 경제에 악영향을 줍니다.' },
          { type: 'quiz', question: '인플레이션이 높을 때 중앙은행의 일반적 대응은?', options: ['금리 인하', '금리 인상', '채권 매입', '화폐 발행'], answer: 1, explanation: '금리 인상으로 소비/투자를 줄여 물가를 잡습니다.' },
          { type: 'learn', emoji: '🛡️', title: '인플레이션 헤지 자산', content: '인플레이션 시기에는 부동산, 금, 원자재, 주식(특히 실물 자산 보유 기업) 등이 헤지 수단이 됩니다. 현금은 인플레이션에 취약합니다.' },
          { type: 'quiz', question: '인플레이션 헤지에 가장 취약한 자산은?', options: ['금', '부동산', '현금', '원자재'], answer: 2, explanation: '현금은 인플레이션으로 실질 가치가 떨어집니다.' },
          { type: 'fillblank', question: '물가가 지속적으로 오르는 현상을 ___이라 합니다.', answer: '인플레이션', options: ['디플레이션', '인플레이션', '스태그플레이션', '리세션'], explanation: '적정 수준의 인플레이션은 경제 성장의 신호입니다.' },
        ],
      },
      {
        id: 'macro_3',
        title: '환율과 투자',
        lessons: [
          { type: 'learn', emoji: '💱', title: '환율이란?', content: '환율은 두 나라 화폐의 교환 비율입니다. 원/달러 환율이 오르면(원화 약세) 수출 기업에 유리하고, 내리면(원화 강세) 수입 기업에 유리합니다.' },
          { type: 'quiz', question: '원/달러 환율 상승(원화 약세)이 유리한 기업은?', options: ['수입 의존 기업', '내수 기업', '수출 기업', '금융 기업'], answer: 2, explanation: '환율 상승 시 같은 달러 매출이 더 많은 원화로 환산됩니다.' },
          { type: 'learn', emoji: '🌐', title: '달러 강세와 신흥국', content: '달러가 강해지면 신흥국(한국 포함)에서 외국인 자금이 빠져나가는 경향이 있습니다. 이를 달러 강세에 따른 자금 유출이라고 합니다.' },
          { type: 'quiz', question: '달러 강세 시 한국 주식시장에서 예상되는 현상은?', options: ['외국인 자금 유입', '외국인 자금 유출', '거래량 급증', '코스피 급등'], answer: 1, explanation: '달러 강세 시 외국인은 달러 자산 선호로 신흥국 자금을 회수합니다.' },
          { type: 'fillblank', question: '원/달러 환율이 오르면 ___ 기업에 유리합니다.', answer: '수출', options: ['수입', '수출', '내수', '금융'], explanation: '환율 상승은 수출 기업의 원화 환산 매출을 늘립니다.' },
        ],
      },
      {
        id: 'macro_4',
        title: '경기 사이클',
        lessons: [
          { type: 'learn', emoji: '🔄', title: '경기 사이클 4단계', content: '경기는 회복→확장→후퇴→침체 4단계를 반복합니다. 주식시장은 실물 경기보다 6개월~1년 앞서 움직이는 경향이 있습니다.' },
          { type: 'quiz', question: '주식시장은 실물 경기보다 얼마나 앞서 움직이나요?', options: ['1개월', '3개월', '6개월~1년', '2년'], answer: 2, explanation: '주식시장은 선행지표로 미래 경기를 반영합니다.' },
          { type: 'learn', emoji: '📊', title: 'GDP란?', content: 'GDP(국내총생산)는 한 나라에서 일정 기간 생산된 모든 재화와 서비스의 가치 합계입니다. GDP 성장률이 높으면 경기가 좋다는 신호입니다.' },
          { type: 'quiz', question: 'GDP 성장률이 2분기 연속 마이너스일 때를 무엇이라 하나요?', options: ['인플레이션', '기술적 침체(Recession)', '스태그플레이션', '디플레이션'], answer: 1, explanation: '2분기 연속 GDP 마이너스 성장을 기술적 침체라고 합니다.' },
          { type: 'fillblank', question: '경기 사이클은 회복→확장→후퇴→___ 4단계를 반복합니다.', answer: '침체', options: ['성장', '침체', '안정', '급등'], explanation: '경기 사이클을 이해하면 투자 전략 수립에 도움이 됩니다.' },
        ],
      },
      {
        id: 'macro_5',
        title: '미국 경제와 한국 증시',
        lessons: [
          { type: 'learn', emoji: '🇺🇸', title: '미국 증시의 영향력', content: '한국 증시는 미국 증시와 높은 상관관계를 보입니다. 특히 나스닥이 폭락하면 다음날 코스닥도 하락하는 경향이 있습니다.' },
          { type: 'quiz', question: '미국 나스닥 급락 시 한국 증시 예상 반응은?', options: ['코스피 급등', '코스닥 하락', '거래량 감소', '환율 하락'], answer: 1, explanation: '글로벌 증시는 미국 증시에 연동되는 경향이 있습니다.' },
          { type: 'learn', emoji: '📅', title: '미국 FOMC란?', content: 'FOMC(연방공개시장위원회)는 미국 중앙은행(Fed)의 금리를 결정하는 기구입니다. 연 8회 회의를 열며, 결과 발표 시 전 세계 주식시장이 큰 영향을 받습니다.' },
          { type: 'quiz', question: 'FOMC는 연간 몇 회 회의를 개최하나요?', options: ['4회', '6회', '8회', '12회'], answer: 2, explanation: 'FOMC는 연 8회 정례 회의를 통해 금리를 결정합니다.' },
          { type: 'fillblank', question: '미국 중앙은행의 금리를 결정하는 기구는 ___입니다.', answer: 'FOMC', options: ['SEC', 'FOMC', 'IMF', 'WTO'], explanation: 'FOMC 결정은 전 세계 금융시장에 큰 영향을 미칩니다.' },
        ],
      },
    ],
  },
};

export function getAllLessonsForCategory(categoryId: CategoryId): DuoLesson[] {
  const category = learningContent[categoryId];
  return category.levels.flatMap(level => level.lessons);
}
