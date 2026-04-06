/**
 * FLOCO — App Entry (legacy)
 * GestureHandlerRootView + ErrorBoundary + AuthContext + NavigationContainer
 */

import 'react-native-gesture-handler';
import React from 'react';
import { View, Text, TouchableOpacity, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import RootNavigator from './navigation/RootNavigator';

let logAppStart: () => void = () => {};
let logScreenView: (name: string) => void = () => {};
try {
  const crashlytics = require('./lib/crashlytics');
  logAppStart = crashlytics.logAppStart ?? logAppStart;
} catch {}
try {
  const analytics = require('./lib/analytics');
  logScreenView = analytics.logScreenView ?? logScreenView;
} catch {}

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
  'Warning: componentWillReceiveProps',
  'Sending `onAnimatedValueUpdate`',
  'AsyncStorage has been extracted',
  'EventEmitter.removeListener',
  'Require cycle:',
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      retry: 2,
    },
  },
});

logAppStart();

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  state = { hasError: false, error: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error) {
    console.error('[App ErrorBoundary]', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#FFFFFF' }}>
          <Text style={{ fontSize: 48 }}>⚠️</Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#191F28', marginTop: 16, textAlign: 'center' }}>
            앱을 다시 시작해주세요
          </Text>
          <Text style={{ fontSize: 12, color: '#8B95A1', marginTop: 8, textAlign: 'center' }}>
            {this.state.error}
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: '' })}
            style={{ backgroundColor: '#0066FF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 16 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const navigationStateChange = (state: any) => {
  const route = state?.routes?.[state.index];
  if (route?.name) {
    logScreenView(route.name);
  }
};

function AppContent() {
  const { isDark, theme } = useTheme();

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: { ...DarkTheme.colors, background: theme.bg, card: theme.bgCard, text: theme.text, border: theme.border },
      }
    : {
        ...DefaultTheme,
        colors: { ...DefaultTheme.colors, background: theme.bg, card: theme.bgCard, text: theme.text, border: theme.border },
      };

  return (
    <AuthProvider>
      <NavigationContainer theme={navTheme} onStateChange={navigationStateChange}>
        <StatusBar style={isDark ? 'light' : 'dark'} translucent backgroundColor="transparent" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <ThemeProvider>
              <AppContent />
            </ThemeProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
