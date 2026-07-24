import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LayoutDashboard, Trophy, Receipt } from 'lucide-react-native';
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
import AdminSchoolStatsScreen from '../screens/admin/AdminSchoolStatsScreen';
import AdminFunnelScreen from '../screens/admin/AdminFunnelScreen';
import AdminLearningImpactScreen from '../screens/admin/AdminLearningImpactScreen';
import AdminTopStocksScreen from '../screens/admin/AdminTopStocksScreen';
import AdminGrowthScreen from '../screens/admin/AdminGrowthScreen';
import AdminExportScreen from '../screens/admin/AdminExportScreen';
import AdminRiskMonitorScreen from '../screens/admin/AdminRiskMonitorScreen';
import AdminReasonQualityScreen from '../screens/admin/AdminReasonQualityScreen';
import AdminUserPostsScreen from '../screens/admin/AdminUserPostsScreen';
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
      <DashboardStack.Screen name="학교별현황" component={AdminSchoolStatsScreen} />
      <DashboardStack.Screen name="가입퍼널" component={AdminFunnelScreen} />
      <DashboardStack.Screen name="학습효과분석" component={AdminLearningImpactScreen} />
      <DashboardStack.Screen name="거래종목TOP" component={AdminTopStocksScreen} />
      <DashboardStack.Screen name="성장추이" component={AdminGrowthScreen} />
      <DashboardStack.Screen name="데이터내보내기" component={AdminExportScreen} />
      <DashboardStack.Screen name="위험모니터링" component={AdminRiskMonitorScreen} />
      <DashboardStack.Screen name="이유품질" component={AdminReasonQualityScreen} />
      <DashboardStack.Screen name="유저게시글" component={AdminUserPostsScreen} />
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

// 탭 아이콘 — lucide + 활성 점 indicator (토스 스타일)
function TabIcon({
  icon: Icon,
  color,
  focused,
}: {
  icon: any;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Icon size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
      <View
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: focused ? color : 'transparent',
          marginTop: 4,
        }}
      />
    </View>
  );
}

export default function AdminTabs() {
  return (
    <Tab.Navigator
      id="AdminTabs"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // 라벨 숨김 — 아이콘만
        tabBarActiveTintColor: '#0066FF',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          height: 64,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          paddingTop: 8,
          paddingBottom: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: { paddingVertical: 4 },
      }}
    >
      <Tab.Screen
        name="대시보드Tab"
        component={DashboardNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={LayoutDashboard} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="랭킹Tab"
        component={RankingScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Trophy} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="거래내역Tab"
        component={TradesNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Receipt} color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
