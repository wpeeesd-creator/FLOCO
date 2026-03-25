/**
 * 이벤트 상세 화면 — 실시간 뉴스 이벤트 학습 퀴즈
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore, FLO_EVENTS, STOCKS } from '../store/appStore';
import { Colors, Typography, Button, Badge, BottomSheet } from '../components/ui';

export default function EventDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { eventId } = route.params;
  const { completeEvent, completedEvents } = useAppStore();

  const event = FLO_EVENTS.find(e => e.id === eventId);
  const stock = event ? STOCKS.find(s => s.ticker === event.ticker) : null;

  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const isCompleted = completedEvents.includes(eventId ?? '');

  if (!event || !stock) {
    return (
      <View style={styles.container}>
        <Text style={Typography.h2}>이벤트를 찾을 수 없어요</Text>
        <Button title="돌아가기" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const isHo = event.badge === '호재';

  function handleAnswer(idx: number) {
    if (answered || isCompleted) return;
    setSelected(idx);
    setAnswered(true);
  }

  function handleSubmit() {
    if (!answered) return;
    completeEvent(event.id, selected === event.ans ? event.xp : 0);
    setShowResult(true);
  }

  function handleClose() {
    setShowResult(false);
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Badge label="LIVE 이벤트" type="danger" size="sm" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* 이벤트 카드 */}
        <View style={[styles.eventCard, { backgroundColor: isHo ? '#1A4D2E' : '#4D1A1A' }]}>
          <View style={styles.eventBadgeRow}>
            <View style={[styles.eventBadge, { backgroundColor: isHo ? Colors.green : Colors.red }]}>
              <Text style={styles.eventBadgeText}>{event.badge}</Text>
            </View>
            <View style={styles.tickerBadge}>
              <Text style={styles.tickerText}>{stock.logo} {event.ticker}</Text>
            </View>
          </View>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDesc}>{event.desc}</Text>

          {/* 주가 영향 */}
          <View style={styles.impactRow}>
            <Text style={styles.impactLabel}>예상 주가 영향</Text>
            <Text style={[styles.impactValue, { color: isHo ? '#6EE7B7' : '#FCA5A5' }]}>
              {event.impact >= 0 ? '+' : ''}{event.impact.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* 퀴즈 섹션 */}
        <View style={styles.quizSection}>
          <Text style={styles.quizLabel}>💡 투자 퀴즈</Text>
          <Text style={[Typography.h3, { lineHeight: 26, marginBottom: 16 }]}>{event.q}</Text>

          {isCompleted ? (
            <View style={styles.completedBanner}>
              <Text style={styles.completedText}>✅ 이미 완료한 이벤트예요</Text>
            </View>
          ) : (
            <>
              {event.opts.map((opt, i) => {
                let bg = '#fff';
                let border = Colors.border;
                let textColor = Colors.text;

                if (answered) {
                  if (i === event.ans) { bg = Colors.greenBg; border = Colors.green; textColor = Colors.green; }
                  else if (i === selected) { bg = Colors.redBg; border = Colors.red; textColor = Colors.red; }
                } else if (selected === i) {
                  bg = '#EAF4FF'; border = Colors.primary;
                }

                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.optionBtn, { backgroundColor: bg, borderColor: border }]}
                    onPress={() => handleAnswer(i)}
                    disabled={answered}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optLetter, { color: border }]}>{String.fromCharCode(65 + i)}</Text>
                    <Text style={[Typography.body1, { flex: 1, color: textColor }]}>{opt}</Text>
                    {answered && i === event.ans && <Text style={{ fontSize: 18 }}>✅</Text>}
                    {answered && i === selected && i !== event.ans && <Text style={{ fontSize: 18 }}>❌</Text>}
                  </TouchableOpacity>
                );
              })}

              {answered && (
                <Button
                  title={selected === event.ans ? `완료 (+${event.xp} XP) 🎉` : '확인 (오답)'}
                  onPress={handleSubmit}
                  variant={selected === event.ans ? 'primary' : 'outline'}
                  size="lg"
                  fullWidth
                />
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* 결과 Bottom Sheet */}
      <BottomSheet visible={showResult} onClose={handleClose} title={selected === event.ans ? '🎉 정답!' : '😅 오답'}>
        <View style={styles.resultContent}>
          <Text style={styles.resultEmoji}>{selected === event.ans ? '🧠' : '📚'}</Text>
          <Text style={[Typography.h3, { textAlign: 'center', marginBottom: 8 }]}>
            {selected === event.ans ? `+${event.xp} XP 획득!` : '다음엔 맞춰봐요'}
          </Text>
          <View style={styles.explainBox}>
            <Text style={Typography.caption}>해설</Text>
            <Text style={[Typography.body1, { lineHeight: 22, marginTop: 4 }]}>{event.explain}</Text>
          </View>
          <Button title="닫기" onPress={handleClose} variant="primary" size="lg" fullWidth />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  eventCard: { margin: 16, borderRadius: 16, padding: 20, gap: 12 },
  eventBadgeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  eventBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  eventBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  tickerBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  tickerText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  eventTitle: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 26 },
  eventDesc: { color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 22 },
  impactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 12 },
  impactLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  impactValue: { fontSize: 22, fontWeight: '800', fontFamily: 'Courier' },
  quizSection: { margin: 16 },
  quizLabel: { fontSize: 12, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  completedBanner: { backgroundColor: Colors.greenBg, borderRadius: 10, padding: 16, alignItems: 'center' },
  completedText: { color: Colors.green, fontWeight: '700', fontSize: 15 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderRadius: 12, padding: 14, marginBottom: 10 },
  optLetter: { fontSize: 15, fontWeight: '800', width: 22, textAlign: 'center' },
  resultContent: { alignItems: 'center', gap: 14, paddingBottom: 8 },
  resultEmoji: { fontSize: 52 },
  explainBox: { backgroundColor: Colors.bg, borderRadius: 10, padding: 14, width: '100%' },
});
