/**
 * 데일리 미션 화면
 * 매일 5개 미션 + 전체 완료 보너스
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import {
  loadTodayMissions, getTodayKey, ALL_COMPLETE_BONUS,
  type DailyMission,
} from '../lib/missionService';
import { Colors } from '../components/ui';

export default function DailyMissionScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const today = getTodayKey();

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const m = await loadTodayMissions(user.id);
      setMissions(m);
    } catch {
      setMissions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const completedCount = missions.filter((m) => m.completed).length;
  const totalCount = missions.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allCompleted = completedCount === totalCount && totalCount > 0;
  const totalRewardSum = missions.reduce((sum, m) => sum + m.reward, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ fontSize: 14, color: Colors.textSub, marginTop: 12 }}>오늘의 미션을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (missions.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text }}>오늘의 미션이 아직 없어요</Text>
          <Text style={{ fontSize: 14, color: Colors.textSub, marginTop: 6 }}>내일 다시 확인해주세요!</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>데일리 미션</Text>
        <Text style={styles.headerDate}>{today}</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* 진행률 카드 */}
        <View style={[styles.progressCard, { backgroundColor: allCompleted ? '#34C759' : Colors.primary }]}>
          <Text style={styles.progressLabel}>오늘의 미션</Text>
          <Text style={styles.progressValue}>{completedCount} / {totalCount} 완료</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressHint}>
            {allCompleted
              ? '모든 미션 완료! 보너스 지급됨!'
              : `모두 완료 시 보너스 +${ALL_COMPLETE_BONUS.toLocaleString()}원`}
          </Text>
        </View>

        {/* 미션 리스트 */}
        <View style={styles.missionCard}>
          {missions.map((mission, i) => (
            <View
              key={mission.id}
              style={[
                styles.missionRow,
                i < missions.length - 1 && styles.missionBorder,
                mission.completed && styles.missionCompleted,
              ]}
            >
              {/* 이모지 */}
              <View style={[styles.missionIcon, mission.completed && styles.missionIconDone]}>
                <Text style={styles.missionEmoji}>
                  {mission.completed ? '✅' : mission.emoji}
                </Text>
              </View>

              {/* 내용 */}
              <View style={styles.missionContent}>
                <Text style={[styles.missionTitle, mission.completed && styles.missionTitleDone]}>
                  {mission.title}
                </Text>
                <Text style={styles.missionDesc}>{mission.description}</Text>
                {mission.target > 1 && (
                  <View style={styles.miniBarBg}>
                    <View style={[
                      styles.miniBarFill,
                      { width: `${Math.min((mission.current / mission.target) * 100, 100)}%` },
                    ]} />
                  </View>
                )}
              </View>

              {/* 보상 */}
              <View style={styles.missionReward}>
                <Text style={[styles.rewardText, mission.completed && styles.rewardTextDone]}>
                  +{mission.reward.toLocaleString()}원
                </Text>
                {mission.target > 1 && (
                  <Text style={styles.rewardProgress}>
                    {mission.current}/{mission.target}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* 전체 완료 보너스 카드 */}
        <View style={[styles.bonusCard, allCompleted && styles.bonusCardDone]}>
          <Text style={styles.bonusEmoji}>{allCompleted ? '🎁' : '🎯'}</Text>
          <View style={styles.bonusMeta}>
            <Text style={styles.bonusTitle}>전체 완료 보너스</Text>
            <Text style={styles.bonusDesc}>
              {allCompleted
                ? '축하해요! 보너스가 지급됐어요'
                : `미션 ${totalCount}개 모두 완료 시`}
            </Text>
          </View>
          <Text style={[styles.bonusAmount, allCompleted && styles.bonusAmountDone]}>
            +{ALL_COMPLETE_BONUS.toLocaleString()}원
          </Text>
        </View>

        {/* 안내 */}
        <Text style={styles.hint}>
          미션은 매일 자정에 초기화돼요.{'\n'}
          총 최대 +{(totalRewardSum + ALL_COMPLETE_BONUS).toLocaleString()}원 획득 가능!
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', marginLeft: 8, color: Colors.text },
  headerDate: { marginLeft: 'auto', color: Colors.textSub, fontSize: 14 },

  // Progress card
  progressCard: { margin: 16, borderRadius: 20, padding: 20 },
  progressLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  progressValue: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', marginTop: 4 },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, marginTop: 12, marginBottom: 8 },
  progressBarFill: { height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  progressHint: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },

  // Mission list
  missionCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  missionRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  missionBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  missionCompleted: { opacity: 0.7 },
  missionIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  missionIconDone: { backgroundColor: '#E8FFF0' },
  missionEmoji: { fontSize: 24 },
  missionContent: { flex: 1 },
  missionTitle: { fontWeight: '700', fontSize: 15, color: Colors.text },
  missionTitleDone: { textDecorationLine: 'line-through' },
  missionDesc: { color: Colors.textSub, fontSize: 13, marginTop: 2 },
  miniBarBg: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginTop: 6 },
  miniBarFill: { height: 4, borderRadius: 2, backgroundColor: Colors.primary },
  missionReward: { alignItems: 'flex-end', marginLeft: 12 },
  rewardText: { fontWeight: '700', fontSize: 14, color: Colors.primary },
  rewardTextDone: { color: '#34C759' },
  rewardProgress: { color: Colors.textSub, fontSize: 12, marginTop: 2 },

  // Bonus card
  bonusCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 20,
    padding: 20, flexDirection: 'row', alignItems: 'center',
    marginBottom: 16, borderWidth: 2, borderColor: Colors.border,
  },
  bonusCardDone: { backgroundColor: '#E8FFF0', borderColor: '#34C759' },
  bonusEmoji: { fontSize: 32, marginRight: 16 },
  bonusMeta: { flex: 1 },
  bonusTitle: { fontWeight: '700', fontSize: 16, color: Colors.text },
  bonusDesc: { color: Colors.textSub, fontSize: 13, marginTop: 2 },
  bonusAmount: { fontWeight: '700', fontSize: 18, color: Colors.primary },
  bonusAmountDone: { color: '#34C759' },

  hint: { color: Colors.textSub, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 40 },
});
