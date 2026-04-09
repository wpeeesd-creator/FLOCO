/**
 * 앱 내 WebView 화면 — 뉴스 등 외부 링크를 앱 내에서 표시
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function WebViewScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { url, title } = route.params ?? {};
  const [isLoading, setIsLoading] = useState(true);

  if (!url) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgCard, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.textSecondary, fontSize: 15 }}>URL이 없어요</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.primary, fontSize: 15, fontWeight: '600' }}>돌아가기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgCard }}>
      {/* 헤더 */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.bgCard,
        borderBottomWidth: 1,
        borderBottomColor: theme.borderStrong,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            marginLeft: 12,
            fontSize: 15,
            fontWeight: 'bold',
            color: theme.text,
          }}
          numberOfLines={1}
        >
          {title ?? '뉴스'}
        </Text>
        <TouchableOpacity
          onPress={() => Linking.openURL(url)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="open-outline" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* WebView */}
      <WebView
        source={{ uri: url }}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState={false}
      />

      {/* 로딩 오버레이 */}
      {isLoading && (
        <View style={{
          position: 'absolute',
          top: 56,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.bgCard,
        }}>
          <ActivityIndicator color={theme.primary} size="large" />
          <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 12 }}>
            페이지 로딩 중...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
