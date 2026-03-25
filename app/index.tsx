/**
 * 앱 메인 진입점
 * - independent NavigationContainer: expo-router의 외부 컨테이너와 독립적으로 동작
 * - 기존 react-navigation 스택/탭 구조 완전 유지
 */

import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from '../navigation/RootNavigator';

export default function AppIndex() {
  return (
    <>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <NavigationContainer independent={true}>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}
