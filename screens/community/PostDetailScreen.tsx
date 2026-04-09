import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  doc, collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove,
  increment, serverTimestamp, getDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Colors } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getPost, deletePost, type CommunityPost } from '../../lib/firestoreService';

interface Comment {
  id: string;
  uid: string;
  nickname: string;
  investmentTypeEmoji: string;
  content: string;
  likes: string[];
  createdAt: any;
}

const formatTime = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
};

export default function PostDetailScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const postId = route.params?.postId ?? '';
  const { user } = useAuth();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingPost, setLoadingPost] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load post once
  const loadPost = useCallback(async () => {
    if (!postId) { setLoadingPost(false); return; }
    try {
      const data = await getPost(postId);
      setPost(data);
    } catch {
      setPost(null);
    } finally {
      setLoadingPost(false);
    }
  }, [postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  // Real-time comments via onSnapshot
  useEffect(() => {
    if (!postId) return;
    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Comment[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        likes: d.data().likes ?? [],
      } as Comment));
      setComments(data);
    }, (error) => {
      console.error('댓글 실시간 리스너 오류:', error);
    });
    return () => unsubscribe();
  }, [postId]);

  const handleTogglePostLike = async () => {
    if (!user?.id || !post) return;
    try {
      const postRef = doc(db, 'posts', postId);
      const postLikes = post.likes ?? [];
      const isLiked = postLikes.includes(user.id);
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(user.id) : arrayUnion(user.id),
      });
      setPost(prev => {
        if (!prev) return null;
        const prevLikes = prev.likes ?? [];
        return {
          ...prev,
          likes: isLiked ? prevLikes.filter(id => id !== user.id) : [...prevLikes, user.id],
        };
      });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('좋아요 오류:', error);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !user?.id || submitting) return;
    setSubmitting(true);
    try {
      const userSnap = await getDoc(doc(db, 'users', user.id));
      const userData = userSnap.exists() ? userSnap.data() : {};
      const nickname = userData?.name ?? userData?.nickname ?? '익명';
      const emoji = userData?.investmentType?.emoji ?? '📊';

      await addDoc(collection(db, 'posts', postId, 'comments'), {
        uid: user.id,
        nickname,
        investmentTypeEmoji: emoji,
        content: commentText.trim(),
        likes: [],
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'posts', postId), {
        commentCount: increment(1),
      });
      setCommentText('');
      Keyboard.dismiss();
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      Alert.alert('오류', '댓글 작성 중 오류가 발생했어요');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleCommentLike = async (commentId: string) => {
    if (!user?.id) return;
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);
    const comment = comments.find(c => c.id === commentId);
    const isLiked = comment?.likes?.includes(user.id);
    await updateDoc(commentRef, {
      likes: isLiked ? arrayRemove(user.id) : arrayUnion(user.id),
    });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert('댓글 삭제', '댓글을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
          await updateDoc(doc(db, 'posts', postId), { commentCount: increment(-1) });
        },
      },
    ]);
  };

  const handleDeletePost = () => {
    Alert.alert('게시물 삭제', '게시물을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deletePost(postId);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleReport = () => {
    Alert.alert('신고 사유', '신고 사유를 선택해주세요', [
      { text: '스팸', onPress: () => submitReport('스팸') },
      { text: '욕설/비하', onPress: () => submitReport('욕설') },
      { text: '허위정보', onPress: () => submitReport('허위정보') },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const submitReport = async (reason: string) => {
    if (!user?.id) return;
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: user.id,
        targetType: 'post',
        targetId: postId,
        reason,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      Alert.alert('신고 완료', '관리자가 검토할 예정이에요');
    } catch {
      Alert.alert('오류', '신고 접수에 실패했어요');
    }
  };

  const isLiked = user && post ? (post.likes ?? []).includes(user.id) : false;

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
      paddingHorizontal: 4, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerIconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: Colors.text },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    errorText: { fontSize: 15, color: Colors.textSub },
    listContent: { paddingBottom: 16 },
    postSection: { backgroundColor: Colors.card, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 },
    authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
    avatarCircle: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center',
    },
    avatarEmoji: { fontSize: 18 },
    authorInfo: { flex: 1, gap: 2 },
    authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    authorNickname: { fontSize: 15, fontWeight: '600', color: Colors.text },
    myBadge: { backgroundColor: '#0066FF20', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    myBadgeText: { color: theme.primary, fontSize: 11, fontWeight: '600' },
    postTime: { fontSize: 12, color: Colors.textMuted },
    postContent: { fontSize: 16, color: Colors.text, lineHeight: 24, marginBottom: 14, paddingHorizontal: 0 },
    tickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
    tickerChip: { backgroundColor: theme.bg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
    tickerChipText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
    actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
    actionsLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    likeButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
    likeCount: { fontSize: 14, color: Colors.textSub, fontWeight: '600' },
    likeCountActive: { color: theme.red },
    commentCountRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    commentCountText: { fontSize: 14, color: Colors.textSub, fontWeight: '600' },
    deletePostButton: { padding: 6, borderRadius: 8, backgroundColor: Colors.bg },
    thickDivider: { height: 8, backgroundColor: theme.bg },
    commentsHeader: {
      backgroundColor: Colors.card, paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    commentsTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
    commentItem: {
      backgroundColor: Colors.card, paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: theme.bg,
    },
    commentRow: { flexDirection: 'row', gap: 10 },
    commentBody: { flex: 1, gap: 4 },
    commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    commentNickname: { fontSize: 13, fontWeight: '600', color: Colors.text },
    commentTime: { fontSize: 12, color: Colors.textMuted, marginLeft: 'auto' },
    commentContent: { fontSize: 15, color: Colors.text, lineHeight: 22 },
    commentActions: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
    commentLikeButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    commentLikeCount: { fontSize: 12, color: Colors.textSub, fontWeight: '600' },
    commentLikeCountActive: { color: theme.red },
    deleteCommentText: { fontSize: 12, color: Colors.textMuted },
    emptyComments: { backgroundColor: Colors.card, paddingVertical: 40, alignItems: 'center' },
    emptyCommentsText: { fontSize: 14, color: Colors.textSub },
    inputBar: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
      borderTopWidth: 1, borderTopColor: theme.borderStrong,
      paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    },
    inputAvatarSmall: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center',
    },
    inputAvatarEmoji: { fontSize: 14 },
    commentInput: {
      flex: 1, backgroundColor: theme.bg, borderRadius: 20,
      paddingHorizontal: 14, paddingVertical: 10,
      fontSize: 14, color: Colors.text, maxHeight: 80,
    },
    sendButton: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    sendButtonDisabled: { backgroundColor: theme.borderStrong },
  });

  const renderComment = ({ item }: { item: Comment }) => {
    const commentLiked = user ? item.likes.includes(user.id) : false;
    const isMyComment = user?.id === item.uid;
    return (
      <View style={styles.commentItem}>
        <View style={styles.commentRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>{item.investmentTypeEmoji || '📊'}</Text>
          </View>
          <View style={styles.commentBody}>
            <View style={styles.commentMeta}>
              <Text style={styles.commentNickname}>{item.nickname}</Text>
              {isMyComment && (
                <View style={styles.myBadge}>
                  <Text style={styles.myBadgeText}>나</Text>
                </View>
              )}
              <Text style={styles.commentTime}>{formatTime(item.createdAt)}</Text>
            </View>
            <Text style={styles.commentContent}>{item.content}</Text>
            <View style={styles.commentActions}>
              <TouchableOpacity
                style={styles.commentLikeButton}
                onPress={() => handleToggleCommentLike(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={commentLiked ? 'heart' : 'heart-outline'}
                  size={14}
                  color={commentLiked ? theme.red : Colors.textSub}
                />
                {item.likes.length > 0 && (
                  <Text style={[styles.commentLikeCount, commentLiked && styles.commentLikeCountActive]}>
                    {item.likes.length}
                  </Text>
                )}
              </TouchableOpacity>
              {isMyComment && (
                <TouchableOpacity
                  onPress={() => handleDeleteComment(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.deleteCommentText}>삭제</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const ListHeader = () => {
    if (!post) return null;
    const isMyPost = user?.id === post.uid;
    return (
      <>
        <View style={styles.postSection}>
          {/* Author row */}
          <View style={styles.authorRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>{post.investmentTypeEmoji || '📊'}</Text>
            </View>
            <View style={styles.authorInfo}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorNickname}>{post.nickname}</Text>
                {isMyPost && (
                  <View style={styles.myBadge}>
                    <Text style={styles.myBadgeText}>나</Text>
                  </View>
                )}
              </View>
              <Text style={styles.postTime}>{formatTime(post.createdAt)}</Text>
            </View>
          </View>

          {/* Content */}
          <Text style={styles.postContent}>{post.content}</Text>

          {/* Ticker tags */}
          {post.tickers && post.tickers.length > 0 && (
            <View style={styles.tickerRow}>
              {post.tickers.map((ticker: string) => (
                <View key={ticker} style={styles.tickerChip}>
                  <Text style={styles.tickerChipText}>#{ticker}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Like + comment count row */}
          <View style={styles.actionsRow}>
            <View style={styles.actionsLeft}>
              <TouchableOpacity style={styles.likeButton} onPress={handleTogglePostLike}>
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isLiked ? theme.red : Colors.textSub}
                />
                <Text style={[styles.likeCount, isLiked && styles.likeCountActive]}>
                  {(post.likes ?? []).length}
                </Text>
              </TouchableOpacity>
              <View style={styles.commentCountRow}>
                <Ionicons name="chatbubble-outline" size={16} color={Colors.textSub} />
                <Text style={styles.commentCountText}>{post.commentCount ?? 0}</Text>
              </View>
            </View>

            {/* Delete button (mine only) */}
            {isMyPost && (
              <TouchableOpacity style={styles.deletePostButton} onPress={handleDeletePost}>
                <Ionicons name="trash-outline" size={16} color={Colors.textSub} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Thick divider */}
        <View style={styles.thickDivider} />

        {/* Comments section header */}
        <View style={styles.commentsHeader}>
          <Text style={styles.commentsTitle}>댓글 {comments.length}</Text>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>게시물</Text>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={handleReport}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="flag-outline" size={22} color={Colors.textSub} />
        </TouchableOpacity>
      </View>

      {loadingPost ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : !post ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>게시물을 불러올 수 없어요.</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            ListHeaderComponent={<ListHeader />}
            ListEmptyComponent={
              <View style={styles.emptyComments}>
                <Text style={styles.emptyCommentsText}>아직 댓글이 없어요</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            <View style={styles.inputBar}>
              <View style={styles.inputAvatarSmall}>
                <Text style={styles.inputAvatarEmoji}>
                  {(user as any)?.investmentTypeEmoji ?? '📊'}
                </Text>
              </View>
              <TextInput
                style={styles.commentInput}
                placeholder="댓글을 입력하세요..."
                placeholderTextColor={Colors.textMuted}
                value={commentText}
                onChangeText={setCommentText}
                multiline={false}
                returnKeyType="send"
                onSubmitEditing={handleAddComment}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!commentText.trim() || submitting) && styles.sendButtonDisabled,
                ]}
                onPress={handleAddComment}
                disabled={!commentText.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={theme.bgCard} />
                ) : (
                  <Ionicons name="send" size={18} color={theme.bgCard} />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </>
      )}
    </SafeAreaView>
  );
}
