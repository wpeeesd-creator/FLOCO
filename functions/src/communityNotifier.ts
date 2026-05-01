import { sendPushToAllUsers } from './sendPush';

interface PostData {
  uid: string;
  nickname?: string;
  content?: string;
  category?: string;
}

export async function notifyNewPost(post: PostData): Promise<void> {
  try {
    const authorName = post.nickname ?? '익명';
    const raw = post.content?.trim() ?? '';
    const preview = raw.length > 30 ? raw.slice(0, 30) + '...' : raw || '새 글';

    await sendPushToAllUsers(
      `💬 ${authorName}`,
      preview,
      {
        type: 'community_new_post',
        authorUid: post.uid,
        category: post.category ?? null,
      },
      post.uid
    );
  } catch (error) {
    console.error('커뮤니티 알림 발송 실패:', error);
  }
}
