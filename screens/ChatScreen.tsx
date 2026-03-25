import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { STOCKS } from '../store/appStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  '이 종목 어때요?',
  'PER이 뭔가요?',
  '차트 어떻게 읽어요?',
  '지금 사도 될까요?',
];

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { ticker } = route.params;
  const stock = STOCKS.find(s => s.ticker === ticker);
  const stockName = stock?.name ?? ticker;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
      console.log('API Key 존재 여부:', !!apiKey);

      if (!apiKey) {
        console.error('ANTHROPIC_API_KEY가 설정되지 않았습니다');
        setMessages([...newMessages, {
          role: 'assistant',
          content: 'API 키가 설정되지 않았어요. .env 파일에 EXPO_PUBLIC_ANTHROPIC_API_KEY를 추가해주세요.',
        }]);
        setLoading(false);
        return;
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey ?? '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: `당신은 주식 투자 교육 도우미 AI "머니몽"입니다.
현재 종목: ${stockName} (${ticker})
현재가: ${stock?.krw ? `₩${stock.price.toLocaleString()}` : `$${stock?.price.toFixed(2)}`}
등락률: ${stock?.change?.toFixed(2)}%

규칙:
- 청소년 눈높이에 맞게 쉽고 친근하게 설명해주세요
- 투자 권유는 절대 하지 말고 교육적인 답변만 해주세요
- 답변은 짧고 명확하게 (200자 이내)
- 이모지를 적절히 사용해주세요`,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API 에러:', errorData);
        throw new Error((errorData as any).error?.message ?? `API 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('API 응답:', JSON.stringify(data).slice(0, 200));
      const aiMessage = data.content?.[0]?.text ?? '응답을 받지 못했어요.';
      setMessages([...newMessages, { role: 'assistant', content: aiMessage }]);
    } catch (error: any) {
      console.error('ChatScreen API error:', error);
      setMessages([...newMessages, {
        role: 'assistant',
        content: '죄송해요, 잠시 후 다시 시도해주세요 🙏',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const showSuggestions = messages.length === 0;

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
                <Text style={styles.welcomeDesc}>
                  {stockName}에 대해 궁금한 게 있으면 물어봐~
                </Text>
              </View>
            )}

            {/* Suggested Questions */}
            {showSuggestions && (
              <View style={styles.suggestionsWrap}>
                {SUGGESTED_QUESTIONS.map((q, i) => (
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
                  <ActivityIndicator size="small" color="#0066FF" />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 22, color: '#0066FF', fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#191919' },
  headerSub: { fontSize: 12, color: '#8E8E93' },
  aiBadge: {
    backgroundColor: '#EBF5FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  aiBadgeText: { fontSize: 12, fontWeight: '800', color: '#0066FF' },

  chatArea: { flex: 1 },

  welcomeBox: {
    alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 24, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  welcomeEmoji: { fontSize: 48, marginBottom: 8 },
  welcomeTitle: { fontSize: 18, fontWeight: '700', color: '#191919', marginBottom: 4 },
  welcomeDesc: { fontSize: 14, color: '#8E8E93', textAlign: 'center' },

  suggestionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  suggestBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#0066FF',
  },
  suggestText: { fontSize: 13, color: '#0066FF', fontWeight: '600' },

  bubble: { maxWidth: '85%', marginBottom: 12, borderRadius: 16, padding: 14 },
  userBubble: {
    alignSelf: 'flex-end', backgroundColor: '#0066FF',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start', backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  aiLabel: { fontSize: 11, color: '#8E8E93', fontWeight: '600', marginBottom: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  userBubbleText: { color: '#FFFFFF' },
  aiBubbleText: { color: '#191919' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#F2F2F7',
  },
  input: {
    flex: 1, backgroundColor: '#F8F9FA', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: '#191919', maxHeight: 100,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#0066FF', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#B0B8C1' },
  sendBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
