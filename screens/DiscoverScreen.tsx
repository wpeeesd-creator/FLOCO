import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Linking, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { STOCKS } from '../store/appStore';
import StockLogo from '../components/StockLogo';
import { useWishlist } from '../hooks/useWishlist';
import { Colors } from '../components/ui';

const { width } = Dimensions.get('window');

type ChartTab = '거래대금' | '거래량' | '급상승' | '급하락' | '인기';
type FeedTab = '추천' | '팔로잉' | '뉴스' | '콘텐츠';

const ISSUES = [
  '🔴 유가 100달러 돌파',
  '📈 나스닥 신고가 경신',
  '💰 삼성전자 배당 발표',
  '⚡ NVIDIA 실적 서프라이즈',
];

const CATEGORIES = [
  { emoji: '🇺🇸', label: '해외주식', screen: 'USStock' },
  { emoji: '🇰🇷', label: '국내주식', screen: 'KRStock' },
  { emoji: '📜', label: '채권', screen: 'Bond' },
  { emoji: '📊', label: 'ETF', screen: 'ETF' },
  { emoji: '🌍', label: '플로월드', screen: '플로월드' },
];

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

const DUMMY_NEWS: NewsItem[] = [
  { title: '미 증시, AI 랠리에 나스닥 사상 최고치 경신', link: '', pubDate: '2시간 전', source: '네이버금융' },
  { title: '삼성전자, 반도체 실적 호전 기대감에 외국인 순매수', link: '', pubDate: '3시간 전', source: '네이버금융' },
  { title: 'SK하이닉스, HBM 수주 확대로 목표가 상향', link: '', pubDate: '4시간 전', source: '네이버금융' },
  { title: '테슬라, 자율주행 업데이트 발표...주가 3% 상승', link: '', pubDate: '5시간 전', source: '네이버금융' },
  { title: '엔비디아, 차세대 GPU 로드맵 공개', link: '', pubDate: '6시간 전', source: '네이버금융' },
  { title: '카카오, 신사업 추진으로 투자자 관심 집중', link: '', pubDate: '7시간 전', source: '네이버금융' },
];

