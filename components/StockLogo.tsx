import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STOCK_LOGOS: Record<string, { bg: string; text: string; label: string }> = {
  // 국내
  '005930': { bg: '#1428A0', text: '#FFFFFF', label: '삼성' },
  '000660': { bg: '#EA0029', text: '#FFFFFF', label: 'SK' },
  '035720': { bg: '#FFE812', text: '#3A1D1D', label: 'kakao' },
  '035420': { bg: '#03C75A', text: '#FFFFFF', label: 'N' },
  '005380': { bg: '#002C5F', text: '#FFFFFF', label: '현대' },
  '373220': { bg: '#E11B22', text: '#FFFFFF', label: 'LG' },
  '006400': { bg: '#1428A0', text: '#FFFFFF', label: 'SDI' },
  '051910': { bg: '#E11B22', text: '#FFFFFF', label: 'LG' },
  '068270': { bg: '#005BAC', text: '#FFFFFF', label: 'C' },
  '207940': { bg: '#1428A0', text: '#FFFFFF', label: '삼바' },
  '000270': { bg: '#EA0029', text: '#FFFFFF', label: '기아' },
  '012330': { bg: '#002C5F', text: '#FFFFFF', label: '모비' },
  '005490': { bg: '#003478', text: '#FFFFFF', label: 'P' },
  '015760': { bg: '#0067A3', text: '#FFFFFF', label: '한전' },
  '028260': { bg: '#1428A0', text: '#FFFFFF', label: '삼물' },
  '105560': { bg: '#FFB81C', text: '#FFFFFF', label: 'KB' },
  '086790': { bg: '#008C73', text: '#FFFFFF', label: '하나' },
  '032830': { bg: '#1428A0', text: '#FFFFFF', label: '삼생' },
  '066570': { bg: '#A50034', text: '#FFFFFF', label: 'LG' },
  '017670': { bg: '#EA0029', text: '#FFFFFF', label: 'SKT' },
  '030200': { bg: '#FF0000', text: '#FFFFFF', label: 'KT' },
  '003550': { bg: '#A50034', text: '#FFFFFF', label: 'LG' },
  '352820': { bg: '#9B1C2E', text: '#FFFFFF', label: 'HYBE' },
  '323410': { bg: '#FFCD00', text: '#3A1D1D', label: 'KB' },
  // 해외
  'AAPL':  { bg: '#555555', text: '#FFFFFF', label: '🍎' },
  'TSLA':  { bg: '#CC0000', text: '#FFFFFF', label: 'T' },
  'NVDA':  { bg: '#76B900', text: '#FFFFFF', label: 'N' },
  'GOOGL': { bg: '#4285F4', text: '#FFFFFF', label: 'G' },
  'AMZN':  { bg: '#FF9900', text: '#FFFFFF', label: 'A' },
  'MSFT':  { bg: '#00A4EF', text: '#FFFFFF', label: 'M' },
  'META':  { bg: '#0866FF', text: '#FFFFFF', label: 'f' },
  'NFLX':  { bg: '#E50914', text: '#FFFFFF', label: 'N' },
  'AMD':   { bg: '#ED1C24', text: '#FFFFFF', label: 'A' },
  'INTC':  { bg: '#0071C5', text: '#FFFFFF', label: 'I' },
  'TSM':   { bg: '#005BAC', text: '#FFFFFF', label: 'T' },
  'ASML':  { bg: '#003B71', text: '#FFFFFF', label: 'A' },
  'QCOM':  { bg: '#3253DC', text: '#FFFFFF', label: 'Q' },
  'JPM':   { bg: '#004B87', text: '#FFFFFF', label: 'JP' },
  'BAC':   { bg: '#012169', text: '#FFFFFF', label: 'B' },
  'GS':    { bg: '#6C9BC2', text: '#FFFFFF', label: 'GS' },
  'V':     { bg: '#1A1F71', text: '#FFFFFF', label: 'V' },
  'PYPL':  { bg: '#003087', text: '#FFFFFF', label: 'P' },
  'COIN':  { bg: '#0052FF', text: '#FFFFFF', label: '₿' },
  'DIS':   { bg: '#113CCF', text: '#FFFFFF', label: 'D' },
  'SPOT':  { bg: '#1DB954', text: '#FFFFFF', label: 'S' },
  'RBLX':  { bg: '#E2231A', text: '#FFFFFF', label: 'R' },
  'SNAP':  { bg: '#FFFC00', text: '#3A1D1D', label: 'S' },
  'SHOP':  { bg: '#96BF48', text: '#FFFFFF', label: 'S' },
  'UBER':  { bg: '#000000', text: '#FFFFFF', label: 'U' },
  'ABNB':  { bg: '#FF5A5F', text: '#FFFFFF', label: 'A' },
  'DASH':  { bg: '#FF3008', text: '#FFFFFF', label: 'D' },
  'PLTR':  { bg: '#101010', text: '#FFFFFF', label: 'P' },
  'SNOW':  { bg: '#29B5E8', text: '#FFFFFF', label: 'S' },
  'CRM':   { bg: '#00A1E0', text: '#FFFFFF', label: 'S' },
  'RIVN':  { bg: '#48C9B0', text: '#FFFFFF', label: 'R' },
  'NIO':   { bg: '#3E92CC', text: '#FFFFFF', label: 'N' },
  'XOM':   { bg: '#ED1B2F', text: '#FFFFFF', label: 'X' },
  'SPY':   { bg: '#003399', text: '#FFFFFF', label: 'SP' },
  'QQQ':   { bg: '#0071EB', text: '#FFFFFF', label: 'Q' },
  'ARKK':  { bg: '#FFA500', text: '#FFFFFF', label: 'A' },
};

interface StockLogoProps {
  ticker: string;
  size?: number;
}

export default function StockLogo({ ticker, size = 44 }: StockLogoProps) {
  const logo = STOCK_LOGOS[ticker];
  const bgColor = logo?.bg ?? '#8E8E93';
  const textColor = logo?.text ?? '#FFFFFF';
  const label = logo?.label ?? ticker[0] ?? '?';
  const isEmoji = label.length === 1 && label.charCodeAt(0) > 127;
  const fontSize = isEmoji ? size * 0.45 : Math.min(size * 0.3, label.length > 2 ? 9 : 14);

  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: bgColor,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Text style={{
        color: textColor,
        fontWeight: '700',
        fontSize,
      }}>
        {label}
      </Text>
    </View>
  );
}
