/**
 * FLOCO 향상된 상태 컴포넌트
 * EmptyState, ErrorStateView, LoadingState, SkeletonItem
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  Animated, StyleSheet,
} from 'react-native';

// ── 색상 상수 ───────────────────────────────────
const COLORS = {
  primary: '#0066FF',
  text: '#191F28',
  textSub: '#8B95A1',
  border: '#E5E8EB',
};

// ── EmptyState ──────────────────────────────────
interface EmptyStateProps {
  emoji: string;
  title: string;
  description?: string;
  buttonText?: string;
  onPress?: () => void;
}

export function EmptyState({ emoji, title, description, buttonText, onPress }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {buttonText && onPress ? (
        <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ── ErrorStateView ──────────────────────────────
interface ErrorStateViewProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorStateView({ message = '오류가 발생했어요', onRetry }: ErrorStateViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>😵</Text>
      <Text style={styles.title}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.buttonText}>다시 시도</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ── LoadingState ────────────────────────────────
export function LoadingState() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>불러오는 중...</Text>
    </View>
  );
}

// ── SkeletonItem ────────────────────────────────
export function SkeletonItem() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.skeletonRow, { opacity }]}>
      <View style={styles.skeletonCircle} />
      <View style={styles.skeletonLines}>
        <View style={styles.skeletonLineShort} />
        <View style={styles.skeletonLineLong} />
      </View>
    </Animated.View>
  );
}

// ── 스타일 ──────────────────────────────────────
const styles = StyleSheet.create({
  // EmptyState / ErrorStateView
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 8,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: COLORS.textSub,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  // LoadingState
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSub,
  },
  // SkeletonItem
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  skeletonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
  },
  skeletonLines: {
    flex: 1,
    gap: 8,
  },
  skeletonLineShort: {
    height: 12,
    width: '40%',
    borderRadius: 6,
    backgroundColor: COLORS.border,
  },
  skeletonLineLong: {
    height: 12,
    width: '70%',
    borderRadius: 6,
    backgroundColor: COLORS.border,
  },
});