export default function DiscoverScreen() {
  const navigation = useNavigation<any>();
  const [chartTab, setChartTab] = useState<ChartTab>('거래대금');
  const [feedTab, setFeedTab] = useState<FeedTab>('뉴스');
  const [news, setNews] = useState<NewsItem[]>(DUMMY_NEWS);
  const [newsLoading, setNewsLoading] = useState(false);
  const [issueIdx, setIssueIdx] = useState(0);
  const { toggleWishlist, isWishlisted } = useWishlist();

  // Auto-scroll issues
  useEffect(() => {
    const timer = setInterval(() => {
      setIssueIdx(prev => (prev + 1) % ISSUES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Fetch news
  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const rssUrl = 'https://finance.naver.com/news/news_list.naver?mode=LSS2D&section_id=101&section_id2=258';
      const response = await fetch(
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&api_key=free`
      );
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        setNews(data.items.slice(0, 10).map((item: any) => ({
          title: item.title?.replace(/<[^>]*>/g, '') ?? '',
          link: item.link ?? '',
          pubDate: item.pubDate ?? '',
          source: '네이버금융',
        })));
      }
    } catch (error) {
      // Keep dummy news on error
    } finally {
      setNewsLoading(false);
    }
  };

  const getChartStocks = () => {
    const all = [...STOCKS];
    switch (chartTab) {
      case '거래대금': return all.sort((a, b) => b.price - a.price).slice(0, 10);
      case '거래량': return all.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 10);
      case '급상승': return all.filter(s => s.change > 0).sort((a, b) => b.change - a.change).slice(0, 10);
      case '급하락': return all.filter(s => s.change < 0).sort((a, b) => a.change - b.change).slice(0, 10);
      case '인기': return all.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 10);
      default: return all.slice(0, 10);
    }
  };

  const chartStocks = getChartStocks();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>발견</Text>
          <View style={styles.indexBadge}>
            <Text style={styles.indexLabel}>나스닥</Text>
            <Text style={[styles.indexValue, { color: Colors.green }]}>17,932 ▲1.24%</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Issue Banner */}
          <View style={styles.issueBanner}>
            <View style={styles.issueDot} />
            <Text style={styles.issueText}>{ISSUES[issueIdx]}</Text>
          </View>

          {/* Categories */}
          <View style={styles.categoryRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c.label}
                style={styles.categoryBtn}
                activeOpacity={0.7}
                onPress={() => navigation.navigate(c.screen)}
              >
                <View style={styles.categoryIcon}>
                  <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
                </View>
                <Text style={styles.categoryLabel}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Event & Index Cards */}
          <View style={styles.cardRow}>
            <View style={[styles.eventCard, { backgroundColor: '#FFF8E6' }]}>
              <Text style={styles.eventLabel}>📅 내일 이벤트</Text>
              <Text style={styles.eventTitle}>美 FOMC 금리 결정</Text>
              <Text style={styles.eventDesc}>한국시간 목요일 새벽 3시</Text>
            </View>
            <View style={[styles.eventCard, { backgroundColor: Colors.redBg ?? '#EBF2FF' }]}>
              <Text style={styles.eventLabel}>📊 나스닥</Text>
              <Text style={[styles.eventTitle, { color: Colors.green }]}>17,932.15</Text>
              <Text style={[styles.eventDesc, { color: Colors.green }]}>▲ 219.76 (+1.24%)</Text>
            </View>
          </View>

          {/* Chart Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>실시간 차트</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {(['거래대금', '거래량', '급상승', '급하락', '인기'] as ChartTab[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.pillTab, chartTab === t && styles.pillTabActive]}
                onPress={() => setChartTab(t)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillTabText, chartTab === t && styles.pillTabTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Stock Rank List */}
          <View style={styles.listCard}>
            {chartStocks.map((s, i) => {
              const sUp = s.change >= 0;
              const isFav = isWishlisted(s.ticker);
              return (
                <TouchableOpacity
                  key={s.ticker}
                  style={[styles.stockRow, i < chartStocks.length - 1 && styles.stockBorder]}
                  onPress={() => navigation.navigate('종목상세D', { ticker: s.ticker })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.rankNum}>{i + 1}</Text>
                  <StockLogo ticker={s.ticker} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stockName}>{s.name}</Text>
                    <Text style={styles.stockTicker}>{s.ticker}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.stockPrice}>
                      {s.krw ? `₩${s.price.toLocaleString()}` : `$${s.price.toFixed(2)}`}
                    </Text>
                    <View style={[styles.changeBadge, { backgroundColor: sUp ? Colors.greenBg ?? '#FFF0F1' : Colors.redBg ?? '#EBF2FF' }]}>
                      <Text style={[styles.changeText, { color: sUp ? Colors.green : Colors.red }]}>
                        {sUp ? '+' : ''}{s.change.toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => toggleWishlist(s.ticker)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ marginLeft: 4 }}
                  >
                    <Text style={{ fontSize: 18, color: isFav ? Colors.green : Colors.border }}>
                      {isFav ? '♥' : '♡'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* News Section */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>뉴스 / 피드</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {(['추천', '팔로잉', '뉴스', '콘텐츠'] as FeedTab[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.pillTab, feedTab === t && styles.pillTabActive]}
                onPress={() => setFeedTab(t)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillTabText, feedTab === t && styles.pillTabTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {newsLoading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color={Colors.primary} />
          ) : (
            <View style={styles.newsList}>
              {news.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.newsCard, i < news.length - 1 && styles.newsCardBorder]}
                  onPress={() => item.link && Linking.openURL(item.link)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.newsMeta}>
                    <Text style={styles.newsSource}>{item.source}</Text>
                    <Text style={styles.newsDate}>{item.pubDate}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, backgroundColor: Colors.bg },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  indexBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  indexLabel: { fontSize: 12, color: Colors.textSub },
  indexValue: { fontSize: 13, fontWeight: '700' },

  // Issue Banner
  issueBanner: {
    backgroundColor: '#191F28',
    marginHorizontal: 16, marginTop: 14,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  issueDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green },
  issueText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', flex: 1 },

  // Categories
  categoryRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: 16, paddingVertical: 18,
  },
  categoryBtn: { alignItems: 'center', gap: 7 },
  categoryIcon: {
    width: 54, height: 54, borderRadius: 16,
    backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#00000010', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  categoryLabel: { fontSize: 12, color: Colors.text, fontWeight: '500' },

  // Event Cards
  cardRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  eventCard: { flex: 1, borderRadius: 12, padding: 16, gap: 4 },
  eventLabel: { fontSize: 12, color: Colors.textSub },
  eventTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  eventDesc: { fontSize: 12, color: Colors.textSub },

  // Section Header
  sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },

  // Pill Tabs
  tabsRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  pillTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
  },
  pillTabActive: { backgroundColor: Colors.text, borderColor: Colors.text },
  pillTabText: { fontSize: 13, color: Colors.textSub, fontWeight: '500' },
  pillTabTextActive: { color: '#FFFFFF', fontWeight: '600' },

  // Stock List Card
  listCard: {
    marginHorizontal: 16, backgroundColor: Colors.card,
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  stockRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  stockBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rankNum: { width: 22, fontSize: 14, fontWeight: '800', color: Colors.primary, textAlign: 'center' },
  stockName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  stockTicker: { fontSize: 11, color: Colors.textSub, marginTop: 1 },
  stockPrice: { fontSize: 14, fontWeight: '600', color: Colors.text, fontFamily: 'Courier' },
  changeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  changeText: { fontSize: 11, fontWeight: '700' },

  // News List
  newsList: {
    marginHorizontal: 16, backgroundColor: Colors.card,
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  newsCard: { padding: 16 },
  newsCardBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  newsTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, lineHeight: 20 },
  newsMeta: { flexDirection: 'row', gap: 8, marginTop: 8 },
  newsSource: { fontSize: 12, color: Colors.primary, fontWeight: '500' },
  newsDate: { fontSize: 12, color: Colors.textSub },
});
