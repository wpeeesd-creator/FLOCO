/**
 * StockChart — 토스 스타일 주식 차트
 * react-native-svg + PanResponder 사용 (추가 패키지 없음, Expo 완전 호환)
 *
 * 기능:
 *  - 라인 차트 / 캔들 차트 토글
 *  - 일봉 / 주봉 / 월봉 탭 전환
 *  - 터치 시 커서 + 가격 말풍선 (토스 스타일)
 *  - 더미 데이터 (30일 기준)
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, PanResponder,
  Dimensions, TouchableOpacity,
} from 'react-native';
import Svg, {
  Path, Defs, Stop,
  LinearGradient as SvgGrad,
  Line as SvgLine,
  Rect as SvgRect,
  G,
  Circle as SvgCircle,
} from 'react-native-svg';
import { Colors } from './ui';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface Candle {
  date: Date;
  open: number;
  close: number;
  high: number;
  low: number;
}
type ChartType = 'line' | 'candle';
type Period = 'day' | 'week' | 'month';

// ─────────────────────────────────────────────────────────
// Dummy data generator (시드 없이 useMemo로 캐싱)
// ─────────────────────────────────────────────────────────
function makeCandles(base: number, count: number, stepDays: number): Candle[] {
  const out: Candle[] = [];
  let price = base;
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * stepDays);
    const open = price;
    const delta = (Math.random() - 0.47) * price * 0.025;
    const close = Math.max(price * 0.85, price + delta);
    const hi = Math.max(open, close) * (1 + Math.random() * 0.013);
    const lo = Math.min(open, close) * (1 - Math.random() * 0.013);
    out.push({
      date: d,
      open: Math.round(open * 100) / 100,
      close: Math.round(close * 100) / 100,
      high: Math.round(hi * 100) / 100,
      low: Math.round(lo * 100) / 100,
    });
    price = close;
  }
  return out;
}

// ─────────────────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────────────────
const fmtPrice = (v: number, krw: boolean) =>
  krw ? `₩${Math.round(v).toLocaleString()}` : `$${v.toFixed(2)}`;

const fmtDate = (d: Date, period: Period): string => {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return period === 'month' ? `${d.getFullYear()}.${m}` : `${m}.${day}`;
};

// ─────────────────────────────────────────────────────────
// Layout constants
// ─────────────────────────────────────────────────────────
const SCREEN_W = Dimensions.get('window').width;
// wrap: marginHorizontal 16, padding 16 양쪽 → 64
const CW = SCREEN_W - 64;
const CH = 180;       // SVG 차트 높이
const PT = 8;         // 차트 내부 padding-top
const PB = 4;         // 차트 내부 padding-bottom
const BUBBLE_H = 40;  // 말풍선 예약 높이

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────
interface StockChartProps {
  basePrice: number;
  isKrw: boolean;
}

export function StockChart({ basePrice, isKrw }: StockChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [period, setPeriod] = useState<Period>('day');
  const [selIdx, setSelIdx] = useState<number | null>(null);

  // ── 데이터 ────────────────────────────────────────────
  const data = useMemo<Candle[]>(() => {
    if (period === 'day')  return makeCandles(basePrice, 30, 1);
    if (period === 'week') return makeCandles(basePrice, 24, 7);
    return                        makeCandles(basePrice, 18, 30);
  }, [basePrice, period]);

  const n = data.length;

  const { minP, maxP } = useMemo(() => ({
    minP: Math.min(...data.map(d => d.low)),
    maxP: Math.max(...data.map(d => d.high)),
  }), [data]);

  const range = maxP - minP || 1;
  const innerH = CH - PT - PB;

  // 좌표 변환
  const xOf = (i: number) => (i / (n - 1)) * CW;
  const yOf = (p: number) => PT + (1 - (p - minP) / range) * innerH;

  // ── 터치 핸들러 ────────────────────────────────────────
  const updateSel = useCallback((x: number) => {
    const idx = Math.round((x / CW) * (n - 1));
    setSelIdx(Math.max(0, Math.min(n - 1, idx)));
  }, [n]);

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderGrant:   e => updateSel(e.nativeEvent.locationX),
    onPanResponderMove:    e => updateSel(e.nativeEvent.locationX),
    onPanResponderRelease: () => setTimeout(() => setSelIdx(null), 2200),
  }), [updateSel]);

  // ── 표시 값 ────────────────────────────────────────────
  const sel = selIdx !== null ? data[selIdx] : null;
  const displayClose = sel?.close ?? data[n - 1]?.close ?? basePrice;
  const periodReturn = ((displayClose - (data[0]?.close ?? basePrice)) / (data[0]?.close ?? basePrice)) * 100;
  const isUp   = periodReturn >= 0;
  const accent = isUp ? Colors.green : Colors.red;

  // 라인 차트 path
  const linePts = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(i)},${yOf(d.close)}`).join(' ');
  const areaPts = `${linePts} L${xOf(n - 1)},${PT + innerH} L0,${PT + innerH} Z`;

  // 캔들 폭
  const candleW = Math.max(3, Math.min(10, CW / n * 0.55));

  // 말풍선 X 클램프
  const bubbleW = chartType === 'candle' ? 148 : 100;
  const bubbleX = selIdx !== null
    ? Math.min(Math.max(xOf(selIdx) - bubbleW / 2, 0), CW - bubbleW)
    : 0;

  return (
    <View style={s.wrap}>

      {/* ── 컨트롤 바 ──────────────────────────────── */}
      <View style={s.controls}>
        {/* 라인 / 캔들 토글 */}
        <View style={s.seg}>
          {(['line', 'candle'] as ChartType[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[s.segBtn, chartType === t && s.segBtnOn]}
              onPress={() => { setChartType(t); setSelIdx(null); }}
            >
              <Text style={[s.segTxt, chartType === t && s.segTxtOn]}>
                {t === 'line' ? '라인' : '캔들'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 일봉 / 주봉 / 월봉 탭 */}
        <View style={s.periods}>
          {(['day', 'week', 'month'] as Period[]).map(p => (
            <TouchableOpacity
              key={p}
              style={[s.pBtn, period === p && s.pBtnOn]}
              onPress={() => { setPeriod(p); setSelIdx(null); }}
            >
              <Text style={[s.pTxt, period === p && s.pTxtOn]}>
                {p === 'day' ? '일봉' : p === 'week' ? '주봉' : '월봉'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── 현재가 헤더 ────────────────────────────── */}
      <View style={s.priceRow}>
        <Text style={[s.priceVal, { color: accent }]}>
          {fmtPrice(displayClose, isKrw)}
        </Text>
        <View style={[s.pill, { backgroundColor: isUp ? Colors.greenBg : Colors.redBg }]}>
          <Text style={[s.pillTxt, { color: accent }]}>
            {isUp ? '▲ +' : '▼ '}{Math.abs(periodReturn).toFixed(2)}%
          </Text>
        </View>
        {sel && (
          <Text style={s.selDate}>{fmtDate(sel.date, period)}</Text>
        )}
      </View>

      {/* ── 차트 ───────────────────────────────────── */}
      <View style={{ height: CH + BUBBLE_H }}>

        {/* 캔들 차트 말풍선 (OHLC) */}
        {sel !== null && chartType === 'candle' && (
          <View style={[s.bubble, { left: bubbleX }]}>
            <Text style={[s.bubblePrice, { color: sel.close >= sel.open ? Colors.green : Colors.red }]}>
              {fmtPrice(sel.close, isKrw)}
            </Text>
            <View style={s.ohlc}>
              <Text style={s.ohlcTxt}>시 {fmtPrice(sel.open, isKrw)}</Text>
              <Text style={s.ohlcTxt}>고 {fmtPrice(sel.high, isKrw)}</Text>
              <Text style={s.ohlcTxt}>저 {fmtPrice(sel.low, isKrw)}</Text>
            </View>
          </View>
        )}

        {/* SVG 차트 본체 */}
        <Svg width={CW} height={CH} style={{ marginTop: BUBBLE_H }}>
          <Defs>
            <SvgGrad id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%"   stopColor={accent} stopOpacity={0.2} />
              <Stop offset="100%" stopColor={accent} stopOpacity={0}   />
            </SvgGrad>
          </Defs>

          {chartType === 'line' ? (
            <>
              {/* 영역 그라데이션 */}
              <Path d={areaPts} fill="url(#areaGrad)" />
              {/* 라인 */}
              <Path
                d={linePts}
                stroke={accent}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* 터치 커서 */}
              {sel !== null && selIdx !== null && (
                <>
                  <SvgLine
                    x1={xOf(selIdx)} y1={PT}
                    x2={xOf(selIdx)} y2={PT + innerH}
                    stroke={Colors.border}
                    strokeWidth={1.5}
                    strokeDasharray="5,3"
                  />
                  <SvgCircle
                    cx={xOf(selIdx)}
                    cy={yOf(sel.close)}
                    r={5}
                    fill={accent}
                    stroke="#fff"
                    strokeWidth={2.5}
                  />
                </>
              )}
            </>
          ) : (
            <>
              {/* 캔들스틱 */}
              {data.map((d, i) => {
                const x     = xOf(i);
                const isUpC = d.close >= d.open;
                const color = isUpC ? Colors.green : Colors.red;
                const bTop  = yOf(Math.max(d.open, d.close));
                const bH    = Math.max(1.5, yOf(Math.min(d.open, d.close)) - bTop);
                const dim   = selIdx !== null && selIdx !== i;
                return (
                  <G key={i} opacity={dim ? 0.18 : 1}>
                    {/* 심지 */}
                    <SvgLine
                      x1={x} y1={yOf(d.high)}
                      x2={x} y2={yOf(d.low)}
                      stroke={color}
                      strokeWidth={1.5}
                    />
                    {/* 몸통 */}
                    <SvgRect
                      x={x - candleW / 2}
                      y={bTop}
                      width={candleW}
                      height={bH}
                      fill={color}
                      rx={1.5}
                    />
                  </G>
                );
              })}
              {/* 선택 커서선 */}
              {sel !== null && selIdx !== null && (
                <SvgLine
                  x1={xOf(selIdx)} y1={PT}
                  x2={xOf(selIdx)} y2={PT + innerH}
                  stroke={Colors.textMuted}
                  strokeWidth={1}
                  strokeDasharray="4,3"
                />
              )}
            </>
          )}
        </Svg>

        {/* 터치 오버레이 (SVG 위에 올림) */}
        <View
          style={[StyleSheet.absoluteFillObject, { top: BUBBLE_H }]}
          {...pan.panHandlers}
        />
      </View>

      {/* ── 최저가 / 최고가 ───────────────────────── */}
      <View style={s.minMax}>
        <Text style={s.minMaxTxt}>저 {fmtPrice(minP, isKrw)}</Text>
        <Text style={s.minMaxTxt}>고 {fmtPrice(maxP, isKrw)}</Text>
      </View>

    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  // Controls
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seg: {
    flexDirection: 'row',
    backgroundColor: Colors.bg,
    borderRadius: 8,
    padding: 2,
  },
  segBtn: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 6 },
  segBtnOn: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  segTxt:   { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  segTxtOn: { color: Colors.text },

  periods: { flexDirection: 'row', gap: 4 },
  pBtn:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  pBtnOn:  { backgroundColor: Colors.primary },
  pTxt:    { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  pTxtOn:  { color: '#fff' },

  // Price header
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  priceVal: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Courier',
    letterSpacing: -0.5,
  },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillTxt: { fontSize: 12, fontWeight: '700' },
  selDate: {
    marginLeft: 'auto' as any,
    fontSize: 11,
    color: Colors.textMuted,
  },

  // Bubble (캔들 OHLC 말풍선)
  bubble: {
    position: 'absolute',
    top: 2,
    backgroundColor: Colors.navy,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 20,
  },
  bubblePrice: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Courier',
    marginBottom: 3,
  },
  ohlc:    { flexDirection: 'row', gap: 8 },
  ohlcTxt: { fontSize: 10, color: 'rgba(255,255,255,0.75)' },

  // Min/Max
  minMax: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  minMaxTxt: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'Courier',
  },
});
