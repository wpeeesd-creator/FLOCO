/**
 * 마이페이지 — 프로필, 닉네임 편집, 투자 유형, 자산 현황, 학습 현황, 거래 현황, 설정, 로그아웃
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Linking, TextInput, Switch, Share, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, onSnapshot, increment } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { db } from '../lib/firebase';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../components/ui';
import { BADGE_DEFINITIONS } from './BadgeScreen';
import { fetchMultiplePrices, calculateProfit } from '../utils/priceService';

// Inline type — do NOT import from lib/investmentAnalysis
interface InvestmentType {
  emoji: string;
  title: string;
  mbtiLike: string;
  color?: string;
  description?: string;
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const { user: currentUser, logout } = useAuth();
  const { holdings, trades, cash, getTotalValue, getReturnRate } = useAppStore();

  const [nickname, setNickname] = useState('투자자');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [investmentType, setInvestmentType] = useState<InvestmentType | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [learningData, setLearningData] = useState({
    streak: 0,
    totalPoints: 0,
    completedLessons: [] as string[],
  });
  const [inviteData, setInviteData] = useState({
    inviteCode: '',
    invitedFriends: [] as string[],
    inviteReward: 0,
  });
  const [schoolInfo, setSchoolInfo] = useState<{ name: string; grade: string; classNum: string } | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [realNameVerified, setRealNameVerified] = useState(false);
  const [portfolioPrices, setPortfolioPrices] = useState<Record<string, any>>({});
  const { theme, isDark, toggleTheme } = useTheme();

  // ── Firestore: user profile + investment type (realtime) ──────────────
  useEffect(() => {
    if (!currentUser?.id) return;
    const unsubscribe = onSnapshot(doc(db, 'users', currentUser.id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setNickname(data.name ?? data.nickname ?? '투자자');
        setInvestmentType(data.investmentType ?? null);
        setNotificationsEnabled(data.notificationsEnabled ?? false);
        setInviteData({
          inviteCode: data.inviteCode ?? '',
          invitedFriends: data.invitedFriends ?? [],
          inviteReward: data.inviteReward ?? 0,
        });
        setSchoolInfo(data.school ?? null);
        setProfileImage(data.profileImage ?? null);
        setRealNameVerified(data.realNameVerified ?? false);
      }
    }, (error) => {
      console.error('프로필 실시간 리스너 오류:', error);
    });
    return () => unsubscribe();
  }, [currentUser?.id]);

  // ── Firestore: learning data (on focus) ──────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) return;
    getDoc(doc(db, 'users', currentUser.id, 'learning', 'data'))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setLearningData({
            streak: d.streak ?? 0,
            totalPoints: d.totalPoints ?? 0,
            completedLessons: d.completedLessons ?? [],
          });
        }
      })
      .catch(() => {});
  }, [currentUser?.id, isFocused]);

  // ── 보유 종목 실시간 가격 ─────────────────────────────────────────────
  useEffect(() => {
    const safeH = holdings ?? [];
    if (safeH.length === 0) return;
    const stocks = safeH.map(h => ({
      ticker: h.ticker,
      isKR: h.ticker.length === 6 && /^\d+$/.test(h.ticker),
    }));
    fetchMultiplePrices(stocks).then(setPortfolioPrices).catch(() => {});
  }, [(holdings ?? []).length, isFocused]);

  // ── Computed values ───────────────────────────────────────────────────
  const balance = cash ?? 1_000_000;
  const safeHoldingsForCalc = holdings ?? [];
  const portfolioValue = safeHoldingsForCalc.reduce((sum, h) => {
    const livePrice = portfolioPrices[h.ticker]?.price;
    const fallbackPrice = h.avgPrice ?? 0;
    return sum + (livePrice ?? fallbackPrice) * (h.qty ?? 0);
  }, 0);
  const totalValue = balance + portfolioValue;
  const { profit, profitRate: returnRate } = calculateProfit(totalValue, 1_000_000);
  const isUp = profit >= 0;
  const safeTrades = trades ?? [];
  const buyCount = safeTrades.filter((t) => t.type === 'buy').length;
  const sellCount = safeTrades.filter((t) => t.type === 'sell').length;

  const profitColor = isUp ? Colors.green : Colors.red;
  const returnColor = returnRate >= 0 ? Colors.green : Colors.red;

  // ── Badge summary ─────────────────────────────────────────────────────
  const badgeCheckData = {
    tradesLength: safeTrades.length,
    totalValue,
    returnRate,
    holdingsLength: (holdings ?? []).length,
    completedLessonsLength: learningData.completedLessons.length,
    streak: learningData.streak,
  };
  const earnedBadges = BADGE_DEFINITIONS.filter((b) => b.check(badgeCheckData));

  // ── Nickname update ───────────────────────────────────────────────────
  const handleUpdateNickname = async () => {
    if (!editNickname.trim() || !currentUser?.id) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.id), { name: editNickname.trim() });
      setIsEditingNickname(false);
      Alert.alert('완료', '닉네임이 변경됐어요!');
    } catch {
      Alert.alert('오류', '닉네임 변경 중 문제가 발생했어요');
    }
  };

  const handleStartEdit = () => {
    setEditNickname(nickname);
    setIsEditingNickname(true);
  };

  // ── Notification toggle ───────────────────────────────────────────────
  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (!currentUser?.id) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.id), { notificationsEnabled: value });
    } catch {
      setNotificationsEnabled(!value);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────
  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `FLOCO 친구 초대 코드: ${inviteData.inviteCode}\n\n청소년 모의투자 앱 FLOCO에서 주식 투자를 배워보세요!\n초대 코드 입력 시 가상 자산 +30,000원 지급!\n\nhttps://floco.app`,
      });
    } catch {
      // 공유 취소 등
    }
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  // ── Account reset ────────────────────────────────────────────────────
  const resetAccount = () => {
    Alert.alert(
      '⚠️ 계좌 초기화',
      '정말 초기화할까요?\n\n초기화 시:\n• 잔액 → 100만원으로 리셋\n• 보유 종목 전체 삭제\n• 거래내역 전체 삭제\n• 학습 기록은 유지됩니다\n\n이 작업은 되돌릴 수 없어요!',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              '마지막 확인',
              '정말로 초기화하시겠어요?',
              [
                { text: '취소', style: 'cancel' },
                {
                  text: '네, 초기화할게요',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await updateDoc(doc(db, 'users', currentUser!.id), {
                        balance: 1000000,
                        totalAsset: 1000000,
                        initialBalance: 1000000,
                        portfolio: [],
                        transactions: [],
                        wishlist: [],
                        resetCount: increment(1),
                        lastResetAt: new Date().toISOString(),
                      });

                      await Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success
                      );

                      Alert.alert(
                        '초기화 완료',
                        '계좌가 100만원으로 초기화됐어요!\n새로운 마음으로 투자를 시작해보세요!'
                      );
                    } catch (error) {
                      Alert.alert('오류', '초기화 중 오류가 발생했어요');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  // ── Helpers ───────────────────────────────────────────────────────────
  const formatKRW = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;

  const typeColor = investmentType?.color ?? Colors.primary;
  const typeBgColor = typeColor + '33'; // ~20% opacity

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── 프로필 카드 ─────────────────────────────── */}
        <View style={styles.card}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={{ width: 80, height: 80, borderRadius: 40 }} />
            ) : (
              <Text style={styles.avatarEmoji}>{investmentType?.emoji ?? '👤'}</Text>
            )}
          </View>

          {/* Nickname row */}
          <View style={styles.nicknameRow}>
            {isEditingNickname ? (
              <>
                <TextInput
                  style={styles.nicknameInput}
                  value={editNickname}
                  onChangeText={setEditNickname}
                  maxLength={12}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleUpdateNickname}
                  placeholder="닉네임 입력"
                  placeholderTextColor={Colors.textMuted}
                />
                <TouchableOpacity onPress={handleUpdateNickname} style={styles.iconBtn}>
                  <Ionicons name="checkmark" size={22} color={Colors.primary} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.nicknameText}>{nickname}</Text>
                <TouchableOpacity onPress={handleStartEdit} style={styles.iconBtn}>
                  <Ionicons name="pencil-outline" size={18} color={Colors.textSub} />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Email */}
          <Text style={styles.emailText}>{currentUser?.email ?? ''}</Text>

          {realNameVerified ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#34C759" />
              <Text style={styles.verifiedText}>실명 인증됨</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.verifyBtn} onPress={() => navigation.navigate('실명인증')} activeOpacity={0.7}>
              <Text style={styles.verifyBtnText}>🪪 실명 인증하기</Text>
            </TouchableOpacity>
          )}

          {/* Investment type badge or CTA */}
          {investmentType ? (
            <TouchableOpacity
              style={[styles.typeBadge, { backgroundColor: typeBgColor }]}
              onPress={() => navigation.navigate('투자유형설문')}
              activeOpacity={0.7}
            >
              <Text style={styles.typeBadgeText}>
                {investmentType.emoji}{'  '}{investmentType.title}{'  '}
                <Text style={{ color: Colors.textSub, fontWeight: '400' }}>
                  {investmentType.mbtiLike}
                </Text>
                {'  '}
                <Text style={{ color: Colors.primary }}>재분석 →</Text>
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.surveyBtn}
              onPress={() => navigation.navigate('투자유형설문')}
              activeOpacity={0.8}
            >
              <Text style={styles.surveyBtnText}>🔮  내 투자 유형 분석하기</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── 다크모드 토글 ──────────────────────────────── */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.card, { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }]}
          activeOpacity={0.7}
        >
          <View style={{
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: isDark ? '#1A1A3A' : '#FFF9E6',
            justifyContent: 'center', alignItems: 'center', marginRight: 12,
          }}>
            <Text style={{ fontSize: 20 }}>{isDark ? '🌙' : '☀️'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.text }}>
              {isDark ? '다크 모드' : '라이트 모드'}
            </Text>
            <Text style={{ fontSize: 12, color: Colors.textSub, marginTop: 2 }}>
              {isDark ? '밝은 화면으로 전환' : '어두운 화면으로 전환'}
            </Text>
          </View>
          <View style={{
            width: 51, height: 31, borderRadius: 15.5,
            backgroundColor: isDark ? Colors.primary : Colors.border,
            justifyContent: 'center', paddingHorizontal: 2,
          }}>
            <View style={{
              width: 27, height: 27, borderRadius: 13.5,
              backgroundColor: '#FFFFFF',
              alignSelf: isDark ? 'flex-end' : 'flex-start',
              elevation: 3,
            }} />
          </View>
        </TouchableOpacity>

        {/* ── 자산 현황 카드 ───────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>💰 자산 현황</Text>
          <View style={styles.statGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>총 자산</Text>
              <Text style={styles.statValue}>{formatKRW(totalValue)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>수익금</Text>
              <Text style={[styles.statValue, { color: profitColor }]}>
                {profit >= 0 ? '+' : ''}{formatKRW(profit)}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>남은 현금</Text>
              <Text style={styles.statValue}>{formatKRW(balance)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>투자 중</Text>
              <Text style={styles.statValue}>{formatKRW(portfolioValue)}</Text>
            </View>
          </View>
          <Text style={[styles.returnRateText, { color: returnColor }]}>
            수익률 {returnRate >= 0 ? '+' : ''}{returnRate.toFixed(2)}%
          </Text>
        </View>

        {/* ── AI 분석 버튼 ──────────────────────────────── */}
        <TouchableOpacity
          style={styles.aiBtn}
          onPress={() => navigation.getParent()?.navigate('홈Tab', { screen: 'AI분석' })}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 16, marginRight: 6 }}>🤖</Text>
          <Text style={styles.aiBtnText}>AI 분석받기</Text>
        </TouchableOpacity>

        {/* ── 학습 현황 카드 ───────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>📚 학습 현황</Text>
          <View style={styles.learnRow}>
            <View style={styles.learnItem}>
              <Text style={styles.learnEmoji}>🔥</Text>
              <Text style={styles.learnValue}>{learningData.streak}일</Text>
              <Text style={styles.learnLabel}>연속학습</Text>
            </View>
            <View style={[styles.learnItem, styles.learnBorderLeft]}>
              <Text style={styles.learnEmoji}>⭐</Text>
              <Text style={styles.learnValue}>{learningData.totalPoints.toLocaleString('ko-KR')}</Text>
              <Text style={styles.learnLabel}>총 포인트</Text>
            </View>
            <View style={[styles.learnItem, styles.learnBorderLeft]}>
              <Text style={styles.learnEmoji}>✅</Text>
              <Text style={styles.learnValue}>{learningData.completedLessons.length}개</Text>
              <Text style={styles.learnLabel}>완료</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.getParent()?.navigate('학습Tab')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>학습하러 가기 →</Text>
          </TouchableOpacity>
        </View>

        {/* ── 거래 현황 카드 ───────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>📈 거래 현황</Text>
          <View style={styles.learnRow}>
            <View style={styles.learnItem}>
              <Text style={styles.learnValue}>{safeTrades.length}회</Text>
              <Text style={styles.learnLabel}>총 거래</Text>
            </View>
            <View style={[styles.learnItem, styles.learnBorderLeft]}>
              <Text style={[styles.learnValue, { color: Colors.green }]}>{buyCount}회</Text>
              <Text style={styles.learnLabel}>매수</Text>
            </View>
            <View style={[styles.learnItem, styles.learnBorderLeft]}>
              <Text style={[styles.learnValue, { color: Colors.red }]}>{sellCount}회</Text>
              <Text style={styles.learnLabel}>매도</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => navigation.getParent()?.navigate('홈Tab', { screen: '거래내역' })}
            activeOpacity={0.85}
          >
            <Text style={styles.ghostBtnText}>거래내역 보기 →</Text>
          </TouchableOpacity>
        </View>

        {/* ── 배지 요약 카드 ──────────────────────────────── */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.cardHeader}>🏅 나의 배지</Text>
            <TouchableOpacity onPress={() => navigation.navigate('배지')} activeOpacity={0.7}>
              <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: '600' }}>전체 보기 →</Text>
            </TouchableOpacity>
          </View>
          {earnedBadges.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {earnedBadges.slice(0, 5).map((b) => (
                <Text key={b.id} style={{ fontSize: 28 }}>{b.emoji}</Text>
              ))}
              {earnedBadges.length > 5 && (
                <View style={{ justifyContent: 'center', paddingLeft: 4 }}>
                  <Text style={{ fontSize: 13, color: Colors.textSub, fontWeight: '600' }}>
                    +{earnedBadges.length - 5}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={{ fontSize: 13, color: Colors.textSub }}>아직 획득한 배지가 없어요. 도전해보세요!</Text>
          )}
        </View>

        {/* ── 친구 초대 카드 ──────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>👥 친구 초대</Text>

          {/* 내 초대 코드 */}
          <View style={styles.inviteCodeBox}>
            <Text style={styles.inviteCodeLabel}>내 초대 코드</Text>
            <Text style={styles.inviteCodeValue}>{inviteData.inviteCode}</Text>
          </View>

          {/* 초대 현황 */}
          <View style={styles.learnRow}>
            <View style={styles.learnItem}>
              <Text style={styles.learnValue}>{inviteData.invitedFriends.length}명</Text>
              <Text style={styles.learnLabel}>초대한 친구</Text>
            </View>
            <View style={[styles.learnItem, styles.learnBorderLeft]}>
              <Text style={[styles.learnValue, { color: '#34C759' }]}>
                +{inviteData.inviteReward.toLocaleString('ko-KR')}원
              </Text>
              <Text style={styles.learnLabel}>총 초대 보상</Text>
            </View>
          </View>

          {/* 공유 버튼 */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleShareInvite}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>친구에게 공유하기</Text>
          </TouchableOpacity>

          {/* 보상 안내 */}
          <View style={styles.inviteHint}>
            <Text style={styles.inviteHintText}>
              친구가 초대 코드 입력 시{'\n'}친구에게 +30,000원 / 나에게 +50,000원 지급!
            </Text>
          </View>
        </View>

        {/* ── 설정 메뉴 ────────────────────────────────── */}
        <View style={[styles.card, styles.menuCard]}>
          {/* 알림 설정 */}
          <View style={styles.menuRow}>
            <Ionicons name="notifications-outline" size={20} color={Colors.text} style={styles.menuIcon} />
            <Text style={styles.menuLabel}>알림 설정</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.menuDivider} />

          {/* 학교/반 설정 */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('학교반설정')}
            activeOpacity={0.7}
          >
            <Ionicons name="school-outline" size={20} color={Colors.text} style={styles.menuIcon} />
            <Text style={styles.menuLabel}>
              {schoolInfo
                ? `${schoolInfo.name} ${schoolInfo.grade} ${schoolInfo.classNum}`
                : '학교/반 설정'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSub} />
          </TouchableOpacity>
          <View style={styles.menuDivider} />

          {/* 개인정보처리방침 */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('개인정보처리방침')}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text-outline" size={20} color={Colors.text} style={styles.menuIcon} />
            <Text style={styles.menuLabel}>개인정보처리방침</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSub} />
          </TouchableOpacity>
          <View style={styles.menuDivider} />

          {/* 서비스 이용약관 */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('서비스이용약관')}
            activeOpacity={0.7}
          >
            <Ionicons name="reader-outline" size={20} color={Colors.text} style={styles.menuIcon} />
            <Text style={styles.menuLabel}>서비스 이용약관</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSub} />
          </TouchableOpacity>
          <View style={styles.menuDivider} />

          {/* 계좌 초기화 */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={resetAccount}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-circle-outline" size={20} color="#FF3B30" style={styles.menuIcon} />
            <Text style={[styles.menuLabel, { color: '#FF3B30' }]}>계좌 초기화</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSub} />
          </TouchableOpacity>
          <View style={styles.menuDivider} />

          {/* 앱 버전 */}
          <View style={styles.menuRow}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.text} style={styles.menuIcon} />
            <Text style={styles.menuLabel}>앱 버전</Text>
            <Text style={styles.menuValue}>1.0.0</Text>
          </View>
          <View style={styles.menuDivider} />

          {/* 튜토리얼 다시 보기 */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={async () => {
              try { await SecureStore.deleteItemAsync('tutorialCompleted'); } catch {}
              Alert.alert('안내', '앱을 다시 열면 튜토리얼이 시작돼요!');
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="help-circle-outline" size={20} color={Colors.text} style={styles.menuIcon} />
            <Text style={styles.menuLabel}>튜토리얼 다시 보기</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSub} />
          </TouchableOpacity>
          <View style={styles.menuDivider} />

          {/* 문의하기 */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Linking.openURL('mailto:support@floco.app')}
            activeOpacity={0.7}
          >
            <Ionicons name="mail-outline" size={20} color={Colors.text} style={styles.menuIcon} />
            <Text style={styles.menuLabel}>문의하기</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSub} />
          </TouchableOpacity>
        </View>

        {/* ── 관리자 버튼 (admin only) ─────────────────── */}
        {currentUser?.role === 'admin' && (
          <TouchableOpacity
            style={styles.adminBtn}
            onPress={() => navigation.navigate('관리자대시보드')}
            activeOpacity={0.85}
          >
            <Text style={styles.adminBtnText}>⚙️  관리자 대시보드</Text>
          </TouchableOpacity>
        )}

        {/* ── 로그아웃 버튼 ────────────────────────────── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutBtnText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },

  // ── Card ──────────────────────────────────────────
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },

  // ── Profile ───────────────────────────────────────
  avatarWrap: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 4,
  },
  nicknameText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  nicknameInput: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    minWidth: 120,
    paddingVertical: 2,
    textAlign: 'center',
  },
  iconBtn: {
    padding: 4,
  },
  emailText: {
    fontSize: 14,
    color: Colors.textSub,
    textAlign: 'center',
    marginBottom: 14,
  },
  typeBadge: {
    alignSelf: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#34C75920', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 14 },
  verifiedText: { color: '#34C759', fontSize: 11, fontWeight: '700', marginLeft: 3 },
  verifyBtn: { alignSelf: 'center', marginBottom: 14 },
  verifyBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },

  surveyBtn: {
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 4,
  },
  surveyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Stat grid ─────────────────────────────────────
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    width: '47%',
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    padding: 12,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSub,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  returnRateText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },

  // ── Learn row ─────────────────────────────────────
  learnRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  learnItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  learnBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  learnEmoji: {
    fontSize: 24,
  },
  learnValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  learnLabel: {
    fontSize: 11,
    color: Colors.textSub,
  },

  // ── AI Button ─────────────────────────────────────
  aiBtn: {
    backgroundColor: '#191F28',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
  },
  aiBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  // ── Invite ────────────────────────────────────────
  inviteCodeBox: {
    backgroundColor: '#F0F4FF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  inviteCodeLabel: {
    color: '#8B95A1',
    fontSize: 13,
    marginBottom: 8,
  },
  inviteCodeValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0066FF',
    letterSpacing: 8,
  },
  inviteHint: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  inviteHintText: {
    color: '#8B95A1',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },

  // ── Buttons ───────────────────────────────────────
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ghostBtn: {
    backgroundColor: '#F2F4F6',
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },

  // ── Settings menu ─────────────────────────────────
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  menuValue: {
    fontSize: 14,
    color: Colors.textSub,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F2F4F6',
    marginLeft: 48,
  },

  // ── Admin button ──────────────────────────────────
  adminBtn: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#F0EEFF',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  adminBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7C3AED',
  },

  // ── Logout button ─────────────────────────────────
  logoutBtn: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFF0F1',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.green,
  },
});
