import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { LEVELS, LEVEL_EMOJI, LEVEL_COLOR, getCoursesByLevel, type Level } from '../data/learningContent';

const DAILY_TERMS = [
  { term: 'PER', desc: '주가수익비율. 현재 주가가 1주당 순이익의 몇 배인지 나타내는 지표' },
  { term: 'PBR', desc: '주가순자산비율. 주가를 1주당 순자산으로 나눈 값' },
  { term: 'ROE', desc: '자기자본이익률. 기업이 자기자본으로 얼마의 이익을 냈는지 측정' },
  { term: '배당금', desc: '기업이 이익의 일부를 주주에게 나눠주는 금액' },
  { term: '시가총액', desc: '주가 × 발행주식수. 기업의 전체 가치를 나타냄' },
  { term: '공매도', desc: '주식을 빌려서 먼저 팔고 나중에 사서 갚는 매도 전략' },
  { term: 'ETF', desc: '주식처럼 거래되는 펀드. 여러 종목에 분산 투자 가능' },
];

const LEVEL_DESC: Record<Level, string> = {
  '입문': '주식이란 · 시장구조 · 기초용어',
  '초급': '캔들차트 · 이동평균선 · PER·PBR·ROE',
  '중급': '재무제표 · 기술적분석 · 거시경제',
  '고급': '포트폴리오 · 리스크관리 · 가치투자',
};

export default function LearningScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Daily term (based on day of year)
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const todayTerm = DAILY_TERMS[dayOfYear % DAILY_TERMS.length];

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getDocs(collection(db, 'users', user.id, 'progress'))
      .then(snap => {
        const map: Record<string, boolean> = {};
        snap.forEach(d => { map[d.id] = d.data().completed ?? false; });
        setProgress(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>주식 학습</Text>
          <Text style={styles.headerSub}>단계별로 학습해보세요</Text>
        </View>

        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} color="#0066FF" />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
            {/* Daily Term Card */}
            <View style={styles.termCard}>
              <View style={styles.termHeader}>
                <Text style={{ fontSize: 20 }}>💡</Text>
                <Text style={styles.termLabel}>오늘의 용어</Text>
              </View>
              <Text style={styles.termTitle}>{todayTerm.term}</Text>
              <Text style={styles.termDesc}>{todayTerm.desc}</Text>
            </View>

            {/* Level Cards */}
            {LEVELS.map((level) => {
              const courses = getCoursesByLevel(level);
              const done = courses.filter(c => progress[c.id]).length;
              const pct = Math.round((done / courses.length) * 100);
              const color = LEVEL_COLOR[level];

              return (
                <TouchableOpacity
                  key={level}
                  style={styles.levelCard}
                  onPress={() => navigation.navigate('코스목록', { level })}
                  activeOpacity={0.7}
                >
                  <View style={styles.levelTop}>
                    <View style={[styles.levelIcon, { backgroundColor: color + '18' }]}>
                      <Text style={{ fontSize: 28 }}>{LEVEL_EMOJI[level]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.levelTitle}>{level}</Text>
                      <Text style={styles.levelDesc}>{LEVEL_DESC[level]}</Text>
                    </View>
                    <View style={[styles.pctBadge, { backgroundColor: pct === 100 ? '#E8FFF0' : color + '15' }]}>
                      <Text style={[styles.pctText, { color: pct === 100 ? '#34C759' : color }]}>
                        {pct === 100 ? '✓' : `${pct}%`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
                  </View>
                  <Text style={styles.progressText}>{done} / {courses.length} 완료</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#191919' },
  headerSub: { fontSize: 13, color: '#8E8E93', marginTop: 2 },

  termCard: {
    backgroundColor: '#0066FF', marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 20,
  },
  termHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  termLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  termTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 },
  termDesc: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },

  levelCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  levelTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  levelIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  levelTitle: { fontSize: 17, fontWeight: '700', color: '#191919' },
  levelDesc: { fontSize: 12, color: '#8E8E93', marginTop: 3 },
  pctBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pctText: { fontSize: 13, fontWeight: '800' },
  progressBg: { height: 6, backgroundColor: '#F2F2F7', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#8E8E93', marginTop: 8 },
});
