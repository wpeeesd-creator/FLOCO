/**
 * Pretendard 적용 글로벌 Text 컴포넌트 + 디자인 토큰 variant/color 지원.
 *
 * 사용 (디자인 토큰 적용 — 신규 권장):
 *   import { Text } from '../components/ui/Text';
 *   <Text variant="title1">제목</Text>
 *   <Text variant="body" color="textSecondary">본문</Text>
 *   <Text variant="display" color="profit">+10,000원</Text>
 *
 * 사용 (기존 방식 — 하위 호환, variant/color 미지정):
 *   <Text>일반 텍스트</Text>          // Pretendard-Regular + textPrimary 색
 *   <TextBold>굵은 텍스트</TextBold>
 *
 * variant 또는 color를 지정하지 않으면 기존 동작(Pretendard-Regular, color: #4B4B4B)을
 * 그대로 따르므로 이미 작성된 화면은 손대지 않아도 됩니다.
 */

import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { Typography, Colors } from './tokens';

type Variant = keyof typeof Typography;
type ColorKey = keyof typeof Colors;

interface CustomTextProps extends TextProps {
  /** 토큰 기반 typography. 미지정 시 Pretendard-Regular fallback */
  variant?: Variant;
  /** 토큰 기반 color key. 미지정 시 textPrimary */
  color?: ColorKey;
}

const styles = StyleSheet.create({
  base: { color: Colors.textPrimary },
  regular:    { fontFamily: 'Pretendard-Regular' },
  medium:     { fontFamily: 'Pretendard-Medium' },
  semibold:   { fontFamily: 'Pretendard-SemiBold' },
  bold:       { fontFamily: 'Pretendard-Bold' },
  extrabold:  { fontFamily: 'Pretendard-ExtraBold' },
});

/**
 * 기본 Text — variant/color prop 지정 시 토큰 적용, 미지정 시 기존 동작 유지.
 *
 * - variant 지정: Typography[variant]가 fontSize/lineHeight/fontFamily 적용
 * - variant 미지정: styles.regular(Pretendard-Regular)만 적용 (사이즈는 props.style 또는 기본 OS)
 * - color 지정: Colors[color]
 * - color 미지정: textPrimary (#4B4B4B)
 * - style prop은 항상 마지막에 머지되어 어떤 토큰값이든 덮어쓸 수 있음
 */
export const Text = ({ variant, color, style, ...props }: CustomTextProps) => {
  const variantStyle = variant ? Typography[variant] : styles.regular;
  const colorStyle = { color: Colors[color ?? 'textPrimary'] };
  return <RNText {...props} style={[variantStyle, colorStyle, style]} />;
};

// ── 가중치별 컴포넌트 (하위 호환) ─────────────────────────
// 기존 코드에서 import해 쓰던 컴포넌트들. 동작 변경 없음.

export const TextRegular = (props: TextProps) => (
  <RNText {...props} style={[styles.base, styles.regular, props.style]} />
);

export const TextMedium = (props: TextProps) => (
  <RNText {...props} style={[styles.base, styles.medium, props.style]} />
);

export const TextSemiBold = (props: TextProps) => (
  <RNText {...props} style={[styles.base, styles.semibold, props.style]} />
);

export const TextBold = (props: TextProps) => (
  <RNText {...props} style={[styles.base, styles.bold, props.style]} />
);

export const TextExtraBold = (props: TextProps) => (
  <RNText {...props} style={[styles.base, styles.extrabold, props.style]} />
);

// ── 숫자 전용 Text (등폭 정렬) ──────────────────────────────
// 금액·시세·수익률 등 자릿수가 흔들리면 안 되는 곳에 사용.
// fontVariant: tabular-nums → 모든 숫자가 같은 폭으로 렌더 → 자릿수 떨림 제거.
// fontFamily는 Pretendard-Bold로 강제하여 'Courier' 등 잡종 폰트 방지.
const numberStyles = StyleSheet.create({
  tabular: {
    fontFamily: 'Pretendard-Bold',
    fontVariant: ['tabular-nums'],
  },
});

export const NumberText = (props: TextProps) => (
  <RNText {...props} style={[numberStyles.tabular, props.style]} />
);
