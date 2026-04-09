import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import {
  fetchAllNews, fetchKRNews, fetchUSNews,
  formatNewsTime, type NewsItem,
} from '../lib/newsService';

type NewsTab = '전체' | '국내' | '미국';

export default function NewsScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<NewsTab>('전체');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNews = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === '국내') {
        setNews(await fetchKRNews());
      } else if (tab === '미국') {
        setNews(await fetchUSNews());
      } else {
        setNews(await fetchAllNews());
      }
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { loadNews(); }, [loadNews]);

  const openNews = (item: NewsItem) => {
    if (!item.url) return;
    navigation.navigate('WebView', { url: item.url, title: item.title });
  };

  const renderItem = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity
      style={styles.newsCard}
      onPress={() => openNews(item)}
      activeOpacity={0.7}
    >
      <View style={styles.newsMeta}>
        <Text style={[styles.newsBadge, {
          color: item.country === 'KR' ? Colors.primary : '#FF9500',
        }]}>
          {item.country === 'KR' ? '🇰🇷 국내' : '🇺🇸 미국'}
        </Text>
        <Text style={styles.newsSource}>
          {item.source} · {formatNewsTime(item.publishedAt)}
        </Text>
      </View>
      <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
      {item.description ? (
        <Text style={styles.newsDesc} numberOfLines={2}>{item.description}</Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>뉴스</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['전체', '국내', '미국'] as NewsTab[]).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive, tab === t && { color: theme.bgCard }]}>
              {t === '국내' ? '🇰🇷 국내' : t === '미국' ? '🇺🇸 미국' : '전체'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={news}
          keyExtractor={(item, i) => `${item.id}_${i}`}
          renderItem={renderItem}
          refreshing={loading}
          onRefresh={loadNews}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📰</Text>
              <Text style={styles.emptyText}>뉴스를 불러올 수 없어요</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  tabRow: {
    flexDirection: 'row', backgroundColor: Colors.card, paddingHorizontal: 16, paddingBottom: 12, gap: 8,
  },
  tabBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.bg, alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textSub, fontWeight: '600', fontSize: 13 },
  tabTextActive: {},
  newsCard: {
    backgroundColor: Colors.card, marginHorizontal: 16, marginTop: 8,
    borderRadius: 16, padding: 16,
  },
  newsMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  newsBadge: { fontSize: 12, fontWeight: '700', marginRight: 8 },
  newsSource: { color: Colors.textSub, fontSize: 12 },
  newsTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, lineHeight: 22 },
  newsDesc: { fontSize: 13, color: Colors.textSub, marginTop: 6, lineHeight: 18 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: Colors.textSub, fontSize: 15, marginTop: 12 },
});
