/**
 * DepositScreen — 원화 → 달러 환전 (커스텀 숫자 키패드)
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../../store/appStore';
import { Colors } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';

const EXCHANGE_RATE = 1391.70;

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['00', '0', '⌫'],
];

export default function DepositScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { cash } = useAppStore();
  const [amount, setAmount] = useState('');

  const numericAmount = parseInt(amount || '0', 10);
  const dollarEquiv = numericAmount / EXCHANGE_RATE;
  const isValid = numericAmount > 0 && numericAmount <= Math.floor(cash);

  function handleKey(key: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (key === '⌫') {
      setAmount(prev => prev.slice(0, -1));
      return;
    }

    // Prevent leading zeros
    if (amount === '' && (key === '0' || key === '00')) return;

    const next = amount + key;
    const parsed = parseInt(next, 10);

    // Cap at available cash
    if (parsed > Math.floor(cash)) {
      setAmount(String(Math.floor(cash)));
      return;
    }

    setAmount(next);
  }

  function handleFillMax() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAmount(String(Math.floor(cash)));
  }

  function handleNext() {
    if (!isValid) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      '환전 확인',
      `₩${numericAmount.toLocaleString()}을\n$${dollarEquiv.toFixed(2)}로 환전하시겠어요?\n\n적용환율: ${EXCHANGE_RATE.toLocaleString()} 원/달러`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '환전하기',
          onPress: () => {
            Alert.alert('환전 완료', `$${dollarEquiv.toFixed(2)}가 충전되었어요!`, [
              { text: '확인', onPress: () => navigation.goBack() },
            ]);
          },
        },
      ]
    );
  }

  const displayAmount = amount === ''
    ? '0원'
    : `${parseInt(amount, 10).toLocaleString()}원`;

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
        <Text style={styles.headerTitle}>원화 → 달러 환전</Text>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => Alert.alert('환전 안내', '평일 오전 9:10부터 오후 3:20까지\n환전 수수료 95% 우대 혜택이 적용돼요.')}
        >
          <Ionicons name="information-circle-outline" size={24} color={Colors.textSub} />
        </TouchableOpacity>
      </View>

      {/* Exchange Rate Badge */}
      <View style={styles.rateBadge}>
        <Text style={styles.rateBadgeText}>
          내 적용 환율 {EXCHANGE_RATE.toLocaleString()} 우대 95%
        </Text>
      </View>

      {/* Amount Input Area */}
      <View style={styles.inputArea}>
        <Text style={[styles.amountText, amount === '' && styles.amountPlaceholder]}>
          {displayAmount}
        </Text>

        <TouchableOpacity onPress={handleFillMax} activeOpacity={0.7}>
          <Text style={styles.balanceLink}>
            잔액: {Math.floor(cash).toLocaleString()}원
          </Text>
        </TouchableOpacity>

        <View style={styles.dollarRow}>
          <Text style={styles.flagText}>🇺🇸</Text>
          <Text style={styles.dollarText}>${dollarEquiv.toFixed(2)}</Text>
        </View>
      </View>

      {/* Next Button */}
      <TouchableOpacity
        style={[styles.nextBtn, !isValid && styles.nextBtnDisabled]}
        onPress={handleNext}
        activeOpacity={0.8}
        disabled={!isValid}
      >
        <Text style={[styles.nextBtnText, { color: theme.bgCard }]}>다음</Text>
      </TouchableOpacity>

      {/* Custom Numpad */}
      <View style={styles.numpad}>
        {KEYS.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.numpadRow}>
            {row.map(key => (
              <TouchableOpacity
                key={key}
                style={styles.numpadKey}
                onPress={() => handleKey(key)}
                activeOpacity={0.7}
              >
                {key === '⌫' ? (
                  <Ionicons name="backspace-outline" size={22} color={Colors.text} />
                ) : (
                  <Text style={styles.numpadKeyText}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
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

  rateBadge: {
    alignSelf: 'center',
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#EBF4FF',
    borderRadius: 20,
  },
  rateBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },

  inputArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  amountText: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Courier',
    textAlign: 'center',
  },
  amountPlaceholder: {
    color: Colors.textMuted,
  },
  balanceLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  dollarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  flagText: { fontSize: 20 },
  dollarText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSub,
    fontFamily: 'Courier',
  },

  nextBtn: {
    marginHorizontal: 16,
    marginBottom: 8,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  nextBtnDisabled: {
    backgroundColor: Colors.border,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },

  numpad: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: Colors.bg,
  },
  numpadRow: {
    flexDirection: 'row',
  },
  numpadKey: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    margin: 3,
    backgroundColor: Colors.card,
  },
  numpadKeyText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
});
