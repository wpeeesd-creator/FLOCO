/**
 * AI 포트폴리오 분석 화면
 * 보유 종목 기반 섹터/국가 분석 + Claude API AI 분석
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useAppStore, STOCKS } from '../store/appStore';
import { Colors } from '../components/ui';
import { fetchWithTimeout, classifyError } from '../lib/errorHandler';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { fetchMultiplePrices } from '../utils/priceService';

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

const SECTOR_COLORS = ['#0066FF', '#34C759', '#FF9500', '#FF2D55', '#5856D6', '#FF3B30', '#AF52DE', '#007AFF'];

interface SectorEntry {
  sector: string;
  value: number;
  percent: string;
}

interface AnalysisData {
  totalPortfolioValue: number;
  cashRatio: string;
  investRatio: string;
  sectorBreakdown: SectorEntry[];
  krRatio: string;
  usRatio: string;
  stockCount: number;
  maxConcentration: string;
}

export default function PortfolioAIScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { holdings, cash } = useAppStore();

  const { isConnected } = useNetworkStatus();
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [portfolioPrices, setPortfolioPrices] = useState<Record<string, any>>({});
  const [userData, setUserData] = useState<any>(null);

  const pct = (v: string) => `${v}%` as unknown as number; // DimensionValue cast for RN

  // Firestore 사용자 데이터
  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.id), (snap) => {
      if (snap.exists()) setUserData(snap.data());
    });
    return () => unsubscribe();
  }, [user?.id]);

  const portfolio = userData?.portfolio ?? [];

  // 보유 종목 실시간 가격
  useEffect(() => {
    if (portfolio.length === 0) return;
    const tickers = portfolio.map((s: any) => ({
      ticker: s.ticker,
      isKR: s.ticker.length === 6 && /^\d+$/.test(s.ticker),
    }));
    fetchMultiplePrices(tickers).then(setPortfolioPrices).catch(() => {});
  }, [portfolio.length]);

  const safeHoldings = holdings ?? [];
  const balance = userData?.balance ?? cash ?? 1_000_000;
  const initialBalance = userData?.initialBalance ?? 1_000_000;

  // 포트폴리오 평가액 계산 (실시간 가격 우선)
  const holdingsWithStock = safeHoldings.map((h) => {
    const stock = STOCKS.find((s) => s.ticker === h.ticker);
    if (!stock) return null;
    const livePrice = portfolioPrices[h.ticker]?.price ?? stock.price ?? 0;
    return { ...h, stock: { ...stock, price: livePrice } };
  }).filter(Boolean) as Array<{ ticker: string; qty: number; avgPrice: number; stock: typeof STOCKS[0] }>;

  const totalPortfolioValue = holdingsWithStock.reduce((sum, h) => sum + (h.stock.price ?? 0) * (h.qty ?? 0), 0);
  const totalAsset = balance + totalPortfolioValue;
  const profit = totalAsset - initialBalance;
  const profitRate = ((profit / initialBalance) * 100).toFixed(2);
  const isUp = profit >= 0;

  const calculateAnalysis = (): AnalysisData => {
    // 섹터 비중
    const sectorMap: Record<string, number> = {};
    holdingsWithStock.forEach((h) => {
      const sector = h.stock.sector ?? '기타';
      sectorMap[sector] = (sectorMap[sector] ?? 0) + (h.stock.price ?? 0) * (h.qty ?? 0);
    });

    const sectorBreakdown = Object.entries(sectorMap)
      .map(([sector, value]) => ({
        sector,
        value,
        percent: totalPortfolioValue > 0 ? ((value / totalPortfolioValue) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.value - a.value);

    // 국내/미국 비중
    const krValue = holdingsWithStock
      .filter((h) => h.stock.market === '한국')
      .reduce((sum, h) => sum + (h.stock.price ?? 0) * (h.qty ?? 0), 0);
    const usValue = holdingsWithStock
      .filter((h) => h.stock.market === '미국')
      .reduce((sum, h) => sum + (h.stock.price ?? 0) * (h.qty ?? 0), 0);

    // 최대 집중도
    const maxConc = holdingsWithStock.length > 0 && totalPortfolioValue > 0
      ? Math.max(...holdingsWithStock.map((h) => ((h.stock.price ?? 0) * (h.qty ?? 0)) / totalPortfolioValue * 100)).toFixed(1)
      : '0';

    return {
      totalPortfolioValue,
      cashRatio: totalAsset > 0 ? ((balance / totalAsset) * 100).toFixed(1) : '100',
      investRatio: totalAsset > 0 ? ((totalPortfolioValue / totalAsset) * 100).toFixed(1) : '0',
      sectorBreakdown,
      krRatio: totalPortfolioValue > 0 ? ((krValue / totalPortfolioValue) * 100).toFixed(1) : '0',
      usRatio: totalPortfolioValue > 0 ? ((usValue / totalPortfolioValue) * 100).toFixed(1) : '0',
      stockCount: holdingsWithStock.length,
      maxConcentration: maxConc,
    };
  };

  const runAIAnalysis = async () => {
    if (holdingsWithStock.length === 0) {
      Alert.alert('알림', '보유 종목이 없어요!\n먼저 주식을 매수해보세요!');
      return;
    }
    if (!isConnected) {
      Alert.alert('오프라인', '인터넷 연결이 끊겨 있어요.\n연결 후 다시 시도해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const data = calculateAnalysis();
      setAnalysisData(data);

      const portfolioSummary = holdingsWithStock.map((h) =>
        `${h.stock.name}(${h.ticker}): ${h.qty}주, 평균단가 ${Math.round(h.avgPrice).toLocaleString()}원, 현재가 ${Math.round(h.stock.price).toLocaleString()}원`,
      ).join('\n');

      const prompt = `나는 청소년 모의투자 앱 FLOCO를 사용하는 학생 투자자입니다.

현재 포트폴리오:
${portfolioSummary}

투자 현황:
- 총 자산: ${Math.round(totalAsset).toLocaleString()}원
- 현금 비율: ${data.cashRatio}%
- 투자 비율: ${data.investRatio}%
- 수익률: ${profitRate}%
- 보유 종목 수: ${data.stockCount}개
- 최대 집중 비중: ${data.maxConcentration}%
- 국내주식: ${data.krRatio}% / 미국주식: ${data.usRatio}%
- 섹터: ${data.sectorBreakdown.map((s) => `${s.sector} ${s.percent}%`).join(', ')}

위 포트폴리오를 아래 형식으로 분석해줘:

1. 전체 평가 (한 줄)
2. 잘한 점 2가지
3. 개선할 점 2가지
4. 구체적인 추천 행동 2가지

친근하고 쉬운 말로, 청소년이 이해할 수 있게 설명해줘.
이모지를 적절히 사용해줘.
각 항목은 줄바꿈으로 구분해줘.`;

      if (!API_KEY) {
        setAnalysis('API 키가 설정되지 않았어요. EAS 빌드 환경에서 EXPO_PUBLIC_ANTHROPIC_API_KEY를 설정해주세요.');
        return;
      }

      const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      }, 30000);

      if (!response.ok) {
        const httpErr = classifyError(new Error(`API 오류: ${response.status}`));
        Alert.alert('오류', httpErr.message);
        return;
      }

      const result = await response.json();
      const aiText = result?.content?.[0]?.text ?? '분석을 불러오지 못했어요. 잠시 후 다시 시도해주세요.';
      setAnalysis(aiText);
    } catch (error) {
      console.error('AI 분석 오류:', error);
      const appError = classifyError(error);
      Alert.alert('오류', appError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI 포트폴리오 분석</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView>
        {/* 포트폴리오 요약 카드 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>내 포트폴리오</Text>
          <Text style={styles.summaryValue}>{Math.round(totalAsset).toLocaleString()}원</Text>
          <Text style={[styles.summaryProfit, { color: isUp ? '#34C759' : '#FF3B30' }]}>
            {isUp ? '+' : ''}{Math.round(profit).toLocaleString()}원 ({isUp ? '+' : ''}{profitRate}%)
          </Text>

          {analysisData && (
            <View style={styles.ratioBar}>
              <View style={styles.ratioLabels}>
                <Text style={styles.ratioLabel}>현금 {analysisData.cashRatio}%</Text>
                <Text style={styles.ratioLabel}>투자 {analysisData.investRatio}%</Text>
              </View>
              <View style={styles.ratioBarBg}>
                <View style={[styles.ratioBarFill, { width: pct(analysisData.investRatio) }]} />
              </View>
            </View>
          )}
        </View>

        {/* 섹터 분석 */}
        {analysisData && analysisData.sectorBreakdown.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>섹터 분포</Text>
            {analysisData.sectorBreakdown.map((s, i) => (
              <View key={s.sector} style={styles.sectorRow}>
                <View style={styles.sectorLabelRow}>
                  <Text style={styles.sectorName}>{s.sector}</Text>
                  <Text style={[styles.sectorPct, { color: SECTOR_COLORS[i % SECTOR_COLORS.length] }]}>{s.percent}%</Text>
                </View>
                <View style={styles.sectorBarBg}>
                  <View style={[styles.sectorBarFill, { width: pct(s.percent), backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length] }]} />
                </View>
              </View>
            ))}

            {/* 국내/미국 비율 */}
            <View style={styles.countryRow}>
              <View style={[styles.countryBox, { backgroundColor: '#F0F4FF' }]}>
                <Text style={styles.countryFlag}>🇰🇷</Text>
                <Text style={[styles.countryPct, { color: Colors.primary }]}>{analysisData.krRatio}%</Text>
                <Text style={styles.countryLabel}>국내</Text>
              </View>
              <View style={[styles.countryBox, { backgroundColor: '#FFF8F0' }]}>
                <Text style={styles.countryFlag}>🇺🇸</Text>
                <Text style={[styles.countryPct, { color: '#FF9500' }]}>{analysisData.usRatio}%</Text>
                <Text style={styles.countryLabel}>미국</Text>
              </View>
            </View>
          </View>
        )}

        {/* AI 분석 결과 or CTA */}
        {analysis ? (
          <View style={styles.card}>
            <View style={styles.aiHeader}>
              <Text style={styles.aiEmoji}>🤖</Text>
              <Text style={styles.cardTitle}>AI 분석 결과</Text>
            </View>
            <Text style={styles.aiText}>{analysis}</Text>
            <TouchableOpacity onPress={runAIAnalysis} style={styles.reAnalyzeBtn} activeOpacity={0.85}>
              <Text style={styles.reAnalyzeBtnText}>다시 분석하기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, styles.ctaCard]}>
            <Text style={styles.ctaEmoji}>🤖</Text>
            <Text style={styles.ctaTitle}>AI가 내 포트폴리오를 분석해드려요!</Text>
            <Text style={styles.ctaDesc}>잘한 점, 개선할 점, 추천 행동을{'\n'}쉽게 설명해드려요</Text>
            <TouchableOpacity
              onPress={runAIAnalysis}
              disabled={isLoading}
              style={styles.analyzeBtn}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.analyzeBtnText}>AI 분석 중...</Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 20, marginRight: 8 }}>🤖</Text>
                  <Text style={styles.analyzeBtnText}>AI 분석 시작하기</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 보유 종목 없을 때 */}
        {holdingsWithStock.length === 0 && (
          <View style={[styles.card, styles.ctaCard]}>
            <Text style={styles.ctaEmoji}>📭</Text>
            <Text style={styles.ctaDesc}>보유 종목이 없어요{'\n'}주식을 매수하고 분석받아보세요!</Text>
            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate('투자Tab')}
              style={[styles.analyzeBtn, { backgroundColor: Colors.primary }]}
              activeOpacity={0.85}
            >
              <Text style={styles.analyzeBtnText}>투자하러 가기</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },

  // Summary
  summaryCard: { backgroundColor: '#191F28', margin: 16, borderRadius: 20, padding: 20 },
  summaryLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 4 },
  summaryValue: { color: '#FFFFFF', fontSize: 28, fontWeight: '700' },
  summaryProfit: { fontSize: 16, marginTop: 4 },
  ratioBar: { marginTop: 16 },
  ratioLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  ratioLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  ratioBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  ratioBarFill: { height: 8, backgroundColor: Colors.primary, borderRadius: 4 },

  // Card
  card: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 12, borderRadius: 20, padding: 20 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 16 },

  // Sector
  sectorRow: { marginBottom: 12 },
  sectorLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sectorName: { color: Colors.text, fontSize: 14 },
  sectorPct: { fontWeight: '700', fontSize: 14 },
  sectorBarBg: { height: 6, backgroundColor: Colors.bg, borderRadius: 3 },
  sectorBarFill: { height: 6, borderRadius: 3 },
  countryRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  countryBox: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  countryFlag: { fontSize: 20 },
  countryPct: { fontWeight: '700', marginTop: 4 },
  countryLabel: { color: Colors.textSub, fontSize: 12 },

  // AI
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  aiEmoji: { fontSize: 24, marginRight: 8 },
  aiText: { fontSize: 15, color: Colors.text, lineHeight: 26 },
  reAnalyzeBtn: { marginTop: 16, backgroundColor: Colors.bg, borderRadius: 12, height: 44, justifyContent: 'center', alignItems: 'center' },
  reAnalyzeBtnText: { color: Colors.textSub, fontWeight: '700' },

  // CTA
  ctaCard: { alignItems: 'center' },
  ctaEmoji: { fontSize: 48, marginBottom: 16 },
  ctaTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  ctaDesc: { color: Colors.textSub, textAlign: 'center', fontSize: 14, lineHeight: 22, marginBottom: 20 },
  analyzeBtn: {
    backgroundColor: '#191F28', borderRadius: 16, height: 52,
    width: '100%', justifyContent: 'center', alignItems: 'center', flexDirection: 'row',
  },
  analyzeBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, marginLeft: 4 },
});
