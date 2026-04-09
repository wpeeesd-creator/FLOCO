import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Colors } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  getPosts, toggleLike,
  type CommunityPost,
} from '../../lib/firestoreService';

const TAGS = ['전체', '구독', '#모의투자', '#주식공부', '#수익인증', '#질문있어요', '#경제뉴스'] as const;
type Tag = typeof TAGS[number];

const TAG_TO_CATEGORY: Record<string, string> = {
  '전체': '전체',
  '#모의투자': '투자인증',
  '#주식공부': '분석',
  '#수익인증': '투자인증',
  '#질문있어요': '질문',
  '#경제뉴스': '자유',
};

const POPULAR_TAGS = [
  { rank: 1, tag: '#모의투자', subscribers: 1243 },
  { rank: 2, tag: '#수익인증', subscribers: 987 },
  { rank: 3, tag: '#주식공부', subscribers: 856 },
  { rank: 4, tag: '#질문있어요', subscribers: 734 },
  { rank: 5, tag: '#경제뉴스', subscribers: 621 },
];

const formatTime = (ts: number) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
};

interface Props {
  navigation: any;
}

export default function CommunityScreen({ navigation }: Props) {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedTag, setSelectedTag] = useState<Tag>('전체');
  const [subscribedTags, setSubscribedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load subscribed tags from Firestore on mount
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.id));
        if (snap.exists()) {
          const data = snap.data();
          setSubscribedTags(data.subscribedTags ?? []);
        }
      } catch {}
    })();
  }, [user?.id]);

  const loadPosts = useCallback(async () => {
    try {
      if (selectedTag === '구독') {
        // Fetch all posts, then filter client-side by subscribed tags
        const data = await getPosts('전체' as any);
        const filtered = data.filter((p) => {
          const postTags = [
            `#${p.category}`,
            ...p.tickers.map((t) => `#${t}`),
          ];
          return subscribedTags.some((st) => postTags.includes(st));
        });
        setPosts(filtered);
      } else {
        const category = TAG_TO_CATEGORY[selectedTag] as any;
        const data = await getPosts(category);
        setPosts(data);
      }
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTag, subscribedTags]);

  useEffect(() => {
    setLoading(true);
    loadPosts();
  }, [selectedTag, subscribedTags]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPosts();
  }, [loadPosts]);

  const handleLike = async (postId: string) => {
    if (!user?.id) return;
    await toggleLike(postId, user.id);
    loadPosts();
  };

  const toggleSubscribe = async (tag: string) => {
    if (!user?.id) return;
    const isSubscribed = subscribedTags.includes(tag);
    const updated = isSubscribed
      ? subscribedTags.filter((t) => t !== tag)
      : [...subscribedTags, tag];

    try {
      await updateDoc(doc(db, 'users', user.id), {
        subscribedTags: updated,
      });
      setSubscribedTags(updated);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert(
        isSubscribed ? '구독 취소' : '구독 완료',
        isSubscribed
          ? `${tag} 구독을 취소했어요`
          : `${tag} 태그를 구독했어요!`,
      );
    } catch {
      Alert.alert('오류', '잠시 후 다시 시도해주세요');
    }
  };

  const featuredPosts = posts.slice(0, 3);
  const remainingPosts = posts.slice(3);

  const PostCard = ({ post }: { post: CommunityPost }) => {
    const postLikes = post.likes ?? [];
    const liked = user ? postLikes.includes(user.id) : false;
    return (
      <TouchableOpacity
        style={styles.postCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('게시물상세', { postId: post.id })}
      >
        {/* Tags */}
        <View style={styles.cardTagRow}>
          {(post.tickers ?? []).map((t) => (
            <Text key={t} style={styles.cardTag}>#{t}</Text>
          ))}
          <Text style={styles.cardTag}>#{post.category}</Text>
        </View>
        {/* Title */}
        <Text style={styles.cardTitle} numberOfLines={2}>
          {(post.content ?? '').slice(0, 80)}
        </Text>
        {/* Time */}
        <Text style={styles.cardTime}>{formatTime(post.createdAt)}</Text>
        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => handleLike(post.id)}
            style={styles.actionBtn}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={16}
              color={liked ? theme.red : Colors.textSub}
            />
            <Text style={styles.actionText}>{postLikes.length}</Text>
          </TouchableOpacity>
          <View style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={16} color={Colors.textSub} />
            <Text style={styles.actionText}>{post.commentCount ?? 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>한눈에 보는 금융 이슈</Text>
        </View>

        {/* Tag Filter */}
        <View style={styles.tagFilterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagFilterContent}
          >
            {TAGS.map((tag) => {
              const isActive = selectedTag === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagPill, isActive && styles.tagPillActive]}
                  onPress={() => setSelectedTag(tag)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tagPillText, isActive && styles.tagPillTextActive, isActive && { color: theme.bgCard }]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ fontSize: 14, color: Colors.textSub, marginTop: 12 }}>게시물을 불러오는 중...</Text>
          </View>
        ) : (
          <>
            {/* Featured Posts */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>오늘의 추천 이슈</Text>
              {featuredPosts.length === 0 ? (
                <View style={styles.emptyBlock}>
                  <Text style={styles.emptyText}>아직 게시물이 없어요</Text>
                </View>
              ) : (
                featuredPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </View>

            {/* Popular Tags */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>20대에게 인기 많은 태그</Text>
              {POPULAR_TAGS.map((item) => {
                const isSubscribed = subscribedTags.includes(item.tag);
                return (
                  <View key={item.tag} style={styles.popularTagRow}>
                    <Text style={styles.popularTagRank}>{item.rank}</Text>
                    <View style={styles.popularTagInfo}>
                      <Text style={styles.popularTagName}>{item.tag}</Text>
                      <Text style={styles.popularTagSubs}>
                        구독자 {item.subscribers.toLocaleString()}명
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.subscribeBtn,
                        isSubscribed && styles.subscribeBtnActive,
                        isSubscribed && { backgroundColor: theme.primaryLight },
                      ]}
                      onPress={() => toggleSubscribe(item.tag)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.subscribeBtnText,
                          isSubscribed && styles.subscribeBtnTextActive,
                        ]}
                      >
                        {isSubscribed ? '구독중' : '구독'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* Subscribe Banner */}
            <TouchableOpacity style={styles.banner} activeOpacity={0.85}>
              <Text style={[styles.bannerTitle, { color: theme.bgCard }]}>관심 태그 구독하기</Text>
              <Text style={styles.bannerDesc}>
                관심 있는 태그를 구독하면{'\n'}맞춤 이슈를 바로 확인할 수 있어요
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.bgCard} style={styles.bannerIcon} />
            </TouchableOpacity>

            {/* Remaining Posts */}
            {remainingPosts.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>사람들이 많이 보고있는 이슈</Text>
                {remainingPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('게시물작성')}
        activeOpacity={0.85}
      >
        <Text style={[styles.fabText, { color: theme.bgCard }]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  headerSection: {
    backgroundColor: Colors.card,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  tagFilterWrapper: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tagFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  tagPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSub,
  },
  tagPillTextActive: {},
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  sectionBlock: {
    marginTop: 8,
    backgroundColor: Colors.card,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  postCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.bg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  cardTag: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 6,
  },
  cardTime: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    color: Colors.textSub,
  },
  popularTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  popularTagRank: {
    width: 24,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  popularTagInfo: {
    flex: 1,
    marginLeft: 8,
    gap: 2,
  },
  popularTagName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  popularTagSubs: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  subscribeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.card,
  },
  subscribeBtnActive: {
    borderColor: Colors.primary,
  },
  subscribeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  subscribeBtnTextActive: {
    color: Colors.primary,
  },
  banner: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  bannerDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  bannerIcon: {
    position: 'absolute',
    right: 20,
    top: '50%',
  },
  emptyBlock: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSub,
  },
  bottomPad: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 32,
  },
});
