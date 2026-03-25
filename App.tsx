/**
 * FLOCO — App Entry
 * AuthContext + NavigationContainer + RootNavigator
 */

import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import RootNavigator from './navigation/RootNavigator';
import { logAppStart } from './lib/crashlytics';
import { logScreenView } from './lib/analytics';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10분
      retry: 2,
    },
  },
});

logAppStart();

const navigationStateChange = (state: any) => {
  const route = state?.routes?.[state.index];
  if (route?.name) {
    logScreenView(route.name);
  }
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer onStateChange={navigationStateChange}>
            <StatusBar style="dark" translucent backgroundColor="transparent" />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
