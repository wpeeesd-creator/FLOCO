/**
 * 루트 네비게이터
 * 온보딩 → 로그인 → 초대코드 → 튜토리얼 → 메인 앱
 * 모든 상태에 방어 코드 + 브랜드 로딩 화면
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import UserTabs from './UserTabs';
import AdminTabs from './AdminTabs';
import OnboardingScreen from '../screens/OnboardingScreen';
import InviteCodeScreen from '../screens/InviteCodeScreen';
import TutorialScreen from '../screens/TutorialScreen';
import { Colors } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { useRealTimeStocks } from '../hooks/useRealTimeStocks';

// ── 브랜드 로딩 화면 ────────────────────────────
function LoadingView() {
  const { theme } = useTheme();
  return (
    <View style={{
      flex: 1, justifyContent: 'center', alignItems: 'center',
      backgroundColor: theme.primary,
    }}>
      <Image
        source={require('../assets/icon.png')}
        style={{ width: 120, height: 120, borderRadius: 28 }}
      />
      <Text style={{
        color: theme.bgCard, fontSize: 36, fontWeight: '800', letterSpacing: 4,
        marginTop: 16,
      }}>
        FLOCO
      </Text>
      <ActivityIndicator color={theme.bgCard} size="large" style={{ marginTop: 20 }} />
      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 10 }}>
        잠시만 기다려주세요
      </Text>
    </View>
  );
}

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  // ── SecureStore 플래그 로드 ────────────────────
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [inviteCodeDone, setInviteCodeDone] = useState<boolean | null>(null);
  const [tutorialDone, setTutorialDone] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [ob, ic, tc] = await Promise.all([
          SecureStore.getItemAsync('onboardingCompleted'),
          SecureStore.getItemAsync('inviteCodeHandled'),
          SecureStore.getItemAsync('tutorialCompleted'),
        ]);
        setOnboardingDone(ob === 'true');
        setInviteCodeDone(ic === 'true');
        setTutorialDone(tc === 'true');
      } catch {
        // SecureStore 실패 시 모두 완료 처리 (앱 진입 차단 방지)
        setOnboardingDone(true);
        setInviteCodeDone(true);
        setTutorialDone(true);
      }
    })();
  }, []);

  // Firestore 실시간 동기화 — 로그인 시 portfolios/{uid} 구독
  useRealtimeSync(user?.id);

  // KIS API 실시간 주가 업데이트 (5분 간격, API 키 없으면 skip)
  useRealTimeStocks();

  // 초기화 대기 (브랜드 로딩 표시)
  if (isLoading || onboardingDone === null) {
    return <LoadingView />;
  }

  // 온보딩 미완료
  if (!onboardingDone) {
    return <OnboardingScreen onComplete={() => setOnboardingDone(true)} />;
  }

  // 미로그인
  if (!user) return <AuthStack />;

  // 초대 코드 입력
  if (!inviteCodeDone) {
    return <InviteCodeScreen onComplete={() => setInviteCodeDone(true)} />;
  }

  // 튜토리얼
  if (!tutorialDone) {
    return <TutorialScreen onComplete={() => setTutorialDone(true)} />;
  }

  // 관리자
  if (user.role === 'admin') return <AdminTabs />;

  // 일반 사용자
  return <UserTabs />;
}
