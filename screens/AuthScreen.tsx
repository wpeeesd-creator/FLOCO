/**
 * 인증 화면 — Firebase 이메일 로그인 / 회원가입
 * 디자인: Nike 스타일 brutalist minimal (라이트 전용 강제)
 */

import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { Text } from '../components/ui/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme, type Theme } from '../context/ThemeContext';
import { validateEmail, validatePassword, validateName } from '../lib/errorHandler';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const { login, register, isLoading } = useAuth();
  const { isConnected } = useNetworkStatus();
  const loading = isLoading;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function switchMode(m: Mode) {
    setMode(m);
    setError('');
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
    setName('');
  }

  async function handleSubmit() {
    setError('');

    if (!isConnected) {
      setError('인터넷 연결이 끊겨 있어요. 연결을 확인해주세요.');
      shake();
      return;
    }

    if (mode === 'register') {
      const nameErr = validateName(name);
      if (nameErr) { setError(nameErr); shake(); return; }
    }
    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); shake(); return; }
    const passErr = validatePassword(password);
    if (passErr) { setError(passErr); shake(); return; }

    if (mode === 'register' && password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않아요.');
      shake();
      return;
    }

    const result = mode === 'login'
      ? await login(email.trim(), password)
      : await register(email.trim(), password, name.trim());

    if (!result.success) {
      setError(result.message);
      shake();
    }
  }

  const isLogin = mode === 'login';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 80 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 헤드라인 */}
        <Text style={styles.headline}>
          {isLogin ? 'FLOCO에 오신 것을\n환영해요' : 'FLOCO 시작하기'}
        </Text>

        {/* 폼 */}
        <Animated.View style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="닉네임"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="이메일"
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />

          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            placeholderTextColor={theme.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType={isLogin ? 'done' : 'next'}
            onSubmitEditing={isLogin ? handleSubmit : undefined}
          />

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="비밀번호 확인"
              placeholderTextColor={theme.textSecondary}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          )}

          {!!error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.submitText}>
              {loading ? '처리 중...' : isLogin ? '로그인' : '가입하기'}
            </Text>
          </TouchableOpacity>

          {isLogin && (
            <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.6}>
              <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* 하단 분리선 + 모드 전환 */}
        <View style={styles.divider} />
        <View style={styles.switchRow}>
          <Text style={styles.switchHint}>
            {isLogin ? '처음이신가요? ' : '이미 계정이 있으신가요? '}
          </Text>
          <TouchableOpacity onPress={() => switchMode(isLogin ? 'register' : 'login')} activeOpacity={0.6}>
            <Text style={styles.switchLink}>
              {isLogin ? '가입하기' : '로그인'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bgCard },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  headline: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.7,
    lineHeight: 44,
    marginBottom: 48,
  },
  form: { gap: 24 },
  input: {
    height: 56,
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontSize: 16,
    fontWeight: '400',
    color: theme.text,
    backgroundColor: theme.bgCard,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.red,
    marginTop: -8,
  },
  submitBtn: {
    backgroundColor: theme.text,
    height: 56,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  forgotBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  forgotText: {
    fontSize: 13,
    color: theme.textSecondary,
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginTop: 40,
    marginBottom: 24,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchHint: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '400',
  },
  switchLink: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
