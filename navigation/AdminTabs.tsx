import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AdminScreen from '../screens/AdminScreen';
import AdminStatsScreen from '../screens/admin/AdminStatsScreen';
import AdminTradeLogScreen from '../screens/admin/AdminTradeLogScreen';
import AdminReportScreen from '../screens/admin/AdminReportScreen';
import AdminLearningStatsScreen from '../screens/admin/AdminLearningStatsScreen';
import AdminPopularStocksScreen from '../screens/admin/AdminPopularStocksScreen';
import AdminEventScreen from '../screens/admin/AdminEventScreen';
import RankingScreen from '../screens/RankingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SurveyScreen from '../screens/SurveyScreen';
import SurveyResultScreen from '../screens/SurveyResultScreen';

export type AdminTabParamList = {
  대시보드Tab: undefined;
  랭킹관리Tab: undefined;
  MYTab: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();
const DashboardStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function DashboardNavigator() {
  return (
    <DashboardStack.Navigator id="AdminDashboardStack" screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="대시보드메인" component={AdminScreen} />
      <DashboardStack.Screen name="관리자통계" component={AdminStatsScreen} />
      <DashboardStack.Screen name="거래로그" component={AdminTradeLogScreen} />
      <DashboardStack.Screen name="신고관리" component={AdminReportScreen} />
      <DashboardStack.Screen name="학습통계" component={AdminLearningStatsScreen} />
      <DashboardStack.Screen name="인기종목" component={AdminPopularStocksScreen} />
      <DashboardStack.Screen name="이벤트관리" component={AdminEventScreen} />
    </DashboardStack.Navigator>
  );
}

function AdminProfileNavigator() {
  return (
    <ProfileStack.Navigator id="AdminProfileStack" screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="프로필메인" component={ProfileScreen} />
      <ProfileStack.Screen name="투자유형설문" component={SurveyScreen} />
      <ProfileStack.Screen name="투자유형결과" component={SurveyResultScreen} />
    </ProfileStack.Navigator>
  );
}

export default function AdminTabs() {
  return (
    <Tab.Navigator
      id="AdminTabs"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0066FF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0.5,
          borderTopColor: '#E5E8EB',
          height: 56,
          paddingBottom: 6,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
      }}
    >
      <Tab.Screen
        name="대시보드Tab"
        component={DashboardNavigator}
        options={{
          tabBarLabel: '대시보드',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="랭킹관리Tab"
        component={RankingScreen}
        options={{
          tabBarLabel: '랭킹',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MYTab"
        component={AdminProfileNavigator}
        options={{
          tabBarLabel: 'MY',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
