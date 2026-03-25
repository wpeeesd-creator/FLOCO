/**
 * expo-router 루트 레이아웃
 * - Expo Go SDK 52+ 필수 요구사항
 * - 기존 react-navigation 구조를 independent NavigationContainer로 유지
 */

import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <Slot />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
