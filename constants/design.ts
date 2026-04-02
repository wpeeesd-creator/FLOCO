/**
 * FLOCO 디자인 시스템 상수
 * 수익=레드(#F04452), 손실=블루(#2175F3)
 */

import { StyleSheet } from 'react-native';

// ── 색상 ──────────────────────────────

export const COLORS = {
  primary: '#1A3A6B',
  secondary: '#4A90D9',
  positive: '#F04452',   // 수익 (한국식: 빨강=상승)
  negative: '#2175F3',   // 손실 (한국식: 파랑=하락)
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  background: '#F5F5F5',
  card: '#FFFFFF',
  text: {
    primary: '#1A1A1A',
    secondary: '#555555',
    tertiary: '#888888',
    disabled: '#BBBBBB',
  },
  border: '#E0E0E0',
  divider: '#F0F0F0',
} as const;

// ── 크기 ──────────────────────────────

export const SIZES = {
  font: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  button: {
    sm: 36,
    md: 44,
    lg: 52,
    xl: 60,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 24,
    full: 9999,
  },
} as const;

// ── 그림자 ──────────────────────────────

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// ── 공통 스타일 ──────────────────────────────

export const COMMON_STYLES = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    ...SHADOWS.md,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.md,
    height: SIZES.button.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.spacing.xl,
  },
  buttonSecondary: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.md,
    height: SIZES.button.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.spacing.xl,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonDanger: {
    backgroundColor: COLORS.danger,
    borderRadius: SIZES.radius.md,
    height: SIZES.button.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.spacing.xl,
  },
  textH1: {
    fontSize: SIZES.font.xxxl,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
  },
  textH2: {
    fontSize: SIZES.font.xxl,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
  },
  textH3: {
    fontSize: SIZES.font.xl,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
  },
  textBody: {
    fontSize: SIZES.font.md,
    fontWeight: '400' as const,
    color: COLORS.text.secondary,
  },
  textCaption: {
    fontSize: SIZES.font.xs,
    fontWeight: '400' as const,
    color: COLORS.text.tertiary,
  },
});
