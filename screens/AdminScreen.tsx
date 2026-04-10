import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, FlatList, TextInput } from 'react-native';
import { collection, getDocs, updateDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTheme } from '../context/ThemeContext';

interface AdminUser {
  uid: string;
  email: string;
  name: string;
  balance: number;
  totalAsset: number;
  portfolio: any[];
}

type TabType = 'users' | 'trades' | 'control';

export default function AdminScreen() {
  const { theme } = useTheme();
  const [tab, setTab] = useState<TabType>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const uSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'user')));
      const uList = uSnap.docs.map(d => ({
        uid: d.id,
        email: d.data().email ?? '',
        name: d.data().displayName ?? d.data().email ?? '',
        balance: d.data().balance ?? 1000000,
        totalAsset: d.data().totalAsset ?? 1000000,
        portfolio: d.data().portfolio ?? [],
      }));
      setUsers(uList.sort((a, b) => b.totalAsset - a.totalAsset));

      const tSnap = await getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc')));
      setTrades(tSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const handleEditBalance = (user: AdminUser) => {
    Alert.prompt('잔액 수정', `${user.email}`, async (value) => {
      if (!value || isNaN(Number(value))) return;
      await updateDoc(doc(db, 'users', user.uid), { balance: Number(value) });
      Alert.alert('완료', '잔액 수정됐습니다.');
      loadData();
    }, 'plain-text', String(user.balance));
  };

  const handleResetAll = () => {
    Alert.alert('전체 초기화', '모든 유저를 100만원으로 초기화합니다.', [
      { text: '취소', style: 'cancel' },
      { text: '초기화', style: 'destructive', onPress: async () => {
        for (const u of users) {
          await updateDoc(doc(db, 'users', u.uid), { balance: 1000000, totalAsset: 1000000, portfolio: [], transactions: [] });
        }
        Alert.alert('완료', `${users.length}명 초기화 완료`);
        loadData();
      }}
    ]);
  };

  const filteredTrades = trades.filter(t =>
    t.ticker?.includes(searchText.toUpperCase()) || t.userEmail?.includes(searchText)
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ paddingTop: 59, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: theme.bgCard, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>🛡️ 관리자</Text>
          <TouchableOpacity onPress={handleResetAll} style={{ backgroundColor: theme.red, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>전체 초기화</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
          {(['users', 'trades', 'control'] as TabType[]).map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: tab === t ? theme.primary : theme.bgInput, alignItems: 'center' }}>
              <Text style={{ color: tab === t ? '#fff' : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>
                {t === 'users' ? '👥 유저' : t === 'trades' ? '📋 거래' : '⚙️ 제어'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tab === 'users' && (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 12 }}>총 {users.length}명</Text>
          {users.map((u, i) => (
            <View key={u.uid} style={{ backgroundColor: theme.bgCard, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: theme.text }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`} {u.name}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{u.email}</Text>
                  <Text style={{ color: theme.text, fontSize: 13, marginTop: 4 }}>
                    총 {u.totalAsset.toLocaleString()}원 · <Text style={{ color: u.totalAsset >= 1000000 ? theme.red : theme.blue }}>
                      {((u.totalAsset - 1000000) / 1000000 * 100).toFixed(2)}%
                    </Text>
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>현금 {u.balance.toLocaleString()}원</Text>
                </View>
                <TouchableOpacity onPress={() => handleEditBalance(u)}
                  style={{ backgroundColor: theme.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                  <Text style={{ color: theme.primary, fontSize: 12, fontWeight: 'bold' }}>잔액수정</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {tab === 'trades' && (
        <View style={{ flex: 1 }}>
          <View style={{ padding: 16, paddingBottom: 8 }}>
            <TextInput placeholder="종목·이메일 검색" placeholderTextColor={theme.textSecondary}
              value={searchText} onChangeText={setSearchText}
              style={{ backgroundColor: theme.bgInput, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: theme.text }} />
          </View>
          <FlatList data={filteredTrades} keyExtractor={i => i.id}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            ListEmptyComponent={<Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 40 }}>거래 내역 없음</Text>}
            renderItem={({ item }) => (
              <View style={{ backgroundColor: theme.bgCard, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: 'bold', color: theme.text }}>{item.stockName ?? item.ticker}</Text>
                  <Text style={{ color: item.type === 'buy' ? theme.red : theme.blue, fontWeight: 'bold' }}>{item.type === 'buy' ? '매수' : '매도'}</Text>
                </View>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{item.userEmail}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ color: theme.text, fontSize: 13 }}>{item.quantity}주 × {item.price?.toLocaleString()}원</Text>
                  <Text style={{ color: theme.text, fontWeight: 'bold' }}>{item.total?.toLocaleString()}원</Text>
                </View>
              </View>
            )}
          />
        </View>
      )}

      {tab === 'control' && (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={{ backgroundColor: theme.bgCard, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ color: theme.text, fontWeight: 'bold', marginBottom: 8 }}>📊 현황</Text>
            <Text style={{ color: theme.textSecondary }}>참가자: {users.length}명</Text>
            <Text style={{ color: theme.textSecondary }}>총 거래: {trades.length}건</Text>
          </View>
          <TouchableOpacity onPress={handleResetAll}
            style={{ backgroundColor: theme.red, borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>🔄 전체 초기화</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>모든 유저 자산을 100만원으로 초기화</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={loadData}
            style={{ backgroundColor: theme.primary, borderRadius: 12, padding: 16, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>🔃 새로고침</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}
