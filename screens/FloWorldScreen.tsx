/**
 * 플로월드 화면 — 마인크래프트 세계관 + 듀오링고 이벤트 퀴즈
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Animated, Dimensions, Vibration, ActivityIndicator, Linking, RefreshControl, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore, FLO_EVENTS, STOCKS } from '../store/appStore';
import { Colors, Typography, Badge, SectionHeader } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { fetchAllNews, fetchKRNews, formatNewsTime, type NewsItem } from '../lib/newsService';

const { width } = Dimensions.get('window');

const ZONES = [
  { id: 'tech',    name: '테크 시티',      emoji: '🏙️', active: true,  wide: true  },
  { id: 'energy',  name: '에너지플랜트',   emoji: '⚡',  active: true,  wide: false },
  { id: 'finance', name: '파이낸스타워',   emoji: '🏦',  active: true,  wide: false },
  { id: 'port',    name: '글로벌항구',     emoji: '🚢',  active: false, wide: false },
  { id: 'space',   name: '스페이스베이스', emoji: '🚀',  active: false, wide: true  },
];

// Zone gradient colours (active zones use distinct tones)
const ZONE_COLORS: Record<string, string> = {
  tech:    '#1A3A6E',
  energy:  '#1A3A2E',
  finance: '#2E1A5E',
  port:    '#1A2B4A',
  space:   '#1A1A3A',
};

function ZoneCard({ zone }: { zone: typeof ZONES[0] }) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 100, useNativeDriver: true }),
    ]).start();
    if (zone.active) Vibration.vibrate(30);
  };

  const bg = zone.active ? ZONE_COLORS[zone.id] : '#1A2438';

  return (
    <Animated.View style={[zone.wide ? styles.zoneWide : styles.zoneNormal, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[styles.zoneCard, { backgroundColor: bg }]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {!zone.active && <Text style={styles.zoneLock}>🔒</Text>}
        <Text style={[styles.zoneEmoji, !zone.active && { opacity: 0.4 }]}>{zone.emoji}</Text>
        <Text style={[styles.zoneName, { color: theme.bgCard }, !zone.active && { opacity: 0.5 }]}>{zone.name}</Text>
        {zone.active && (
          <View style={styles.zoneActiveDot} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

type NewsTab = '전체' | '국내' | '미국';

export default function FloWorldScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { completedEvents, floPoints, streak } = useAppStore();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsTab, setNewsTab] = useState<NewsTab>('전체');
  const [refreshing, setRefreshing] = useState(false);
  const [todayEvent, setTodayEvent] = useState<NewsItem | null>(null);

  const loadNews = useCallback(async () => {
    try {
      const items = await fetchAllNews();
      setNews(items);
    } catch (error) {
      // ignore — keep previous state
    } finally {
      setNewsLoading(false);
    }
  }, []);

  useEffect(() => { loadNews(); }, []);

  useEffect(() => {
    fetchKRNews()
      .then(items => { if (items.length > 0) setTodayEvent(items[0]); })
      .catch(() => {});
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  }, [loadNews]);

  const filteredNews = newsTab === '전체'
    ? news
    : news.filter(n => n.country === (newsTab === '국내' ? 'KR' : 'US'));

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* 우주 그라디언트 헤더 */}
        <View style={styles.floHero}>
          {/* Star field */}
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.star,
                {
                  backgroundColor: theme.bgCard,
                  top: `${(i * 17 + 5) % 80}%` as any,
                  left: `${(i * 23 + 3) % 100}%` as any,
                  opacity: 0.3 + (i % 5) * 0.14,
                },
              ]}
            />
          ))}

          {/* Title row */}
          <View style={{ alignItems: 'center' }}>
            <View style={styles.floTitleRow}>
              <Text style={[styles.floTitle, { color: theme.bgCard }]}>FLOCO WORLD</Text>
              <View style={styles.liveBadge}>
                <View style={[styles.liveDot, { backgroundColor: theme.bgCard }]} />
                <Text style={[styles.liveText, { color: theme.bgCard }]}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.floSubtitle}>실시간 세계 이벤트로 배우는 투자</Text>
          </View>

          {/* Stats row */}
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatNum, { color: theme.bgCard }]}>{streak}일</Text>
              <Text style={styles.heroStatLabel}>스트릭 🔥</Text>
            </View>
            <View style={[styles.heroStat, styles.heroStatMiddle]}>
              <Text style={[styles.heroStatNum, { color: theme.bgCard }]}>{floPoints}</Text>
              <Text style={styles.heroStatLabel}>FLO</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatNum, { color: theme.bgCard }]}>{completedEvents.length}</Text>
              <Text style={styles.heroStatLabel}>완료</Text>
            </View>
          </View>
        </View>

        {/* 오늘의 주요 뉴스 카드 */}
        {todayEvent && (
          <TouchableOpacity
            onPress={() => todayEvent.url ? Linking.openURL(todayEvent.url) : undefined}
            style={styles.todayEventCard}
            activeOpacity={0.8}
          >
            <Text style={styles.todayEventLabel}>📰 오늘의 주요 뉴스</Text>
            <Text style={[styles.todayEventTitle, { color: theme.bgCard }]} numberOfLines={3}>
              {todayEvent.title}
            </Text>
            <Text style={styles.todayEventMeta}>
              {todayEvent.source} · {formatNewsTime(todayEvent.publishedAt)}
            </Text>
            <View style={styles.todayEventBtn}>
              <Text style={[styles.todayEventBtnText, { color: theme.bgCard }]}>자세히 보기 →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* 세계 지도 */}
        <SectionHeader title="세계 지도" />
        <View style={styles.zoneGrid}>
          {ZONES.map(z => <ZoneCard key={z.id} zone={z} />)}
        </View>

        {/* 실시간 이벤트 피드 */}
        <View style={styles.eventSection}>
          <View style={styles.eventSectionHeader}>
            <Text style={Typography.h3}>실시간 이벤트</Text>
            <View style={styles.liveDotRed} />
          </View>

          <View style={{ gap: 10 }}>
            {FLO_EVENTS.map(event => {
              const stock = STOCKS.find(s => s.ticker === event.ticker);
              if (!stock) return null;
              const done = completedEvents.includes(event.id);
              return (
                <TouchableOpacity
                  key={event.id}
                  style={[styles.eventCard, done && { opacity: 0.6 }]}
                  onPress={() => navigation.navigate('이벤트상세', { eventId: event.id })}
                  activeOpacity={0.8}
                >
                  <View style={styles.eventCardTop}>
                    <View style={styles.stockLogo}>
                      <Text style={{ fontSize: 22 }}>{stock.logo}</Text>
                    </View>
                    <Text style={[Typography.body1, { fontWeight: '700', flex: 1 }]}>{stock.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[Typography.body2, { fontWeight: '700', color: event.impact >= 0 ? Colors.green : Colors.red }]}>
                        {event.impact >= 0 ? '+' : ''}{event.impact}%
                      </Text>
                      <Badge label={event.badge} type={event.badge === '호재' ? 'success' : 'danger'} size="sm" />
                    </View>
                  </View>
                  <Text style={[Typography.body2, { marginVertical: 6 }]}>{event.title}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[Typography.caption, { color: Colors.gold, fontWeight: '700' }]}>+{event.xp} FLO</Text>
                    {done
                      ? <Badge label="완료 ✓" type="success" size="sm" />
                      : <Text style={[Typography.caption, { color: Colors.primary }]}>이벤트 참여 →</Text>
                    }
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 실시간 뉴스 */}
        <View style={styles.newsSection}>
          <View style={styles.newsSectionHeader}>
            <Text style={Typography.h3}>실시간 뉴스</Text>
            <Text style={{ fontSize: 12, color: Colors.textMuted }}>{news.length}건</Text>
          </View>

          {/* 뉴스 탭 */}
          <View style={styles.newsTabRow}>
            {(['전체', '국내', '미국'] as NewsTab[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.newsTab, newsTab === t && styles.newsTabActive]}
                onPress={() => setNewsTab(t)}
                activeOpacity={0.7}
              >
                <Text style={[styles.newsTabText, newsTab === t && styles.newsTabTextActive, newsTab === t && { color: theme.bgCard }]}>
                  {t === '국내' ? '🇰🇷 국내' : t === '미국' ? '🇺🇸 미국' : '전체'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {newsLoading ? (
            <View style={{ gap: 12 }}>
              {[1, 2, 3].map(i => (
                <View key={i} style={styles.skeleton} />
              ))}
            </View>
          ) : filteredNews.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 40 }}>📭</Text>
              <Text style={{ color: Colors.textSub, marginTop: 12 }}>뉴스를 불러오지 못했어요</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {filteredNews.slice(0, 15).map((item, i) => (
                <TouchableOpacity
                  key={item.id + i}
                  style={styles.newsCard}
                  onPress={() => item.url ? Linking.openURL(item.url) : undefined}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.newsCardTop}>
                        <View style={[styles.newsCountryBadge, {
                          backgroundColor: item.country === 'KR' ? Colors.redBg ?? '#EBF2FF' : '#FFF3E0',
                        }]}>
                          <Text style={{ fontSize: 11, color: item.country === 'KR' ? Colors.primary : '#FF6B35' }}>
                            {item.country === 'KR' ? '🇰🇷 국내' : '🇺🇸 미국'}
                          </Text>
                        </View>
                        <Text style={styles.newsSource}>
                          {item.source} · {formatNewsTime(item.publishedAt)}
                        </Text>
                      </View>
                      <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                      {item.description ? (
                        <Text style={styles.newsDesc} numberOfLines={2}>{item.description}</Text>
                      ) : null}
                    </View>
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={styles.newsImage} />
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // Hero / header
  floHero: {
    backgroundColor: '#0A0E27',
    padding: 24, paddingTop: 36,
    alignItems: 'center', gap: 18,
    minHeight: 190,
    position: 'relative', overflow: 'hidden',
  },
  star: { position: 'absolute', width: 2, height: 2, borderRadius: 1 },
  floTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  floTitle: { fontSize: 22, fontWeight: '700', letterSpacing: 1 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.green,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  liveDot: { width: 5, height: 5, borderRadius: 2.5 },
  liveText: { fontSize: 10, fontWeight: '700' },
  floSubtitle: { color: 'rgba(255,255,255,0.50)', fontSize: 13 },

  heroStats: {
    flexDirection: 'row', width: '100%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12, padding: 14,
  },
  heroStat: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  heroStatMiddle: {
    borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroStatNum: { fontSize: 18, fontWeight: '700', fontFamily: 'Courier' },
  heroStatLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 3 },

  // Today's news card
  todayEventCard: {
    marginHorizontal: 16, marginTop: 16, marginBottom: 4,
    backgroundColor: Colors.primary,
    borderRadius: 12, padding: 20,
  },
  todayEventLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
  todayEventTitle: { fontSize: 16, fontWeight: '700', marginTop: 8, lineHeight: 24 },
  todayEventMeta: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 8 },
  todayEventBtn: {
    marginTop: 12, backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  todayEventBtnText: { fontWeight: '700', fontSize: 13 },

  // Zone grid
  zoneGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 10, marginBottom: 8,
  },
  zoneWide: { width: '100%' },
  zoneNormal: { width: (width - 42) / 2 },
  zoneCard: {
    borderRadius: 12, padding: 16,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 90, position: 'relative',
  },
  zoneLock: { position: 'absolute', top: 8, right: 8, fontSize: 14 },
  zoneEmoji: { fontSize: 28, marginBottom: 6 },
  zoneName: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  zoneActiveDot: {
    position: 'absolute', bottom: 8, right: 8,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.green,
  },

  // Event section
  eventSection: { paddingHorizontal: 16, paddingBottom: 8, gap: 12 },
  eventSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  liveDotRed: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.green },
  eventCard: {
    backgroundColor: Colors.card,
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  eventCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stockLogo: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: '#EAF4FF',
    alignItems: 'center', justifyContent: 'center',
  },

  // News section
  newsSection: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, gap: 12 },
  newsSectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  newsTabRow: { flexDirection: 'row', gap: 8 },
  newsTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
  },
  newsTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  newsTabText: { fontSize: 13, color: Colors.textSub, fontWeight: '600' },
  newsTabTextActive: { fontWeight: '700' },
  skeleton: { backgroundColor: Colors.border, borderRadius: 12, height: 100 },
  newsCard: {
    backgroundColor: Colors.card,
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  newsCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  newsCountryBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  newsSource: { fontSize: 12, color: Colors.textSub },
  newsTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, lineHeight: 22 },
  newsDesc: { fontSize: 13, color: Colors.textSub, marginTop: 6, lineHeight: 18 },
  newsImage: { width: 72, height: 72, borderRadius: 10, marginLeft: 12 },
});
