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
