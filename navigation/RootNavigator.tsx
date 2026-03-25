import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import UserTabs from './UserTabs';
import AdminTabs from './AdminTabs';
import { Colors } from '../components/ui';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  // Firestore 실시간 동기화 — 로그인 시 portfolios/{uid} 구독
  useRealtimeSync(user?.id);

  // Firebase Auth 초기화 대기
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // 미로그인
  if (!user) return <AuthStack />;

  // 관리자
  if (user.role === 'admin') return <AdminTabs />;

  // 일반 사용자
  return <UserTabs />;
}
