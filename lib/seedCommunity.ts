/**
 * 커뮤니티 샘플 게시글 시드 데이터
 */

import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';

const SAMPLE_POSTS = [
  {
    category: '투자전략',
    content: '장기 투자의 핵심은 복리 효과입니다. S&P500 지수 ETF에 매월 일정 금액을 꾸준히 투자하는 것만으로도 20년 뒤에는 큰 차이를 만들 수 있어요. 💪',
    tickers: ['SPY', 'VOO'],
  },
  {
    category: '종목분석',
    content: '엔비디아(NVDA)의 AI 칩 수요는 여전히 강합니다. 데이터센터 매출이 전년 대비 200% 성장하며 시장 기대치를 크게 웃돌았네요. 단기 조정이 오면 분할 매수 기회로 볼 수 있을 것 같아요.',
    tickers: ['NVDA'],
  },
  {
    category: '시장뉴스',
    content: '오늘 코스피가 2,600선을 돌파했습니다. 외국인 순매수세가 이어지며 반도체·자동차 섹터가 강세를 보이고 있어요. 환율도 안정되면서 투자 심리가 개선되는 모습입니다.',
    tickers: ['005930', '000270'],
  },
  {
    category: '포트폴리오',
    content: '제 포트폴리오 구성을 공개합니다! 미국 성장주 40%, 배당주 30%, 채권 ETF 20%, 현금 10%로 운용 중입니다. 변동성이 클 때 현금 비중을 늘려두는 게 심리적으로 많이 편하더라고요.',
    tickers: ['QQQ', 'VYM', 'AGG'],
  },
  {
    category: '투자전략',
    content: '리밸런싱의 중요성! 연 2회 포트폴리오를 원래 비중으로 맞춰주는 것만으로 장기 수익률이 개선된다는 연구 결과가 많아요. 오늘은 분기 리밸런싱을 진행했습니다.',
    tickers: [],
  },
  {
    category: '종목분석',
    content: '테슬라(TSLA) 최근 조정에 대한 의견입니다. FSD 완전 자율주행 기술 완성도와 에너지 사업 성장성을 감안하면 현재 주가는 흥미로운 수준이라고 생각해요. 물론 리스크도 큽니다.',
    tickers: ['TSLA'],
  },
  {
    category: '시장뉴스',
    content: '미국 연준(Fed)이 금리를 동결했습니다. 인플레이션이 여전히 목표치 위에 있지만 경기 침체 우려로 인해 추가 인상보다는 관망 기조를 유지하는 듯합니다. 채권 시장 반응이 주목됩니다.',
    tickers: ['TLT', 'SHY'],
  },
  {
    category: '포트폴리오',
    content: '처음 주식 투자를 시작하는 분들께: 소액으로 시작하고, 분산 투자하고, 절대 빌린 돈으로 투자하지 마세요. 플로코 앱으로 모의투자 먼저 연습해보는 것도 좋은 방법이에요! 🚀',
    tickers: [],
  },
];

export async function seedCommunityPosts(adminUid: string): Promise<void> {
  const postsRef = collection(db, 'posts');
  const now = Date.now();

  await Promise.all(
    SAMPLE_POSTS.map((post, index) =>
      addDoc(postsRef, {
        uid: adminUid,
        nickname: 'FLOCO 팀',
        investmentTypeEmoji: '📊',
        category: post.category,
        content: post.content,
        tickers: post.tickers,
        likes: [],
        commentCount: Math.floor(Math.random() * 16),
        createdAt: now - index * 60000, // 1분 간격으로 분산
      })
    )
  );
}
