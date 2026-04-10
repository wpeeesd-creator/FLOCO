import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppStore, STOCKS } from '../store/appStore';
import { fetchWithTimeout, classifyError } from '../lib/errorHandler';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useTheme } from '../context/ThemeContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const DEFAULT_QUESTIONS = [
  '이 종목 어때요?',
  'PER이 뭔가요?',
  '차트 어떻게 읽어요?',
  '지금 사도 될까요?',
];

export default function ChatScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const ticker = route.params?.ticker ?? '';
  const passedStock = route.params?.stock ?? null;
  const baseStock = STOCKS.find(s => s.ticker === ticker);
  // 전달받은 stock 객체 우선 사용 (실시간 가격 포함), 없으면 STOCKS에서 조회
  const stock = passedStock
    ? { ...baseStock, ...passedStock }
    : baseStock;
  const stockName = stock?.name ?? ticker;

  const { holdings, cash, getTotalValue, getReturnRate } = useAppStore();
  const holding = holdings?.find(h => h.ticker === ticker);
  const ownedQty = holding?.qty ?? 0;
  const avgPrice = holding?.avgPrice ?? 0;
  const evalProfit = ownedQty > 0 && stock ? (stock.price - avgPrice) * ownedQty : 0;
  const evalProfitRate = ownedQty > 0 && avgPrice > 0
    ? ((stock?.price ?? 0) - avgPrice) / avgPrice * 100 : 0;
  const totalAsset = getTotalValue?.() ?? 1_000_000;
  const profitRate = getReturnRate?.() ?? 0;

  const { isConnected } = useNetworkStatus();

  // 종목별 맞춤 추천 질문
  const suggestedQuestions = stock
    ? [
        `${stock.name} 지금 사도 될까?`,
        `${stock.name} 어떤 회사야?`,
        `${stock.name} 목표주가는?`,
        ownedQty > 0 ? '지금 팔아야 해?' : '이 섹터 전망은?',
      ]
    : DEFAULT_QUESTIONS;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    // 네트워크 체크
    if (!isConnected) {
      setMessages(prev => [...prev,
        { role: 'user', content: text.trim() },
        { role: 'assistant', content: '인터넷 연결이 끊겨 있어요. 연결 후 다시 시도해주세요 📡' },
      ]);
      return;
    }

    const userMsg: Message = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
      console.log('API Key 로드됨:', apiKey.substring(0, 20));
      console.log('API Key 존재 여부:', !!apiKey);

      if (!apiKey || apiKey === 'dummy') {
        setMessages([...newMessages, {
          role: 'assistant',
          content: '머니몽 AI가 준비 중이에요! 🐾\n관리자에게 API 키 설정을 요청해주세요.',
        }]);
        setLoading(false);
        return;
      }

      const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey ?? '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: `당신은 FLOCO 앱의 AI 투자 어시스턴트 "머니몽"입니다.
청소년 모의투자 앱에서 사용자의 투자를 도와주는 친근한 AI예요.

${stock ? `=== 현재 보고 있는 종목 (실시간 데이터) ===
종목명: ${stock.name}
티커: ${ticker}
현재가: ${stock.krw ? `₩${stock.price.toLocaleString()}` : `$${stock.price.toFixed(2)}`}
등락률: ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%
섹터: ${stock.sector ?? '기타'}
시장: ${stock.market}

=== 유저 보유 현황 ===
보유수량: ${ownedQty}주
${ownedQty > 0 ? `평균매수가: ${Math.round(avgPrice).toLocaleString()}원
현재 평가손익: ${evalProfit >= 0 ? '+' : ''}${Math.round(evalProfit).toLocaleString()}원 (${evalProfitRate >= 0 ? '+' : ''}${evalProfitRate.toFixed(2)}%)` : '현재 미보유 종목'}` : '종목 미선택 상태'}

=== 유저 투자 현황 ===
총 자산: ${Math.round(totalAsset).toLocaleString()}원
보유 현금: ${Math.round(cash ?? 1_000_000).toLocaleString()}원
수익률: ${profitRate.toFixed(2)}%

