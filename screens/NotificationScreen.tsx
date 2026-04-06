import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/ui';

export default function NotificationScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  // Firestore 실시간 알림 구독
  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const notifs = Array.isArray(data.notifications)
          ? [...data.notifications].sort((a: any, b: any) =>
              new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
            )
          : [];
        setNotifications(notifs);
      }
    });
    return () => unsubscribe();
  }, [user?.id]);

  // 전체 읽음 처리
  useEffect(() => {
    if (!user?.id || notifications.length === 0) return;
    const hasUnread = notifications.some(n => !n.read);
    if (hasUnread) {
      const updated = notifications.map(n => ({ ...n, read: true }));
      updateDoc(doc(db, 'users', user.id), { notifications: updated }).catch(console.error);
    }
  }, [notifications.length]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* 헤더 */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          알림
          {unreadCount > 0 && (
            <Text style={{ color: Colors.primary }}> ({unreadCount})</Text>
          )}
        </Text>
      </View>

      {notifications.length === 0 ? (
        <View style={s.emptyWrap}>
          <Text style={{ fontSize: 48 }}>🔔</Text>
          <Text style={{ color: Colors.textSub, marginTop: 12 }}>
            알림이 없어요
          </Text>
          <Text style={{ color: Colors.textSub, fontSize: 13, marginTop: 8 }}>
            매수/매도 후 알림이 표시돼요
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, i) => item.id ?? i.toString()}
          renderItem={({ item }) => {
            const isKR = item.ticker?.length === 6 && /^\d+$/.test(item.ticker);
            const isBuy = item.tradeType === 'buy';

            return (
              <TouchableOpacity
                onPress={() => {
                  if (item.ticker) {
                    navigation.navigate('종목상세' as never, { ticker: item.ticker } as never);
                  }
                }}
                style={[s.row, !item.read && s.rowUnread]}
                activeOpacity={0.7}
              >
                {/* 아이콘 */}
                <View style={[s.iconWrap, {
                  backgroundColor: item.type === 'trade'
                    ? (isBuy ? Colors.greenBg : Colors.redBg)
                    : Colors.goldBg,
                }]}>
                  <Text style={{ fontSize: 22 }}>
                    {item.type === 'trade'
                      ? (isBuy ? '📈' : '📉')
                      : item.type === 'reward' ? '🎓' : '🔔'}
                  </Text>
                </View>

                {/* 내용 */}
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{item.title}</Text>
                  <Text style={s.rowBody}>{item.body}</Text>

                  {/* 거래 상세 */}
                  {item.type === 'trade' && item.quantity != null && (
                    <View style={s.tagRow}>
                      <View style={[s.tag, { backgroundColor: isBuy ? Colors.greenBg : Colors.redBg }]}>
                        <Text style={[s.tagText, { color: isBuy ? Colors.green : Colors.red }]}>
                          {isKR ? `${item.quantity}주` : `${item.quantity?.toFixed(4)}주`}
                        </Text>
                      </View>
                      {item.total != null && (
                        <View style={[s.tag, { backgroundColor: Colors.bg }]}>
                          <Text style={[s.tagText, { color: Colors.textSub }]}>
                            {isKR
                              ? `${Math.round(item.total).toLocaleString()}원`
                              : `$${item.total.toFixed(2)}`}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  <Text style={s.rowTime}>
                    {new Date(item.createdAt).toLocaleString('ko-KR', {
                      month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>

                {/* 읽지 않음 표시 */}
                {!item.read && <View style={s.unreadDot} />}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4, marginRight: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, flex: 1 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Colors.textSub, marginTop: 12, fontSize: 15 },
  row: {
    backgroundColor: Colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowUnread: { backgroundColor: '#EBF2FF' },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  rowTitle: { fontWeight: 'bold', fontSize: 15, color: Colors.text },
  rowBody: { color: Colors.textSub, fontSize: 13, marginTop: 4, lineHeight: 18 },
  tagRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  tag: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, fontWeight: 'bold' },
  rowTime: { color: Colors.inactive, fontSize: 11, marginTop: 6 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary, marginTop: 4,
  },
});
