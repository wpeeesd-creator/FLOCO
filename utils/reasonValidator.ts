/**
 * 매수/매도 사유(reason) 입력 검증
 * - 의미 없는 입력 ("." "ㅁㅁㅁ" "ㅋㅋㅋ" "냐미냐미" 등) 차단
 * - 화면(TradingScreen, StockDetailScreen)에서만 사용. store 액션에는 검증 없음.
 * - AdminLearningImpactScreen이 "유효한 이유 작성률" 판정에도 재사용.
 */

export interface ValidationResult {
  valid: boolean;
  message?: string;
  charCount: number;
  meaningfulCount: number;
}

const MIN_LENGTH = 10;
const MAX_LENGTH = 200;

// 금지 단어 — 성의 없는 이유 차단
const BLACKLIST = ['ㅋㅋ', 'ㅎㅎ', 'ㅠㅠ', 'asdf', '1234', 'test', '테스트', '아무거나', '몰라'];

/**
 * 의미 있는 글자수 계산 (한글 완성형 + 자모음 + 영문 + 숫자)
 */
function countMeaningful(text: string): number {
  const matches = text.match(/[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]/g);
  return matches ? matches.length : 0;
}

/**
 * 반복 문자 검출
 * 1. 같은 문자가 4번 이상 연속 ("냐냐냐냐")
 * 2. 가장 많이 등장한 문자가 전체의 60% 이상
 * 3. 고유 문자 종류가 3개 미만 ("ㅁㅁㅁㅁㅁ", "111111", "냐미냐미냐미")
 */
function isRepeating(text: string): boolean {
  const trimmed = text.trim().replace(/\s/g, '');
  if (trimmed.length === 0) return false;

  if (/(.)\1{3,}/.test(trimmed)) return true;

  const charCount: Record<string, number> = {};
  for (const ch of trimmed) {
    charCount[ch] = (charCount[ch] ?? 0) + 1;
  }
  const maxCount = Math.max(...Object.values(charCount));
  if (maxCount / trimmed.length >= 0.6) return true;

  if (trimmed.length >= 5 && Object.keys(charCount).length < 3) return true;

  return false;
}

/**
 * 같은 단어 반복 검출 ("냐미 냐미 냐미 냐미")
 * 3단어 이상인데 고유 단어가 절반 미만이면 반복으로 판정
 */
function isWordRepeating(text: string): boolean {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 3) return false;
  const uniqueWords = new Set(words);
  return uniqueWords.size < words.length / 2;
}

export function validateReason(reason: string): ValidationResult {
  const trimmed = reason.trim();
  const charCount = trimmed.length;
  const meaningfulCount = countMeaningful(trimmed);
  const base = { charCount, meaningfulCount };

  // 1. 빈값
  if (charCount === 0) {
    return { valid: false, message: '이유를 입력해주세요', ...base };
  }

  // 2. 최소 길이
  if (charCount < MIN_LENGTH) {
    return {
      valid: false,
      message: `최소 ${MIN_LENGTH}자 이상 입력해주세요 (현재 ${charCount}자)`,
      ...base,
    };
  }

  // 3. 최대 길이 (입력은 maxLength로 제한되지만 이중 방어)
  if (charCount > MAX_LENGTH) {
    return { valid: false, message: `이유는 ${MAX_LENGTH}자 이내로 작성해주세요`, ...base };
  }

  // 4. 유의미 문자 절대수
  if (meaningfulCount < 3) {
    return { valid: false, message: '한글/영문/숫자를 3자 이상 포함해주세요', ...base };
  }

  // 5. 유의미 문자 비율 — 공백 제외 길이 대비 70% 미만이면 특수문자 도배로 판정
  const nonSpaceLength = trimmed.replace(/\s/g, '').length;
  if (nonSpaceLength > 0 && meaningfulCount / nonSpaceLength < 0.7) {
    return { valid: false, message: '의미 있는 문장을 작성해주세요', ...base };
  }

  // 6. 반복 문자 ("냐냐냐냐", "ㅁㅁㅁㅁㅁ", "111111")
  if (isRepeating(trimmed)) {
    return {
      valid: false,
      message: '반복되는 문자는 사용할 수 없어요. 진짜 이유를 적어주세요',
      ...base,
    };
  }

  // 7. 반복 단어 ("냐미 냐미 냐미")
  if (isWordRepeating(trimmed)) {
    return { valid: false, message: '같은 단어를 너무 자주 반복했어요', ...base };
  }

  // 8. 금지 단어
  const lower = trimmed.toLowerCase();
  for (const word of BLACKLIST) {
    if (lower.includes(word)) {
      return { valid: false, message: `"${word}"는 이유로 사용할 수 없어요`, ...base };
    }
  }

  return { valid: true, ...base };
}

/**
 * 스펙 호환 시그니처 — { valid, error } 형태가 필요한 곳에서 사용
 */
export function validateTradeReason(reason: string): { valid: boolean; error?: string } {
  const result = validateReason(reason);
  return { valid: result.valid, error: result.message };
}

/**
 * 실시간 카운터용 (입력 중 표시)
 */
export function getReasonStatus(reason: string): { color: string; text: string } {
  const result = validateReason(reason);
  if (result.valid) {
    return { color: '#34C759', text: `✓ ${result.charCount}자` };
  }
  if (result.charCount === 0) {
    return { color: '#8E8E93', text: `0자 (최소 ${MIN_LENGTH}자)` };
  }
  return { color: '#FF3B30', text: `${result.charCount}자 - ${result.message}` };
}

/**
 * 추천 이유 템플릿 — 칩 선택 시 입력란 자동 채움 (모두 검증 통과 길이)
 */
export const REASON_TEMPLATES: Record<'buy' | 'sell', string[]> = {
  buy: [
    '최근 실적이 좋아 보여서',
    '신제품 출시 기대감이 있어서',
    '주가가 저점이라고 생각해서',
    '장기 투자 목적으로 모아가려고',
    '공부한 내용을 바탕으로 판단해서',
  ],
  sell: [
    '목표 수익률을 달성해서',
    '손실 확대를 막기 위해서',
    '더 좋은 투자 기회를 발견해서',
    '단기 차익을 실현하려고',
  ],
};
