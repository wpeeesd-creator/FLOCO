/**
 * 에러 분류 및 사용자 메시지 생성
 * - 네트워크 끊김, 서버 무응답, 입력값 오류를 자동 분류
 * - 각 케이스에 맞는 한국어 메시지 반환
 */

export type ErrorCategory = 'network' | 'timeout' | 'server' | 'validation' | 'auth' | 'unknown';

export interface AppError {
  category: ErrorCategory;
  message: string;       // 사용자에게 보여줄 메시지
  original?: unknown;    // 원본 에러 (디버깅용)
}

/** fetch에 타임아웃을 적용한 래퍼 */
export async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutMs = 15000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

/** 에러 객체를 분석해서 카테고리와 사용자 메시지를 반환 */
export function classifyError(error: unknown): AppError {
  // AbortError = 타임아웃
  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      category: 'timeout',
      message: '서버 응답이 너무 느려요. 잠시 후 다시 시도해주세요.',
      original: error,
    };
  }

  // TypeError: Network request failed (RN의 네트워크 에러)
  if (error instanceof TypeError && /network|fetch|internet/i.test(error.message)) {
    return {
      category: 'network',
      message: '인터넷 연결을 확인해주세요.',
      original: error,
    };
  }

  // Firebase 에러 코드
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: string }).code;
    if (code === 'unavailable' || code === 'deadline-exceeded') {
      return {
        category: 'network',
        message: '서버에 연결할 수 없어요. 인터넷 연결을 확인해주세요.',
        original: error,
      };
    }
    if (code === 'permission-denied' || code === 'unauthenticated') {
      return {
        category: 'auth',
        message: '접근 권한이 없어요. 다시 로그인해주세요.',
        original: error,
      };
    }
  }

  // 일반 에러 메시지 패턴 매칭
  const msg = error instanceof Error ? error.message : String(error);

  if (/network|internet|offline|net::ERR/i.test(msg)) {
    return {
      category: 'network',
      message: '인터넷 연결을 확인해주세요.',
      original: error,
    };
  }
  if (/timeout|timed?\s*out|abort/i.test(msg)) {
    return {
      category: 'timeout',
      message: '서버 응답이 너무 느려요. 잠시 후 다시 시도해주세요.',
      original: error,
    };
  }
  if (/5\d{2}|internal server|bad gateway|service unavailable/i.test(msg)) {
    return {
      category: 'server',
      message: '서버에 문제가 생겼어요. 잠시 후 다시 시도해주세요.',
      original: error,
    };
  }

  return {
    category: 'unknown',
    message: '오류가 발생했어요. 다시 시도해주세요.',
    original: error,
  };
}

/** HTTP 응답 상태 코드를 사용자 메시지로 변환 */
export function classifyHttpStatus(status: number): AppError | null {
  if (status >= 200 && status < 300) return null; // 성공

  if (status === 401 || status === 403) {
    return { category: 'auth', message: '인증이 만료됐어요. 다시 로그인해주세요.' };
  }
  if (status === 404) {
    return { category: 'server', message: '요청한 정보를 찾을 수 없어요.' };
  }
  if (status === 429) {
    return { category: 'server', message: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.' };
  }
  if (status >= 500) {
    return { category: 'server', message: '서버에 문제가 생겼어요. 잠시 후 다시 시도해주세요.' };
  }
  return { category: 'unknown', message: '오류가 발생했어요. 다시 시도해주세요.' };
}

// ── 입력값 검증 헬퍼 ──────────────────────────────

export function validateEmail(email: string): string | null {
  if (!email.trim()) return '이메일을 입력해주세요.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return '올바른 이메일 형식이 아니에요.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return '비밀번호를 입력해주세요.';
  if (password.length < 6) return '비밀번호는 6자 이상이어야 해요.';
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) return '이름을 입력해주세요.';
  if (name.trim().length < 2) return '이름은 2자 이상이어야 해요.';
  return null;
}

export function validateTradeQty(qtyStr: string): { qty: number; error: string | null } {
  const trimmed = qtyStr.trim();
  if (!trimmed) return { qty: 0, error: '수량을 입력해주세요.' };
  const qty = parseInt(trimmed, 10);
  if (isNaN(qty) || !Number.isFinite(qty)) return { qty: 0, error: '숫자만 입력해주세요.' };
  if (qty <= 0) return { qty: 0, error: '1주 이상 입력해주세요.' };
  if (qty > 99999) return { qty: 0, error: '최대 99,999주까지 주문할 수 있어요.' };
  return { qty, error: null };
}