=== 중요 규칙 ===
1. 위의 실시간 데이터를 기반으로 답변하세요
2. 주가는 반드시 위에 제공된 현재가를 사용하세요
3. 절대로 실제 투자를 권유하지 마세요 — "모의투자 앱"임을 항상 인식하세요
4. 청소년 눈높이에 맞게 쉽고 친근하게 설명해주세요
5. 답변은 짧고 명확하게 (200자 이내)
6. 이모지를 적절히 사용해주세요`,
          messages: newMessages
            .map(m => ({ role: m.role, content: m.content }))
            .slice(-10),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API 에러:', response.status, errorData);
        const errorType = (errorData as any)?.error?.type ?? '';
        const errorMsg = (errorData as any)?.error?.message ?? '';

        if (response.status === 429 || errorType === 'rate_limit_error') {
          setMessages([...newMessages, {
            role: 'assistant',
            content: '요청이 너무 많아요. 잠시 후 다시 시도해주세요 ⏳',
          }]);
          return;
        }
        if (response.status === 401 || errorType === 'authentication_error') {
          setMessages([...newMessages, {
            role: 'assistant',
            content: 'API 키가 유효하지 않아요. 관리자에게 문의해주세요 🔑',
          }]);
          return;
        }
        if (errorType === 'invalid_request_error' && errorMsg.includes('credit')) {
          setMessages([...newMessages, {
            role: 'assistant',
            content: 'AI 크레딧이 부족해요. 관리자에게 문의해주세요 🙏',
          }]);
          return;
        }
        throw new Error(errorMsg || `API 오류: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = data?.content?.[0]?.text ?? '응답을 받지 못했어요.';
      setMessages([...newMessages, { role: 'assistant', content: aiMessage }]);
    } catch (error: any) {
      console.error('ChatScreen API error:', error);
      const appError = classifyError(error);
      const errorMessages: Record<string, string> = {
        network: '인터넷 연결이 불안정해요. 연결을 확인하고 다시 시도해주세요 📡',
        timeout: '서버 응답이 너무 느려요. 잠시 후 다시 물어봐주세요 ⏳',
        server: '서버에 문제가 생겼어요. 잠시 후 다시 시도해주세요 🔧',
      };
      setMessages([...newMessages, {
        role: 'assistant',
        content: errorMessages[appError.category] ?? '일시적인 오류가 발생했어요. 다시 시도해주세요 🙏',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const showSuggestions = messages.length === 0;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: theme.bgCard, paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
    },
    backBtn: { padding: 4 },
    backText: { fontSize: 22, color: theme.primary, fontWeight: '600' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#191919' },
    headerSub: { fontSize: 12, color: '#8E8E93' },
    aiBadge: { backgroundColor: '#EBF5FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    aiBadgeText: { fontSize: 12, fontWeight: '800', color: theme.primary },
    chatArea: { flex: 1 },
    welcomeBox: {
      alignItems: 'center', backgroundColor: theme.bgCard,
      borderRadius: 16, padding: 24, marginBottom: 16,
      shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
    },
    welcomeEmoji: { fontSize: 48, marginBottom: 8 },
    welcomeTitle: { fontSize: 18, fontWeight: '700', color: '#191919', marginBottom: 4 },
    welcomeDesc: { fontSize: 14, color: '#8E8E93', textAlign: 'center' },
    holdingInfoBox: { marginTop: 8, backgroundColor: '#F8F9FA', borderRadius: 10, padding: 10, width: '100%' },
    holdingInfoTitle: { fontSize: 12, fontWeight: '700', color: '#8E8E93', marginBottom: 4 },
    holdingInfoText: { fontSize: 13, color: '#191919', lineHeight: 20 },
    suggestionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    suggestBtn: {
      backgroundColor: theme.bgCard, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10,
      borderWidth: 1, borderColor: theme.primary,
    },
    suggestText: { fontSize: 13, color: theme.primary, fontWeight: '600' },
    bubble: { maxWidth: '85%', marginBottom: 12, borderRadius: 16, padding: 14 },
    userBubble: { alignSelf: 'flex-end', backgroundColor: theme.primary, borderBottomRightRadius: 4 },
    aiBubble: {
      alignSelf: 'flex-start', backgroundColor: theme.bgCard, borderBottomLeftRadius: 4,
      shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
    },
    aiLabel: { fontSize: 11, color: '#8E8E93', fontWeight: '600', marginBottom: 4 },
    bubbleText: { fontSize: 14, lineHeight: 20 },
    userBubbleText: { color: theme.bgCard },
    aiBubbleText: { color: '#191919' },
    inputBar: {
      flexDirection: 'row', alignItems: 'flex-end', gap: 8,
      backgroundColor: theme.bgCard, paddingHorizontal: 12, paddingVertical: 8,
      borderTopWidth: 1, borderTopColor: '#F2F2F7',
    },
    input: {
      flex: 1, backgroundColor: '#F8F9FA', borderRadius: 20,
      paddingHorizontal: 16, paddingVertical: 10,
      fontSize: 14, color: '#191919', maxHeight: 100,
    },
    sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
    sendBtnDisabled: { backgroundColor: '#B0B8C1' },
    sendBtnText: { color: theme.bgCard, fontSize: 18, fontWeight: '700' },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{stockName} AI 분석</Text>
            <Text style={styles.headerSub}>{ticker}</Text>
          </View>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.chatArea}
            contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Welcome */}
            {showSuggestions && (
              <View style={styles.welcomeBox}>
                <Text style={styles.welcomeEmoji}>🐾</Text>
                <Text style={styles.welcomeTitle}>머니몽이 도와줄게!</Text>
                {stock ? (
                  <>
                    <Text style={styles.welcomeDesc}>
                      {stock.name} 현재가: {stock.krw ? `₩${stock.price.toLocaleString()}` : `$${stock.price.toFixed(2)}`} ({stock.change >= 0 ? '▲' : '▼'}{Math.abs(stock.change).toFixed(2)}%)
                    </Text>
                    <Text style={styles.welcomeDesc}>
                      섹터: {stock.sector ?? '기타'}
                    </Text>
                    {ownedQty > 0 ? (
                      <View style={styles.holdingInfoBox}>
                        <Text style={styles.holdingInfoTitle}>보유 현황</Text>
                        <Text style={styles.holdingInfoText}>
                          {ownedQty}주 · 평균 {Math.round(avgPrice).toLocaleString()}원
                        </Text>
                        <Text style={[styles.holdingInfoText, {
                          color: evalProfit >= 0 ? theme.red : '#2175F3',
                          fontWeight: '700',
                        }]}>
                          평가손익: {evalProfit >= 0 ? '+' : ''}{Math.round(evalProfit).toLocaleString()}원 ({evalProfitRate >= 0 ? '+' : ''}{evalProfitRate.toFixed(2)}%)
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.welcomeDesc}>
                        아직 보유하지 않은 종목이에요
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.welcomeDesc}>
                    투자에 대해 궁금한 게 있으면 물어봐~
                  </Text>
                )}
              </View>
            )}

            {/* Suggested Questions */}
            {showSuggestions && (
              <View style={styles.suggestionsWrap}>
                {suggestedQuestions.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestBtn}
                    onPress={() => sendMessage(q)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Chat Messages */}
            {messages.map((msg, i) => (
              <View
                key={i}
                style={[
                  styles.bubble,
                  msg.role === 'user' ? styles.userBubble : styles.aiBubble,
                ]}
              >
                {msg.role === 'assistant' && (
                  <Text style={styles.aiLabel}>🐾 머니몽</Text>
                )}
                <Text style={[
                  styles.bubbleText,
                  msg.role === 'user' ? styles.userBubbleText : styles.aiBubbleText,
                ]}>
                  {msg.content}
                </Text>
              </View>
            ))}

            {/* Loading */}
            {loading && (
              <View style={[styles.bubble, styles.aiBubble]}>
                <Text style={styles.aiLabel}>🐾 머니몽</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={styles.aiBubbleText}>생각하는 중...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="질문을 입력하세요..."
              placeholderTextColor="#B0B8C1"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || loading}
            >
              <Text style={styles.sendBtnText}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

