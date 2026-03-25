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
import { fetchAllNews, fetchKRNews, formatNewsTime, type NewsItem } from '../lib/newsService';

const { width } = Dimensions.get('window');

const ZONES = [
  { id: 'tech',    name: '테크 시티',    emoji: '🏙️', active: true,  wide: true  },
  { id: 'energy',  name: '에너지플랜트', emoji: '⚡',  active: true,  wide: false },
  { id: 'finance', name: '파이낸스타워', emoji: '🏦',  active: true,  wide: false },
  { id: 'port',    name: '글로벌항구',   emoji: '🚢',  active: false, wide: false },
  { id: 'space',   name: '스페이스베이스', emoji: '🚀', active: false, wide: true  },
];

function ZoneCard({ zone }: { zone: typeof ZONES[0] }) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 100, useNativeDriver: true }),
    ]).start();
    if (zone.active) Vibration.vibrate(30);
  };

  return (
    <Animated.View style={[zone.wide ? styles.zoneWide : styles.zoneNormal, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[styles.zoneCard, zone.active ? styles.zoneCard_active : styles.zoneCard_locked]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {!zone.active && <Text style={styles.zoneLock}>🔒</Text>}
        <Text style={[styles.zoneEmoji, !zone.active && { opacity: 0.4 }]}>{zone.emoji}</Text>
        <Text style={[styles.zoneName,  !zone.active && { opacity: 0.5 }]}>{zone.name}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

type NewsTab = '전체' | '국내' | '미국';

export default function FloWorldScreen() {
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
      console.error('뉴스 로드 오류:', error);
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0066FF" />}
      >
        {/* 우주 히어로 */}
        <View style={styles.floHero}>
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.star,
                { top: `${(i * 17 + 5) % 80}%` as any, left: `${(i * 23 + 3) % 100}%` as any, opacity: 0.3 + (i % 5) * 0.14 },
              ]}
            />
          ))}
          <View style={{ alignItems: 'center' }}>
            <View style={styles.floTitleRow}>
              <Text style={styles.floTitle}>FLOCO WORLD</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.floSubtitle}>실시간 세계 이벤트로 배우는 투자</Text>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{streak}일</Text>
              <Text style={styles.heroStatLabel}>스트릭 🔥</Text>
            </View>
            <View style={[styles.heroStat, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.heroStatNum}>{floPoints}</Text>
              <Text style={styles.heroStatLabel}>FLO</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{completedEvents.length}</Text>
              <Text style={styles.heroStatLabel}>완료</Text>
            </View>
          </View>
        </View>

        {/* 오늘의 주요 뉴스 */}
        {todayEvent && (
          <TouchableOpacity
            onPress={() => todayEvent.url ? Linking.openURL(todayEvent.url) : null}
            style={styles.todayEventCard}
            activeOpacity={0.8}
          >
            <Text style={styles.todayEventLabel}>📰 오늘의 주요 뉴스</Text>
            <Text style={styles.todayEventTitle} numberOfLines={3}>
              {todayEvent.title}
            </Text>
            <Text style={styles.todayEventMeta}>
              {todayEvent.source} · {formatNewsTime(todayEvent.publishedAt)}
            </Text>
            <View style={styles.todayEventBtn}>
              <Text style={styles.todayEventBtnText}>자세히 보기 →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* 세계 지도 */}
        <SectionHeader title="세계 지도" />
        <View style={styles.zoneGrid}>
          {ZONES.map(z => <ZoneCard key={z.id} zone={z} />)}
        </View>

        {/* 실시간 이벤트 */}
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
            <Text style={{ fontSize: 12, color: Colors.textMuted }}>
              {news.length}건
            </Text>
          </View>

          {/* 뉴스 탭 */}
          <View style={styles.newsTabRow}>
            {(['전체', '국내', '미국'] as NewsTab[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.newsTab, newsTab === t && styles.newsTabActive]}
                onPress={() => setNewsTab(t)}
              >
                <Text style={[styles.newsTabText, newsTab === t && styles.newsTabTextActive]}>
                  {t === '국내' ? '🇰🇷 국내' : t === '미국' ? '🇺🇸 미국' : '전체'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {newsLoading ? (
            /* 스켈레톤 UI */
            <View style={{ gap: 12 }}>
              {[1, 2, 3].map(i => (
                <View key={i} style={styles.skeleton} />
              ))}
            </View>
          ) : filteredNews.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 40 }}>📭</Text>
              <Text style={{ color: '#8E8E93', marginTop: 12 }}>뉴스를 불러오지 못했어요</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {filteredNews.slice(0, 15).map((item, i) => (
                <TouchableOpacity
                  key={item.id + i}
                  style={styles.newsCard}
                  onPress={() => item.url ? Linking.openURL(item.url) : null}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.newsCardTop}>
                        <View style={[styles.newsCountryBadge, {
                          backgroundColor: item.country === 'KR' ? '#EBF2FF' : '#FFF3E0',
                        }]}>
                          <Text style={{ fontSize: 11, color: item.country === 'KR' ? '#0066FF' : '#FF6B35' }}>
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
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.newsImage}
                      />
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
  floHero: {
    backgroundColor: '#0A1628', padding: 24, paddingTop: 32,
    alignItems: 'center', gap: 16, minHeight: 180,
    position: 'relative', overflow: 'hidden',
  },
  star: { position: 'absolute', width: 2, height: 2, backgroundColor: '#fff', borderRadius: 1 },
  floTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  floTitle: { color: '#fff', fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.red, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff' },
  liveDotRed: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.red },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  floSubtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 13 },
  heroStats: {
    flexDirection: 'row', width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12,
  },
  heroStat: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  heroStatNum: { color: '#fff', fontSize: 18, fontWeight: '700', fontFamily: 'Courier' },
  heroStatLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 },
  zoneGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, marginBottom: 8 },
  zoneWide: { width: '100%' },
  zoneNormal: { width: (width - 34) / 2 },
  zoneCard: {
    borderRadius: 12, padding: 16, alignItems: 'center',
    justifyContent: 'center', minHeight: 90, position: 'relative',
  },
  zoneCard_active: { backgroundColor: Colors.primary },
  zoneCard_locked: { backgroundColor: '#1A2B4A' },
  zoneLock: { position: 'absolute', top: 8, right: 8, fontSize: 14 },
  zoneEmoji: { fontSize: 28, marginBottom: 6 },
  zoneName: { color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  eventSection: { padding: 16, gap: 12 },
  eventSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  eventCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  eventCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stockLogo: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#EAF6FF', alignItems: 'center', justifyContent: 'center' },

  // 오늘의 이벤트
  todayEventCard: {
    marginHorizontal: 16, marginBottom: 16, backgroundColor: '#0066FF',
    borderRadius: 20, padding: 20,
  },
  todayEventLabel: { color: '#FFFFFF80', fontSize: 12 },
  todayEventTitle: {
    color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 8, lineHeight: 24,
  },
  todayEventMeta: { color: '#FFFFFF80', fontSize: 12, marginTop: 8 },
  todayEventBtn: {
    marginTop: 12, backgroundColor: '#FFFFFF20', borderRadius: 12,
    paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-start',
  },
  todayEventBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  // 뉴스 섹션
  newsSection: { padding: 16, gap: 12 },
  newsSectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  newsTabRow: { flexDirection: 'row', gap: 8 },
  newsTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  newsTabActive: { backgroundColor: '#0066FF' },
  newsTabText: { fontSize: 13, color: '#8E8E93', fontWeight: '700' },
  newsTabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  skeleton: {
    backgroundColor: '#F2F2F7', borderRadius: 16, height: 100,
  },
  newsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  newsCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  newsCountryBadge: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
  },
  newsSource: { fontSize: 12, color: '#8E8E93' },
  newsTitle: { fontSize: 15, fontWeight: '600', color: '#191919', lineHeight: 22 },
  newsDesc: { fontSize: 13, color: '#8E8E93', marginTop: 6, lineHeight: 18 },
  newsImage: { width: 72, height: 72, borderRadius: 12, marginLeft: 12 },
});
