/**
 * StockChart — 라인 차트 + 봉 차트 (react-native-svg)
 * Expo 완전 호환, 추가 패키지 불필요
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Line, Rect, Circle, G } from 'react-native-svg';
import { Colors } from './ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 32;
const CHART_HEIGHT = 200;
const PADDING = { top: 10, bottom: 20, left: 0, right: 0 };
const DRAW_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const DRAW_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

interface StockChartProps {
  basePrice: number;
  isKrw?: boolean;
}

type ChartType = 'line' | 'candle';
type Period = '1D' | '1W' | '1M' | '3M' | '1Y';

const PERIOD_DAYS: Record<Period, number> = {
  '1D': 2,
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
};

interface CandleData {
  date: Date;
  open: number;
  close: number;
  high: number;
  low: number;
}

function generateData(days: number, basePrice: number): CandleData[] {
  const data: CandleData[] = [];
  let price = basePrice * 0.95;
  const now = Date.now();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now - i * 86400000);
    const change = (Math.random() - 0.48) * price * 0.03;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    data.push({
      date,
      open: Math.round(open * 100) / 100,
      close: Math.round(close * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
    });
    price = close;
  }
  return data;
}

function buildLinePath(data: CandleData[], minVal: number, maxVal: number): string {
  if (data.length === 0) return '';
  const range = maxVal - minVal || 1;
  return data.map((d, i) => {
    const x = PADDING.left + (i / (data.length - 1)) * DRAW_WIDTH;
    const y = PADDING.top + (1 - (d.close - minVal) / range) * DRAW_HEIGHT;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

export function StockChart({ basePrice, isKrw }: StockChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [period, setPeriod] = useState<Period>('1M');

  const days = PERIOD_DAYS[period];
  const data = useMemo(() => generateData(days, basePrice), [days, basePrice]);

  const allPrices = data.flatMap(d => [d.high, d.low, d.open, d.close]);
  const minVal = Math.min(...allPrices);
  const maxVal = Math.max(...allPrices);
  const range = maxVal - minVal || 1;

  const firstPrice = data[0]?.close ?? basePrice;
  const lastPrice = data[data.length - 1]?.close ?? basePrice;
  const isPositive = lastPrice >= firstPrice;
  const chartColor = isPositive ? '#F04452' : '#2175F3';

  const linePath = useMemo(() => buildLinePath(data, minVal, maxVal), [data, minVal, maxVal]);

  const candleWidth = Math.max(2, Math.min(8, (DRAW_WIDTH / data.length) * 0.6));

  return (
    <View style={styles.container}>
      {/* Chart type toggle */}
      <View style={styles.typeRow}>
        {([
          { type: 'line' as ChartType, label: '📈 라인' },
          { type: 'candle' as ChartType, label: '🕯️ 봉차트' },
        ]).map(({ type, label }) => (
          <TouchableOpacity
            key={type}
            onPress={() => setChartType(type)}
            style={[styles.typeBtn, chartType === type && styles.typeBtnActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.typeText, chartType === type && styles.typeTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SVG Chart */}
      <View style={styles.chartWrap}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(pct => {
            const y = PADDING.top + pct * DRAW_HEIGHT;
            return (
              <Line key={pct} x1={0} y1={y} x2={CHART_WIDTH} y2={y} stroke="#F2F4F6" strokeWidth={1} />
            );
          })}

          {chartType === 'line' ? (
            <>
              <Path d={linePath} fill="none" stroke={chartColor} strokeWidth={2} strokeLinejoin="round" />
              {/* End dot */}
              {data.length > 0 && (() => {
                const lastX = PADDING.left + DRAW_WIDTH;
                const lastY = PADDING.top + (1 - (lastPrice - minVal) / range) * DRAW_HEIGHT;
                return <Circle cx={lastX} cy={lastY} r={4} fill={chartColor} />;
              })()}
            </>
          ) : (
            <G>
              {data.map((d, i) => {
                const x = PADDING.left + (i / (data.length - 1 || 1)) * DRAW_WIDTH;
                const isUp = d.close >= d.open;
                const color = isUp ? '#F04452' : '#2175F3';
                const bodyTop = PADDING.top + (1 - (Math.max(d.open, d.close) - minVal) / range) * DRAW_HEIGHT;
                const bodyBottom = PADDING.top + (1 - (Math.min(d.open, d.close) - minVal) / range) * DRAW_HEIGHT;
                const wickTop = PADDING.top + (1 - (d.high - minVal) / range) * DRAW_HEIGHT;
                const wickBottom = PADDING.top + (1 - (d.low - minVal) / range) * DRAW_HEIGHT;
                const bodyHeight = Math.max(1, bodyBottom - bodyTop);

                return (
                  <G key={i}>
                    {/* Wick */}
                    <Line x1={x} y1={wickTop} x2={x} y2={wickBottom} stroke={color} strokeWidth={1} />
                    {/* Body */}
                    <Rect
                      x={x - candleWidth / 2}
                      y={bodyTop}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={color}
                    />
                  </G>
                );
              })}
            </G>
          )}
        </Svg>

        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>
            {isKrw ? `${Math.round(maxVal).toLocaleString()}` : maxVal.toFixed(1)}
          </Text>
          <Text style={styles.yLabel}>
            {isKrw ? `${Math.round((minVal + maxVal) / 2).toLocaleString()}` : ((minVal + maxVal) / 2).toFixed(1)}
          </Text>
          <Text style={styles.yLabel}>
            {isKrw ? `${Math.round(minVal).toLocaleString()}` : minVal.toFixed(1)}
          </Text>
        </View>
      </View>

      {/* Price summary */}
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>
          {isKrw ? `₩${Math.round(lastPrice).toLocaleString()}` : `$${lastPrice.toFixed(2)}`}
        </Text>
        <Text style={[styles.changeLabel, { color: chartColor }]}>
          {isPositive ? '+' : ''}{((lastPrice - firstPrice) / firstPrice * 100).toFixed(2)}%
        </Text>
      </View>

      {/* Period selector */}
      <View style={styles.periodRow}>
        {(['1D', '1W', '1M', '3M', '1Y'] as Period[]).map(p => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default StockChart;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
    marginBottom: 4,
  },
  typeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F4F6',
  },
  typeBtnActive: {
    backgroundColor: Colors.primary,
  },
  typeText: {
    color: '#8B95A1',
    fontSize: 13,
    fontWeight: '600',
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  chartWrap: {
    paddingHorizontal: 16,
    position: 'relative',
  },
  yAxis: {
    position: 'absolute',
    right: 20,
    top: PADDING.top,
    bottom: PADDING.bottom,
    justifyContent: 'space-between',
  },
  yLabel: {
    fontSize: 9,
    color: '#ADB5BD',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191F28',
  },
  changeLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F6',
    paddingTop: 12,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  periodBtnActive: {
    backgroundColor: '#191F28',
  },
  periodText: {
    color: '#8B95A1',
    fontSize: 14,
  },
  periodTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
