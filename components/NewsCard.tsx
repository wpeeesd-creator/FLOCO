import React from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet, Linking, Alert,
} from 'react-native';
import { Colors } from './ui';
import { formatNewsTime, type NewsItem } from '../lib/newsService';

interface NewsCardProps {
  item: NewsItem;
}

export default function NewsCard({ item }: NewsCardProps) {
  const flag = item.country === 'KR' ? '🇰🇷' : '🇺🇸';

  const handlePress = async () => {
    if (!item.url) {
      // 더미 뉴스 — Alert로 내용 표시
      Alert.alert(
        item.title,
        `${item.description}\n\n(FLOCO 샘플 뉴스입니다)`,
        [{ text: '확인' }],
      );
      return;
    }
    try {
      await Linking.openURL(item.url);
    } catch {
      // URL 열기 실패 시 조용히 무시
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.body}>
        <View style={styles.meta}>
          <Text style={styles.flag}>{flag}</Text>
          <Text style={styles.source}>{item.source}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.time}>{formatNewsTime(item.publishedAt)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      </View>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  body: {
    flex: 1,
    gap: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flag: {
    fontSize: 13,
  },
  source: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
  dot: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  time: {
    fontSize: 12,
    color: Colors.textSub,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 20,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: Colors.border,
  },
});
