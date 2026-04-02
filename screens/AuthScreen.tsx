/**
 * 인증 화면 — Firebase 이메일 로그인 / 회원가입
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/ui';
import { validateEmail, validatePassword, validateName } from '../lib/errorHandler';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID  = '572965735174-esma8uktkqtk92pqai7dm9ci80s7uhli.apps.googleusercontent.com';
const EXPO_CLIENT_ID = '572965735174-3hrl5qope4q11o5eqphlmf28rn41fehf.apps.googleusercontent.com';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const { login, register, loginWithGoogle, isLoading } = useAuth();
  const { isConnected } = useNetworkStatus();
  const loading = isLoading;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const [, googleResponse, googlePrompt] = Google.useAuthRequest({
    clientId: EXPO_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    iosClientId: EXPO_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.params.id_token;
      if (idToken) loginWithGoogle(idToken);
    }
  }, [googleResponse]);

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
    setName('');
  }

  async function handleSubmit() {
    setError('');

    // 네트워크 체크
    if (!isConnected) {
      setError('인터넷 연결이 끊겨 있어요. 연결을 확인해주세요.');
      shake();
      return;
    }

    // 입력값 검증
    if (mode === 'register') {
      const nameErr = validateName(name);
      if (nameErr) { setError(nameErr); shake(); return; }
    }
    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); shake(); return; }
    const passErr = validatePassword(password);
    if (passErr) { setError(passErr); shake(); return; }

    const result = mode === 'login'
      ? await login(email.trim(), password)
      : await register(email.trim(), password, name.trim());

    if (!result.success) {
      setError(result.message);
      shake();
    }
    // 성공 시 App.tsx의 onAuthStateChanged가 자동으로 화면 전환
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 로고 */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>F</Text>
          </View>
          <Text style={styles.appName}>FLOCO</Text>
          <Text style={styles.appSub}>NCS 3기 모의투자 대회</Text>
        </View>

        {/* 탭 */}
        <View style={styles.tabRow}>
          {(['login', 'register'] as Mode[]).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.tabBtn, mode === m && styles.tabBtnActive]}
              onPress={() => switchMode(m)}
            >
              <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                {m === 'login' ? '로그인' : '회원가입'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 폼 */}
        <Animated.View style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}>
          {mode === 'register' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>이름</Text>
              <TextInput
                style={styles.input}
                placeholder="홍길동"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              placeholder="example@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호 {mode === 'register' && <Text style={styles.hint}>(6자 이상)</Text>}</Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호 입력"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.submitText}>
              {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
            </Text>
          </TouchableOpacity>

          {/* 구분선 */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 구글 로그인 버튼 */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={() => googlePrompt()}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>Google로 계속하기</Text>
          </TouchableOpacity>

          {mode === 'login' && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>💡 관리자: admin@floco.com</Text>
              <Text style={styles.infoText}>앱 재실행 시 자동 로그인됩니다</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 },

  logoArea: { alignItems: 'center', marginBottom: 40, gap: 8 },
  logoCircle: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  logoText: { color: '#fff', fontSize: 34, fontWeight: '800' },
  appName: { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  appSub: { fontSize: 13, color: Colors.textSub },

  tabRow: {
    flexDirection: 'row', backgroundColor: '#EEF2F7',
    borderRadius: 12, padding: 4, marginBottom: 24,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  tabText: { fontSize: 15, fontWeight: '600', color: Colors.textSub },
  tabTextActive: { color: Colors.primary },

  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  hint: { fontSize: 11, fontWeight: '400', color: Colors.textMuted },
  input: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    fontSize: 15, borderWidth: 1.5, borderColor: Colors.border,
  },

  errorBox: {
    backgroundColor: '#FFF0F0', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#FFD0D0',
  },
  errorText: { fontSize: 13, color: Colors.red, fontWeight: '600' },

  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
    shadowColor: Colors.primary, shadowOpacity: 0.35, shadowRadius: 12, elevation: 5,
  },
  submitBtnDisabled: { opacity: 0.65 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 12, color: Colors.textMuted },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: Colors.border, gap: 10,
  },
  googleIcon: {
    fontSize: 16, fontWeight: '800', color: '#4285F4',
  },
  googleText: { fontSize: 15, fontWeight: '600', color: Colors.text },

  infoBox: {
    backgroundColor: '#EAF4FF', borderRadius: 10, padding: 12,
    alignItems: 'center', gap: 4,
  },
  infoText: { fontSize: 12, color: Colors.primary },
});
