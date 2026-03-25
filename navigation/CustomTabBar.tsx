import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const ACTIVE_COLOR = '#0066FF';
const INACTIVE_COLOR = '#8E8E93';

const TABS = [
  { name: '홈Tab',       label: '홈',       iconActive: 'home' as const,        iconInactive: 'home-outline' as const },
  { name: '증권Tab',     label: '증권',     iconActive: 'stats-chart' as const, iconInactive: 'stats-chart-outline' as const },
  { name: '발견Tab',     label: '발견',     iconActive: 'compass' as const,     iconInactive: 'compass-outline' as const },
  { name: '랭킹Tab',     label: '랭킹',     iconActive: 'trophy' as const,      iconInactive: 'trophy-outline' as const },
  { name: '플로월드Tab',  label: '월드',     iconActive: 'planet' as const,      iconInactive: 'planet-outline' as const },
  { name: '마이페이지Tab', label: 'MY',      iconActive: 'person' as const,      iconInactive: 'person-outline' as const },
];

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
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

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabBtn}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
            >
              <Ionicons
                name={isFocused ? meta.iconActive : meta.iconInactive}
                size={24}
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
    height: 1,
    backgroundColor: '#E8ECF0',
  },
  tabRow: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
});
