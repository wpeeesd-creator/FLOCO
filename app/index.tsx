/**
 * 앱 메인 진입점
 * - NavigationIndependentTree로 react-navigation 트리를 격리
 * - SplashScreen 해제 (앱 초기화 완료 후)
 * - APK 흰화면 방지: 초기화 완료 전까지 FLOCO 브랜드 로딩 표시
 */

import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, Alert, BackHandler, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { NavigationIndependentTree } from '@react-navigation/core';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import RootNavigator from '../navigation/RootNavigator';
import { OfflineBanner } from '../hooks/useNetworkStatus';

let checkVersion: () => void = () => {};
try {
  checkVersion = require('../utils/versionCheck').checkVersion;
} catch {}


// ── 브랜드 로딩 화면 (스플래시 → 앱 전환 사이) ──────
function BrandedLoading() {
  return (
    <View style={{
      flex: 1, justifyContent: 'center', alignItems: 'center',
      backgroundColor: '#0066FF',
    }}>
      <Image
        source={require('../assets/icon.png')}
        style={{ width: 120, height: 120, borderRadius: 28 }}
      />
      <Text style={{
        color: '#FFFFFF', fontSize: 36, fontWeight: '800', letterSpacing: 6,
        marginTop: 16,
      }}>
        FLOCO
      </Text>
      <ActivityIndicator color="#FFFFFF" size="large" style={{ marginTop: 24 }} />
      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 12 }}>
        청소년 모의투자 플랫폼
      </Text>
    </View>
  );
}

export default function AppIndex() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Firebase 초기화 + 폰트 로드 대기
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error('앱 초기화 오류:', error);
      } finally {
        setAppReady(true);
        // 안전하게 스플래시 숨기기
        try {
          await SplashScreen.hideAsync();
        } catch {
          // 이미 숨겨진 경우 무시
        }
      }
    };
    prepare();
  }, []);

  // ── 앱 버전 체크 ──────────────────────────────────────
  useEffect(() => {
    checkVersion();
  }, []);

  // ── 안드로이드 뒤로가기 종료 확인 ────────────────────
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backAction = () => {
      Alert.alert(
        'FLOCO 종료',
        '앱을 종료할까요?',
        [
          { text: '취소', style: 'cancel' },
          { text: '종료', onPress: () => BackHandler.exitApp() },
        ]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  if (!appReady) {
    return <BrandedLoading />;
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationIndependentTree>
        <NavigationContainer>
          <StatusBar style="dark" translucent backgroundColor="transparent" />
          <OfflineBanner />
          <RootNavigator />
        </NavigationContainer>
      </NavigationIndependentTree>
    </View>
  );
}
