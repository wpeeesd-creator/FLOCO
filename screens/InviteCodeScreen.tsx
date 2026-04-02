/**
 * 초대 코드 입력 화면 — 회원가입 후 표시
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/AuthContext';
import { applyInviteCode } from '../lib/inviteService';

interface InviteCodeScreenProps {
  onComplete: () => void;
}

export default function InviteCodeScreen({ onComplete }: InviteCodeScreenProps) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSkip = async () => {
    try {
      await SecureStore.setItemAsync('inviteCodeHandled', 'true');
    } catch {}
    onComplete();
  };

  const handleApply = async () => {
    if (!user?.id || code.length !== 6) return;

    setIsLoading(true);
    try {
      const result = await applyInviteCode(user.id, code);

      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
          await SecureStore.setItemAsync('inviteCodeHandled', 'true');
        } catch {}
        Alert.alert('초대 코드 적용!', result.message, [
          { text: '확인', onPress: onComplete },
        ]);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('오류', result.message);
      }
    } catch {
      Alert.alert('오류', '초대 코드 적용 중 오류가 발생했어요');
    } finally {
      setIsLoading(false);
    }
  };

  const isReady = code.length === 6;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 나중에 버튼 */}
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
          <Text style={styles.skipText}>나중에</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.emoji}>🎁</Text>
          <Text style={styles.title}>
            친구 초대 코드가{'\n'}있으신가요?
          </Text>
          <Text style={styles.description}>
            초대 코드 입력 시{'\n'}가상 자산 +30,000원 지급!
          </Text>

          {/* 코드 입력 */}
          <View style={[styles.inputWrap, isReady && styles.inputWrapActive]}>
            <TextInput
              value={code}
              onChangeText={(text) => setCode(text.toUpperCase())}
              placeholder="초대 코드 6자리 입력"
              placeholderTextColor="#8B95A1"
              maxLength={6}
              autoCapitalize="characters"
              style={styles.input}
            />
          </View>

          {/* 적용 버튼 */}
          <TouchableOpacity
            onPress={handleApply}
            disabled={!isReady || isLoading}
            style={[styles.applyBtn, isReady && styles.applyBtnActive]}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.applyText, isReady && styles.applyTextActive]}>
                적용하기
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    padding: 24,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  skipText: {
    color: '#8B95A1',
    fontSize: 15,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#191F28',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 36,
  },
  description: {
    color: '#8B95A1',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
  },
  inputWrap: {
    marginTop: 40,
    borderWidth: 2,
    borderColor: '#E5E8EB',
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  inputWrapActive: {
    borderColor: '#0066FF',
  },
  input: {
    fontSize: 24,
    fontWeight: '700',
    color: '#191F28',
    textAlign: 'center',
    letterSpacing: 8,
  },
  applyBtn: {
    marginTop: 16,
    backgroundColor: '#E5E8EB',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  applyBtnActive: {
    backgroundColor: '#0066FF',
  },
  applyText: {
    color: '#8B95A1',
    fontSize: 16,
    fontWeight: '700',
  },
  applyTextActive: {
    color: '#FFFFFF',
  },
});
