/**
 * ExchangeAlertScreen — 환율 알림 설정
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../components/ui';

const EXCHANGE_RATE = 1391.35;

interface AlertItem {
  id: string;
  rate: number;
  direction: 'above' | 'below';
  enabled: boolean;
}

export default function ExchangeAlertScreen() {
  const navigation = useNavigation<any>();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  function handleAddAlert() {
    Alert.alert(
      '환율 알림 추가',
      '원하는 알림 환율을 입력해주세요.\n(예: 1,350원 이하 시 알림)',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => {
            const newAlert: AlertItem = {
              id: Date.now().toString(),
              rate: 1350,
              direction: 'below',
              enabled: true,
            };
            setAlerts(prev => [...prev, newAlert]);
          },
        },
      ]
    );
  }

  function handleToggleAlert(id: string) {
    setAlerts(prev =>
      prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a)
    );
  }

  function handleDeleteAlert(id: string) {
    Alert.alert('알림 삭제', '이 환율 알림을 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => setAlerts(prev => prev.filter(a => a.id !== id)),
      },
    ]);
  }

  function handleSubscribe() {
    Alert.alert('알림 설정 완료', '환율 알림이 등록되었어요.\n원하는 환율에 도달하면 알려드릴게요!', [
      { text: '확인' },
    ]);
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>달러 채우기</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="notifications" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.bannerTitle}>환율 알림을 받아보세요</Text>
          <Text style={styles.bannerDesc}>
            원하는 환율에 도달하면 바로 알려드려요.{'\n'}더 유리한 환율로 환전하세요.
          </Text>
        </View>

        {/* Current Rate Card */}
        <View style={styles.rateCard}>
          <View style={styles.rateCardLeft}>
            <Text style={styles.rateCardLabel}>현재 적용환율</Text>
            <Text style={styles.rateCardValue}>{EXCHANGE_RATE.toLocaleString()} 원/달러</Text>
          </View>
          <View style={styles.rateCardBadge}>
            <Text style={styles.rateCardBadgeText}>우대 95%</Text>
          </View>
        </View>

        {/* Direct Input Button */}
        <TouchableOpacity
          style={styles.directInputBtn}
          onPress={handleAddAlert}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={18} color={Colors.primary} />
          <Text style={styles.directInputText}>직접 환율 입력하기</Text>
        </TouchableOpacity>

        {/* Alert List */}
        <View style={styles.alertSection}>
          <Text style={styles.alertSectionTitle}>등록된 환율 알림</Text>

          {alerts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={40} color={Colors.border} />
              <Text style={styles.emptyTitle}>등록된 알림이 없어요</Text>
              <Text style={styles.emptyDesc}>위 버튼을 눌러 환율 알림을 추가해보세요</Text>
            </View>
          ) : (
            <View style={styles.alertList}>
              {alerts.map(alert => (
                <View key={alert.id} style={styles.alertItem}>
                  <View style={styles.alertItemLeft}>
                    <Text style={styles.alertRate}>
                      {alert.rate.toLocaleString()}원
                    </Text>
                    <Text style={styles.alertDirection}>
                      {alert.direction === 'below' ? '이하 시 알림' : '이상 시 알림'}
                    </Text>
                  </View>
                  <View style={styles.alertItemRight}>
                    <TouchableOpacity
                      onPress={() => handleToggleAlert(alert.id)}
                      style={[
                        styles.alertToggle,
                        { backgroundColor: alert.enabled ? Colors.primary : Colors.border },
                      ]}
                    >
                      <Text style={styles.alertToggleText}>
                        {alert.enabled ? 'ON' : 'OFF'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteAlert(alert.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Subscribe Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.subscribeBtn}
          onPress={handleSubscribe}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications" size={18} color="#FFFFFF" />
          <Text style={styles.subscribeBtnText}>알림 받기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },

  scrollContent: { paddingBottom: 120 },

  // Banner
  banner: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 24,
  },
  bannerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  bannerDesc: {
    fontSize: 14,
    color: Colors.textSub,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Rate card
  rateCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rateCardLeft: { gap: 4 },
  rateCardLabel: { fontSize: 13, color: Colors.textSub },
  rateCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Courier',
  },
  rateCardBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EBF4FF',
    borderRadius: 20,
  },
  rateCardBadgeText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  // Direct input button
  directInputBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.card,
  },
  directInputText: { fontSize: 15, fontWeight: '600', color: Colors.primary },

  // Alert section
  alertSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  alertSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: Colors.textSub },
  emptyDesc: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },

  alertList: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  alertItemLeft: { gap: 3 },
  alertRate: { fontSize: 16, fontWeight: '700', color: Colors.text },
  alertDirection: { fontSize: 12, color: Colors.textSub },
  alertItemRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertToggle: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertToggleText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },

  // Bottom
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 12,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  subscribeBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  subscribeBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
