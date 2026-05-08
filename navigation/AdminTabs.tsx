import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AdminScreen from '../screens/AdminScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUserTradesScreen from '../screens/admin/AdminUserTradesScreen';
import AdminUserDetailScreen from '../screens/admin/AdminUserDetailScreen';
import AdminStatsScreen from '../screens/admin/AdminStatsScreen';
import AdminTradeLogScreen from '../screens/admin/AdminTradeLogScreen';
import AdminReportScreen from '../screens/admin/AdminReportScreen';
import AdminLearningStatsScreen from '../screens/admin/AdminLearningStatsScreen';
import AdminPopularStocksScreen from '../screens/admin/AdminPopularStocksScreen';
import AdminEventScreen from '../screens/admin/AdminEventScreen';
import RankingScreen from '../screens/RankingScreen';

export type AdminTabParamList = {
  대시보드Tab: undefined;
  랭킹Tab: undefined;
  거래내역Tab: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();
const DashboardStack = createNativeStackNavigator();
const TradesStack = createNativeStackNavigator();

function DashboardNavigator() {
  return (
    <DashboardStack.Navigator id="AdminDashboardStack" screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="관리자종합" component={AdminDashboardScreen} />
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

function TradesNavigator() {
  return (
    <TradesStack.Navigator id="AdminTradesStack" screenOptions={{ headerShown: false }}>
      <TradesStack.Screen name="사용자거래목록" component={AdminUserTradesScreen} />
      <TradesStack.Screen name="사용자거래상세" component={AdminUserDetailScreen} />
    </TradesStack.Navigator>
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
        name="랭킹Tab"
        component={RankingScreen}
        options={{
          tabBarLabel: '랭킹',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="거래내역Tab"
        component={TradesNavigator}
        options={{
          tabBarLabel: '거래내역',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
