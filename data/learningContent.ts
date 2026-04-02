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
          {
            type: 'learn',
            emoji: '🕰️',
            title: '시가와 종가',
            content: '📌 시가(始價, Opening Price)\n하루 중 처음으로 거래된 가격\n\n📌 종가(終價, Closing Price)\n하루 중 마지막으로 거래된 가격\n\n한국 주식시장 운영 시간: 오전 9시 ~ 오후 3시 30분\n\n💡 시가와 종가의 차이로 그날 주가가 오른지 내린지 알 수 있어요!',
          },
          {
            type: 'learn',
            emoji: '📊',
            title: '거래량과 거래대금',
            content: '📌 거래량(Volume)\n하루 동안 거래된 주식의 수량\n예: 삼성전자 거래량 1,000만 주\n\n📌 거래대금\n하루 동안 거래된 금액 (거래량 × 주가)\n예: 거래량 1,000만 주 × 주가 7만원 = 7,000억원\n\n💡 거래량 급증 = 투자자 관심 증가 신호!\n거래량 없이 주가만 오르면 신뢰도가 낮아요.',
          },
          {
            type: 'learn',
            emoji: '🏢',
            title: '시가총액',
            content: '📌 시가총액(Market Capitalization)\n현재 주가 × 총 발행 주식 수\n\n예시:\n삼성전자 주가 73,000원 × 60억 주 ≈ 438조원\n\n💡 시가총액으로 기업의 크기를 비교해요!\n\n• 대형주: 시가총액 1조원 이상\n• 중형주: 3,000억 ~ 1조원\n• 소형주: 3,000억원 미만\n\n코스피 1위 = 한국에서 가장 큰 기업!',
          },
          {
            type: 'quiz',
            question: '하루 중 처음으로 거래된 주식 가격을 무엇이라 하나요?',
            options: ['종가', '시가', '고가', '저가'],
            answer: 1,
            explanation: '시가(始價)는 하루 중 처음으로 거래된 가격이에요. 반대로 종가는 마지막으로 거래된 가격이에요.',
          },
          {
            type: 'quiz',
            question: '시가총액을 구하는 공식은?',
            options: ['주가 ÷ 총 발행 주식 수', '주가 × 거래량', '주가 × 총 발행 주식 수', '거래량 × 거래대금'],
            answer: 2,
            explanation: '시가총액 = 현재 주가 × 총 발행 주식 수. 기업의 전체 가치를 나타내는 지표예요.',
          },
        ],
      },
      {
        id: 'vocab_2',
        title: '투자 지표 용어',
        lessons: [
          {
            type: 'learn',
            emoji: '💹',
            title: 'PER (주가수익비율)',
            content: 'PER = 주가 ÷ 주당순이익(EPS)\n\n"이 회사의 1년치 이익으로 주가를 회수하는 데 몇 년 걸리나?"\n\n예시:\n• 주가 10만원, EPS 1만원 → PER 10배\n• 10년치 이익과 맞먹는 가격\n\n💡 해석:\n• PER 낮으면 → 상대적 저평가\n• PER 높으면 → 미래 성장 기대감 큼\n\n같은 업종끼리 비교하는 게 포인트!',
          },
          {
            type: 'learn',
            emoji: '🏦',
            title: 'PBR (주가순자산비율)',
            content: 'PBR = 주가 ÷ 주당순자산(BPS)\n\n"회사가 지금 문을 닫으면 얼마나 돌려받을 수 있나?"\n\n예시:\n• PBR 1배 = 장부상 자산가치와 동일\n• PBR 0.5배 = 자산가치의 절반 가격\n\n💡 해석:\n• PBR 1배 미만 → 청산가치보다 싸게 거래 (저평가)\n• PBR 1배 이상 → 미래 가치 반영\n\n금융주(은행, 보험) 분석에 특히 많이 사용해요.',
          },
          {
            type: 'learn',
            emoji: '📈',
            title: 'ROE (자기자본이익률)',
            content: 'ROE = 순이익 ÷ 자기자본 × 100 (%)\n\n"내 돈으로 얼마나 효율적으로 수익을 냈나?"\n\n예시:\n• 자기자본 100억, 순이익 20억 → ROE 20%\n• 100원 투자해서 20원 벌었다는 뜻\n\n💡 기준:\n• ROE 15% 이상 → 우량 기업\n• ROE 지속 상승 → 경쟁력 강화 중\n\n워런 버핏이 가장 중요시하는 지표!\n"ROE가 높고 지속되는 기업에 투자하라"',
          },
          {
            type: 'quiz',
            question: 'PER이 낮다는 것은 일반적으로 무엇을 의미하나요?',
            options: ['기업이 적자', '상대적으로 저평가된 상태', '성장성이 없음', '배당금이 높음'],
            answer: 1,
            explanation: 'PER이 낮다는 것은 이익 대비 주가가 저렴하다는 의미로, 상대적 저평가 신호일 수 있어요. 단, 업종 평균과 비교해야 해요.',
          },
          {
            type: 'fillblank',
            question: 'ROE = 순이익 ÷ ___ × 100',
            answer: '자기자본',
            options: ['총자산', '자기자본', '부채', '매출액'],
            explanation: 'ROE(자기자본이익률) = 순이익 ÷ 자기자본 × 100. 자기 돈으로 얼마나 효율적으로 수익을 냈는지 보여줘요.',
          },
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
          {
            type: 'learn',
            emoji: '🕯️',
            title: '캔들의 구조',
            content: '캔들 하나에 4가지 가격 정보가 담겨 있어요!\n\n📌 캔들 구조\n• 시가(Open): 캔들 몸통의 시작점\n• 종가(Close): 캔들 몸통의 끝점\n• 고가(High): 위 꼬리(심지)의 끝\n• 저가(Low): 아래 꼬리(심지)의 끝\n\n📌 색깔 의미 (한국 기준)\n• 🔴 빨간색(양봉): 종가 > 시가 (상승)\n• 🔵 파란색(음봉): 종가 < 시가 (하락)\n\n💡 미국은 반대! 초록=상승, 빨강=하락',
          },
          {
            type: 'learn',
            emoji: '🔴',
            title: '주요 캔들 패턴',
            content: '캔들 패턴으로 추세 전환을 예측할 수 있어요!\n\n📌 망치형(Hammer) 🔨\n• 아래 꼬리가 몸통의 2배 이상\n• 하락 후 등장 시 반등 신호\n\n📌 장악형(Engulfing)\n• 큰 양봉이 이전 음봉을 완전히 감쌈\n• 강한 매수 신호!\n\n📌 도지(Doji)\n• 시가 = 종가 (십자 모양)\n• 매수/매도 세력 균형 → 추세 전환 가능\n\n💡 단일 캔들 패턴보다 여러 캔들의 흐름을 봐야 해요!',
          },
          {
            type: 'learn',
            emoji: '📉',
            title: '이동평균선',
            content: '이동평균선(MA)은 일정 기간 평균 주가를 연결한 선이에요.\n\n📌 주요 이동평균선\n• 5일선: 단기 추세 (1주)\n• 20일선: 단기~중기 (1달)\n• 60일선: 중기 추세 (3달)\n• 120일선: 장기 추세 (6달)\n\n📌 골든크로스 ⭐\n단기선이 장기선을 위로 돌파 → 매수 신호\n\n📌 데드크로스 💀\n단기선이 장기선을 아래로 돌파 → 매도 신호\n\n💡 이동평균선이 모이면(정배열/역배열) 강한 추세 신호!',
          },
          {
            type: 'quiz',
            question: '한국 주식시장에서 양봉(빨간색)이 의미하는 것은?',
            options: ['종가가 시가보다 낮음', '종가가 시가보다 높음', '거래량 급증', '주가 변동 없음'],
            answer: 1,
            explanation: '한국에서 양봉(빨간 캔들)은 종가가 시가보다 높은 상승을 의미해요. 미국은 반대로 초록색이 상승이에요.',
          },
          {
            type: 'quiz',
            question: '단기 이동평균선이 장기 이동평균선을 위로 돌파하는 것을 무엇이라 하나요?',
            options: ['데드크로스', '골든크로스', '망치형', '도지'],
            answer: 1,
            explanation: '골든크로스(Golden Cross)는 단기선이 장기선을 위로 돌파하는 매수 신호예요. 반대는 데드크로스(Dead Cross)라고 해요.',
          },
        ],
      },
      {
        id: 'chart_2',
        title: '기술적 분석 심화',
        lessons: [
          {
            type: 'learn',
            emoji: '📏',
            title: '지지선과 저항선',
            content: '지지선과 저항선은 기술적 분석의 핵심이에요!\n\n📌 지지선(Support)\n주가가 하락하다 반등하는 가격대\n→ 매수 세력이 강한 구간\n→ "이 가격이면 사겠다"는 투자자 多\n\n📌 저항선(Resistance)\n주가가 상승하다 막히는 가격대\n→ 매도 세력이 강한 구간\n→ "이 가격이면 팔겠다"는 투자자 多\n\n📌 역할 전환!\n• 저항선 상향 돌파 → 새로운 지지선\n• 지지선 하향 돌파 → 새로운 저항선\n\n💡 라운드 넘버(5만원, 10만원)가 심리적 지지/저항선 역할!',
          },
          {
            type: 'learn',
            emoji: '📊',
            title: 'RSI (상대강도지수)',
            content: 'RSI는 주가의 과매수/과매도 상태를 측정하는 지표예요.\n\n📌 RSI 계산\n0~100 사이의 값\n• RSI > 70: 과매수 → 조정 가능성\n• RSI < 30: 과매도 → 반등 가능성\n• RSI = 50: 중립\n\n📌 활용법\n• RSI가 70 이상에서 다시 70 아래로 → 매도 고려\n• RSI가 30 이하에서 다시 30 위로 → 매수 고려\n\n💡 RSI만으로 매매 결정은 위험!\n다른 지표와 함께 사용하세요.',
          },
          {
            type: 'quiz',
            question: 'RSI가 30 이하일 때 일반적으로 무엇을 의미하나요?',
            options: ['과매수 상태', '과매도 상태', '강한 상승 추세', '거래량 감소'],
            answer: 1,
            explanation: 'RSI 30 이하는 과매도 상태로 반등 가능성이 높다는 신호예요. 반대로 70 이상은 과매수 상태로 조정 가능성을 나타내요.',
          },
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
        title: '재무제표 읽기',
        lessons: [
          {
            type: 'learn',
            emoji: '📄',
            title: '손익계산서',
            content: '손익계산서는 "얼마나 벌었나?"를 보여줘요.\n\n📌 손익계산서 구조\n매출액\n− 매출원가\n= 매출총이익\n− 판관비(판매관리비)\n= 영업이익 ⭐ (핵심!)\n± 영업외손익\n= 세전이익\n− 법인세\n= 당기순이익\n\n💡 영업이익이 중요한 이유!\n• 본업에서 얼마나 버는지 보여줘요\n• 영업이익이 플러스 = 본업 경쟁력 있음\n• 영업이익률 = 영업이익 ÷ 매출액 × 100',
          },
          {
            type: 'learn',
            emoji: '🏦',
            title: '재무상태표',
            content: '재무상태표는 "지금 얼마나 가지고 있나?"를 보여줘요.\n\n📌 기본 등식\n자산 = 부채 + 자본\n\n📌 주요 지표\n• 부채비율 = 부채 ÷ 자본 × 100\n  → 200% 이하면 안전한 편\n• 유동비율 = 유동자산 ÷ 유동부채 × 100\n  → 150% 이상이면 단기 지급 능력 양호\n\n💡 부채가 많다고 무조건 나쁜 건 아니에요!\n성장을 위한 적절한 레버리지는 필요해요.\n단, 이자비용 감당 가능 여부 확인은 필수!',
          },
          {
            type: 'learn',
            emoji: '💵',
            title: '현금흐름표',
            content: '현금흐름표는 "현금이 어떻게 움직였나?"를 보여줘요.\n\n📌 3가지 현금흐름\n1️⃣ 영업활동 현금흐름\n본업에서 현금이 들어오고 나간 것\n→ 지속적 플러스 = 건전한 기업 ✅\n\n2️⃣ 투자활동 현금흐름\n설비투자, 주식 매입 등\n→ 성장 기업은 보통 마이너스\n\n3️⃣ 재무활동 현금흐름\n차입, 배당, 자사주 매입 등\n\n💡 순이익은 높은데 영업현금흐름이 마이너스?\n→ 회계 조작 의심 신호!',
          },
          {
            type: 'quiz',
            question: '재무제표에서 기업의 본업 경쟁력을 가장 잘 보여주는 지표는?',
            options: ['당기순이익', '영업이익', '매출총이익', '자기자본'],
            answer: 1,
            explanation: '영업이익은 본업(영업활동)에서 벌어들인 이익으로, 기업의 핵심 사업 경쟁력을 가장 잘 보여줘요.',
          },
        ],
      },
      {
        id: 'company_2',
        title: '좋은 기업 고르는 법',
        lessons: [
          {
            type: 'learn',
            emoji: '🏰',
            title: '경제적 해자(Moat)',
            content: '해자(Moat)란 경쟁자가 넘어오지 못하게 막는 성의 도랑!\n기업에서는 경쟁 우위를 말해요.\n\n📌 해자의 종류\n1️⃣ 브랜드 파워\n코카콜라, 애플 — 같은 제품이라도 더 비싸게 팔 수 있어요\n\n2️⃣ 네트워크 효과\n카카오톡, 인스타그램 — 사용자 많을수록 가치 증가\n\n3️⃣ 원가 우위\n아마존 — 규모의 경제로 경쟁사보다 싸게 공급\n\n4️⃣ 전환 비용\n어도비, SAP — 한번 쓰면 다른 것으로 바꾸기 어려움\n\n💡 해자가 넓을수록 장기 투자에 유리해요!',
          },
          {
            type: 'learn',
            emoji: '🚀',
            title: '성장주 vs 가치주',
            content: '📌 성장주(Growth Stock)\n빠르게 성장하는 기업\n• 높은 PER, 높은 매출 성장률\n• 대표: 엔비디아, 테슬라\n• 장점: 큰 수익 가능\n• 단점: 고평가 위험, 변동성 큼\n\n📌 가치주(Value Stock)\n저평가된 기업\n• 낮은 PER·PBR, 안정적 배당\n• 대표: 삼성전자, 현대차\n• 장점: 하방 리스크 낮음\n• 단점: 느린 주가 상승\n\n💡 GARP 전략 = 성장(Growth) + 합리적 가격(At Reasonable Price)\n두 가지를 모두 고려!',
          },
          {
            type: 'quiz',
            question: '경제적 해자(Moat)가 넓은 기업의 특징으로 올바른 것은?',
            options: ['경쟁사가 쉽게 진입 가능', '경쟁 우위가 지속됨', '배당금이 낮음', '부채가 많음'],
            answer: 1,
            explanation: '경제적 해자가 넓은 기업은 브랜드, 네트워크 효과, 원가 우위 등으로 경쟁 우위를 지속적으로 유지할 수 있어요.',
          },
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
        title: '투자자의 심리 함정',
        lessons: [
          {
            type: 'learn',
            emoji: '😱',
            title: '공포와 탐욕',
            content: '"주식시장은 단기적으로 투표기계이지만,\n장기적으로는 체중계다" — 워런 버핏\n\n📌 공포 지수(VIX)\n시장의 두려움 정도를 측정하는 지표\n• VIX 높음 = 시장 공포 → 매수 기회?\n• VIX 낮음 = 시장 안도 → 조정 경계?\n\n📌 공포탐욕지수(Fear & Greed Index)\n0~100 사이\n• 0~25: 극도의 공포\n• 75~100: 극도의 탐욕\n\n💡 "다른 사람들이 탐욕스러울 때 두려워하고,\n다른 사람들이 두려워할 때 탐욕스러워져라"\n— 워런 버핏',
          },
          {
            type: 'learn',
            emoji: '😔',
            title: '손실 회피 편향',
            content: '인간은 같은 금액이라도 이익보다 손실을 2배 더 크게 느껴요!\n\n📌 손실 회피(Loss Aversion)\n10만원 이익의 기쁨 < 10만원 손실의 고통\n\n📌 투자에서의 문제\n• 손실 중인 주식을 팔지 못함 (본전 생각)\n• "팔면 확정 손실이 되니까 그냥 보유"\n→ 손실이 더 커지는 악순환!\n\n📌 해결책\n• 명확한 손절 기준 미리 설정\n• "이 주식을 지금 처음 본다면 살까?"로 판단\n• 포트폴리오 전체 관점으로 보기\n\n💡 손절은 패배가 아니라 리스크 관리예요!',
          },
          {
            type: 'learn',
            emoji: '⚓',
            title: '앵커링 효과',
            content: '앵커링(Anchoring)은 처음 접한 정보에 과도하게 의존하는 심리예요.\n\n📌 투자에서의 앵커링\n• "이 주식 52주 최고가가 10만원이었으니까 5만원이면 싸다"\n  → 현재 기업 가치와 무관한 판단!\n\n• "내가 7만원에 샀으니까 7만원이 되면 판다"\n  → 매수 가격은 미래 주가와 무관!\n\n📌 다른 심리 함정들\n• 확증 편향: 내 생각을 지지하는 정보만 수집\n• 군중 심리: 남들이 사니까 나도 사\n• 최근성 편향: 최근 추세가 계속될 것이라 믿음\n\n💡 투자 판단은 "현재 이 기업의 가치"에 기반해야 해요!',
          },
          {
            type: 'quiz',
            question: '손실 회피 편향으로 인해 투자자들이 흔히 저지르는 실수는?',
            options: ['이익이 나는 주식을 너무 빨리 팜', '손실 중인 주식을 팔지 못함', '분산 투자를 너무 많이 함', '현금 비중을 너무 높게 유지'],
            answer: 1,
            explanation: '손실 회피 편향 때문에 투자자들은 손실 중인 주식을 팔면 손실이 "확정"된다고 느껴 팔지 못하고 손실이 더 커지는 경우가 많아요.',
          },
          {
            type: 'quiz',
            question: '워런 버핏의 투자 격언 "다른 사람들이 탐욕스러울 때 ___하라"에서 빈칸은?',
            options: ['더 탐욕스러워', '두려워', '관망', '분산투자'],
            answer: 1,
            explanation: '"다른 사람들이 탐욕스러울 때 두려워하고, 두려워할 때 탐욕스러워져라" — 시장의 공포를 역이용하는 역발상 투자 원칙이에요.',
          },
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
          {
            type: 'learn',
            emoji: '🏦',
            title: '중앙은행과 기준금리',
            content: '중앙은행은 경제의 "심장"이에요.\n\n📌 주요 중앙은행\n• 미국: 연방준비제도(Fed, 연준)\n• 한국: 한국은행(BOK)\n• 유럽: 유럽중앙은행(ECB)\n• 일본: 일본은행(BOJ)\n\n📌 기준금리란?\n중앙은행이 설정하는 기준이 되는 금리\n시중 금리 전체에 영향을 미쳐요.\n\n📌 FOMC란?\n미국 연준의 금리 결정 회의\n연 8회 개최. 전 세계 시장이 주목!\n\n💡 "연준에 맞서지 마라(Don\'t fight the Fed)"\n연준의 정책 방향이 시장 트렌드를 좌우해요.',
          },
          {
            type: 'learn',
            emoji: '📈',
            title: '금리와 주가의 관계',
            content: '금리는 주식 가치에 직접적인 영향을 미쳐요!\n\n📌 금리 인상 → 주가 하락 경향\n• 기업 이자 부담 증가 → 이익 감소\n• 예금·채권 매력 증가 → 주식 자금 이탈\n• 미래 이익의 현재 가치(DCF) 감소\n\n📌 금리 인하 → 주가 상승 경향\n• 반대 효과!\n• 저금리 → 위험자산(주식) 선호\n\n📌 특히 민감한 섹터\n• 금리 인상에 취약: 성장주, 기술주, 부동산\n• 금리 인상에 유리: 금융주(은행, 보험)\n\n💡 금리 인상 초기에는 주가 하락하지만,\n경기가 좋아서 인상하는 거라면 나중에 상승할 수도!',
          },
          {
            type: 'learn',
            emoji: '📊',
            title: 'CPI와 인플레이션',
            content: 'CPI(소비자물가지수)는 인플레이션을 측정하는 지표예요.\n\n📌 CPI란?\n일반 소비자가 구매하는 상품·서비스 가격 변동\n• 미국 CPI 매월 발표\n• 전년 동월 대비 % 변화로 표시\n\n📌 인플레이션과 주식\n• 적당한 인플레이션(2%): 경기 호황 신호 → 주가 상승\n• 과도한 인플레이션(5%+): 금리 인상 압력 → 주가 하락\n\n📌 스태그플레이션\n경기 침체 + 물가 상승 동시 발생\n→ 최악의 시나리오!\n\n💡 연준 목표 인플레이션 = 2%\n이를 기준으로 금리를 조정해요.',
          },
          {
            type: 'learn',
            emoji: '🔄',
            title: '경기 사이클',
            content: '경기는 4단계로 순환해요!\n\n📌 경기 사이클\n1️⃣ 확장기 (호황)\n• GDP 성장, 실업률 하락\n• 기업 실적 개선 → 주가 상승\n\n2️⃣ 정점 (과열)\n• 인플레이션 상승\n• 금리 인상 시작 → 주가 조정\n\n3️⃣ 수축기 (침체)\n• 경기 둔화, 실업 증가\n• 기업 실적 악화 → 주가 하락\n\n4️⃣ 저점 (불황)\n• 금리 인하 시작\n• 선행 지표 회복 → 주가 반등 시작\n\n💡 주식시장은 실물경제보다 6~12개월 앞서 움직여요!',
          },
          {
            type: 'quiz',
            question: '금리 인상이 주식시장에 미치는 일반적인 영향은?',
            options: ['주가 상승', '주가 하락', '거래량만 증가', '영향 없음'],
            answer: 1,
            explanation: '금리 인상은 기업 이자 부담 증가, 예금 매력 상승, 미래 이익의 현재 가치 감소 등으로 주가 하락 압력을 줘요.',
          },
          {
            type: 'quiz',
            question: '미국 연준(Fed)의 금리 결정 회의 이름은?',
            options: ['G20', 'FOMC', 'IMF', 'WTO'],
            answer: 1,
            explanation: 'FOMC(Federal Open Market Committee, 연방공개시장위원회)는 미국 연준의 금리 결정 기구로 연 8회 회의를 열어요.',
          },
        ],
      },
      {
        id: 'macro_2',
        title: '환율과 글로벌 투자',
        lessons: [
          {
            type: 'learn',
            emoji: '💱',
            title: '환율과 주식시장',
            content: '환율은 두 나라 화폐의 교환 비율이에요.\n\n📌 원/달러 환율 상승 (원화 약세)\n• 1달러 = 1,300원 → 1,400원\n• 수출 기업(삼성, 현대차): 유리 ✅\n  달러를 원화로 환전 시 더 많이 받음\n• 수입 기업, 해외 채무 기업: 불리 ❌\n\n📌 원/달러 환율 하락 (원화 강세)\n• 1달러 = 1,300원 → 1,200원\n• 수출 기업: 불리 ❌\n• 수입 기업: 유리 ✅\n\n📌 외국인 투자와 환율\n• 외국인 자금 유입 → 원화 강세 + 주가 상승\n• 외국인 자금 유출 → 원화 약세 + 주가 하락\n\n💡 해외 주식 투자 시 환율 변동도 수익에 포함돼요!',
          },
          {
            type: 'quiz',
            question: '원/달러 환율이 상승(원화 약세)하면 유리한 기업은?',
            options: ['수입 원자재가 많은 기업', '수출 비중이 높은 기업', '해외 부채가 많은 기업', '국내 소비 중심 기업'],
            answer: 1,
            explanation: '원/달러 환율 상승(원화 약세)은 수출 기업에게 유리해요. 달러로 받은 수익을 원화로 환전할 때 더 많이 받기 때문이에요.',
          },
        ],
      },
    ],
  },
};

export function getAllLessonsForCategory(categoryId: CategoryId): DuoLesson[] {
  const category = learningContent[categoryId];
  return category.levels.flatMap(level => level.lessons);
}
