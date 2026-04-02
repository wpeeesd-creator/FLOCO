import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, FlatList, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { createPost, getUserProfile, type PostCategory } from '../../lib/firestoreService';
import { STOCKS } from '../../store/appStore';

const POST_CATEGORIES: Exclude<PostCategory, '전체'>[] = ['투자인증', '분석', '질문', '자유'];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  투자인증: { bg: '#FFF0F1', text: Colors.green,   border: Colors.green },
  분석:     { bg: '#EBF2FF', text: Colors.red,     border: Colors.red },
  질문:     { bg: '#F0F4FF', text: Colors.primary, border: Colors.primary },
  자유:     { bg: '#F5F5F5', text: Colors.textSub, border: Colors.border },
};

export default function CreatePostScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<Exclude<PostCategory, '전체'> | null>(null);
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

  const addTicker = useCallback((ticker: string) => {
    if (!selectedTickers.includes(ticker)) {
      setSelectedTickers((prev) => [...prev, ticker]);
    }
    setTickerSearch('');
  }, [selectedTickers]);

  const removeTicker = useCallback((ticker: string) => {
    setSelectedTickers((prev) => prev.filter((t) => t !== ticker));
  }, []);

  const canSubmit = !!selectedCategory && content.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !user || !selectedCategory) return;
    setSubmitting(true);
    try {
      const profile = await getUserProfile(user.id);
      const nickname = profile?.name ?? user.name;
      const investmentTypeEmoji = (profile as any)?.investmentTypeEmoji ?? '📈';

      await createPost({
        uid: user.id,
        nickname,
        investmentTypeEmoji,
        category: selectedCategory,
        content: content.trim(),
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
        <View style={styles.headerRight} />
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
          {/* Category selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>카테고리</Text>
            <View style={styles.categoryRow}>
              {POST_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                const color = CATEGORY_COLORS[cat];
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryPill,
                      isActive && {
                        backgroundColor: color.bg,
                        borderColor: color.border,
                      },
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        isActive && { color: color.text, fontWeight: '700' },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Content input */}
          <View style={styles.section}>
            <TextInput
              style={styles.contentInput}
              placeholder="투자 경험을 공유해보세요"
              placeholderTextColor={Colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Ticker tag section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>종목 태그</Text>

            {/* Ticker search input */}
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

            {/* Filtered stock results */}
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

            {/* Selected tickers as removable chips */}
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

        {/* Submit button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>게시하기</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  headerRight: {
    width: 36,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    backgroundColor: Colors.card,
    marginBottom: 8,
    padding: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSub,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSub,
  },
  contentInput: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: 'top',
    padding: 0,
  },
  tickerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tickerSearchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    padding: 0,
  },
  searchResults: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 10,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchResultItemSelected: {
    backgroundColor: '#F0F4FF',
  },
  searchResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchResultTicker: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  searchResultName: {
    fontSize: 13,
    color: Colors.textSub,
  },
  searchResultRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchResultMarket: {
    fontSize: 12,
    color: Colors.textMuted,
    backgroundColor: Colors.bg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectedTickersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C5D9FF',
  },
  selectedChipText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  submitContainer: {
    backgroundColor: Colors.card,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
