/**
 * FLOCO 공통 컴포넌트
 * 토스 디자인 패턴 기반
 */

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, Animated,
} from 'react-native';

// ── 토스 컬러 시스템 (마스터 프롬프트 기준) ──────────────────────────
export const Colors = {
  primary: '#0066FF',
  primaryDark: '#0052CC',
  bg: '#FFFFFF',
  card: '#FFFFFF',
  navy: '#191919',
  green: '#FF3B30',       // 상승 (한국식 빨강)
  greenBg: '#FFF0F1',
  red: '#3182F6',         // 하락 (한국식 파랑)
  redBg: '#EBF2FF',
  gold: '#F59E0B',
  goldBg: '#FFF3D6',
  text: '#191919',
  textSub: '#8E8E93',
  textMuted: '#B0B8C1',
  border: '#F2F2F7',
  shadow: 'rgba(0,0,0,0.04)',
};

// ── 토스 타이포그래피 ──────────────────────────
export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: Colors.text },
  h2: { fontSize: 18, fontWeight: '600' as const, color: Colors.text },
  h3: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
  body1: { fontSize: 15, fontWeight: '400' as const, color: Colors.text },
  body2: { fontSize: 13, fontWeight: '400' as const, color: Colors.textSub },
  caption: { fontSize: 11, fontWeight: '400' as const, color: Colors.textMuted },
  mono: { fontSize: 15, fontFamily: 'Courier', fontWeight: '700' as const, color: Colors.text },
  monoLg: { fontSize: 28, fontFamily: 'Courier', fontWeight: '700' as const, color: Colors.text },
};

// ── 카드 컴포넌트 (토스 스타일) ──────────────────
interface CardProps {
  children: React.ReactNode;
  style?: object;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  const content = (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  }
  return content;
}

// ── 버튼 컴포넌트 (토스 스타일) ──────────────────
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  fullWidth?: boolean;
}

export function Button({
  title, onPress, variant = 'primary', size = 'md',
  disabled, loading, icon, fullWidth,
}: ButtonProps) {
  const btnStyle = [
    styles.btn,
    styles[`btn_${variant}`],
    styles[`btn_${size}`],
    fullWidth && { width: '100%' as const },
    disabled && styles.btn_disabled,
  ];

  const textStyle = [
    styles.btnText,
    styles[`btnText_${variant}`],
    styles[`btnText_${size}`],
  ];

  return (
    <TouchableOpacity
      style={btnStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : Colors.primary} size="small" />
      ) : (
        <Text style={textStyle}>
          {icon ? `${icon}  ` : ''}{title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ── 배지 컴포넌트 ──────────────────────────────
interface BadgeProps {
  label: string;
  type?: 'success' | 'danger' | 'warning' | 'info' | 'default';
  size?: 'sm' | 'md';
}

export function Badge({ label, type = 'default', size = 'md' }: BadgeProps) {
  const bgColors = {
    success: Colors.greenBg, danger: Colors.redBg,
    warning: Colors.goldBg, info: '#EAF4FF', default: '#F0F4F8',
  };
  const textColors = {
    success: Colors.green, danger: Colors.red,
    warning: Colors.gold, info: Colors.primary, default: Colors.textSub,
  };
  return (
    <View style={[
      styles.badge,
      { backgroundColor: bgColors[type] },
      size === 'sm' && styles.badge_sm,
    ]}>
      <Text style={[
        styles.badgeText,
        { color: textColors[type] },
        size === 'sm' && styles.badgeText_sm,
      ]}>
        {label}
      </Text>
    </View>
  );
}

// ── 수익률 표시 컴포넌트 (토스 스타일) ──────────────
interface ReturnBadgeProps {
  value: number;
  showArrow?: boolean;
}

export function ReturnBadge({ value, showArrow = true }: ReturnBadgeProps) {
  const isUp = value >= 0;
  return (
    <View style={[styles.returnBadge, { backgroundColor: isUp ? Colors.greenBg : Colors.redBg }]}>
      <Text style={[styles.returnBadgeText, { color: isUp ? Colors.green : Colors.red }]}>
        {showArrow ? (isUp ? '↗ ' : '↘ ') : ''}
        {isUp ? '+' : ''}{value.toFixed(2)}%
      </Text>
    </View>
  );
}

// ── 구분선 ──────────────────────────────────
export function Divider({ margin = 0 }: { margin?: number }) {
  return <View style={[styles.divider, { marginVertical: margin }]} />;
}

// ── 빈 상태 (Empty State) ──────────────────────
interface EmptyStateProps {
  emoji: string;
  title: string;
  desc?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ emoji, title, desc, action }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {desc && <Text style={styles.emptyDesc}>{desc}</Text>}
      {action && (
        <Button title={action.label} onPress={action.onPress} variant="outline" size="sm" />
      )}
    </View>
  );
}

// ── 스켈레톤 로딩 ──────────────────────────────
export function Skeleton({ width, height, borderRadius = 8 }: { width: number | string; height: number; borderRadius?: number }) {
  return (
    <View style={{ width: width as number, height, borderRadius, backgroundColor: '#E8ECF0' }} />
  );
}

// ── XP 진행 바 (듀오링고 스타일) ──────────────────
interface XpBarProps {
  current: number;
  max: number;
  showLabel?: boolean;
}

export function XpBar({ current, max, showLabel = true }: XpBarProps) {
  const pct = Math.min((current % max) / max * 100, 100);
  return (
    <View>
      {showLabel && (
        <View style={styles.xpBarLabel}>
          <Text style={Typography.caption}>XP</Text>
          <Text style={Typography.caption}>{current % max} / {max}</Text>
        </View>
      )}
      <View style={styles.xpBarBg}>
        <View style={[styles.xpBarFill, { width: `${pct}%` as any }]} />
      </View>
    </View>
  );
}

// ── 하트 표시 (듀오링고 스타일) ──────────────────
export function Hearts({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <View style={styles.hearts}>
      {Array.from({ length: max }).map((_, i) => (
        <Text key={i} style={{ fontSize: 16, opacity: i < count ? 1 : 0.2 }}>❤️</Text>
      ))}
    </View>
  );
}

// ── 스트릭 표시 ──────────────────────────────
export function Streak({ count }: { count: number }) {
  return (
    <View style={styles.streak}>
      <Text style={{ fontSize: 18 }}>🔥</Text>
      <Text style={[Typography.h3, { color: Colors.gold }]}>{count}일</Text>
    </View>
  );
}

// ── Bottom Sheet (토스 스타일) ──────────────────
interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function BottomSheet({ visible, onClose, children, title }: BottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.bsOverlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.bsContainer}>
        <View style={styles.bsHandle} />
        {title && <Text style={styles.bsTitle}>{title}</Text>}
        {children}
      </View>
    </Modal>
  );
}

