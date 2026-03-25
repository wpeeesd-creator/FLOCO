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

const { width } = Dimensions.get('window');

type ChartTab = '거래대금' | '거래량' | '급상승' | '급하락' | '인기';
type FeedTab = '추천' | '팔로잉' | '뉴스' | '콘텐츠';

// Dummy data
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

// Dummy news fallback
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
      console.error('뉴스 fetch 오류:', error);
      // Keep dummy news on error
    } finally {
      setNewsLoading(false);
    }
  };

  // toggleWishlist from shared hook

  // Chart stocks sorted by tab
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>발견</Text>
          <View style={styles.indexBadge}>
            <Text style={styles.indexLabel}>나스닥</Text>
            <Text style={[styles.indexValue, { color: '#FF3B30' }]}>17,932 ▲1.24%</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Issue Banner */}
          <View style={styles.issueBanner}>
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
            <View style={[styles.eventCard, { backgroundColor: '#FFF8E1' }]}>
              <Text style={styles.eventLabel}>📅 내일 이벤트</Text>
              <Text style={styles.eventTitle}>美 FOMC 금리 결정</Text>
              <Text style={styles.eventDesc}>한국시간 목요일 새벽 3시</Text>
            </View>
            <View style={[styles.eventCard, { backgroundColor: '#EBF5FF' }]}>
              <Text style={styles.eventLabel}>📊 나스닥</Text>
              <Text style={[styles.eventTitle, { color: '#FF3B30' }]}>17,932.15</Text>
              <Text style={[styles.eventDesc, { color: '#FF3B30' }]}>▲ 219.76 (+1.24%)</Text>
            </View>
          </View>

          {/* Chart Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>실시간 차트</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartTabs}>
            {(['거래대금', '거래량', '급상승', '급하락', '인기'] as ChartTab[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.chartTab, chartTab === t && styles.chartTabActive]}
                onPress={() => setChartTab(t)}
              >
                <Text style={[styles.chartTabText, chartTab === t && styles.chartTabTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Chart Stock List */}
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
                    <View style={[styles.changeBadge, { backgroundColor: sUp ? '#FFF0F1' : '#EBF2FF' }]}>
                      <Text style={[styles.changeText, { color: sUp ? '#FF3B30' : '#3182F6' }]}>
                        {sUp ? '+' : ''}{s.change.toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => toggleWishlist(s.ticker)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ marginLeft: 4 }}
                  >
                    <Text style={{ fontSize: 18, color: isFav ? '#FF3B30' : '#D1D1D6' }}>
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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartTabs}>
            {(['추천', '팔로잉', '뉴스', '콘텐츠'] as FeedTab[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.chartTab, feedTab === t && styles.chartTabActive]}
                onPress={() => setFeedTab(t)}
              >
                <Text style={[styles.chartTabText, feedTab === t && styles.chartTabTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {newsLoading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color="#0066FF" />
          ) : (
            <View style={styles.newsList}>
              {news.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.newsCard, i < news.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F2F2F7' }]}
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#191919' },
  indexBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  indexLabel: { fontSize: 12, color: '#8E8E93' },
  indexValue: { fontSize: 12, fontWeight: '700' },

  issueBanner: {
    backgroundColor: '#191919', marginHorizontal: 16, marginTop: 12,
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12,
  },
  issueText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  categoryRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: 16, paddingVertical: 16,
  },
  categoryBtn: { alignItems: 'center', gap: 6 },
  categoryIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center',
  },
  categoryLabel: { fontSize: 12, color: '#191919', fontWeight: '500' },

  cardRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  eventCard: {
    flex: 1, borderRadius: 14, padding: 16, gap: 4,
  },
  eventLabel: { fontSize: 12, color: '#8E8E93' },
  eventTitle: { fontSize: 16, fontWeight: '700', color: '#191919' },
  eventDesc: { fontSize: 12, color: '#8E8E93' },

  sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#191919' },

  chartTabs: { paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  chartTab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  chartTabActive: { backgroundColor: '#191919' },
  chartTabText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
  chartTabTextActive: { color: '#FFFFFF', fontWeight: '600' },

  listCard: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF',
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F2F2F7',
  },
  stockRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  stockBorder: { borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  rankNum: { width: 22, fontSize: 14, fontWeight: '800', color: '#0066FF', textAlign: 'center' },
  stockName: { fontSize: 14, fontWeight: '600', color: '#191919' },
  stockTicker: { fontSize: 11, color: '#8E8E93', marginTop: 1 },
  stockPrice: { fontSize: 14, fontWeight: '600', color: '#191919', fontFamily: 'Courier' },
  changeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  changeText: { fontSize: 11, fontWeight: '700' },

  newsList: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF',
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F2F2F7',
  },
  newsCard: { padding: 16 },
  newsTitle: { fontSize: 14, fontWeight: '600', color: '#191919', lineHeight: 20 },
  newsMeta: { flexDirection: 'row', gap: 8, marginTop: 8 },
  newsSource: { fontSize: 12, color: '#0066FF', fontWeight: '500' },
  newsDate: { fontSize: 12, color: '#8E8E93' },
});
