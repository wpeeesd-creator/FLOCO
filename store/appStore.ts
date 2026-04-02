/**
 * FLOCO 전역 상태 관리
 * 듀오링고 알고리즘: XP, 스트릭, 단계별 잠금해제, 하트 시스템
 * 토스 패턴: 즉각 피드백, 트랜잭션 처리
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { savePortfolio } from '../lib/firestoreService';
import { logStockPurchase, logStockSold, logLessonCompleted, logLevelUp } from '../lib/analytics';
import { recordError, setUserId } from '../lib/crashlytics';

// ── 타입 ──────────────────────────────

export interface Stock {
  ticker: string;
  name: string;
  market: '미국' | '한국';
  price: number;
  change: number;
  logo: string;
  krw: boolean;
  sector?: string;
}

export interface Holding {
  ticker: string;
  qty: number;
  avgPrice: number;
}

export interface TradeRecord {
  id: string;
  ticker: string;
  type: 'buy' | 'sell';
  qty: number;
  price: number;
  fee: number;
  timestamp: number;
}

export interface Lesson {
  id: string;
  step: number;
  emoji: string;
  color: string;
  title: string;
  sub: string;
  xp: number;
  concept: string;
  hl: string;
  eg: string;
  keypoints: string[];
  quiz: {
    q: string;
    opts: string[];
    ans: number;
  };
  reward: {
    type: 'badge' | 'coin';
    label: string;
    desc: string;
  };
}

export interface FloEvent {
  id: string;
  ticker: string;
  impact: number;
  badge: '호재' | '악재';
  title: string;
  desc: string;
  q: string;
  opts: string[];
  ans: number;
  explain: string;
  xp: number;
}

// ── 듀오링고 알고리즘 상수 ──────────────────

const XP_PER_LEVEL = 500;
const MAX_HEARTS = 5;
const STREAK_BONUS_MULTIPLIER = 2; // 7일 연속 시 XP 2배
const STREAK_MILESTONE = 7;

// ── 데이터 ──────────────────────────────

function applyRandomVariation(price: number): number {
  const variation = (Math.random() - 0.48) * 0.06; // -3% ~ +3%
  return Math.round(price * (1 + variation));
}

function applyRandomChange(): number {
  return parseFloat(((Math.random() - 0.48) * 6).toFixed(2));
}

export const STOCKS: Stock[] = [
  // ── 미국 기술 ──
  { ticker: 'AAPL',  name: '애플',           market: '미국', price: 189.50, change: +0.9,  logo: '🍎', krw: false, sector: '기술' },
  { ticker: 'MSFT',  name: '마이크로소프트',   market: '미국', price: 415.30, change: +0.8,  logo: '🔷', krw: false, sector: '기술' },
  { ticker: 'GOOGL', name: '알파벳(구글)',     market: '미국', price: 175.20, change: +0.4,  logo: '🔍', krw: false, sector: '기술' },
  { ticker: 'META',  name: '메타',            market: '미국', price: 512.60, change: +1.3,  logo: '👤', krw: false, sector: '기술' },
  { ticker: 'AMZN',  name: '아마존',          market: '미국', price: 198.70, change: -0.6,  logo: '📦', krw: false, sector: '기술' },
  { ticker: 'NFLX',  name: '넷플릭스',        market: '미국', price: 628.40, change: -0.5,  logo: '🎬', krw: false, sector: '기술' },
  { ticker: 'ADBE',  name: '어도비',          market: '미국', price: 412.80, change: +0.7,  logo: '🎨', krw: false, sector: '기술' },
  { ticker: 'CRM',   name: '세일즈포스',       market: '미국', price: 298.60, change: +1.4,  logo: '☁️', krw: false, sector: '기술' },
  { ticker: 'NOW',   name: '서비스나우',       market: '미국', price: 798.30, change: +1.1,  logo: '⚙️', krw: false, sector: '기술' },
  { ticker: 'INTU',  name: '인튜이트',        market: '미국', price: 612.80, change: +0.8,  logo: '📊', krw: false, sector: '기술' },
  { ticker: 'ORCL',  name: '오라클',          market: '미국', price: 142.30, change: +0.9,  logo: '🔶', krw: false, sector: '기술' },
  { ticker: 'IBM',   name: 'IBM',            market: '미국', price: 198.40, change: +0.3,  logo: '🔵', krw: false, sector: '기술' },
  { ticker: 'UBER',  name: '우버',            market: '미국', price: 78.40,  change: +0.7,  logo: '🚗', krw: false, sector: '기술' },
  { ticker: 'SNAP',  name: '스냅',            market: '미국', price: 12.40,  change: -2.1,  logo: '👻', krw: false, sector: '기술' },
  { ticker: 'PINS',  name: '핀터레스트',       market: '미국', price: 34.80,  change: +1.5,  logo: '📌', krw: false, sector: '기술' },
  { ticker: 'SPOT',  name: '스포티파이',       market: '미국', price: 312.50, change: +1.6,  logo: '🎵', krw: false, sector: '기술' },
  { ticker: 'ABNB',  name: '에어비앤비',       market: '미국', price: 142.80, change: -0.3,  logo: '🏠', krw: false, sector: '기술' },
  { ticker: 'RBLX',  name: '로블록스',         market: '미국', price: 42.60,  change: +1.3,  logo: '🎮', krw: false, sector: '기술' },
  { ticker: 'DASH',  name: '도어대시',         market: '미국', price: 164.50, change: +1.2,  logo: '🍔', krw: false, sector: '기술' },
  // ── 미국 반도체 ──
  { ticker: 'NVDA',  name: '엔비디아',         market: '미국', price: 875.40, change: +3.2,  logo: '🟩', krw: false, sector: '반도체' },
  { ticker: 'AMD',   name: 'AMD',            market: '미국', price: 178.90, change: +2.1,  logo: '🔴', krw: false, sector: '반도체' },
  { ticker: 'INTC',  name: '인텔',            market: '미국', price: 43.20,  change: -0.8,  logo: '🔵', krw: false, sector: '반도체' },
  { ticker: 'QCOM',  name: '퀄컴',            market: '미국', price: 168.40, change: +0.5,  logo: '📡', krw: false, sector: '반도체' },
  { ticker: 'TXN',   name: '텍사스인스트루먼트', market: '미국', price: 198.70, change: -0.3, logo: '📐', krw: false, sector: '반도체' },
  { ticker: 'MU',    name: '마이크론',         market: '미국', price: 112.30, change: +3.1,  logo: '💾', krw: false, sector: '반도체' },
  { ticker: 'AMAT',  name: '어플라이드머티리얼즈', market: '미국', price: 198.60, change: +1.9, logo: '🔧', krw: false, sector: '반도체' },
  { ticker: 'LRCX',  name: '램리서치',         market: '미국', price: 912.40, change: +2.3,  logo: '🔬', krw: false, sector: '반도체' },
  { ticker: 'AVGO',  name: '브로드컴',         market: '미국', price: 215.60, change: +1.2,  logo: '📶', krw: false, sector: '반도체' },
  { ticker: 'TSM',   name: 'TSMC',           market: '미국', price: 178.90, change: +2.4,  logo: '🇹🇼', krw: false, sector: '반도체' },
  { ticker: 'ASML',  name: 'ASML',           market: '미국', price: 892.40, change: -0.6,  logo: '🔬', krw: false, sector: '반도체' },
  // ── 미국 금융 ──
  { ticker: 'JPM',   name: 'JP모건',          market: '미국', price: 198.70, change: +0.8,  logo: '🏦', krw: false, sector: '금융' },
  { ticker: 'GS',    name: '골드만삭스',       market: '미국', price: 478.20, change: -0.2,  logo: '💼', krw: false, sector: '금융' },
  { ticker: 'V',     name: '비자',            market: '미국', price: 278.40, change: +0.3,  logo: '💳', krw: false, sector: '금융' },
  { ticker: 'MA',    name: '마스터카드',       market: '미국', price: 478.90, change: +0.5,  logo: '💳', krw: false, sector: '금융' },
  { ticker: 'BAC',   name: '뱅크오브아메리카', market: '미국', price: 38.40,  change: +0.4,  logo: '🏛️', krw: false, sector: '금융' },
  { ticker: 'WFC',   name: '웰스파고',        market: '미국', price: 58.90,  change: +0.6,  logo: '🏛️', krw: false, sector: '금융' },
  { ticker: 'MS',    name: '모건스탠리',       market: '미국', price: 98.40,  change: +0.3,  logo: '💼', krw: false, sector: '금융' },
  { ticker: 'PYPL',  name: '페이팔',          market: '미국', price: 78.40,  change: -1.2,  logo: '🅿️', krw: false, sector: '금융' },
  { ticker: 'SQ',    name: '블록',            market: '미국', price: 68.30,  change: -0.9,  logo: '⬛', krw: false, sector: '금융' },
  { ticker: 'COIN',  name: '코인베이스',       market: '미국', price: 198.30, change: +4.2,  logo: '🪙', krw: false, sector: '금융' },
  { ticker: 'BRKB',  name: '버크셔해서웨이',   market: '미국', price: 452.30, change: +0.3,  logo: '🦉', krw: false, sector: '금융' },
  // ── 미국 헬스케어 ──
  { ticker: 'JNJ',   name: '존슨앤드존슨',    market: '미국', price: 152.30, change: +0.4,  logo: '🏥', krw: false, sector: '헬스케어' },
  { ticker: 'PFE',   name: '화이자',          market: '미국', price: 28.40,  change: -0.7,  logo: '💊', krw: false, sector: '헬스케어' },
  { ticker: 'LLY',   name: '일라이릴리',      market: '미국', price: 782.40, change: +1.8,  logo: '💉', krw: false, sector: '헬스케어' },
  { ticker: 'ABBV',  name: '애브비',          market: '미국', price: 178.40, change: +0.9,  logo: '🧬', krw: false, sector: '헬스케어' },
  { ticker: 'MRK',   name: '머크',            market: '미국', price: 128.60, change: +0.5,  logo: '💊', krw: false, sector: '헬스케어' },
  { ticker: 'UNH',   name: '유나이티드헬스',   market: '미국', price: 512.80, change: +0.7,  logo: '🩺', krw: false, sector: '헬스케어' },
  // ── 미국 소비재 ──
  { ticker: 'TSLA',  name: '테슬라',          market: '미국', price: 242.30, change: -1.4,  logo: '⚡', krw: false, sector: '자동차' },
  { ticker: 'NKE',   name: '나이키',          market: '미국', price: 98.60,  change: -0.4,  logo: '👟', krw: false, sector: '소비재' },
  { ticker: 'SBUX',  name: '스타벅스',        market: '미국', price: 89.30,  change: +0.6,  logo: '☕', krw: false, sector: '소비재' },
  { ticker: 'MCD',   name: '맥도날드',        market: '미국', price: 298.40, change: +0.3,  logo: '🍔', krw: false, sector: '소비재' },
  { ticker: 'DIS',   name: '디즈니',          market: '미국', price: 112.40, change: +0.5,  logo: '🏰', krw: false, sector: '미디어' },
  // ── 미국 에너지 ──
  { ticker: 'XOM',   name: '엑슨모빌',        market: '미국', price: 112.80, change: +1.1,  logo: '🛢️', krw: false, sector: '에너지' },
  { ticker: 'CVX',   name: '셰브론',          market: '미국', price: 158.40, change: +0.8,  logo: '⛽', krw: false, sector: '에너지' },
  // ── 미국 AI·성장주 ──
  { ticker: 'PLTR',  name: '팔란티어',        market: '미국', price: 24.60,  change: +2.8,  logo: '🔭', krw: false, sector: 'AI' },
  { ticker: 'RIVN',  name: '리비안',          market: '미국', price: 12.40,  change: -2.3,  logo: '🚙', krw: false, sector: '전기차' },
  { ticker: 'LCID',  name: '루시드',          market: '미국', price: 3.80,   change: -1.6,  logo: '🔋', krw: false, sector: '전기차' },
  { ticker: 'HOOD',  name: '로빈후드',        market: '미국', price: 18.70,  change: +3.1,  logo: '🏹', krw: false, sector: '핀테크' },
  { ticker: 'SHOP',  name: '쇼피파이',        market: '미국', price: 78.90,  change: +1.4,  logo: '🛍️', krw: false, sector: '이커머스' },
  { ticker: 'SNOW',  name: '스노우플레이크',   market: '미국', price: 168.40, change: -1.2,  logo: '❄️', krw: false, sector: '클라우드' },
  // ── 미국 ETF ──
  { ticker: 'SPY',   name: 'S&P500 ETF',     market: '미국', price: 512.30, change: +0.94, logo: '🌐', krw: false, sector: 'ETF' },
  { ticker: 'QQQ',   name: '나스닥100 ETF',   market: '미국', price: 440.20, change: +1.12, logo: '💡', krw: false, sector: 'ETF' },
  { ticker: 'ARKK',  name: 'ARK 이노베이션',  market: '미국', price: 48.30,  change: +2.34, logo: '🚀', krw: false, sector: 'ETF' },

  // ── 한국 반도체 ──
  { ticker: '005930', name: '삼성전자',        market: '한국', price: 75400,  change: +1.2,  logo: '📱', krw: true, sector: '반도체' },
  { ticker: '000660', name: 'SK하이닉스',      market: '한국', price: 198500, change: -0.8,  logo: '🔬', krw: true, sector: '반도체' },
  { ticker: '009150', name: '삼성전기',        market: '한국', price: 145000, change: +2.1,  logo: '⚡', krw: true, sector: '반도체' },
  // ── 한국 IT ──
  { ticker: '035420', name: 'NAVER',          market: '한국', price: 215000, change: -0.3,  logo: '🟩', krw: true, sector: 'IT' },
  { ticker: '035720', name: '카카오',          market: '한국', price: 48200,  change: +2.1,  logo: '💬', krw: true, sector: 'IT' },
  { ticker: '377300', name: '카카오페이',       market: '한국', price: 38750,  change: +1.7,  logo: '💸', krw: true, sector: 'IT' },
  { ticker: '323410', name: '카카오뱅크',       market: '한국', price: 24150,  change: -1.1,  logo: '🏦', krw: true, sector: 'IT' },
  { ticker: '018260', name: '삼성에스디에스',   market: '한국', price: 152000, change: +1.1,  logo: '💻', krw: true, sector: 'IT' },
  { ticker: '066570', name: 'LG전자',          market: '한국', price: 98400,  change: +0.7,  logo: '📺', krw: true, sector: 'IT' },
  // ── 한국 바이오 ──
  { ticker: '207940', name: '삼성바이오로직스', market: '한국', price: 798000, change: -0.4,  logo: '🧬', krw: true, sector: '바이오' },
  { ticker: '068270', name: '셀트리온',        market: '한국', price: 178500, change: +0.9,  logo: '💊', krw: true, sector: '바이오' },
  { ticker: '000100', name: '유한양행',        market: '한국', price: 98500,  change: +1.2,  logo: '💊', krw: true, sector: '바이오' },
  { ticker: '128940', name: '한미약품',        market: '한국', price: 312000, change: +2.4,  logo: '💉', krw: true, sector: '바이오' },
  // ── 한국 자동차 ──
  { ticker: '005380', name: '현대차',          market: '한국', price: 245000, change: +0.5,  logo: '🚗', krw: true, sector: '자동차' },
  { ticker: '000270', name: '기아',            market: '한국', price: 118500, change: +0.7,  logo: '🚙', krw: true, sector: '자동차' },
  { ticker: '012330', name: '현대모비스',       market: '한국', price: 245000, change: +0.3,  logo: '🔧', krw: true, sector: '자동차' },
  { ticker: '161390', name: '한국타이어',       market: '한국', price: 52300,  change: +0.4,  logo: '⭕', krw: true, sector: '자동차' },
  // ── 한국 2차전지 ──
  { ticker: '373220', name: 'LG에너지솔루션',  market: '한국', price: 412000, change: +1.8,  logo: '🔋', krw: true, sector: '2차전지' },
  { ticker: '006400', name: '삼성SDI',         market: '한국', price: 289000, change: -0.6,  logo: '⚡', krw: true, sector: '2차전지' },
  { ticker: '051910', name: 'LG화학',          market: '한국', price: 312000, change: +1.5,  logo: '🧪', krw: true, sector: '2차전지' },
  // ── 한국 금융 ──
  { ticker: '105560', name: 'KB금융',          market: '한국', price: 72300,  change: +0.5,  logo: '🏦', krw: true, sector: '금융' },
  { ticker: '055550', name: '신한지주',        market: '한국', price: 47850,  change: +1.3,  logo: '🏛️', krw: true, sector: '금융' },
  { ticker: '086790', name: '하나금융지주',     market: '한국', price: 58200,  change: +0.8,  logo: '🏛️', krw: true, sector: '금융' },
  { ticker: '032830', name: '삼성생명',        market: '한국', price: 98500,  change: +1.5,  logo: '🛡️', krw: true, sector: '금융' },
  { ticker: '000810', name: '삼성화재',        market: '한국', price: 298000, change: +0.7,  logo: '🛡️', krw: true, sector: '금융' },
  { ticker: '024110', name: '기업은행',        market: '한국', price: 14850,  change: +0.3,  logo: '🏦', krw: true, sector: '금융' },
  // ── 한국 게임 ──
  { ticker: '259960', name: '크래프톤',        market: '한국', price: 298000, change: +2.3,  logo: '🎮', krw: true, sector: '게임' },
  { ticker: '251270', name: '넷마블',          market: '한국', price: 54300,  change: +0.6,  logo: '🎲', krw: true, sector: '게임' },
  { ticker: '036570', name: '엔씨소프트',       market: '한국', price: 178000, change: -1.8,  logo: '⚔️', krw: true, sector: '게임' },
  { ticker: '263750', name: '펄어비스',        market: '한국', price: 38500,  change: +1.2,  logo: '🏴', krw: true, sector: '게임' },
  { ticker: '293490', name: '카카오게임즈',     market: '한국', price: 21800,  change: -0.7,  logo: '🎯', krw: true, sector: '게임' },
  // ── 한국 에너지 ──
  { ticker: '096770', name: 'SK이노베이션',    market: '한국', price: 132000, change: -1.3,  logo: '⛽', krw: true, sector: '에너지' },
  { ticker: '010950', name: 'S-Oil',          market: '한국', price: 78400,  change: +0.6,  logo: '🛢️', krw: true, sector: '에너지' },
  { ticker: '034020', name: '두산에너빌리티',   market: '한국', price: 19450,  change: +0.4,  logo: '⚙️', krw: true, sector: '에너지' },
  { ticker: '015760', name: '한국전력',        market: '한국', price: 21350,  change: -0.5,  logo: '💡', krw: true, sector: '에너지' },
  { ticker: '036460', name: '한국가스공사',     market: '한국', price: 32150,  change: +0.2,  logo: '🔥', krw: true, sector: '에너지' },
  // ── 한국 방산 ──
  { ticker: '012450', name: '한화에어로스페이스', market: '한국', price: 289000, change: +3.1, logo: '✈️', krw: true, sector: '방산' },
  { ticker: '047810', name: '한국항공우주',     market: '한국', price: 68500,  change: +1.8,  logo: '🛩️', krw: true, sector: '방산' },
  // ── 한국 통신 ──
  { ticker: '017670', name: 'SK텔레콤',        market: '한국', price: 52300,  change: +0.8,  logo: '📶', krw: true, sector: '통신' },
  { ticker: '030200', name: 'KT',             market: '한국', price: 39850,  change: -0.4,  logo: '📞', krw: true, sector: '통신' },
  // ── 한국 철강·소재 ──
  { ticker: '005490', name: 'POSCO홀딩스',     market: '한국', price: 398000, change: -0.2,  logo: '🏗️', krw: true, sector: '소재' },
  { ticker: '010130', name: '고려아연',        market: '한국', price: 678000, change: -0.3,  logo: '🪨', krw: true, sector: '소재' },
  { ticker: '011170', name: '롯데케미칼',       market: '한국', price: 89400,  change: +0.8,  logo: '🧪', krw: true, sector: '소재' },
  // ── 한국 지주·건설 ──
  { ticker: '034730', name: 'SK',             market: '한국', price: 178000, change: -0.9,  logo: '🔴', krw: true, sector: '지주' },
  { ticker: '003550', name: 'LG',             market: '한국', price: 78200,  change: -0.8,  logo: '🔴', krw: true, sector: '지주' },
  { ticker: '028260', name: '삼성물산',        market: '한국', price: 145000, change: +0.6,  logo: '🏢', krw: true, sector: '건설' },
  // ── 한국 엔터 ──
  { ticker: '352820', name: '하이브',          market: '한국', price: 198000, change: -0.9,  logo: '🎵', krw: true, sector: '엔터' },
  // ── 한국 기타 ──
  { ticker: '033780', name: 'KT&G',           market: '한국', price: 108500, change: +0.7,  logo: '🚬', krw: true, sector: '담배' },
  { ticker: '021240', name: '코웨이',          market: '한국', price: 62400,  change: +0.9,  logo: '💧', krw: true, sector: '가전' },
  { ticker: '011200', name: 'HMM',            market: '한국', price: 18450,  change: -1.3,  logo: '🚢', krw: true, sector: '해운' },
  { ticker: '010120', name: 'LS일렉트릭',      market: '한국', price: 198000, change: +1.9,  logo: '⚡', krw: true, sector: '전기' },
  // ── 한국 추가 종목 ──
  { ticker: '034220', name: 'LG디스플레이',     market: '한국', price: 14500,  change: -1.2,  logo: '📺', krw: true, sector: '전자' },
  { ticker: '247540', name: '에코프로비엠',     market: '한국', price: 198000, change: +2.8,  logo: '🔋', krw: true, sector: '2차전지' },
  { ticker: '086520', name: '에코프로',         market: '한국', price: 89000,  change: +3.1,  logo: '🔋', krw: true, sector: '2차전지' },
  { ticker: '326030', name: '에이비엘바이오',   market: '한국', price: 28500,  change: +1.5,  logo: '🧬', krw: true, sector: '바이오' },
  { ticker: '195870', name: '해성디에스',       market: '한국', price: 78500,  change: +0.8,  logo: '🔧', krw: true, sector: '자동차' },
  { ticker: '064350', name: '현대로템',         market: '한국', price: 45800,  change: +2.1,  logo: '🚂', krw: true, sector: '방산' },
  { ticker: '032640', name: 'LG유플러스',       market: '한국', price: 11850,  change: -0.5,  logo: '📡', krw: true, sector: '통신' },
  { ticker: '225570', name: '넥슨게임즈',       market: '한국', price: 21500,  change: +1.3,  logo: '🎮', krw: true, sector: '게임' },
  // ── 미국 추가 종목 ──
  { ticker: 'COST',  name: '코스트코',         market: '미국', price: 912.30, change: +0.6,  logo: '🏪', krw: false, sector: '소비재' },
  { ticker: 'WMT',   name: '월마트',           market: '미국', price: 68.40,  change: +0.3,  logo: '🏬', krw: false, sector: '소비재' },
  { ticker: 'NET',   name: '클라우드플레어',    market: '미국', price: 98.40,  change: +1.8,  logo: '☁️', krw: false, sector: '클라우드' },
  { ticker: 'DDOG',  name: '데이터독',         market: '미국', price: 128.60, change: +2.1,  logo: '🐕', krw: false, sector: '클라우드' },
  { ticker: 'ZM',    name: '줌',              market: '미국', price: 68.40,  change: -0.8,  logo: '📹', krw: false, sector: '기술' },
  { ticker: 'T',     name: 'AT&T',            market: '미국', price: 18.40,  change: +0.2,  logo: '📞', krw: false, sector: '통신' },
  { ticker: 'VZ',    name: '버라이즌',         market: '미국', price: 42.30,  change: -0.3,  logo: '📶', krw: false, sector: '통신' },
];

// Apply random price variation on each app start
STOCKS.forEach(s => {
  s.price = s.krw ? applyRandomVariation(s.price) : parseFloat((s.price * (1 + (Math.random() - 0.48) * 0.06)).toFixed(2));
  s.change = applyRandomChange();
});

export const LESSONS: Lesson[] = [
  {
    id: 'l1', step: 1, emoji: '📘', color: '#1A3A6B', title: '주식이란 무엇인가', sub: '기업 소유권의 기초 개념', xp: 15,
    reward: { type: 'badge', label: '📜 주식 입문', desc: '첫 수업 완료 뱃지' },
    concept: '주식은 기업의 소유권을 나타내는 증서입니다. 주식을 보유하면 그 기업의 주주(소유자)가 되어, 회사가 성장할수록 함께 이익을 나눌 수 있습니다.',
    hl: '📌 주식 보유 = 기업의 공동 소유자',
    eg: '예시: 삼성전자 주식 1주(약 73,400원)를 사면 삼성전자의 0.0000000015% 주인이 됩니다.',
    keypoints: ['주식 = 기업 소유권 증서', '상장기업 주식은 증권거래소에서 매매 가능', '주주는 배당금 + 의결권을 가짐'],
    quiz: { q: '주식을 구매하면 어떤 권리를 얻게 될까요?', opts: ['은행 이자 수취권', '기업 소유권 및 의결권', '채권 이자 수취권', '부동산 임대권'], ans: 1 },
  },
  {
    id: 'l2', step: 2, emoji: '📊', color: '#1A4D2E', title: '기업 분석 기초', sub: '재무제표 읽는 법', xp: 20,
    reward: { type: 'coin', label: '💰 +500 플로코인', desc: '재무 분석가 칭호 획득' },
    concept: '기업 분석의 핵심은 재무제표입니다. 재무제표는 기업의 건강 상태를 보여주는 성적표로, 이걸 읽을 줄 알면 좋은 기업과 나쁜 기업을 구분할 수 있습니다.',
    hl: '📌 손익계산서 · 재무상태표 · 현금흐름표',
    eg: '예시: 매출 1조원, 순이익 500억원 → 순이익률 5%. 동종업계 평균이 10%라면 비효율적으로 운영 중일 수 있습니다.',
    keypoints: ['손익계산서: 얼마 벌고 얼마 썼나', '재무상태표: 자산·부채·자본 현황', '현금흐름표: 실제 돈이 어떻게 흐르나'],
    quiz: { q: '기업의 매출과 순이익을 확인하는 재무제표는?', opts: ['재무상태표', '현금흐름표', '손익계산서', '자본변동표'], ans: 2 },
  },
  {
    id: 'l3', step: 3, emoji: '📈', color: '#4A1A6B', title: 'PER 이해하기', sub: '주가수익비율 완전 정복', xp: 20,
    reward: { type: 'badge', label: '🔍 밸류에이션 탐정', desc: 'PER 분석 뱃지' },
    concept: 'PER(Price Earnings Ratio)은 현재 주가가 1주당 순이익의 몇 배인지를 나타냅니다.',
    hl: '📌 PER = 주가 ÷ 주당순이익(EPS)',
    eg: '예시: 삼성전자 주가 73,000원 / EPS 5,200원 = PER 14배. 반도체 업종 평균 PER이 20배라면 저평가된 상태.',
    keypoints: ['PER 낮음 = 이익 대비 주가가 쌈', 'PER 높음 = 미래 성장 기대가 높음', '같은 업종끼리 비교해야 의미 있음'],
    quiz: { q: 'PER이 높다는 것은 무엇을 의미할까요?', opts: ['기업이 저평가되어 있다', '기업의 주가가 이익 대비 높다', '기업이 파산 위기에 있다', '배당금이 많이 지급된다'], ans: 1 },
  },
  {
    id: 'l4', step: 4, emoji: '🌐', color: '#6B4A00', title: '분산 투자 전략', sub: '리스크를 줄이는 황금 법칙', xp: 30,
    reward: { type: 'coin', label: '💰 +1,000 플로코인', desc: '리스크 관리 전문가 칭호' },
    concept: '분산 투자는 여러 종목·자산·국가에 나누어 투자하여 한 곳에서 손실이 나더라도 전체 자산에 미치는 영향을 줄이는 전략입니다.',
    hl: '📌 달걀을 한 바구니에 담지 마라',
    eg: '예시: 삼성전자만 100만원 → -30% 시 -30만원 손실. vs 3개 종목 분산 → 전체 손실 -10만원.',
    keypoints: ['종목 분산: 여러 기업에 나눠 투자', '자산 분산: 주식·채권·금에 분산', '국가 분산: 한국·미국·글로벌 ETF'],
    quiz: { q: '분산투자의 주요 목적은?', opts: ['수익 극대화', '리스크 감소', '빠른 매매', '세금 절약'], ans: 1 },
  },
  {
    id: 'l5', step: 5, emoji: '💹', color: '#1A5C3A', title: 'ETF 이해하기', sub: '상장지수펀드 완전 정복', xp: 40,
    reward: { type: 'badge', label: '🌐 ETF 마스터', desc: 'ETF 전문가 뱃지' },
    concept: 'ETF(Exchange Traded Fund)는 특정 지수를 추종하는 펀드로, 주식처럼 자유롭게 사고팔 수 있습니다.',
    hl: '📌 낮은 비용 + 광범위한 분산 = ETF의 핵심 강점',
    eg: '예시: SPY 1주 = 미국 상위 500개 기업 동시 투자. 연간 수수료 0.09%.',
    keypoints: ['지수 추종: 시장 전체에 투자', '주식처럼 매매 가능', '낮은 수수료'],
    quiz: { q: 'ETF의 가장 큰 장점은?', opts: ['고수익 보장', '낮은 비용의 분산투자', '단일 종목 집중', '세금 면제'], ans: 1 },
  },
  {
    id: 'l6', step: 6, emoji: '💰', color: '#6B1A1A', title: '배당주 투자', sub: '매달 월급처럼 받는 투자', xp: 35,
    reward: { type: 'coin', label: '💰 +1,500 플로코인', desc: '배당 투자자 칭호' },
    concept: '배당주란 기업이 번 이익의 일부를 주주에게 현금으로 나눠주는 주식입니다.',
    hl: '📌 배당수익률 = 주당 배당금 ÷ 현재 주가 × 100',
    eg: '예시: 코카콜라 주가 $60, 연간 배당금 $1.84 → 배당수익률 3.1%.',
    keypoints: ['배당수익률: 투자 대비 현금 수익 비율', '배당성향: 순이익 중 배당 비율', '배당 귀족주: 25년+ 배당 증가 기업'],
    quiz: { q: '배당수익률을 계산하는 공식은?', opts: ['주가 ÷ 배당금 × 100', '배당금 ÷ 주가 × 100', '순이익 ÷ 매출 × 100', '자산 ÷ 부채 × 100'], ans: 1 },
  },
  {
    id: 'l7', step: 7, emoji: '📉', color: '#1A3A6B', title: '시장 심리와 투자', sub: '공포와 탐욕 지수 읽기', xp: 45,
    reward: { type: 'badge', label: '🧠 심리 투자 전문가', desc: '감정 제어 뱃지' },
    concept: '주식 시장은 숫자가 아니라 사람들의 심리로 움직입니다.',
    hl: '📌 공포에 사고, 탐욕에 팔아라 — 워렌 버핏',
    eg: '예시: 2020년 코로나 폭락 때 S&P500을 산 투자자는 2년 후 +100% 수익.',
    keypoints: ['공포·탐욕 지수(0~100)', 'FOMO: 고점 매수의 함정', '손절의 심리학'],
    quiz: { q: '"남들이 두려워할 때 사라"고 한 투자자는?', opts: ['피터 린치', '레이 달리오', '워렌 버핏', '조지 소로스'], ans: 2 },
  },
  {
    id: 'l8', step: 8, emoji: '🚀', color: '#4A006B', title: '성장주 vs 가치주', sub: '나에게 맞는 투자 스타일', xp: 50,
    reward: { type: 'coin', label: '🏆 +2,000 플로코인 + 레벨업', desc: '투자 스타일리스트 칭호' },
    concept: '성장주는 미래 성장 가능성에 베팅, 가치주는 현재 이익 대비 저평가된 주식입니다.',
    hl: '📌 성장주 = 미래에 베팅 / 가치주 = 현재 가치에 집중',
    eg: '예시: 엔비디아(성장주) PER 60배 vs 코카콜라(가치주) PER 25배, 배당 3%.',
    keypoints: ['성장주: 높은 PER, 높은 변동성', '가치주: 낮은 PER, 배당 있음', '혼합 전략 권장'],
    quiz: { q: '성장주의 특징으로 올바른 것은?', opts: ['PER이 낮고 배당이 높다', '미래 성장 기대로 PER이 높다', '주가 변동이 거의 없다', '반드시 배당을 지급한다'], ans: 1 },
  },
];

export const FLO_EVENTS: FloEvent[] = [
  { id: 'ev1', ticker: 'AAPL', impact: -3.2, badge: '악재', title: 'Apple CEO 팀 쿡 갑작스러운 사임 발표', desc: 'Apple의 팀 쿡 CEO가 건강 문제로 사임을 발표했습니다.', q: 'Apple 주가가 하락한 주요 원인은 무엇일까요?', opts: ['CEO 교체 불확실성', '정치적 규제 이슈', '공급망 차질', '배당 삭감'], ans: 0, explain: 'CEO 교체는 경영 연속성에 대한 불확실성을 높여 단기적으로 주가 하락을 야기합니다.', xp: 25 },
  { id: 'ev2', ticker: 'NVDA', impact: +5.8, badge: '호재', title: '엔비디아, 차세대 AI 칩 "H300" 발표!', desc: '엔비디아가 H300 GPU를 공개하며 기존 대비 AI 성능이 3배 향상됐다고 밝혔습니다.', q: '엔비디아 주가가 상승한 주요 이유는?', opts: ['배당 증가 발표', '새 AI 칩으로 시장 지배력 강화', 'CEO 교체', '주식 분할'], ans: 1, explain: '신제품 발표로 미래 실적 기대감이 높아지면 주가가 상승합니다.', xp: 25 },
  { id: 'ev3', ticker: '005930', impact: -2.1, badge: '악재', title: '삼성전자 화성 반도체 공장 화재', desc: '경기도 화성 반도체 생산라인에서 화재가 발생해 생산에 차질이 생겼습니다.', q: '이 사건이 삼성전자 주가에 미치는 영향은?', opts: ['주가 상승 — 단가 상승', '주가 하락 — 생산 차질', '변동 없음', '외국인 매수 증가'], ans: 1, explain: '생산 차질은 단기 실적 악화와 고객사의 대안 공급처 탐색을 유발합니다.', xp: 20 },
  { id: 'ev4', ticker: 'TSLA', impact: -4.5, badge: '악재', title: '테슬라 중국 판매량 전년 대비 30% 급감', desc: '중국 시장에서 BYD에 밀려 테슬라 판매량이 30% 감소했습니다.', q: '중국 판매 부진이 테슬라 주가에 미치는 영향은?', opts: ['긍정적 — 미국 집중', '부정적 — 성장 스토리 훼손', '중립적', '배당 증가'], ans: 1, explain: '중국은 전기차 최대 시장입니다. 판매 부진은 글로벌 성장 둔화를 시사합니다.', xp: 20 },
];

// ── 스토어 타입 ──────────────────────────

interface AppState {
  // 현재 유저 ID
  userId: string;

  // 포트폴리오
  cash: number;
  holdings: Holding[];
  trades: TradeRecord[];

  // 듀오링고 알고리즘
  xp: number;
  level: number;
  hearts: number;
  streak: number;
  lastCheckIn: string;
  lastStudyDate: string;
  completedLessons: string[];
  floPoints: number;
  completedEvents: string[];
  achievements: string[];

  // 유저 데이터 로드/초기화
  loadFromSnapshot: (userId: string, snapshot: Partial<{
    cash: number; holdings: Holding[]; trades: TradeRecord[];
    xp: number; level: number; streak: number; hearts: number;
    lastCheckIn: string; lastStudyDate: string; floPoints: number;
    completedLessons: string[]; completedEvents: string[]; achievements: string[];
  }>) => void;
  syncToAuth: () => void;
  syncToAuthAsync: () => Promise<void>;

  // Optimistic UI — 거래 진행 중 여부
  isTradePending: boolean;

  // 액션 — 거래 (Optimistic UI: 로컬 즉시 반영 → 백그라운드 Firestore 동기화 → 실패 시 롤백)
  buyStock: (ticker: string, qty: number, price: number) => Promise<{ success: boolean; message: string }>;
  sellStock: (ticker: string, qty: number, price: number) => Promise<{ success: boolean; message: string }>;

  // 액션 — 듀오링고 알고리즘
  completeLesson: (lessonId: string) => { xpGained: number; levelUp: boolean; streakBonus: boolean };
  completeEvent: (eventId: string, xp: number) => void;
  answerDailyQuestion: (key: string, floReward: number) => { floGained: number };
  loseHeart: () => boolean; // true = 하트 소진
  restoreHearts: () => void;
  initStreak: () => void;

  // 유틸
  getTotalValue: () => number;
  getReturnRate: () => number;
  getLessonStatus: (lessonId: string) => 'completed' | 'active' | 'locked';
}

// ── 스토어 구현 ──────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 초기값 (로그인 전 기본값)
      userId: '',
      cash: 1_000_000,
      holdings: [],
      trades: [],
      xp: 0,
      level: 1,
      hearts: 5,
      streak: 0,
      lastCheckIn: '',
      lastStudyDate: '',
      completedLessons: [],
      floPoints: 0,
      completedEvents: [],
      achievements: [],
      isTradePending: false,

      // ── 유저 데이터 로드 ──
      loadFromSnapshot: (userId, snapshot) => {
        console.log('loadFromSnapshot 호출, userId:', userId);
        setUserId(userId);
        set({
          userId,
          cash: snapshot.cash ?? 1_000_000,
          holdings: snapshot.holdings ?? [],
          trades: snapshot.trades ?? [],
          xp: snapshot.xp ?? 0,
          level: snapshot.level ?? 1,
          hearts: snapshot.hearts ?? 5,
          streak: snapshot.streak ?? 0,
          lastCheckIn: snapshot.lastCheckIn ?? '',
          lastStudyDate: snapshot.lastStudyDate ?? '',
          floPoints: snapshot.floPoints ?? 0,
          completedLessons: snapshot.completedLessons ?? [],
          completedEvents: snapshot.completedEvents ?? [],
          achievements: snapshot.achievements ?? [],
        });
      },

      // ── Firestore 포트폴리오 동기화 (fire-and-forget) ──
      syncToAuth: () => {
        const s = get();
        if (!s.userId) return;
        const { getSessionUser } = require('../lib/userSession');
        const profile = getSessionUser();
        if (!profile) return;
        savePortfolio(s.userId, {
          name: profile.name,
          email: profile.email,
          cash: s.cash,
          holdings: s.holdings,
          trades: s.trades,
          xp: s.xp,
          level: s.level,
          streak: s.streak,
          lastCheckIn: s.lastCheckIn,
          floPoints: s.floPoints,
          completedLessons: s.completedLessons,
          completedEvents: s.completedEvents,
          achievements: s.achievements,
        }).catch(() => {});
      },

      // ── Firestore 포트폴리오 동기화 (await 가능 — Optimistic UI 롤백용) ──
      syncToAuthAsync: async () => {
        const s = get();
        if (!s.userId) return;
        const { getSessionUser } = require('../lib/userSession');
        const profile = getSessionUser();
        if (!profile) return;
        await savePortfolio(s.userId, {
          name: profile.name,
          email: profile.email,
          cash: s.cash,
          holdings: s.holdings,
          trades: s.trades,
          xp: s.xp,
          level: s.level,
          streak: s.streak,
          lastCheckIn: s.lastCheckIn,
          floPoints: s.floPoints,
          completedLessons: s.completedLessons,
          completedEvents: s.completedEvents,
          achievements: s.achievements,
        });
      },

      // ── 매수 (Optimistic UI: 로컬 즉시 반영 → Firestore 백그라운드 동기화 → 실패 시 롤백) ──
      buyStock: async (ticker, qty, price) => {
        const total = price * qty;
        const fee = total * 0.001; // 수수료 0.1%
        const totalWithFee = total + fee;
        const { cash, holdings } = get();

        if (cash < totalWithFee) {
          return { success: false, message: `잔액이 부족해요. (필요: ${Math.round(totalWithFee).toLocaleString()}원)` };
        }

        // 롤백용 스냅샷
        const snapshot = { cash, holdings: [...holdings], trades: [...(get().trades ?? [])] };

        const existing = holdings.find(h => h.ticker === ticker);
        const newHoldings = existing
          ? holdings.map(h => h.ticker === ticker
              ? { ...h, qty: h.qty + qty, avgPrice: (h.avgPrice * h.qty + price * qty) / (h.qty + qty) }
              : h)
          : [...holdings, { ticker, qty, avgPrice: price }];

        const newTrade: TradeRecord = {
          id: Date.now().toString(),
          ticker, type: 'buy', qty, price, fee,
          timestamp: Date.now(),
        };

        // ① 즉시 로컬 상태 반영 (Optimistic Update)
        set({ cash: cash - totalWithFee, holdings: newHoldings, trades: [...(snapshot.trades ?? []), newTrade], isTradePending: true });

        try {
          // ② 백그라운드 Firestore 동기화
          await get().syncToAuthAsync();
          set({ isTradePending: false });
          logStockPurchase(ticker, qty, price);
          return { success: true, message: `${ticker} ${qty}주 매수 완료` };
        } catch (error) {
          // ③ 실패 시 롤백
          if (error instanceof Error) recordError(error, '매수 Firestore 동기화 실패');
          set({ cash: snapshot.cash, holdings: snapshot.holdings, trades: snapshot.trades, isTradePending: false });
          return { success: false, message: '거래 저장에 실패했어요. 다시 시도해주세요.' };
        }
      },

      // ── 매도 (Optimistic UI: 로컬 즉시 반영 → Firestore 백그라운드 동기화 → 실패 시 롤백) ──
      sellStock: async (ticker, qty, price) => {
        const { holdings, cash } = get();
        const holding = holdings.find(h => h.ticker === ticker);

        if (!holding || holding.qty < qty) {
          return { success: false, message: '보유 수량이 부족해요.' };
        }

        // 롤백용 스냅샷
        const snapshot = { cash, holdings: [...holdings], trades: [...(get().trades ?? [])] };

        const total = price * qty;
        const fee = total * 0.001;
        const netAmount = total - fee;

        const newHoldings = holding.qty === qty
          ? holdings.filter(h => h.ticker !== ticker)
          : holdings.map(h => h.ticker === ticker ? { ...h, qty: h.qty - qty } : h);

        const newTrade: TradeRecord = {
          id: Date.now().toString(),
          ticker, type: 'sell', qty, price, fee,
          timestamp: Date.now(),
        };

        // ① 즉시 로컬 상태 반영 (Optimistic Update)
        set({ cash: cash + netAmount, holdings: newHoldings, trades: [...(snapshot.trades ?? []), newTrade], isTradePending: true });

        try {
          // ② 백그라운드 Firestore 동기화
          await get().syncToAuthAsync();
          set({ isTradePending: false });
          logStockSold(ticker, qty, price);
          return { success: true, message: `${ticker} ${qty}주 매도 완료` };
        } catch (error) {
          // ③ 실패 시 롤백
          if (error instanceof Error) recordError(error, '매도 Firestore 동기화 실패');
          set({ cash: snapshot.cash, holdings: snapshot.holdings, trades: snapshot.trades, isTradePending: false });
          return { success: false, message: '거래 저장에 실패했어요. 다시 시도해주세요.' };
        }
      },

      // ── 듀오링고: 레슨 완료 ──
      completeLesson: (lessonId) => {
        const { xp, level, streak, floPoints } = get();
        const completedLessons = get().completedLessons ?? [];
        if (completedLessons.includes(lessonId)) return { xpGained: 0, levelUp: false, streakBonus: false };

        const lesson = LESSONS.find(l => l.id === lessonId);
        if (!lesson) return { xpGained: 0, levelUp: false, streakBonus: false };

        // 스트릭 보너스 계산
        const streakBonus = streak >= STREAK_MILESTONE;
        const xpGained = streakBonus ? lesson.xp * STREAK_BONUS_MULTIPLIER : lesson.xp;
        const newXp = xp + xpGained;
        const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
        const levelUp = newLevel > level;

        // 오늘 날짜로 스트릭 업데이트
        const today = new Date().toDateString();

        set({
          completedLessons: [...completedLessons, lessonId],
          xp: newXp,
          level: newLevel,
          floPoints: floPoints + xpGained,
          lastStudyDate: today,
          streak: streak + (get().lastStudyDate !== today ? 1 : 0),
        });
        get().syncToAuth();

        logLessonCompleted(lessonId, xpGained);
        if (levelUp) logLevelUp(newLevel);

        return { xpGained, levelUp, streakBonus };
      },

      // ── 듀오링고: 이벤트 완료 ──
      completeEvent: (eventId, xp) => {
        const completedEvents = get().completedEvents ?? [];
        const { floPoints } = get();
        if (completedEvents.includes(eventId)) return;
        set({ completedEvents: [...completedEvents, eventId], floPoints: floPoints + xp });
        get().syncToAuth();
      },

      // ── 오늘의 질문 답변 ──
      answerDailyQuestion: (key, floReward) => {
        const completedEvents = get().completedEvents ?? [];
        const { floPoints } = get();
        if (completedEvents.includes(key)) return { floGained: 0 };
        set({ completedEvents: [...completedEvents, key], floPoints: floPoints + floReward });
        get().syncToAuth();
        return { floGained: floReward };
      },

      // ── 듀오링고: 하트 시스템 ──
      loseHeart: () => {
        const { hearts } = get();
        if (hearts <= 0) return true;
        set({ hearts: hearts - 1 });
        return hearts - 1 <= 0;
      },

      restoreHearts: () => set({ hearts: MAX_HEARTS }),

      // ── 스트릭 초기화 (매일 첫 접속 시 +1, 하루 건너뛰면 리셋) ──
      initStreak: () => {
        const { lastCheckIn, streak } = get();
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastCheckIn === today) return; // 오늘 이미 체크인
        const newStreak = lastCheckIn === yesterday ? streak + 1 : 1;
        set({ streak: newStreak, lastCheckIn: today });
        get().syncToAuth(); // 백그라운드 Firestore 동기화
      },

      // ── 유틸 ──
      getTotalValue: () => {
        try {
          const { cash, holdings } = get();
          const safeHoldings = holdings ?? [];
          return safeHoldings.reduce((sum, h) => {
            const stock = STOCKS.find(s => s.ticker === h.ticker);
            return sum + (stock ? (stock.price ?? 0) * (h.qty ?? 0) : 0);
          }, cash ?? 1_000_000);
        } catch (error) {
          console.error('getTotalValue 오류:', error);
          return 1_000_000;
        }
      },

      getReturnRate: () => {
        try {
          const total = get().getTotalValue();
          return ((total - 1_000_000) / 1_000_000) * 100;
        } catch (error) {
          console.error('getReturnRate 오류:', error);
          return 0;
        }
      },

      // ── 듀오링고: 단계별 잠금해제 ──
      getLessonStatus: (lessonId) => {
        const completedLessons = get().completedLessons ?? [];
        if (completedLessons.includes(lessonId)) return 'completed';
        const lesson = LESSONS.find(l => l.id === lessonId);
        if (!lesson) return 'locked';
        if (lesson.step === 1) return 'active';
        const prevLesson = LESSONS.find(l => l.step === lesson.step - 1);
        if (prevLesson && completedLessons.includes(prevLesson.id)) return 'active';
        return 'locked';
      },
    }),
    {
      name: 'floco-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