// ── 토스트 메시지 ──────────────────────────────
interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
}

export function Toast({ message, type = 'info', visible }: ToastProps) {
  if (!visible) return null;
  const bgColor = type === 'success' ? Colors.green : type === 'error' ? Colors.red : Colors.navy;
  return (
    <View style={[styles.toast, { backgroundColor: bgColor }]}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}

// ── 섹션 헤더 ──────────────────────────────────
interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void };
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={Typography.h3}>{title}</Text>
      {action && (
        <TouchableOpacity
          onPress={action.onPress}
          style={{ paddingVertical: 10, paddingHorizontal: 8 }}
        >
          <Text style={[Typography.body2, { color: Colors.primary }]}>{action.label} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── 스타일 ──────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  btn: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn_primary: { backgroundColor: Colors.primary },
  btn_outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  btn_ghost: { backgroundColor: 'transparent' },
  btn_danger: { backgroundColor: Colors.red },
  btn_disabled: { opacity: 0.5 },
  btn_sm: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6 },
  btn_md: { paddingHorizontal: 20, paddingVertical: 12 },
  btn_lg: { paddingHorizontal: 24, paddingVertical: 16 },
  btnText: { fontWeight: '700' },
  btnText_primary: { color: '#fff' },
  btnText_outline: { color: Colors.primary },
  btnText_ghost: { color: Colors.primary },
  btnText_danger: { color: '#fff' },
  btnText_sm: { fontSize: 13 },
  btnText_md: { fontSize: 15 },
  btnText_lg: { fontSize: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badge_sm: { paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeText_sm: { fontSize: 10 },
  returnBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  returnBadgeText: { fontSize: 12, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.border },
  emptyState: { alignItems: 'center', padding: 40, gap: 8 },
  emptyEmoji: { fontSize: 40, marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptyDesc: { fontSize: 13, color: Colors.textSub, textAlign: 'center' },
  xpBarLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  xpBarBg: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  hearts: { flexDirection: 'row', gap: 2 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  bsContainer: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 34, maxHeight: '80%',
  },
  bsHandle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  bsTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16, textAlign: 'center' },
  toast: {
    position: 'absolute', bottom: 80, left: 20, right: 20,
    borderRadius: 10, padding: 14, alignItems: 'center',
  },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 16 },
});
