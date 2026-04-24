import React from 'react';
import {
  View, Text, TouchableNativeFeedback, TouchableOpacity,
  StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const ACTIVE_COLOR = '#0066FF';
const INACTIVE_COLOR = '#ADB5BD';

const TABS = [
  { name: '홈Tab',       label: '홈',   iconActive: 'home' as const,        iconInactive: 'home-outline' as const },
  { name: '투자Tab',     label: '투자', iconActive: 'stats-chart' as const, iconInactive: 'stats-chart-outline' as const },
  { name: '랭킹Tab',     label: '랭킹', iconActive: 'trophy' as const,      iconInactive: 'trophy-outline' as const },
  { name: '학습Tab',     label: '학습', iconActive: 'book' as const,        iconInactive: 'book-outline' as const },
  { name: '마이페이지Tab', label: 'MY',  iconActive: 'person' as const,      iconInactive: 'person-outline' as const },
];

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, 6);

  return (
    <View style={[styles.container, { paddingBottom }]}>
      <View style={styles.separator} />
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const meta = TABS.find(t => t.name === route.name) ?? TABS[index];
          const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Android: 물결(Ripple) 효과 / iOS: opacity 효과
          if (Platform.OS === 'android') {
            return (
              <TouchableNativeFeedback
                key={route.key}
                onPress={onPress}
                background={TouchableNativeFeedback.Ripple('rgba(0,102,255,0.12)', true)}
                accessibilityRole="button"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={meta.label}
              >
                <View style={styles.tabBtn}>
                  <Ionicons
                    name={isFocused ? meta.iconActive : meta.iconInactive}
                    size={22}
                    color={color}
                  />
                  <Text style={[styles.label, { color }]}>{meta.label}</Text>
                </View>
              </TouchableNativeFeedback>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabBtn}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={meta.label}
            >
              <Ionicons
                name={isFocused ? meta.iconActive : meta.iconInactive}
                size={22}
                color={color}
              />
              <Text style={[styles.label, { color }]}>{meta.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  separator: {
    height: 0.5,
    backgroundColor: '#E5E8EB',
  },
  tabRow: {
    flexDirection: 'row',
    // Android 48dp, iOS 49pt 기준 — 60으로 여유 확보
    height: 56,
    alignItems: 'center',
    paddingTop: 4,
  },
  tabBtn: {
    flex: 1,
    // 최소 터치 영역: Android 48dp / iOS 44pt 준수
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
