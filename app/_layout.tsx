/**
 * expo-router 루트 레이아웃
 * - SplashScreen 제어 (APK 흰화면 방지 핵심)
 * - ErrorBoundary로 앱 크래시 시 오류 화면 표시
 * - 최초 실행 시 모의투자 안내 팝업 (법적 필수)
 * - 알림 핸들러 설정
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, LogBox } from 'react-native';
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider, useToast } from '../context/ToastContext';
import { OfflineBanner } from '../hooks/useNetworkStatus';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';

// ── 프로덕션 경고 무시 ──────────────────────────────
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
  'Warning: componentWillReceiveProps',
  'Sending `onAnimatedValueUpdate`',
  'AsyncStorage has been extracted',
  'EventEmitter.removeListener',
  'expo-linking',
  'No native splash screen',
  'Require cycle:',
]);

// ── 스플래시 유지 (앱 초기화 완료까지) ───────────────
SplashScreen.preventAutoHideAsync().catch(() => {});

// ── 알림 핸들러 ─────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ── ErrorBoundary ────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  state = { hasError: false, error: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF' }}>
          <Text style={{ fontSize: 48 }}>⚠️</Text>
          <Text style={{
            fontSize: 18, fontWeight: 'bold', marginTop: 16, color: '#191F28',
            textAlign: 'center',
          }}>
            앗, 문제가 생겼어요
          </Text>
          <Text style={{ fontSize: 14, color: '#8B95A1', textAlign: 'center', lineHeight: 22, marginVertical: 12, paddingHorizontal: 16 }}>
            일시적인 오류가 발생했어요.{'\n'}아래 버튼을 눌러 다시 시도해주세요.
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: '' })}
            style={{
              backgroundColor: '#0066FF', paddingHorizontal: 24, paddingVertical: 12,
              borderRadius: 8, marginTop: 8,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

// ── 모의투자 면책 팝업 ──────────────────────────────
function DisclaimerModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const shown = await SecureStore.getItemAsync('disclaimerShown');
        if (!shown) setVisible(true);
      } catch {
        setVisible(true);
      }
    })();
  }, []);

  const handleConfirm = async () => {
    setVisible(false);
    try {
      await SecureStore.setItemAsync('disclaimerShown', 'true');
    } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={{
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center', padding: 24,
      }}>
        <View style={{
          backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24,
          width: '100%', maxWidth: 340, alignItems: 'center',
        }}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>📢</Text>
          <Text style={{
            fontSize: 18, fontWeight: '700', color: '#191F28',
            textAlign: 'center', marginBottom: 16,
          }}>
            모의투자 서비스 안내
          </Text>
          <Text style={{
            fontSize: 14, color: '#4E5968', lineHeight: 22,
            textAlign: 'center', marginBottom: 24,
          }}>
            FLOCO는 교육 목적의 모의투자 서비스입니다.
            {'\n\n'}실제 주식 투자가 아니며 가상의 자산으로 투자를 연습합니다.
            {'\n\n'}실제 투자 시 손실이 발생할 수 있으니 전문가와 상담하세요.
          </Text>
          <TouchableOpacity
            onPress={handleConfirm}
            style={{
              backgroundColor: '#0066FF', borderRadius: 12,
              paddingVertical: 14, paddingHorizontal: 32,
              width: '100%', alignItems: 'center',
            }}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
              확인했어요
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── QueryClient ──────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      retry: 2,
    },
  },
});

// ── Root Layout ──────────────────────────────────────
export default function RootLayout() {
  useEffect(() => {
    const notifSub = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[알림 수신]', notification.request.content.title);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[알림 클릭]', response.notification.request.content.data);
    });

    return () => {
      notifSub.remove();
      responseSub.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <ToastProvider>
              <ThemeProvider>
                <AuthProvider>
                  <OfflineBanner />
                  <Slot />
                  <DisclaimerModal />
                </AuthProvider>
              </ThemeProvider>
            </ToastProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
