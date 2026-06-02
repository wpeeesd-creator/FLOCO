/**
 * MBTI 투자유형 분석 결과 화면 (리뉴얼)
 * ① 풀스크린 유형 카드 (페이드인) → ② 스크롤 상세분석
 * ③ 유명 투자자 포트폴리오 → ④ 추천 종목 → ⑤ 보유종목 궁합
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { Text } from '../components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, updateDoc } from 'firebase/firestore';
import Svg, { Circle } from 'react-native-svg';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/ui';
import StockLogo from '../components/StockLogo';
import { useTheme } from '../context/ThemeContext';
import {
  MBTI_MAP, INVEST_TYPES, getInvestorsForType, getStockCompatibility,
  type InvestorProfile, type InvestTypeInfo,
} from '../data/investorProfiles';
import { useAppStore, STOCKS } from '../store/appStore';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── 도넛차트 ─────────────────────────────────────
const DONUT_COLORS = ['#FF3B30', '#FF9500', '#34C759', '#3478F6', '#5856D6', '#AF52DE', '#FF2D55'];

function DonutChart({ data, size = 120 }: { data: Array<{ weight: number; ticker: string }>; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const totalWeight = data.reduce((s, d) => s + d.weight, 0);
  let accumulated = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {data.map((item, i) => {
          const pct = item.weight / totalWeight;
          const strokeDasharray = `${circumference * pct} ${circumference * (1 - pct)}`;
          const rotation = (accumulated / totalWeight) * 360 - 90;
          accumulated += item.weight;
          return (
            <Circle
              key={item.ticker}
              cx={center} cy={center} r={radius}
              fill="none" stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
              strokeWidth={14} strokeDasharray={strokeDasharray}
              strokeLinecap="butt"
              transform={`rotate(${rotation} ${center} ${center})`}
            />
          );
        })}
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.text }}>TOP 5</Text>
      </View>
    </View>
  );
}

// ── 컴포넌트 ──────────────────────────────────────
export default function SurveyResultScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { cash, holdings } = useAppStore();

  const mode: 'quick' | 'deep' = route.params?.mode ?? 'quick';
  const mbti: string = route.params?.mbti ?? 'INTJ';
  const investType: string = route.params?.investType ?? 'value';
  const deepScores: Record<string, number> | undefined = route.params?.scores;

  const mapping = MBTI_MAP[mbti] ?? MBTI_MAP.INTJ;
  const typeInfo = INVEST_TYPES[investType] ?? INVEST_TYPES.value;
  const investors = getInvestorsForType(investType);
  const isDeep = mode === 'deep';

  // 애니메이션
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.9)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  const [expandedInvestor, setExpandedInvestor] = useState<string | null>(null);
  const [followModal, setFollowModal] = useState<InvestorProfile | null>(null);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(heroScale, { toValue: 1, friction: 8, useNativeDriver: true }),
      ]),
      Animated.timing(contentFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  // Firestore 저장
  useEffect(() => {
    if (!user?.id) return;
    updateDoc(doc(db, 'users', user.id), {
      investmentType: {
        type: investType, mbti: `${mbti}형 투자자`,
        emoji: mapping.animal, title: typeInfo.title,
        subtitle: typeInfo.subtitle, color: typeInfo.color,
        keywords: mapping.keywords,
        analyzedAt: new Date().toISOString(),
      },
      surveyCompleted: true,
    }).catch((e) => console.error('투자유형 저장 오류:', e));
  }, [user?.id]);

  // 보유종목 궁합
  const safeHoldings = holdings ?? [];
  const holdingsCompat = safeHoldings.map(h => {
    const stock = STOCKS.find(st => st.ticker === h.ticker);
    if (!stock) return null;
    const score = getStockCompatibility(h.ticker, investType, stock.sector);
    return { ticker: h.ticker, name: stock.name, score, logo: stock.logo };
  }).filter(Boolean).sort((a: any, b: any) => b.score - a.score);

  const navigateToStock = (ticker: string) => {
    // ProfileStack 내부에서 push — 뒤로가기 시 SurveyResult로 자연 복귀
    navigation.navigate('종목상세', { ticker });
  };

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    scroll: { flex: 1 },

    // ① 히어로 카드
    heroGradient: { minHeight: SCREEN_H * 0.55, justifyContent: 'center', alignItems: 'center', paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24 },
    backBtn: { position: 'absolute', top: 16, left: 16, padding: 8 },
    heroAnimal: { fontSize: 80 },
    heroName: { fontSize: 36, fontWeight: '900', color: '#fff', marginTop: 16, textAlign: 'center' },
    heroType: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    heroIcon: { marginTop: 20, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 10 },
    heroIconText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    heroMbti: { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
    heroMbtiText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    scrollHint: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 24 },

    // ② 상세 분석
    card: { backgroundColor: theme.bgCard, marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 20 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 14 },
    keywordRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    keywordBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
    keywordText: { fontWeight: '700', fontSize: 13 },
    descText: { fontSize: 14, color: Colors.text, lineHeight: 22, marginBottom: 12 },
    labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    labelDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    labelText: { fontSize: 14, color: Colors.text, lineHeight: 22, flex: 1 },

    // ③ 투자자
    investorCard: { backgroundColor: theme.bgCard, marginHorizontal: 16, marginTop: 12, borderRadius: 20, overflow: 'hidden' },
    investorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    investorName: { fontSize: 15, fontWeight: '700', color: Colors.text },
    investorStyle: { fontSize: 12, color: Colors.textSub, marginTop: 2 },
    investorReturn: { fontSize: 12, fontWeight: '600', textAlign: 'right' },
    investorQuote: { fontSize: 11, color: Colors.textSub, fontStyle: 'italic', marginTop: 2, textAlign: 'right' },
    portfolioWrap: { paddingHorizontal: 16, paddingBottom: 16 },
    donutRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    legendWrap: { flex: 1, marginLeft: 16, gap: 4 },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
    legendTicker: { fontSize: 12, fontWeight: '700', color: Colors.text, width: 42 },
    legendDesc: { fontSize: 11, color: Colors.textSub, flex: 1 },
    legendPct: { fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },
    followBtn: { marginHorizontal: 16, marginTop: 8, marginBottom: 16, borderRadius: 12, height: 44, justifyContent: 'center', alignItems: 'center' },
    followBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    // ④ 추천 종목
    stockGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    stockChip: { width: '47%' as any, borderRadius: 16, padding: 14, borderWidth: 1 },
    stockTicker: { fontSize: 14, fontWeight: '800' },
    stockReason: { fontSize: 11, color: Colors.textSub, marginTop: 2 },

    // ⑤ 궁합
    compatRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.bg },
    compatName: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
    compatScore: { fontSize: 14, fontWeight: '800', marginLeft: 8 },

    // 모달
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: theme.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' as any },
    modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 4 },
    modalSub: { fontSize: 13, color: Colors.textSub, marginBottom: 16 },
    modalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.bg },
    modalTicker: { fontSize: 14, fontWeight: '700' },
    modalAmt: { fontSize: 14, fontWeight: '600', color: Colors.text },

    // 버튼
    btnWrap: { marginHorizontal: 16, marginTop: 20, gap: 12, marginBottom: 40 },
    primaryBtn: { borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center' },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    ghostBtn: { backgroundColor: theme.bg, borderRadius: 16, height: 48, justifyContent: 'center', alignItems: 'center' },
    ghostBtnText: { color: Colors.textSub, fontSize: 15 },
  });

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ① 풀스크린 히어로 카드 */}
        <Animated.View style={{ opacity: heroFade, transform: [{ scale: heroScale }] }}>
          <LinearGradient colors={[...typeInfo.gradient]} style={s.heroGradient}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Text style={{ color: '#fff', fontSize: 22 }}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={s.heroAnimal}>{mapping.animal}</Text>
            <Text style={s.heroName}>{mapping.name}</Text>
            <Text style={s.heroType}>{typeInfo.title}</Text>
            <View style={s.heroIcon}>
              <Text style={s.heroIconText}>{mapping.icon}</Text>
            </View>
            <View style={s.heroMbti}>
              <Text style={s.heroMbtiText}>{mbti}형 투자자</Text>
            </View>
            {isDeep && (
              <View style={{ marginTop: 10, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>심층 분석 완료 ✓</Text>
              </View>
            )}
            <Text style={s.scrollHint}>아래로 스와이프하여 {isDeep ? '심층' : '상세'} 분석 보기 ↓</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity: contentFade }}>

          {/* DNA 점수 바 (상세 모드 전용) */}
          {isDeep && deepScores && (
            <View style={s.card}>
              <Text style={s.cardTitle}>투자 DNA 분석</Text>
              {Object.entries(deepScores)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([key, val]) => {
                  const maxScore = Math.max(...Object.values(deepScores), 1);
                  const pct = Math.round((val / maxScore) * 100);
                  const typeNames: Record<string, string> = {
                    aggressive: '공격형', growth: '성장형', balanced: '균형형', value: '가치형',
                    analytical: '분석형', trader: '트레이더', dividend: '배당형', momentum: '모멘텀',
                  };
                  return (
                    <View key={key} style={{ marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.text }}>{typeNames[key] ?? key}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: key === investType ? typeInfo.color : Colors.textSub }}>{val}점</Text>
                      </View>
                      <View style={{ height: 8, backgroundColor: theme.bg, borderRadius: 4 }}>
                        <View style={{ height: 8, borderRadius: 4, width: `${pct}%` as any, backgroundColor: key === investType ? typeInfo.color : typeInfo.color + '40' }} />
                      </View>
                    </View>
                  );
                })}
            </View>
          )}

          {/* ② 상세 분석 — DNA 키워드 */}
          <View style={s.card}>
            <Text style={s.cardTitle}>나의 투자 DNA</Text>
            <View style={s.keywordRow}>
              {mapping.keywords.map((kw) => (
                <View key={kw} style={[s.keywordBadge, { backgroundColor: typeInfo.color + '15' }]}>
                  <Text style={[s.keywordText, { color: typeInfo.color }]}>#{kw}</Text>
                </View>
              ))}
            </View>
            <Text style={s.descText}>{typeInfo.description}</Text>

            <Text style={[s.cardTitle, { marginTop: 8 }]}>강점</Text>
            {typeInfo.strengths.map((str, i) => (
              <View key={i} style={s.labelRow}>
                <View style={[s.labelDot, { backgroundColor: typeInfo.color }]} />
                <Text style={s.labelText}>{str}</Text>
              </View>
            ))}

            <Text style={[s.cardTitle, { marginTop: 12 }]}>주의할 점</Text>
            {typeInfo.weaknesses.map((w, i) => (
              <View key={i} style={s.labelRow}>
                <View style={[s.labelDot, { backgroundColor: '#FF9500' }]} />
                <Text style={s.labelText}>{w}</Text>
              </View>
            ))}

            <View style={[s.keywordBadge, { backgroundColor: typeInfo.color + '10', marginTop: 16, alignSelf: 'flex-start' }]}>
              <Text style={[s.keywordText, { color: typeInfo.color }]}>전략: {typeInfo.strategy}</Text>
            </View>
          </View>

          {/* ③ 유명 투자자 포트폴리오 */}
          <View style={[s.card, { paddingBottom: 8 }]}>
            <Text style={s.cardTitle}>나와 닮은 유명 투자자{isDeep ? '' : ' (1명)'}</Text>
          </View>

          {(isDeep ? investors : investors.slice(0, 1)).map((inv) => {
            const isOpen = expandedInvestor === inv.id;
            return (
              <View key={inv.id} style={s.investorCard}>
                <TouchableOpacity
                  style={s.investorHeader}
                  onPress={() => setExpandedInvestor(isOpen ? null : inv.id)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.investorName}>{inv.name}</Text>
                    <Text style={s.investorStyle}>{inv.style}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                    <Text style={[s.investorReturn, { color: typeInfo.color }]}>{inv.returnRate}</Text>
                    <Text style={s.investorQuote}>"{inv.quote.length > 16 ? inv.quote.slice(0, 16) + '…' : inv.quote}"</Text>
                  </View>
                </TouchableOpacity>

                {isOpen && (
                  <View style={s.portfolioWrap}>
                    <View style={s.donutRow}>
                      <DonutChart data={inv.portfolio} size={110} />
                      <View style={s.legendWrap}>
                        {inv.portfolio.map((item, i) => (
                          <TouchableOpacity key={item.ticker} style={s.legendItem} onPress={() => navigateToStock(item.ticker)} activeOpacity={0.6}>
                            <View style={[s.legendDot, { backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }]} />
                            <Text style={s.legendTicker}>{item.ticker}</Text>
                            <Text style={s.legendDesc}>{item.desc}</Text>
                            <Text style={[s.legendPct, { color: DONUT_COLORS[i % DONUT_COLORS.length] }]}>{item.weight}%</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[s.followBtn, { backgroundColor: typeInfo.color }]}
                      onPress={() => setFollowModal(inv)}
                      activeOpacity={0.85}
                    >
                      <Text style={s.followBtnText}>이 포트폴리오 따라하기</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}

          {/* ④ 추천 종목 */}
          <View style={s.card}>
            <Text style={s.cardTitle}>내 유형 추천 종목</Text>
            <View style={s.stockGrid}>
              {typeInfo.recommendedStocks.slice(0, isDeep ? 6 : 4).map((st) => (
                <TouchableOpacity
                  key={st.ticker}
                  style={[s.stockChip, { borderColor: typeInfo.color + '30', backgroundColor: typeInfo.color + '08' }]}
                  onPress={() => navigateToStock(st.ticker)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.stockTicker, { color: typeInfo.color }]}>{st.ticker}</Text>
                  <Text style={s.stockReason}>{st.reason}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ⑤ 보유종목 궁합 분석 (상세만) */}
          {isDeep && (
            <View style={s.card}>
              <Text style={s.cardTitle}>내 보유종목 궁합</Text>
              {holdingsCompat.length > 0 ? (
                holdingsCompat.slice(0, 5).map((h: any) => (
                  <TouchableOpacity key={h.ticker} style={s.compatRow} onPress={() => navigateToStock(h.ticker)} activeOpacity={0.6}>
                    <View style={{ marginRight: 10 }}>
                      <StockLogo ticker={h.ticker} size={40} />
                    </View>
                    <Text style={s.compatName}>{h.name}</Text>
                    <Text style={[s.compatScore, { color: h.score >= 80 ? typeInfo.color : h.score >= 60 ? '#FF9500' : Colors.textSub }]}>
                      {h.score}% 일치
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <TouchableOpacity
                  style={[s.primaryBtn, { backgroundColor: typeInfo.color, marginTop: 8 }]}
                  onPress={() => { try { navigation.getParent()?.navigate('투자Tab'); } catch { navigation.goBack(); } }}
                  activeOpacity={0.85}
                >
                  <Text style={s.primaryBtnText}>첫 종목을 골라보세요</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* 경고 */}
          <View style={{ backgroundColor: '#FFF8E7', marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 16, borderLeftWidth: 4, borderLeftColor: '#FF9500' }}>
            <Text style={{ fontSize: 13, color: Colors.text, lineHeight: 20 }}>{typeInfo.warning}</Text>
          </View>

          {/* 간편 모드 업그레이드 배너 */}
          {!isDeep && (
            <View style={{ backgroundColor: '#EFF6FF', marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 20 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 }}>상세 분석으로 더 알아보기</Text>
              <View style={{ gap: 4, marginBottom: 14 }}>
                <Text style={{ fontSize: 13, color: '#666' }}>간편: 투자자 1명 · 종목 4개 · 기본 결과</Text>
                <Text style={{ fontSize: 13, color: '#8B5CF6', fontWeight: '600' }}>상세: 투자자 3명 · 종목 6개 · DNA 바차트 · 궁합분석</Text>
              </View>
              <TouchableOpacity
                style={{ backgroundColor: '#8B5CF6', borderRadius: 14, height: 44, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => navigation.navigate('투자유형설문')}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>5분 투자하고 더 알아보기 →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 버튼 */}
          <View style={s.btnWrap}>
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: typeInfo.color }]}
              onPress={() => { try { navigation.getParent()?.navigate('홈Tab'); } catch { navigation.goBack(); } }}
              activeOpacity={0.85}
            >
              <Text style={s.primaryBtnText}>투자 시작하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ghostBtn} onPress={() => navigation.navigate('투자유형설문')} activeOpacity={0.7}>
              <Text style={s.ghostBtnText}>다시 분석하기</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* 따라하기 모달 */}
      <Modal visible={!!followModal} transparent animationType="slide" onRequestClose={() => setFollowModal(null)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setFollowModal(null)}>
          <View style={s.modalSheet} onStartShouldSetResponder={() => true}>
            {followModal && (() => {
              const budget = cash;
              const totalW = followModal.portfolio.reduce((sum, p) => sum + p.weight, 0);
              return (
                <>
                  <Text style={s.modalTitle}>{followModal.name} 포트폴리오</Text>
                  <Text style={s.modalSub}>내 보유 현금 {Math.round(budget).toLocaleString()}원 기준</Text>
                  <ScrollView style={{ maxHeight: 280 }}>
                    {followModal.portfolio.map((item) => {
                      const alloc = Math.round(budget * (item.weight / totalW));
                      return (
                        <TouchableOpacity
                          key={item.ticker}
                          style={s.modalRow}
                          onPress={() => { setFollowModal(null); setTimeout(() => navigateToStock(item.ticker), 300); }}
                          activeOpacity={0.6}
                        >
                          <View>
                            <Text style={[s.modalTicker, { color: typeInfo.color }]}>{item.ticker}</Text>
                            <Text style={{ fontSize: 11, color: Colors.textSub }}>{item.desc} ({item.weight}%)</Text>
                          </View>
                          <Text style={s.modalAmt}>{alloc.toLocaleString()}원</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14, marginTop: 4 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.text }}>총 투자금</Text>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: typeInfo.color }}>{Math.round(budget).toLocaleString()}원</Text>
                  </View>
                  <TouchableOpacity
                    style={[s.primaryBtn, { backgroundColor: typeInfo.color, marginTop: 20 }]}
                    onPress={() => { setFollowModal(null); try { navigation.getParent()?.navigate('투자Tab'); } catch { navigation.goBack(); } }}
                    activeOpacity={0.85}
                  >
                    <Text style={s.primaryBtnText}>투자하러 가기</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
