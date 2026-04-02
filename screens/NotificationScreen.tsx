import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../components/ui';

interface NotificationItem {
  id: string;
  type: 'trade' | 'learning' | 'ranking' | 'event' | 'community';
  title: string;
  body: string;
  time: string;
  read: boolean;
  emoji: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', type: 'trade', title: '매수 완료', body: '삼성전자 5주 매수 완료!', time: '10분 전', read: false, emoji: '📈' },
  { id: '2', type: 'learning', title: '학습 보상', body: '캔들차트 읽기 완료! +70,000원 지급', time: '1시간 전', read: false, emoji: '🎓' },
  { id: '3', type: 'ranking', title: '순위 변동', body: '현재 랭킹 5위예요!', time: '3시간 전', read: true, emoji: '🏆' },
  { id: '4', type: 'event', title: '이벤트 마감 임박', body: '3월 수익률 챌린지 마감 1일 전!', time: '5시간 전', read: true, emoji: '⏰' },
  { id: '5', type: 'community', title: '새 댓글', body: '내 게시물에 댓글이 달렸어요', time: '어제', read: true, emoji: '💬' },
];

export default function NotificationScreen() {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: item.read ? '#FFFFFF' : '#EBF2FF' }]}
      onPress={() => markRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarEmoji}>{item.emoji}</Text>
      </View>
      <View style={styles.itemCenter}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.itemTime}>{item.time}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🔔</Text>
      <Text style={styles.emptyText}>알림이 없어요</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림</Text>
        <TouchableOpacity
          style={styles.markAllBtn}
          onPress={markAllRead}
          activeOpacity={0.7}
        >
          <Text style={styles.markAllText}>모두 읽음</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
    marginRight: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  markAllBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  markAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },

  // List item
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  itemCenter: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  itemBody: {
    fontSize: 13,
    color: Colors.textSub,
    lineHeight: 18,
    marginBottom: 4,
  },
  itemTime: {
    fontSize: 12,
    color: Colors.inactive,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
  },

  // Empty state
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSub,
    fontWeight: '500',
  },
});
