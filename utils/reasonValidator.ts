/**
 * 매수/매도 사유(reason) 입력 검증
 * - 의미 없는 입력 ("." "ㅁㅁㅁ" "ㅋㅋㅋ" 등) 차단
 * - 화면(TradingScreen, StockDetailScreen)에서만 사용. store 액션에는 검증 없음.
 */

export interface ValidationResult {
  valid: boolean;
  message?: string;
  charCount: number;
  meaningfulCount: number;
}

/**
 * 의미 있는 글자수 계산 (한글 완성형 + 자모음 + 영문 + 숫자)
 */
function countMeaningful(text: string): number {
  const matches = text.match(/[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]/g);
  return matches ? matches.length : 0;
}

/**
 * 반복 문자 검출
 * 1. 같은 문자가 4번 이상 연속
 * 2. 가장 많이 등장한 문자가 전체의 60% 이상
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

  return false;
}

export function validateReason(reason: string): ValidationResult {
  const trimmed = reason.trim();
  const charCount = trimmed.length;
  const meaningfulCount = countMeaningful(trimmed);

  if (charCount === 0) {
    return { valid: false, message: '이유를 입력해주세요', charCount, meaningfulCount };
  }

  if (charCount < 5) {
    return {
      valid: false,
      message: `최소 5자 이상 입력해주세요 (현재 ${charCount}자)`,
      charCount,
      meaningfulCount,
    };
  }

  if (meaningfulCount < 3) {
    return {
      valid: false,
      message: '한글/영문/숫자를 3자 이상 포함해주세요',
      charCount,
      meaningfulCount,
    };
  }

  if (isRepeating(trimmed)) {
    return {
      valid: false,
      message: '반복되는 문자는 사용할 수 없어요. 진짜 이유를 적어주세요',
      charCount,
      meaningfulCount,
    };
  }

  return { valid: true, charCount, meaningfulCount };
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
    return { color: '#8E8E93', text: '0자 (최소 5자)' };
  }
  return { color: '#FF3B30', text: `${result.charCount}자 - ${result.message}` };
}
