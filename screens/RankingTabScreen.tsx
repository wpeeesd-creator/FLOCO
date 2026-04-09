import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import RankingScreen from './RankingScreen';
import ClassRankingScreen from './ClassRankingScreen';
import CommunityScreen from './community/CommunityScreen';

type Tab = '전체' | '우리 반' | '커뮤니티';
const TABS: Tab[] = ['전체', '우리 반', '커뮤니티'];

interface SchoolInfo {
  name: string;
  grade: string;
  classNum: string;
  classId: string;
}

export default function RankingTabScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('전체');
  const [school, setSchool] = useState<SchoolInfo | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const unsub = onSnapshot(doc(db, 'users', user.id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSchool(data?.school ?? null);
      }
    });
    return () => unsub();
  }, [user?.id]);

  const renderContent = () => {
    if (tab === '전체') return <RankingScreen />;
    if (tab === '커뮤니티') return <CommunityScreen navigation={navigation} />;

    // 우리 반 탭
    if (!school) {
      return (
        <View style={styles.emptyClass}>
          <Text style={styles.emptyEmoji}>🏫</Text>
          <Text style={styles.emptyText}>
            학교/반을 설정하면{'\n'}반 친구들과 경쟁할 수 있어요!
          </Text>
          <TouchableOpacity
            onPress={() => navigation.getParent()?.navigate('마이페이지Tab', { screen: '학교반설정' })}
            style={styles.emptyBtn}
            activeOpacity={0.85}
          >
            <Text style={[styles.emptyBtnText, { color: theme.bgCard }]}>학교/반 설정하기</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ClassRankingScreen
        classId={school.classId}
        schoolName={school.name}
        grade={school.grade}
        classNum={school.classNum}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Sub-tab bar */}
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  tabBtn: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSub,
  },
  tabTextActive: {
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  emptyClass: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    color: Colors.textSub,
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    height: 44,
    justifyContent: 'center',
  },
  emptyBtnText: {
    fontWeight: '700',
  },
});
