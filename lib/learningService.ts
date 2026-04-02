import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './firebase';

export interface ReviewItem {
  lessonId: string;
  categoryId: string;
  reviewDates: number[]; // timestamps
}

export interface LearningData {
  streak: number;
  hearts: number;          // max 3
  totalPoints: number;
  lastStudyDate: string;   // YYYY-MM-DD
  completedLessons: string[]; // lesson IDs like "vocabulary_vocab_1_0"
  wrongAnswers: string[];     // question IDs
  reviewSchedule: ReviewItem[];
  categoryProgress: Record<string, { completed: number; total: number }>;
}

const DEFAULT_LEARNING: LearningData = {
  streak: 0,
  hearts: 3,
  totalPoints: 0,
  lastStudyDate: '',
  completedLessons: [],
  wrongAnswers: [],
  reviewSchedule: [],
  categoryProgress: {
    vocabulary: { completed: 0, total: 10 },
    newsLearning: { completed: 0, total: 8 },
    chartAnalysis: { completed: 0, total: 12 },
    companyAnalysis: { completed: 0, total: 10 },
    psychology: { completed: 0, total: 8 },
    macro: { completed: 0, total: 10 },
  },
};

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const y = yesterday.getFullYear();
  const m = String(yesterday.getMonth() + 1).padStart(2, '0');
  const d = String(yesterday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function learningDocRef(uid: string) {
  return doc(db, 'users', uid, 'learning', 'data');
}

export async function getLearningData(uid: string): Promise<LearningData> {
  try {
    const ref = learningDocRef(uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as LearningData;
    }
    await setDoc(ref, DEFAULT_LEARNING);
    return { ...DEFAULT_LEARNING };
  } catch (error) {
    console.error('getLearningData error:', error);
    return { ...DEFAULT_LEARNING };
  }
}

export async function saveLearningData(uid: string, data: Partial<LearningData>): Promise<void> {
  try {
    const ref = learningDocRef(uid);
    await setDoc(ref, data, { merge: true });
  } catch (error) {
    console.error('saveLearningData error:', error);
  }
}

export async function completeLesson(
  uid: string,
  lessonId: string,
  categoryId: string,
  points: number,
  wrongQuestionIds?: string[]
): Promise<void> {
  try {
    const ref = learningDocRef(uid);
    const snap = await getDoc(ref);
    const current: LearningData = snap.exists()
      ? (snap.data() as LearningData)
      : { ...DEFAULT_LEARNING };

    const today = getTodayString();
    const yesterday = getYesterdayString();

    let newStreak = current.streak;
    if (current.lastStudyDate === today) {
      // already studied today, no change
    } else if (current.lastStudyDate === yesterday) {
      newStreak = current.streak + 1;
    } else {
      newStreak = 1;
    }

    const prevCategoryProgress = current.categoryProgress ?? DEFAULT_LEARNING.categoryProgress;
    const prevCategoryEntry = prevCategoryProgress[categoryId] ?? { completed: 0, total: 0 };
    const updatedCategoryProgress = {
      ...prevCategoryProgress,
      [categoryId]: {
        ...prevCategoryEntry,
        completed: prevCategoryEntry.completed + 1,
      },
    };

    const updates: Record<string, unknown> = {
      completedLessons: arrayUnion(lessonId),
      totalPoints: (current.totalPoints ?? 0) + points,
      streak: newStreak,
      lastStudyDate: today,
      categoryProgress: updatedCategoryProgress,
    };

    if (wrongQuestionIds && wrongQuestionIds.length > 0) {
      updates.wrongAnswers = arrayUnion(...wrongQuestionIds);
    }

    await setDoc(ref, updates, { merge: true });
  } catch (error) {
    console.error('completeLesson error:', error);
  }
}

export async function saveWrongAnswer(uid: string, questionId: string): Promise<void> {
  try {
    const ref = learningDocRef(uid);
    await updateDoc(ref, { wrongAnswers: arrayUnion(questionId) });
  } catch (error) {
    console.error('saveWrongAnswer error:', error);
  }
}

export async function removeWrongAnswer(uid: string, questionId: string): Promise<void> {
  try {
    const ref = learningDocRef(uid);
    await updateDoc(ref, { wrongAnswers: arrayRemove(questionId) });
  } catch (error) {
    console.error('removeWrongAnswer error:', error);
  }
}

export async function loseHeart(uid: string): Promise<number> {
  try {
    const ref = learningDocRef(uid);
    const snap = await getDoc(ref);
    const current: LearningData = snap.exists()
      ? (snap.data() as LearningData)
      : { ...DEFAULT_LEARNING };

    const newHearts = Math.max(0, (current.hearts ?? 3) - 1);
    await setDoc(ref, { hearts: newHearts }, { merge: true });
    return newHearts;
  } catch (error) {
    console.error('loseHeart error:', error);
    return 0;
  }
}

export async function restoreHearts(uid: string): Promise<void> {
  try {
    const ref = learningDocRef(uid);
    await setDoc(ref, { hearts: 3 }, { merge: true });
  } catch (error) {
    console.error('restoreHearts error:', error);
  }
}

export async function scheduleReview(uid: string, lessonId: string, categoryId: string): Promise<void> {
  try {
    const ref = learningDocRef(uid);
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const reviewItem: ReviewItem = {
      lessonId,
      categoryId,
      reviewDates: [
        now + 1 * DAY,
        now + 3 * DAY,
        now + 7 * DAY,
        now + 30 * DAY,
      ],
    };
    await updateDoc(ref, { reviewSchedule: arrayUnion(reviewItem) });
  } catch (error) {
    console.error('scheduleReview error:', error);
  }
}

export async function getDueReviews(uid: string): Promise<ReviewItem[]> {
  try {
    const ref = learningDocRef(uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];

    const data = snap.data() as LearningData;
    const now = Date.now();
    const schedule: ReviewItem[] = data.reviewSchedule ?? [];

    return schedule.filter((item) =>
      item.reviewDates.some((date) => date <= now)
    );
  } catch (error) {
    console.error('getDueReviews error:', error);
    return [];
  }
}
