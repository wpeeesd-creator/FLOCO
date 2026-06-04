/**
 * 관리자 메뉴 화면 — 분석/운영 도구 진입 + 유저 관리(잔액 수정) + 기타 운영 기능
 * 토스 톤 라이트 디자인 (DS 토큰 — AdminDashboardScreen과 동일)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Text } from '../components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  LayoutDashboard,
  School,
  TrendingUp,
  GraduationCap,
  BarChart3,
  LineChart,
  AlertTriangle,
  Download,
  MessageSquare,
  ChevronRight,
  Tag,
  RotateCcw,
  UserX,
  Pencil,
} from 'lucide-react-native';
import { collection, getDocs, updateDoc, doc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { normalizeCategory } from '../lib/firestoreService';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { resetMyAccount, TARGET_UID as MY_RESET_UID } from '../scripts/resetMyAccount';

interface AdminUser {
  uid: string;
  email: string;
  name: string;
  balance: number;
  totalAsset: number;
}

export default function AdminScreen() {
  const { theme } = useTheme();
  const { logout } = useAuth();
  const navigation = useNavigation<any>();

  // 디자인 토큰 — 다른 admin 화면과 동일 (PPT 캡처용 고정 라이트 톤)
  const DS = {
    bg: '#F9FAFB',
    cardBg: '#FFFFFF',
    text: '#1F2937',
    textSub: '#6B7280',
    textMuted: '#9CA3AF',
    primary: theme.primary ?? '#0066FF',
    border: '#F3F4F6',
    negative: '#EF4444',
  };

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [editBalanceUser, setEditBalanceUser] = useState<AdminUser | null>(null);
  const [editBalanceText, setEditBalanceText] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const uSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'user')));
      const uList = uSnap.docs.map(d => ({
        uid: d.id,
        email: d.data().email ?? '',
        name: d.data().displayName ?? d.data().nickname ?? d.data().name ?? d.data().email ?? '',
        balance: d.data().balance ?? 10000000,
        totalAsset: d.data().totalAsset ?? 10000000,
      }));
      setUsers(uList.sort((a, b) => b.totalAsset - a.totalAsset));
    } catch (e) { console.error(e); }
  };

  // ── 유저 잔액 수정 (기존 기능 유지) ──
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

  // ── 전체 초기화 (기존 기능 유지) ──
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

  // TODO: 전체 리셋 기능 추가 후 제거 — 임시 테스트용 본인 계정 리셋 (기존 기능 유지)
  const handleResetMyAccount = () => {
    Alert.alert(
      '내 계정 데이터 완전 리셋',
      `대상 UID: ${MY_RESET_UID}\n\n자산/포트폴리오/거래/미션/학습이 모두 초기화되고 자동 로그아웃됩니다.\n관심종목·알림은 유지돼요.\n\n정말 리셋할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '리셋',
          style: 'destructive',
          onPress: async () => {
            const result = await resetMyAccount();
            console.log('[resetMyAccount] 결과:', result);
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

  // ── 카테고리 마이그레이션 (기존 기능 유지 — 로직 무변경) ──
  const handleMigrateCategories = () => {
    Alert.alert(
      '카테고리 마이그레이션',
      '기존 글의 카테고리를 3종(질문/포트폴리오/시장뉴스)으로 정규화합니다. 진행할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '진행',
          onPress: async () => {
            try {
              const postsRef = collection(db, 'posts');
              const snapshot = await getDocs(postsRef);
              const batch = writeBatch(db);
              let migrated = 0;
              let valid = 0;
              snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const oldCategory = data.category as string;
                const newCategory = normalizeCategory(oldCategory);
                if (oldCategory !== newCategory) {
                  batch.update(docSnap.ref, { category: newCategory });
                  migrated++;
                } else {
                  valid++;
                }
              });
              if (migrated > 0) await batch.commit();
              Alert.alert('완료', `변환: ${migrated}개 / 이미 유효: ${valid}개`);
            } catch (e: any) {
              Alert.alert('오류', e?.message ?? '마이그레이션 실패');
            }
          },
        },
      ],
    );
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: DS.bg },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: DS.cardBg,
      borderBottomWidth: 1,
      borderBottomColor: DS.border,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: DS.text },
    scrollContent: { padding: 16, paddingBottom: 100 }, // 탭바 가림 방지
    // 메인 카드 (종합 대시보드)
    mainCard: {
      backgroundColor: DS.primary,
      padding: 20,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 24,
    },
    mainCardTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
    mainCardSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
    // 섹션 + 그리드
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: DS.textSub,
      marginTop: 8,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    gridItem: {
      width: '48.5%',
      backgroundColor: DS.cardBg,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      gap: 8,
      minHeight: 90,
      justifyContent: 'center',
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: DS.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    gridLabel: { fontSize: 13, fontWeight: '600', color: DS.text, textAlign: 'center' },
    // 기타 리스트 행
    etcCard: {
      backgroundColor: DS.cardBg,
      borderRadius: 12,
      marginBottom: 16,
      overflow: 'hidden',
    },
    etcRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: DS.border,
    },
    etcLabel: { fontSize: 14, fontWeight: '600', color: DS.text, flex: 1 },
    etcDesc: { fontSize: 11, color: DS.textMuted, marginTop: 2 },
    // 유저 관리
    userCard: {
      backgroundColor: DS.cardBg,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    userName: { fontSize: 14, fontWeight: '700', color: DS.text },
    userEmail: { fontSize: 11, color: DS.textMuted, marginTop: 1 },
    userAsset: { fontSize: 13, color: DS.text, marginTop: 4, fontWeight: '600' },
    userBalance: { fontSize: 11, color: DS.textSub, marginTop: 1 },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: DS.primary + '15',
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 8,
    },
    editBtnText: { color: DS.primary, fontSize: 12, fontWeight: '700' },
    // Android 잔액 수정 모달
    modalOverlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 100,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalBox: { backgroundColor: DS.cardBg, borderRadius: 16, padding: 24, width: '100%' },
  });

  const GridItem = ({ icon: Icon, label, onPress, color }: {
    icon: any;
    label: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity style={styles.gridItem} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.iconWrap, color ? { backgroundColor: color + '20' } : null]}>
        <Icon size={22} color={color ?? DS.primary} strokeWidth={2} />
      </View>
      <Text style={styles.gridLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const EtcRow = ({ icon: Icon, label, desc, color, onPress }: {
    icon: any;
    label: string;
    desc?: string;
    color?: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.etcRow} onPress={onPress} activeOpacity={0.7}>
      <Icon size={18} color={color ?? DS.textSub} strokeWidth={2} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.etcLabel, color ? { color } : null]}>{label}</Text>
        {desc ? <Text style={styles.etcDesc}>{desc}</Text> : null}
      </View>
      <ChevronRight size={16} color={DS.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Android용 잔액 수정 인라인 모달 (기존 기능 유지) */}
      {editBalanceUser && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={{ color: DS.text, fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>잔액 수정</Text>
            <Text style={{ color: DS.textSub, fontSize: 13, marginBottom: 12 }}>{editBalanceUser.email}</Text>
            <TextInput
              value={editBalanceText}
              onChangeText={setEditBalanceText}
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: DS.border, borderRadius: 8, padding: 12, color: DS.text, fontSize: 16, marginBottom: 16 }}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setEditBalanceUser(null)} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: DS.bg, alignItems: 'center' }}>
                <Text style={{ color: DS.textSub, fontWeight: '600' }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmEditBalance} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: DS.primary, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>관리자</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 종합 대시보드 — 풀폭 강조 카드 */}
        <TouchableOpacity
          style={styles.mainCard}
          onPress={() => navigation.navigate('관리자종합')}
          activeOpacity={0.85}
        >
          <LayoutDashboard size={28} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.mainCardTitle}>종합 대시보드</Text>
            <Text style={styles.mainCardSub}>전체 지표 한눈에 보기</Text>
          </View>
          <ChevronRight size={20} color="#fff" />
        </TouchableOpacity>

        {/* 분석 도구 */}
        <Text style={styles.sectionLabel}>분석 도구</Text>
        <View style={styles.grid}>
          <GridItem icon={School} label="학교별 현황" onPress={() => navigation.navigate('학교별현황')} />
          <GridItem icon={TrendingUp} label="가입 퍼널" onPress={() => navigation.navigate('가입퍼널')} />
          <GridItem icon={GraduationCap} label="학습 효과" onPress={() => navigation.navigate('학습효과분석')} />
          <GridItem icon={BarChart3} label="종목 TOP" onPress={() => navigation.navigate('거래종목TOP')} />
          <GridItem icon={LineChart} label="성장 추이" onPress={() => navigation.navigate('성장추이')} />
          <GridItem icon={MessageSquare} label="이유 품질" onPress={() => navigation.navigate('이유품질')} />
        </View>

        {/* 운영 도구 */}
        <Text style={styles.sectionLabel}>운영 도구</Text>
        <View style={styles.grid}>
          <GridItem
            icon={AlertTriangle}
            label="위험 모니터링"
            color="#EF4444"
            onPress={() => navigation.navigate('위험모니터링')}
          />
          <GridItem icon={Download} label="CSV 내보내기" onPress={() => navigation.navigate('데이터내보내기')} />
        </View>

        {/*
          ⚠️ 임시 숨김 — 더미 데이터 포함 화면 (사업계획서 시연/캡처 시 노출 방지):
          - AdminStatsScreen (관리자통계: Math.random 주간 차트)
          - AdminLearningStatsScreen (학습통계: 하드코딩 오답 TOP5)
          - AdminReportScreen (신고관리: createReport 호출처 없어 항상 빈 목록)
          - AdminEventScreen (이벤트관리)
          - AdminPopularStocksScreen (인기종목 — 거래종목TOP으로 대체됨)
          - AdminTradeLogScreen (거래로그 — 거래내역 탭으로 대체됨)
          라우트('관리자통계' 등)는 그대로 등록돼 있음. 빌드 12에서 실데이터로 교체 후 복구.
        */}

        {/* 기타 운영 기능 */}
        <Text style={styles.sectionLabel}>기타</Text>
        <View style={styles.etcCard}>
          <EtcRow
            icon={Tag}
            label="카테고리 정규화"
            desc="커뮤니티 글 카테고리 3종으로 마이그레이션"
            onPress={handleMigrateCategories}
          />
          <EtcRow
            icon={RotateCcw}
            label="전체 초기화"
            desc="모든 유저 자산을 1000만원으로 초기화"
            color={DS.negative}
            onPress={handleResetAll}
          />
          <EtcRow
            icon={UserX}
            label="내 계정 데이터 완전 리셋 (테스트용)"
            desc={`UID ${MY_RESET_UID.slice(0, 12)}…만 리셋 + 자동 로그아웃`}
            color={DS.negative}
            onPress={handleResetMyAccount}
          />
        </View>

        {/* 유저 관리 — 잔액 수정 (기존 기능 유지) */}
        <Text style={styles.sectionLabel}>유저 관리 ({users.length}명)</Text>
        {users.map((u) => (
          <View key={u.uid} style={styles.userCard}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.userName} numberOfLines={1}>{u.name}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{u.email}</Text>
              <Text style={styles.userAsset}>
                총 {u.totalAsset.toLocaleString()}원{' '}
                <Text style={{ color: u.totalAsset >= 10000000 ? '#EF4444' : '#3478F6' }}>
                  {((u.totalAsset - 10000000) / 10000000 * 100).toFixed(2)}%
                </Text>
              </Text>
              <Text style={styles.userBalance}>현금 {u.balance.toLocaleString()}원</Text>
            </View>
            <TouchableOpacity onPress={() => handleEditBalance(u)} style={styles.editBtn} activeOpacity={0.75}>
              <Pencil size={12} color={DS.primary} />
              <Text style={styles.editBtnText}>잔액수정</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
