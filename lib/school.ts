/**
 * 학교 정보 공용 타입 + 헬퍼
 * - alternative(대안학교, NCS): 기수제 (cohort)
 * - middle/high(일반 중·고): 학년제 (grade + classNum)
 * - 기존 사용자(type 없음)는 cohort 기반 대안학교로 간주 (자동 마이그레이션 없음)
 */

export type SchoolType = 'alternative' | 'middle' | 'high';

export interface School {
  name: string;
  type?: SchoolType;       // 신규 필드 — 기존 데이터엔 없을 수 있음
  classId: string;

  // 대안학교 (NCS) 전용
  cohort?: string;         // '1기' | '2기' | '3기'

  // 일반 학교 (중/고) 전용
  grade?: number;          // 1 | 2 | 3
  classNum?: number;       // 반 번호 (1~20)
}

export const SCHOOL_TYPE_LABELS: Record<SchoolType, string> = {
  alternative: '대안학교',
  middle: '중학교',
  high: '고등학교',
};

/** type 없는 기존 데이터 방어 — cohort가 있으면 기수제(대안학교)로 간주 */
export function getSchoolDisplayType(school: Partial<School> | null | undefined): SchoolType {
  if (!school) return 'alternative';
  if (school.type) return school.type;
  if (school.cohort) return 'alternative'; // 기존 데이터
  return 'alternative'; // fallback
}

/** classId 생성 — alternative: "${name}_${cohort}" / middle·high: "${name}_${grade}학년${classNum}반" */
export function buildClassId(
  name: string,
  type: SchoolType,
  opts: { cohort?: string; grade?: number; classNum?: number },
): string {
  if (type === 'alternative') return `${name}_${opts.cohort ?? ''}`;
  return `${name}_${opts.grade ?? '?'}학년${opts.classNum ?? '?'}반`;
}

/** "1기" 또는 "1학년 3반" — 카드·메뉴 표시용 */
export function formatCohortOrGrade(school: Partial<School> | null | undefined): string {
  if (!school) return '';
  const type = getSchoolDisplayType(school);
  if (type === 'alternative') return school.cohort ?? (school.grade != null ? String(school.grade) : '');
  if (school.grade != null && school.classNum != null) return `${school.grade}학년 ${school.classNum}반`;
  return '';
}

/** "넥스트챌린지스쿨 1기" / "○○고등학교 1학년 3반" / "학교 미설정" */
export function formatSchoolLabel(school: Partial<School> | null | undefined, fallback = '학교 미설정'): string {
  if (!school?.name) return fallback;
  const suffix = formatCohortOrGrade(school);
  return suffix ? `${school.name} ${suffix}` : school.name;
}
