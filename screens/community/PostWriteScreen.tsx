import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { createPost, getUserProfile } from '../../lib/firestoreService';
import { STOCKS } from '../../store/appStore';

const WRITE_TAGS = ['#모의투자', '#주식공부', '#수익인증', '#질문있어요', '#경제뉴스'] as const;
type WriteTag = typeof WRITE_TAGS[number];

const TAG_TO_CATEGORY: Record<WriteTag, string> = {
  '#모의투자': '투자인증',
  '#주식공부': '분석',
  '#수익인증': '투자인증',
  '#질문있어요': '질문',
  '#경제뉴스': '자유',
};

interface Props {
  navigation: any;
}

export default function PostWriteScreen({ navigation }: Props) {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  const [selectedTags, setSelectedTags] = useState<WriteTag[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tickerSearch, setTickerSearch] = useState('');
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const filteredStocks = tickerSearch.trim().length > 0
    ? STOCKS.filter(
        (s) =>
          s.ticker.toLowerCase().includes(tickerSearch.toLowerCase()) ||
          s.name.toLowerCase().includes(tickerSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  const toggleTag = (tag: WriteTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addTicker = useCallback((ticker: string) => {
    if (!selectedTickers.includes(ticker)) {
      setSelectedTickers((prev) => [...prev, ticker]);
    }
    setTickerSearch('');
  }, [selectedTickers]);

  const removeTicker = useCallback((ticker: string) => {
    setSelectedTickers((prev) => prev.filter((t) => t !== ticker));
  }, []);

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.bg },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: Colors.text },
    postButton: { width: 44, height: 36, alignItems: 'center', justifyContent: 'center' },
    postButtonDisabled: { opacity: 0.4 },
    postButtonText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
    postButtonTextDisabled: { color: Colors.textMuted },
    scrollContent: { paddingBottom: 40 },
    section: { backgroundColor: Colors.card, marginBottom: 8, padding: 20 },
    sectionLabel: {
      fontSize: 13, fontWeight: '700', color: Colors.textSub, marginBottom: 12,
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    tagPill: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
      borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg,
    },
    tagPillSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    tagPillText: { fontSize: 13, fontWeight: '600', color: Colors.textSub },
    tagPillTextSelected: { color: theme.bgCard },
    titleInput: { fontSize: 18, fontWeight: '700', color: Colors.text, padding: 0 },
    contentInput: {
      fontSize: 15, color: Colors.text, lineHeight: 24, minHeight: 200,
      textAlignVertical: 'top', padding: 0,
    },
    tickerSearchContainer: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg,
      borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
      gap: 8, marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
    },
    tickerSearchInput: { flex: 1, fontSize: 14, color: Colors.text, padding: 0 },
    searchResults: {
      backgroundColor: Colors.card, borderRadius: 10, borderWidth: 1,
      borderColor: Colors.border, overflow: 'hidden', marginBottom: 10,
    },
    searchResultItem: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 14, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    searchResultItemSelected: { backgroundColor: '#F0F4FF' },
    searchResultLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    searchResultTicker: { fontSize: 14, fontWeight: '700', color: Colors.text },
    searchResultName: { fontSize: 13, color: Colors.textSub },
    searchResultRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    searchResultMarket: {
      fontSize: 12, color: Colors.textMuted, backgroundColor: Colors.bg,
      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    },
    selectedTickersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    selectedChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: theme.primaryLight,
      paddingHorizontal: 10, paddingVertical: 6,
      borderRadius: 20, borderWidth: 1, borderColor: '#C5D9FF',
    },
    selectedChipText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  });

  const canSubmit = selectedTags.length > 0 && content.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setSubmitting(true);
    try {
      const profile = await getUserProfile(user.id);
      const nickname = profile?.name ?? user.name;
      const investmentTypeEmoji = (profile as any)?.investmentTypeEmoji ?? '📈';
      const category = TAG_TO_CATEGORY[selectedTags[0]] as any;
      const fullContent = title.trim()
        ? `${title.trim()}\n\n${content.trim()}`
        : content.trim();

      await createPost({
        uid: user.id,
        nickname,
        investmentTypeEmoji,
        category,
        content: fullContent,
        tickers: selectedTickers,
      });
      navigation.goBack();
    } catch {
      Alert.alert('오류', '게시물 등록에 실패했어요. 다시 시도해주세요.');
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>글쓰기</Text>
        <TouchableOpacity
          style={[styles.postButton, !canSubmit && styles.postButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={[styles.postButtonText, !canSubmit && styles.postButtonTextDisabled]}>
              게시
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Tag Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>태그 선택</Text>
            <View style={styles.tagRow}>
              {WRITE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagPill, isSelected && styles.tagPillSelected]}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tagPillText, isSelected && styles.tagPillTextSelected]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <TextInput
              style={styles.titleInput}
              placeholder="제목을 입력하세요"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              returnKeyType="next"
            />
          </View>

          {/* Content Input */}
          <View style={styles.section}>
            <TextInput
              style={styles.contentInput}
              placeholder="내용을 입력하세요"
              placeholderTextColor={Colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Ticker Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>종목 태그</Text>

            {/* Search Input */}
            <View style={styles.tickerSearchContainer}>
              <Ionicons name="search-outline" size={16} color={Colors.textSub} />
              <TextInput
                style={styles.tickerSearchInput}
                placeholder="종목명 또는 티커 검색"
                placeholderTextColor={Colors.textMuted}
                value={tickerSearch}
                onChangeText={setTickerSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {tickerSearch.length > 0 && (
                <TouchableOpacity onPress={() => setTickerSearch('')}>
                  <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Results */}
            {filteredStocks.length > 0 && (
              <View style={styles.searchResults}>
                {filteredStocks.map((stock) => {
                  const alreadySelected = selectedTickers.includes(stock.ticker);
                  return (
                    <TouchableOpacity
                      key={stock.ticker}
                      style={[
                        styles.searchResultItem,
                        alreadySelected && styles.searchResultItemSelected,
                      ]}
                      onPress={() => addTicker(stock.ticker)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.searchResultLeft}>
                        <Text style={styles.searchResultTicker}>{stock.ticker}</Text>
                        <Text style={styles.searchResultName}>{stock.name}</Text>
                      </View>
                      <View style={styles.searchResultRight}>
                        <Text style={styles.searchResultMarket}>{stock.market}</Text>
                        {alreadySelected && (
                          <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Selected Ticker Chips */}
            {selectedTickers.length > 0 && (
              <View style={styles.selectedTickersRow}>
                {selectedTickers.map((ticker) => (
                  <View key={ticker} style={styles.selectedChip}>
                    <Text style={styles.selectedChipText}>#{ticker}</Text>
                    <TouchableOpacity
                      onPress={() => removeTicker(ticker)}
                      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                    >
                      <Ionicons name="close" size={13} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

