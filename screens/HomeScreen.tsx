import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator,
  Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAppStore, STOCKS } from '../store/appStore';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/ui';
import StockLogo from '../components/StockLogo';
import NewsCard from '../components/NewsCard';
import { useAllNews } from '../hooks/useNews';
import { loadTodayMissions, ALL_COMPLETE_BONUS, type DailyMission } from '../lib/missionService';
import { fetchMultiplePrices, calculateProfit } from '../utils/priceService';
import { useTheme } from '../context/ThemeContext';

type TopTab = '보유' | '관심';
type StockTab = '전체' | '국내' | '미국';
type MarketFilter = '국내' | '미국' | '기타';
type SortType = 'value' | 'return';

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { holdings, cash, getTotalValue, getReturnRate } = useAppStore();
  const { news, loading: newsLoading } = useAllNews(5);

  const [topTab, setTopTab] = useState<TopTab>('보유');
  const [stockTab, setStockTab] = useState<StockTab>('전체');
  const [sortType, setSortType] = useState<SortType>('value');
  const [refreshing, setRefreshing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [nickname, setNickname] = useState('투자자');
  const [investmentType, setInvestmentType] = useState<{ emoji: string; name: string } | null>(null);
  const [firestoreBalance, setFirestoreBalance] = useState<number | null>(null);
  const [firestoreTotalAsset, setFirestoreTotalAsset] = useState<number | null>(null);
  const [firestoreInitialBalance, setFirestoreInitialBalance] = useState<number | null>(null);
  const [missionData, setMissionData] = useState<{ completed: number; total: number; maxReward: number }>({ completed: 0, total: 0, maxReward: 0 });
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [wishlistPrices, setWishlistPrices] = useState<Record<string, any>>({});
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Firestore real-time listener ──────────────────
  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setNickname(data?.name ?? data?.nickname ?? '투자자');
        if (data?.investmentType) {
          setInvestmentType(data.investmentType);
        }
        if (data?.balance !== undefined) {
          setFirestoreBalance(data.balance);
          // appStore(Zustand)도 동기화 → derived values 즉시 반영
          useAppStore.setState({ cash: data.balance });
        }
        if (data?.totalAsset !== undefined) {
          setFirestoreTotalAsset(data.totalAsset);
        }
        if (data?.initialBalance !== undefined) {
          setFirestoreInitialBalance(data.initialBalance);
        }
        // wishlist 동기화
        if (Array.isArray(data?.wishlist)) {
          setWishlist(data.wishlist);
        }
        // 읽지 않은 알림 개수
        if (Array.isArray(data?.notifications)) {
          setUnreadCount(data.notifications.filter((n: any) => !n.read).length);
        } else {
          setUnreadCount(0);
        }
        // portfolio → appStore holdings 동기화
        if (Array.isArray(data?.portfolio)) {
          const synced = data.portfolio.map((p: any) => ({
            ticker: p.ticker,
            qty: p.quantity ?? p.qty ?? 0,
            avgPrice: p.avgPrice ?? 0,
          }));
          useAppStore.setState({ holdings: synced });
        }
      }
    }, (error) => {
      console.error('홈 유저 실시간 리스너 오류:', error);
    });
    return () => unsubscribe();
  }, [user?.id]);

  // ── 데일리 미션 로드 ──────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    loadTodayMissions(user.id).then((missions) => {
      const completed = missions.filter((m) => m.completed).length;
      const total = missions.length;
      const maxReward = missions.reduce((s, m) => s + m.reward, 0) + ALL_COMPLETE_BONUS;
      setMissionData({ completed, total, maxReward });
    }).catch(() => {});
  }, [user?.id]);

  // ── 보유 종목 실시간 가격 ──────────────────────────
  const [portfolioPrices, setPortfolioPrices] = useState<Record<string, any>>({});

  useEffect(() => {
    const safeH = holdings ?? [];
    if (safeH.length === 0) return;
    const tickers = safeH.map(h => ({
      ticker: h.ticker,
      isKR: h.ticker.length === 6 && /^\d+$/.test(h.ticker),
    }));
    fetchMultiplePrices(tickers).then(setPortfolioPrices).catch(() => {});
    const interval = setInterval(() => {
      fetchMultiplePrices(tickers).then(setPortfolioPrices).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [holdings?.length]);

  // ── 관심 종목 실시간 가격 ──────────────────────────
  useEffect(() => {
    if (wishlist.length === 0) return;
    const tickers = wishlist.map((s: any) => ({
      ticker: s.ticker,
      isKR: s.isKR ?? (s.ticker.length === 6 && /^\d+$/.test(s.ticker)),
    }));
    fetchMultiplePrices(tickers).then(setWishlistPrices).catch(() => {});
    const interval = setInterval(() => {
      fetchMultiplePrices(tickers).then(setWishlistPrices).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [wishlist.length]);

  // ── Derived values ────────────────────────────────
  const balance = cash !== undefined ? cash : (firestoreBalance ?? 1_000_000);
  const safeHoldingsRaw = holdings ?? [];
  const portfolioValue = safeHoldingsRaw.reduce((sum, h) => {
    const livePrice = portfolioPrices[h.ticker]?.price;
    const stockPrice = STOCKS.find(s => s.ticker === h.ticker)?.price ?? 0;
    return sum + (livePrice ?? stockPrice) * (h.qty ?? 0);
  }, 0);
  const realTotalAsset = balance + portfolioValue;
  const initialBalance = firestoreInitialBalance ?? 1_000_000;
  const { profit, profitRate } = calculateProfit(realTotalAsset, initialBalance);
  const totalValue = realTotalAsset;
  const isUp = profit >= 0;

  // ── Firestore totalAsset 실시간 업데이트 ──────────
  useEffect(() => {
    if (!user?.id || safeHoldingsRaw.length === 0) return;
    if (Math.abs(realTotalAsset - (firestoreTotalAsset ?? 0)) > 100) {
      updateDoc(doc(db, 'users', user.id), {
        totalAsset: Math.round(realTotalAsset),
      }).catch(console.error);
    }
  }, [realTotalAsset]);

  // ── Holdings computation ──────────────────────────
  const safeHoldings = holdings ?? [];
  const holdingsData = safeHoldings.map(h => {
    const stock = STOCKS.find(s => s.ticker === h.ticker);
    if (!stock) return null;
    const livePrice = portfolioPrices[h.ticker]?.price ?? stock.price ?? 0;
    const evalAmt = livePrice * (h.qty ?? 0);
    const pnlAmt = (livePrice - (h.avgPrice ?? 0)) * (h.qty ?? 0);
    const pnlRate = (h.avgPrice ?? 0) > 0
      ? ((livePrice - (h.avgPrice ?? 0)) / (h.avgPrice ?? 0)) * 100
      : 0;
    console.log('종목:', h.ticker, '평균매수가:', h.avgPrice, '현재가:', livePrice, '수익률:', pnlRate.toFixed(2));
    return { ...h, stock: { ...stock, price: livePrice }, evalAmt, pnlAmt, pnlRate };
  }).filter(Boolean) as Array<{
    ticker: string; qty: number; avgPrice: number;
    stock: typeof STOCKS[0]; evalAmt: number; pnlAmt: number; pnlRate: number;
  }>;

  const filteredHoldings = holdingsData.filter(h => {
    if (stockTab === '국내') return h.stock.market === '한국';
    if (stockTab === '미국') return h.stock.market === '미국';
    return true; // 전체
  });

  const sortedHoldings = [...filteredHoldings].sort((a, b) => {
    if (sortType === 'value') return b.evalAmt - a.evalAmt;
    return b.pnlRate - a.pnlRate;
  });

  const summaryEval = sortedHoldings.reduce((sum, h) => sum + h.evalAmt, 0);
  const summaryPnl = sortedHoldings.reduce((sum, h) => sum + h.pnlAmt, 0);
  const summaryRate = summaryEval - summaryPnl > 0
    ? (summaryPnl / (summaryEval - summaryPnl)) * 100
    : 0;
  const summaryUp = summaryPnl >= 0;

  const watchlistStocks = wishlist;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // ── Shared banners ────────────────────────────────
  const renderNoticeBanner = () => (
    <TouchableOpacity onPress={() => setShowGuide(true)} style={styles.noticeBanner} activeOpacity={0.7}>
      <Ionicons name="megaphone-outline" size={16} color={theme.primary} />
      <Text style={styles.noticeText} numberOfLines={1}>
        투자 전 반드시 설명서를 읽어보세요. 원금손실이 발생할 수 있습니다.
      </Text>
      <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  const renderLearnBanner = () => (
    <TouchableOpacity
      style={styles.learnBanner}
      onPress={() => navigation.getParent()?.navigate('학습Tab')}
      activeOpacity={0.85}
    >
      <View style={styles.learnBannerLeft}>
        <Text style={styles.learnBannerEmoji}>📚</Text>
        <View style={styles.learnBannerTexts}>
          <Text style={styles.learnBannerTitle}>오늘의 학습</Text>
          <Text style={styles.learnBannerSub}>주식 공부하고 FLO 포인트 받기!</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
    </TouchableOpacity>
  );

  const renderEventBanner = () => (
    <TouchableOpacity
      style={styles.eventBanner}
      onPress={() => navigation.navigate('이벤트')}
      activeOpacity={0.85}
    >
      <Text style={styles.eventBannerEmoji}>🏆</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.eventBannerTitle}>이벤트 & 챌린지</Text>
        <Text style={styles.eventBannerSub}>참여하고 보상 받아보세요!</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.bgCard} />
    </TouchableOpacity>
  );

  const getMarketStatus = () => {
    const now = new Date();
    const koreaOffset = 9 * 60; // UTC+9
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const koreaMs = utcMs + koreaOffset * 60000;
    const korea = new Date(koreaMs);
    const koreaHour = korea.getHours();
    const koreaMin = korea.getMinutes();
    const koreaDay = korea.getDay();

    const nyOffset = -5 * 60; // UTC-5 (EST, simplified)
    const nyMs = utcMs + nyOffset * 60000;
    const ny = new Date(nyMs);
    const nyHour = ny.getHours();
    const nyMin = ny.getMinutes();
    const nyDay = ny.getDay();

    const isKoreaWeekday = koreaDay >= 1 && koreaDay <= 5;
    const isNYWeekday = nyDay >= 1 && nyDay <= 5;

    const koreaOpen = isKoreaWeekday && ((koreaHour > 9 || (koreaHour === 9 && koreaMin >= 0)) && (koreaHour < 15 || (koreaHour === 15 && koreaMin <= 30)));
    const nyOpen = isNYWeekday && ((nyHour > 9 || (nyHour === 9 && nyMin >= 30)) && nyHour < 16);

    return { koreaOpen, nyOpen };
  };

  const MarketStatus = () => {
    const { koreaOpen, nyOpen } = getMarketStatus();
    return (
      <View style={styles.marketStatusRow}>
        <View style={styles.marketStatusCard}>
          <Text style={styles.marketStatusFlag}>🇰🇷</Text>
          <View style={styles.marketStatusInfo}>
            <Text style={styles.marketStatusName}>KOSPI</Text>
            <Text style={styles.marketStatusHours}>09:00 – 15:30 KST</Text>
          </View>
          <View style={[styles.marketStatusDot, { backgroundColor: koreaOpen ? '#00C853' : theme.red }]} />
          <Text style={[styles.marketStatusLabel, { color: koreaOpen ? '#00C853' : theme.red }]}>
            {koreaOpen ? '개장' : '마감'}
          </Text>
        </View>
        <View style={styles.marketStatusCard}>
          <Text style={styles.marketStatusFlag}>🇺🇸</Text>
          <View style={styles.marketStatusInfo}>
            <Text style={styles.marketStatusName}>NASDAQ</Text>
            <Text style={styles.marketStatusHours}>09:30 – 16:00 ET</Text>
          </View>
          <View style={[styles.marketStatusDot, { backgroundColor: nyOpen ? '#00C853' : theme.red }]} />
          <Text style={[styles.marketStatusLabel, { color: nyOpen ? '#00C853' : theme.red }]}>
            {nyOpen ? '개장' : '마감'}
          </Text>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    stockTabRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 0,
      gap: 16,
    },
    stockTabBtn: {
      paddingBottom: 10,
      alignItems: 'center',
    },
    stockTabText: {
      fontSize: 15,
      color: theme.textSecondary,
    },
    stockTabTextActive: {
      fontWeight: 'bold',
      color: theme.primary,
    },
    stockTabUnderline: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: theme.primary,
      borderRadius: 1,
    },

    // ── Header ──
    header: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      backgroundColor: theme.bg,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTabs: {
      flexDirection: 'row',
    },
    headerTabBtn: {
      paddingVertical: 14,
      paddingHorizontal: 4,
      marginRight: 20,
      position: 'relative',
    },
    headerTabText: {
      fontSize: 16,
      fontWeight: '500',
      color: Colors.inactive,
    },
    headerTabTextActive: {
      color: theme.text,
      fontWeight: '700',
    },
    headerTabUnderline: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: theme.primary,
      borderRadius: 1,
    },
    headerIcons: {
      flexDirection: 'row',
      paddingBottom: 8,
    },
    iconBtn: {
      padding: 6,
      marginLeft: 4,
    },

    // ── Scroll ──
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },

    // ── Account Card ──
    accountCard: {
      backgroundColor: theme.bgCard,
      borderRadius: 12,
      marginHorizontal: 20,
      marginTop: 16,
      paddingVertical: 20,
      paddingHorizontal: 20,
      shadowColor: '#00000010',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    accountTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    accountNickname: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    investTypeBadge: {
      backgroundColor: '#EBF2FF',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    investTypeBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
    },
    totalAssetLabel: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    totalAssetValue: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.8,
      marginBottom: 8,
    },
    profitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 20,
    },
    profitAmt: {
      fontSize: 15,
      fontWeight: '600',
    },
    profitRateBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    profitRateText: {
      fontSize: 12,
      fontWeight: '700',
    },
    actionRow: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 16,
    },
    actionBtn: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    actionBtnDivider: {
      width: 1,
      backgroundColor: theme.border,
      marginVertical: 2,
    },
    actionBtnEmoji: {
      fontSize: 20,
    },
    actionBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.text,
    },

    // ── Balance Card ──
    balanceCard: {
      backgroundColor: theme.bgCard,
      borderRadius: 12,
      marginHorizontal: 20,
      marginTop: 8,
      paddingVertical: 16,
      paddingHorizontal: 20,
      shadowColor: '#00000010',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    balanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    balanceItem: {
      flex: 1,
    },
    balanceDivider: {
      width: 1,
      backgroundColor: theme.border,
      height: 40,
      marginHorizontal: 16,
    },
    balanceLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    balancePrimaryValue: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.primary,
      letterSpacing: -0.4,
    },
    balanceValue: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.4,
    },

    // ── Pill Tabs ──
    pillTabRow: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginTop: 16,
      gap: 8,
    },
    pillTab: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: theme.bgCard,
      borderWidth: 1,
      borderColor: theme.border,
    },
    pillTabActive: {
      backgroundColor: theme.text,
      borderColor: theme.text,
    },
    pillTabText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.textSecondary,
    },
    pillTabTextActive: {
      color: theme.bgCard,
      fontWeight: '600',
    },

    // ── Summary Row ──
    summaryRow: {
      flexDirection: 'row',
      backgroundColor: theme.bgCard,
      borderRadius: 12,
      marginHorizontal: 20,
      marginTop: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
      shadowColor: '#00000010',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryDivider: {
      width: 1,
      backgroundColor: theme.border,
      marginVertical: 2,
    },
    summaryLabel: {
      fontSize: 11,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.3,
    },

    // ── Sort Row ──
    sortRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginTop: 16,
      marginBottom: 4,
    },
    sortCount: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
    },
    sortBtns: {
      flexDirection: 'row',
      gap: 4,
    },
    sortBtn: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    sortBtnActive: {
      backgroundColor: theme.border,
    },
    sortBtnText: {
      fontSize: 12,
      color: Colors.inactive,
    },
    sortBtnTextActive: {
      color: theme.text,
      fontWeight: '600',
    },

    // ── Holding Card ──
    holdingCard: {
      backgroundColor: theme.bgCard,
      borderRadius: 12,
      marginHorizontal: 20,
      marginTop: 4,
      overflow: 'hidden',
      shadowColor: '#00000010',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    holdingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      height: 64,
    },
    holdingBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    holdingMeta: {
      flex: 1,
      marginLeft: 12,
    },
    holdingName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
      letterSpacing: -0.2,
    },
    holdingQty: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    holdingAmts: {
      alignItems: 'flex-end',
    },
    holdingEval: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.3,
    },
    holdingPnl: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 2,
    },

    // ── Empty State ──
    emptyBox: {
      alignItems: 'center',
      marginHorizontal: 20,
      marginTop: 4,
      backgroundColor: theme.bgCard,
      borderRadius: 12,
      paddingVertical: 36,
      paddingHorizontal: 24,
    },
    emptyEmoji: {
      fontSize: 40,
      marginBottom: 12,
    },
    emptyTitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    emptyBtn: {
      marginTop: 20,
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingHorizontal: 28,
      height: 44,
      justifyContent: 'center',
    },
    emptyBtnText: {
      color: theme.bgCard,
      fontWeight: '700',
      fontSize: 14,
    },

    // ── Notice Banner ──
    noticeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.bgCard,
      borderRadius: 12,
      marginHorizontal: 20,
      marginTop: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 8,
      shadowColor: '#00000010',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    noticeText: {
      flex: 1,
      fontSize: 12,
      color: theme.textSecondary,
    },

    // ── Learn Banner ──
    learnBanner: {
      backgroundColor: theme.primary,
      borderRadius: 16,
      marginHorizontal: 20,
      marginTop: 8,
      paddingVertical: 18,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    learnBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    learnBannerEmoji: {
      fontSize: 28,
    },
    learnBannerTexts: {
      gap: 2,
    },
    learnBannerTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.bgCard,
    },
    learnBannerSub: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
    },

    // ── Watchlist ──
    watchlistHeader: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    watchlistTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
    },

    // ── News Section ──
    newsSectionHeader: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 4,
    },
    newsSectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
    },
    newsCard: {
      backgroundColor: theme.bgCard,
      borderRadius: 12,
      marginHorizontal: 20,
      marginTop: 8,
      overflow: 'hidden',
      shadowColor: '#00000010',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    newsDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginHorizontal: 16,
    },

    // ── AI Analyze Button ──
    aiAnalyzeBtn: {
      backgroundColor: theme.text,
      borderRadius: 16,
      marginHorizontal: 20,
      marginTop: 8,
      height: 52,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    aiAnalyzeBtnText: {
      color: theme.bgCard,
      fontWeight: '700',
      fontSize: 15,
    },

    // ── Mission Banner ──
    missionBanner: {
      backgroundColor: theme.bgCard,
      borderRadius: 20,
      marginHorizontal: 20,
      marginTop: 8,
      padding: 16,
      shadowColor: '#00000010',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    missionBannerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    missionBannerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    missionBannerLink: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    missionBarBg: {
      height: 8,
      backgroundColor: theme.border,
      borderRadius: 4,
      marginBottom: 8,
    },
    missionBarFill: {
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.primary,
    },
    missionBannerSub: {
      color: theme.textSecondary,
      fontSize: 13,
    },

    // ── Reward Hint ──
    rewardHint: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 4,
      paddingHorizontal: 20,
    },
    eventBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 20,
      marginTop: 8,
      backgroundColor: '#FF9500',
      borderRadius: 16,
      padding: 16,
    },
    eventBannerEmoji: {
      fontSize: 24,
      marginRight: 12,
    },
    eventBannerTitle: {
      color: theme.bgCard,
      fontWeight: '700',
      fontSize: 15,
    },
    eventBannerSub: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 13,
      marginTop: 2,
    },

    // ── Market Status ──
    marketStatusRow: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 10,
      gap: 10,
      backgroundColor: theme.bg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    marketStatusCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.bgCard,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
      shadowColor: '#00000010',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 1,
    },
    marketStatusFlag: {
      fontSize: 20,
    },
    marketStatusInfo: {
      flex: 1,
    },
    marketStatusName: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
    },
    marketStatusHours: {
      fontSize: 10,
      color: theme.textSecondary,
      marginTop: 1,
    },
    marketStatusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    marketStatusLabel: {
      fontSize: 12,
      fontWeight: '700',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── 상단 탭바 ── */}
      <View style={styles.header}>
        <View style={styles.headerTabs}>
          {(['보유', '관심'] as TopTab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={styles.headerTabBtn}
              onPress={() => setTopTab(t)}
              activeOpacity={0.7}
            >
              <Text style={[styles.headerTabText, topTab === t && styles.headerTabTextActive]}>
                {t}
              </Text>
              {topTab === t && <View style={styles.headerTabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.getParent()?.navigate('투자Tab', { screen: '종목검색' })}
          >
            <Ionicons name="search-outline" size={22} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('알림')}
          >
            <Ionicons name="notifications-outline" size={22} color={theme.text} />
            {unreadCount > 0 && (
              <View style={{
                position: 'absolute',
                top: 2,
                right: 2,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: theme.red,
                paddingHorizontal: 4,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <MarketStatus />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {topTab === '보유' ? (
          <>
            {/* ── 계좌 카드 ── */}
            <View style={styles.accountCard}>
              {/* 닉네임 + 투자 유형 배지 */}
              <View style={styles.accountTopRow}>
                <Text style={styles.accountNickname}>{nickname}님의 계좌</Text>
                {investmentType && (
                  <View style={styles.investTypeBadge}>
                    <Text style={styles.investTypeBadgeText}>
                      {investmentType.emoji} {investmentType.name}
                    </Text>
                  </View>
                )}
              </View>

              {/* 총 자산 */}
              <Text style={styles.totalAssetLabel}>총 자산</Text>
              <Text style={styles.totalAssetValue}>
                {Math.round(totalValue).toLocaleString()}원
              </Text>

              {/* 수익금 + 수익률 */}
              <View style={styles.profitRow}>
                <Text style={[styles.profitAmt, { color: isUp ? theme.red : theme.blue }]}>
                  {isUp ? '+' : ''}{Math.round(profit).toLocaleString()}원
                </Text>
                <View style={[
                  styles.profitRateBadge,
                  { backgroundColor: isUp ? Colors.greenBg : Colors.redBg },
                ]}>
                  <Text style={[styles.profitRateText, { color: isUp ? theme.red : theme.blue }]}>
                    {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{profitRate.toFixed(2)}%
                  </Text>
                </View>
              </View>

              {/* 액션 버튼 3개 */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('자산상세')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionBtnEmoji}>📊</Text>
                  <Text style={styles.actionBtnText}>총자산</Text>
                </TouchableOpacity>
                <View style={styles.actionBtnDivider} />
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('보상내역')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionBtnEmoji}>🎁</Text>
                  <Text style={styles.actionBtnText}>보상내역</Text>
                </TouchableOpacity>
                <View style={styles.actionBtnDivider} />
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('거래내역')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionBtnEmoji}>🔄</Text>
                  <Text style={styles.actionBtnText}>거래내역</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── 잔고 카드 ── */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>주문가능금액</Text>
                  <Text style={styles.balancePrimaryValue}>
                    {Math.round(balance).toLocaleString()}원
                  </Text>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>투자중 금액</Text>
                  <Text style={styles.balanceValue}>
                    {Math.round(portfolioValue).toLocaleString()}원
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.rewardHint}>
              💡 학습을 완료하면 가상 자산이 늘어나요!
            </Text>

            {/* ── 전체/국내/미국 보유 종목 탭 ── */}
            <View style={styles.stockTabRow}>
              {(['전체', '국내', '미국'] as StockTab[]).map(tab => {
                const krCount = safeHoldings.filter(h => {
                  const st = STOCKS.find(s => s.ticker === h.ticker);
                  return st?.market === '한국';
                }).length;
                const usCount = safeHoldings.length - krCount;
                const count = tab === '전체' ? safeHoldings.length : tab === '국내' ? krCount : usCount;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={styles.stockTabBtn}
                    onPress={() => setStockTab(tab)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.stockTabText,
                      stockTab === tab && styles.stockTabTextActive,
                    ]}>
                      {tab === '국내' ? '🇰🇷 국내' : tab === '미국' ? '🇺🇸 미국' : '전체'}
                      {count > 0 ? ` ${count}` : ''}
                    </Text>
                    {stockTab === tab && <View style={styles.stockTabUnderline} />}
                  </TouchableOpacity>
                );
              })}
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                onPress={() => navigation.getParent()?.navigate('투자Tab')}
                activeOpacity={0.7}
              >
                <Text style={{ color: theme.primary, fontSize: 13 }}>투자탭 →</Text>
              </TouchableOpacity>
            </View>

            {/* ── 평가금/수익금/수익률 summary ── */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>평가금</Text>
                <Text style={styles.summaryValue}>
                  {Math.round(summaryEval).toLocaleString()}원
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>수익금</Text>
                <Text style={[styles.summaryValue, { color: summaryUp ? theme.red : theme.blue }]}>
                  {summaryUp ? '+' : ''}{Math.round(summaryPnl).toLocaleString()}원
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>수익률</Text>
                <Text style={[styles.summaryValue, { color: summaryUp ? theme.red : theme.blue }]}>
                  {summaryUp ? '+' : ''}{summaryRate.toFixed(2)}%
                </Text>
              </View>
            </View>

            {/* ── 정렬 ── */}
            <View style={styles.sortRow}>
              <Text style={styles.sortCount}>보유 {sortedHoldings.length}종목</Text>
              <View style={styles.sortBtns}>
                {([
                  { key: 'value' as SortType, label: '평가금액순' },
                  { key: 'return' as SortType, label: '수익률순' },
                ]).map(s => (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.sortBtn, sortType === s.key && styles.sortBtnActive]}
                    onPress={() => setSortType(s.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.sortBtnText, sortType === s.key && styles.sortBtnTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── 보유 종목 리스트 ── */}
            {sortedHoldings.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>📈</Text>
                <Text style={styles.emptyTitle}>
                  보유 종목이 없어요{'\n'}첫 투자를 시작해보세요!
                </Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => navigation.getParent()?.navigate('투자Tab')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyBtnText}>첫 투자하러 가기</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.holdingCard}>
                {sortedHoldings.map((h, i) => {
                  const hUp = h.pnlRate >= 0;
                  return (
                    <TouchableOpacity
                      key={h.ticker}
                      style={[
                        styles.holdingRow,
                        i < sortedHoldings.length - 1 && styles.holdingBorder,
                      ]}
                      onPress={() => {
                        const pd = portfolioPrices[h.ticker];
                        navigation.getParent()?.navigate('투자Tab', {
                          screen: '종목상세', params: {
                            ticker: h.ticker,
                            price: pd?.price,
                            change: pd?.change,
                            changeAmount: pd?.changeAmount,
                            high: pd?.high,
                            low: pd?.low,
                            open: pd?.open,
                            volume: pd?.volume,
                            previousClose: pd?.previousClose,
                            week52High: pd?.week52High,
                            week52Low: pd?.week52Low,
                            per: pd?.per,
                            pbr: pd?.pbr,
                            marketState: pd?.marketState,
                          },
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <StockLogo ticker={h.ticker} size={44} />
                      <View style={styles.holdingMeta}>
                        <Text style={styles.holdingName}>{h.stock.name}</Text>
                        <Text style={styles.holdingQty}>{h.qty.toLocaleString()}주</Text>
                      </View>
                      <View style={styles.holdingAmts}>
                        <Text style={styles.holdingEval}>
                          {h.stock.krw
                            ? `${Math.round(h.evalAmt).toLocaleString()}원`
                            : `$${h.evalAmt.toFixed(2)}`}
                        </Text>
                        <Text style={[styles.holdingPnl, { color: hUp ? theme.red : theme.blue }]}>
                          {hUp ? '+' : ''}
                          {h.stock.krw
                            ? `${Math.round(h.pnlAmt).toLocaleString()}원`
                            : `$${h.pnlAmt.toFixed(2)}`}
                          {'  '}{hUp ? '+' : ''}{h.pnlRate.toFixed(2)}%
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* ── AI 포트폴리오 분석 버튼 ── */}
            <TouchableOpacity
              style={styles.aiAnalyzeBtn}
              onPress={() => navigation.navigate('AI분석')}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 20, marginRight: 8 }}>🤖</Text>
              <Text style={styles.aiAnalyzeBtnText}>AI 포트폴리오 분석받기</Text>
            </TouchableOpacity>

            {/* ── 데일리 미션 배너 ── */}
            {missionData.total > 0 && (
              <TouchableOpacity
                style={styles.missionBanner}
                onPress={() => navigation.navigate('데일리미션')}
                activeOpacity={0.85}
              >
                <View style={styles.missionBannerTop}>
                  <Text style={styles.missionBannerTitle}>오늘의 미션</Text>
                  <Text style={styles.missionBannerLink}>자세히 보기</Text>
                </View>
                <View style={styles.missionBarBg}>
                  <View style={[
                    styles.missionBarFill,
                    { width: `${missionData.total > 0 ? (missionData.completed / missionData.total) * 100 : 0}%` },
                  ]} />
                </View>
                <Text style={styles.missionBannerSub}>
                  {missionData.completed}/{missionData.total} 완료 · 최대 +{missionData.maxReward.toLocaleString()}원
                </Text>
              </TouchableOpacity>
            )}

            {renderNoticeBanner()}
            {renderLearnBanner()}
            {renderEventBanner()}

            {/* ── 오늘의 뉴스 ── */}
            <View style={styles.newsSectionHeader}>
              <Text style={styles.newsSectionTitle}>오늘의 뉴스</Text>
            </View>
            {newsLoading ? (
              <View style={{ alignItems: 'center', marginTop: 12 }}>
                <ActivityIndicator color={theme.primary} />
                <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 8 }}>뉴스를 불러오는 중...</Text>
              </View>
            ) : news.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Text style={{ fontSize: 36 }}>📰</Text>
                <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 8 }}>뉴스를 불러올 수 없어요</Text>
              </View>
            ) : (
              <View style={styles.newsCard}>
                {news.map((item, i) => (
                  <React.Fragment key={item.id}>
                    <NewsCard item={item} />
                    {i < news.length - 1 && <View style={styles.newsDivider} />}
                  </React.Fragment>
                ))}
              </View>
            )}
          </>
        ) : (
          /* ── 관심 탭 ── */
          <>
            <View style={styles.watchlistHeader}>
              <Text style={styles.watchlistTitle}>관심 종목 {watchlistStocks.length}</Text>
            </View>
            {watchlistStocks.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🤍</Text>
                <Text style={styles.emptyTitle}>
                  관심 종목이 없어요{'\n'}투자 탭에서 하트를 눌러 추가해보세요!
                </Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => navigation.getParent()?.navigate('투자Tab')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyBtnText}>종목 둘러보기</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.holdingCard}>
                {watchlistStocks.map((s: any, i: number) => {
                  const isKR = s.isKR ?? (s.ticker?.length === 6 && /^\d+$/.test(s.ticker));
                  const priceData = wishlistPrices[s.ticker];
                  const displayPrice = priceData?.price ?? 0;
                  const displayChange = priceData?.change ?? 0;
                  const sUp = displayChange >= 0;
                  const holding = safeHoldings.find(h => h.ticker === s.ticker);
                  return (
                    <TouchableOpacity
                      key={s.ticker}
                      style={[
                        styles.holdingRow,
                        i < watchlistStocks.length - 1 && styles.holdingBorder,
                      ]}
                      onPress={() => {
                        const pd = wishlistPrices[s.ticker];
                        navigation.getParent()?.navigate('투자Tab', {
                          screen: '종목상세', params: {
                            ticker: s.ticker,
                            price: pd?.price,
                            change: pd?.change,
                            changeAmount: pd?.changeAmount,
                            high: pd?.high,
                            low: pd?.low,
                            open: pd?.open,
                            volume: pd?.volume,
                            previousClose: pd?.previousClose,
                            week52High: pd?.week52High,
                            week52Low: pd?.week52Low,
                            per: pd?.per,
                            pbr: pd?.pbr,
                            marketState: pd?.marketState,
                          },
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <StockLogo ticker={s.ticker} size={44} />
                      <View style={styles.holdingMeta}>
                        <Text style={styles.holdingName}>{s.name}</Text>
                        <Text style={styles.holdingQty}>
                          {s.ticker}{holding ? ` · ${holding.qty}주 보유` : ''}
                        </Text>
                      </View>
                      <View style={styles.holdingAmts}>
                        {displayPrice > 0 ? (
                          <>
                            <Text style={styles.holdingEval}>
                              {isKR ? `₩${Math.round(displayPrice).toLocaleString()}` : `$${displayPrice.toFixed(2)}`}
                            </Text>
                            <Text style={[styles.holdingPnl, { color: sUp ? theme.red : theme.blue }]}>
                              {sUp ? '+' : ''}{displayChange.toFixed(2)}%
                            </Text>
                          </>
                        ) : (
                          <ActivityIndicator size="small" color={theme.textSecondary} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {renderNoticeBanner()}
            {renderLearnBanner()}
            {renderEventBanner()}
          </>
        )}
      </ScrollView>

      {/* ── 투자 안내 모달 ── */}
      {showGuide && (
        <Modal visible={showGuide} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowGuide(false)} />
            <View style={{
              backgroundColor: theme.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: 24, maxHeight: '80%',
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>
                  모의투자 가이드
                </Text>
                <TouchableOpacity onPress={() => setShowGuide(false)}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {[
                  { emoji: '💡', title: 'FLOCO란?', content: '실제 돈을 사용하지 않고 가상의 자산으로 주식 투자를 경험할 수 있는 모의투자 앱이에요.' },
                  { emoji: '💰', title: '초기 자산', content: '처음 가입하면 1,000,000원의 가상 자산이 지급돼요. 학습을 완료하면 추가 보상을 받을 수 있어요.' },
                  { emoji: '📈', title: '실시간 주가', content: 'Yahoo Finance API를 통해 실제 주식 시장의 실시간 가격으로 거래할 수 있어요.' },
                  { emoji: '💸', title: '수수료 안내', content: '매수 시 0.1%, 매도 시 0.1%의 수수료가 부과돼요. 실제 증권사와 유사한 환경이에요.' },
                  { emoji: '🇺🇸', title: '미국 주식 소수점', content: '미국 주식은 소수점 단위로 매수할 수 있어요. 예: Apple 0.5주 매수 가능' },
                  { emoji: '🏆', title: '랭킹', content: '수익률 기준으로 다른 사용자와 경쟁해요. 실시간으로 랭킹이 갱신돼요.' },
                  { emoji: '🎓', title: '학습 보상', content: '학습 탭에서 레슨을 완료하면 가상 자산 보상을 받아요.' },
                  { emoji: '⚠️', title: '주의사항', content: 'FLOCO는 교육 목적의 모의투자 앱이에요. 실제 투자 결과와 다를 수 있으며, 실제 투자 권유가 아니에요.' },
                ].map((item, i) => (
                  <View key={i} style={{ flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 28, marginRight: 12, marginTop: 2 }}>{item.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 15, color: theme.text, marginBottom: 4 }}>{item.title}</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 20 }}>{item.content}</Text>
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => setShowGuide(false)}
                  style={{
                    backgroundColor: theme.primary, borderRadius: 16, height: 52,
                    justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 16,
                  }}
                >
                  <Text style={{ color: theme.bgCard, fontWeight: 'bold', fontSize: 16 }}>확인했어요!</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

    </SafeAreaView>
  );
}

