/**
 * 관리자 — 특정 사용자 게시글 관리
 * route params(uid, name)로 진입 → 해당 유저의 posts 목록 조회
 * 각 카드: 제목/내용 미리보기/날짜 + 삭제(deleteDoc) / 경고(warnings arrayUnion) 버튼
 * 토스 톤 라이트 디자인 (DS 토큰 — AdminUserTradesScreen과 동일)
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, Trash2, AlertTriangle } from 'lucide-react-native';
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTheme } from '../../context/ThemeContext';

interface PostRow {
  id: string;
  title?: string;
  category?: string;
  content: string;
  createdAt: number;
}

// ── 헬퍼 ─────────────────────────────────────
function toMs(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : 0;
  }
  if (value?.seconds) return value.seconds * 1000;
  if (value?.toMillis) return value.toMillis();
  return 0;
}

function formatDate(ms: number): string {
  if (!ms) return '날짜 없음';
  const d = new Date(ms);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdminUserPostsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { uid, name } = (route.params ?? {}) as { uid: string; name?: string };

  // 디자인 토큰 — AdminUserTradesScreen과 동일 (고정 라이트 톤)
  const DS = {
    bg: '#F9FAFB',
    cardBg: '#FFFFFF',
    text: '#1F2937',
    textSub: '#6B7280',
    textMuted: '#9CA3AF',
    primary: theme.primary ?? '#0066FF',
    border: '#F3F4F6',
    warning: '#F59E0B',
    negative: '#EF4444',
  };

  const [rows, setRows] = useState<PostRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [warnVisible, setWarnVisible] = useState(false);
  const [warnReason, setWarnReason] = useState('');

  useEffect(() => {
    if (!uid) {
      setLoaded(true);
      return;
    }
    // where(uid)만 서버 필터 → 정렬은 클라이언트(복합 색인 불필요)
    const unsub = onSnapshot(
      query(collection(db, 'posts'), where('uid', '==', uid)),
      (snap) => {
        const list: PostRow[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            title: data.title,
            category: data.category,
            content: data.content ?? '',
            createdAt: toMs(data.createdAt),
          };
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        setRows(list);
        setLoaded(true);
      },
      (err) => {
        console.error('AdminUserPosts 구독 오류:', err);
        setLoaded(true);
      },
    );
    return () => unsub();
  }, [uid]);

  const handleDelete = (post: PostRow) => {
    Alert.alert(
      '게시글 삭제',
      '이 게시글을 삭제할까요? 되돌릴 수 없어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'posts', post.id));
            } catch (e) {
              console.error('게시글 삭제 실패:', e);
              Alert.alert('삭제 실패', '잠시 후 다시 시도해주세요.');
            }
          },
        },
      ],
    );
  };

  const handleWarn = () => {
    setWarnReason('');
    setWarnVisible(true);
  };

  const submitWarning = async () => {
    const trimmed = warnReason.trim();
    if (!trimmed) {
      Alert.alert('경고 사유 필요', '경고 사유를 입력해주세요.');
      return;
    }
    try {
      // serverTimestamp()는 arrayUnion 내부에서 사용 불가 → Date.now() 사용
      await updateDoc(doc(db, 'users', uid), {
        warnings: arrayUnion({ reason: trimmed, timestamp: Date.now() }),
      });
      setWarnVisible(false);
      setWarnReason('');
      Alert.alert('경고 전송 완료', `${name ?? '사용자'}에게 경고를 기록했어요.`);
    } catch (e) {
      console.error('경고 저장 실패:', e);
      Alert.alert('경고 실패', '잠시 후 다시 시도해주세요.');
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: DS.bg },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: DS.cardBg,
          borderBottomWidth: 1,
          borderBottomColor: DS.border,
        },
        backBtn: { width: 36, alignItems: 'flex-start' },
        headerTitleWrap: { flex: 1, alignItems: 'center' },
        headerTitle: { fontSize: 18, fontWeight: '700', color: DS.text },
        headerSub: { fontSize: 12, color: DS.textSub, marginTop: 2 },
        listContent: { padding: 16, paddingBottom: 100 }, // 탭바 가림 방지
        // 게시글 카드
        postCard: {
          backgroundColor: DS.cardBg,
          borderRadius: 16,
          padding: 16,
          marginBottom: 8,
          gap: 8,
        },
        metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        categoryBadge: {
          paddingHorizontal: 8,
          paddingVertical: 3,
          backgroundColor: DS.primary + '15',
          borderRadius: 6,
        },
        categoryBadgeText: { fontSize: 11, color: DS.primary, fontWeight: '700' },
        dateText: { fontSize: 12, color: DS.textMuted },
        postTitle: { fontSize: 15, fontWeight: '700', color: DS.text },
        postContent: { fontSize: 13, color: DS.textSub, lineHeight: 19 },
        actionRow: {
          flexDirection: 'row',
          gap: 8,
          marginTop: 4,
          borderTopWidth: 1,
          borderTopColor: DS.border,
          paddingTop: 12,
        },
        actionBtn: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingVertical: 10,
          borderRadius: 10,
        },
        warnBtn: { backgroundColor: DS.warning + '15' },
        warnBtnText: { fontSize: 13, fontWeight: '700', color: DS.warning },
        deleteBtn: { backgroundColor: DS.negative + '15' },
        deleteBtnText: { fontSize: 13, fontWeight: '700', color: DS.negative },
        center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        emptyState: { paddingVertical: 60, alignItems: 'center', gap: 8 },
        emptyTitle: { fontSize: 15, color: DS.textSub, marginTop: 8 },
        // 경고 입력 모달
        modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          padding: 24,
        },
        modalCard: {
          backgroundColor: DS.cardBg,
          borderRadius: 16,
          padding: 20,
          gap: 12,
        },
        modalTitle: { fontSize: 17, fontWeight: '700', color: DS.text },
        modalSub: { fontSize: 13, color: DS.textSub },
        modalInput: {
          borderWidth: 1,
          borderColor: DS.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 14,
          color: DS.text,
          minHeight: 88,
          textAlignVertical: 'top',
          backgroundColor: DS.bg,
        },
        modalBtnRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
        modalBtn: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          borderRadius: 10,
        },
        modalCancelBtn: { backgroundColor: DS.border },
        modalCancelText: { fontSize: 14, fontWeight: '700', color: DS.textSub },
        modalSubmitBtn: { backgroundColor: DS.warning },
        modalSubmitText: { fontSize: 14, fontWeight: '700', color: '#fff' },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme.primary],
  );

  if (!loaded) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DS.primary} />
          <Text style={styles.emptyTitle}>게시글 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={24} color={DS.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>게시글 관리</Text>
          <Text style={styles.headerSub}>
            {(name ?? '사용자')} · {rows.length}개
          </Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={rows}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>작성한 게시글이 없어요</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <View style={styles.metaRow}>
              {!!item.category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </View>
              )}
              <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            </View>

            <Text style={styles.postTitle} numberOfLines={1}>
              {item.title || item.category || '게시글'}
            </Text>
            <Text style={styles.postContent} numberOfLines={3}>
              {item.content || '(내용 없음)'}
            </Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={handleWarn}
                style={[styles.actionBtn, styles.warnBtn]}
                activeOpacity={0.8}
              >
                <AlertTriangle size={16} color={DS.warning} />
                <Text style={styles.warnBtnText}>경고</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                style={[styles.actionBtn, styles.deleteBtn]}
                activeOpacity={0.8}
              >
                <Trash2 size={16} color={DS.negative} />
                <Text style={styles.deleteBtnText}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        initialNumToRender={10}
        windowSize={11}
      />

      {/* 경고 사유 입력 모달 */}
      <Modal
        visible={warnVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWarnVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>경고 사유 입력</Text>
              <Text style={styles.modalSub}>
                {(name ?? '사용자')}에게 보낼 경고 사유를 입력하세요.
              </Text>
              <TextInput
                style={styles.modalInput}
                value={warnReason}
                onChangeText={setWarnReason}
                placeholder="경고 사유를 입력하세요"
                placeholderTextColor={DS.textMuted}
                multiline
                autoFocus
              />
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  onPress={() => setWarnVisible(false)}
                  style={[styles.modalBtn, styles.modalCancelBtn]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={submitWarning}
                  style={[styles.modalBtn, styles.modalSubmitBtn]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalSubmitText}>경고 전송</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
