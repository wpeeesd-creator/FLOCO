import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, ScrollView, Alert, FlatList, TextInput, Platform } from 'react-native';
import { Text } from '../components/ui/Text';
import { collection, getDocs, updateDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { db } from '../lib/firebase';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { resetMyAccount, TARGET_UID as MY_RESET_UID } from '../scripts/resetMyAccount';

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
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<TabType>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [editBalanceUser, setEditBalanceUser] = useState<AdminUser | null>(null);
  const [editBalanceText, setEditBalanceText] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const uSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'user')));
      const uList = uSnap.docs.map(d => ({
        uid: d.id,
        email: d.data().email ?? '',
        name: d.data().displayName ?? d.data().email ?? '',
        balance: d.data().balance ?? 10000000,
        totalAsset: d.data().totalAsset ?? 10000000,
        portfolio: d.data().portfolio ?? [],
      }));
      setUsers(uList.sort((a, b) => b.totalAsset - a.totalAsset));

      const tSnap = await getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc')));
      setTrades(tSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const handleEditBalance = (user: AdminUser) => {
    if (Platform.OS === 'ios') {
      Alert.prompt('잔액 수정', `${user.email}`, async (value) => {
        if (!value || isNaN(Number(value))) return;
        await updateDoc(doc(db, 'users', user.uid), { balance: Number(value) });
        Alert.alert('완료', '잔액 수정됐습니다.');
        loadData();
      }, 'plain-text', String(user.balance));
    } else {
      // Android: 인라인 수정 모달 사용
      setEditBalanceText(String(user.balance));
      setEditBalanceUser(user);
    }
  };

  const confirmEditBalance = async () => {
    if (!editBalanceUser || isNaN(Number(editBalanceText))) return;
    await updateDoc(doc(db, 'users', editBalanceUser.uid), { balance: Number(editBalanceText) });
    Alert.alert('완료', '잔액 수정됐습니다.');
    setEditBalanceUser(null);
    loadData();
  };

  const handleResetAll = () => {
    Alert.alert('전체 초기화', '모든 유저를 1000만원으로 초기화합니다.', [
      { text: '취소', style: 'cancel' },
      { text: '초기화', style: 'destructive', onPress: async () => {
        for (const u of users) {
          await updateDoc(doc(db, 'users', u.uid), { balance: 10000000, totalAsset: 10000000, initialBalance: 10000000, portfolio: [], transactions: [] });
        }
        Alert.alert('완료', `${users.length}명 초기화 완료`);
        loadData();
      }}
    ]);
  };

  // TODO: 전체 리셋 기능 추가 후 제거 — 임시 테스트용 본인 계정 리셋
  const handleResetMyAccount = () => {
    Alert.alert(
      '⚠️ 내 계정 데이터 완전 리셋',
      `대상 UID: ${MY_RESET_UID}\n\n자산/포트폴리오/거래/미션/학습이 모두 초기화되고 자동 로그아웃됩니다.\n관심종목·알림은 유지돼요.\n\n정말 리셋할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '리셋',
          style: 'destructive',
          onPress: async () => {
            const result = await resetMyAccount();
            console.log('🔁 [resetMyAccount] 결과:', result);
            if (result.success) {
              Alert.alert('완료', '리셋 후 로그아웃됩니다. 다시 로그인해주세요.', [
                { text: '확인', onPress: () => logout?.() },
              ]);
            } else {
              Alert.alert('일부 실패', result.errors.join('\n'));
            }
          },
        },
      ],
    );
  };

  const filteredTrades = trades.filter(t =>
    t.ticker?.includes(searchText.toUpperCase()) || t.userEmail?.includes(searchText)
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Android용 잔액 수정 인라인 모달 */}
      {editBalanceUser && (
        <View style={{
          position: 'absolute', inset: 0, zIndex: 100,
          backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24,
        }}>
          <View style={{ backgroundColor: theme.bgCard, borderRadius: 16, padding: 24, width: '100%' }}>
            <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>잔액 수정</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 12 }}>{editBalanceUser.email}</Text>
            <TextInput
              value={editBalanceText}
              onChangeText={setEditBalanceText}
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: theme.borderStrong, borderRadius: 8, padding: 12, color: theme.text, fontSize: 16, marginBottom: 16 }}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setEditBalanceUser(null)} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.bgInput, alignItems: 'center' }}>
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmEditBalance} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.primary, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: theme.bgCard, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>🛡️ 관리자</Text>
          <TouchableOpacity onPress={handleResetAll} style={{ backgroundColor: theme.red, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>전체 초기화</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('관리자종합')}
          style={{ marginTop: 12, backgroundColor: theme.primary, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>📊 종합 대시보드</Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 }}>사용자·거래·학습·자산·커뮤니티 실시간 통계</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>›</Text>
        </TouchableOpacity>
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
                    총 {u.totalAsset.toLocaleString()}원 · <Text style={{ color: u.totalAsset >= 10000000 ? theme.red : theme.blue }}>
                      {((u.totalAsset - 10000000) / 10000000 * 100).toFixed(2)}%
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
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>모든 유저 자산을 1000만원으로 초기화</Text>
          </TouchableOpacity>

          {/* TODO: 전체 리셋 기능 추가 후 제거 — 임시 본인 계정 리셋 버튼 */}
          <TouchableOpacity onPress={handleResetMyAccount}
            style={{ backgroundColor: '#B00020', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center', borderWidth: 2, borderColor: '#FF4444' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>🚨 내 계정 데이터 완전 리셋 (테스트용)</Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 }}>UID {MY_RESET_UID.slice(0, 12)}…만 리셋 + 자동 로그아웃</Text>
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
