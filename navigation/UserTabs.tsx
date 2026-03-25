import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import StockScreen from '../screens/StockScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import StockDetailScreen from '../screens/StockDetailScreen';
import TradingScreen from '../screens/TradingScreen';
import ChatScreen from '../screens/ChatScreen';
import TransactionScreen from '../screens/TransactionScreen';
import RankingScreen from '../screens/RankingScreen';
import LearningScreen from '../screens/LearningScreen';
import CourseListScreen from '../screens/CourseListScreen';
import LessonScreen from '../screens/LessonScreen';
import LessonDetailScreen from '../screens/LessonDetailScreen';
import SearchScreen from '../screens/SearchScreen';
import USStockScreen from '../screens/discover/USStockScreen';
import KRStockScreen from '../screens/discover/KRStockScreen';
import BondScreen from '../screens/discover/BondScreen';
import ETFScreen from '../screens/discover/ETFScreen';
import FloWorldScreen from '../screens/FloWorldScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminScreen from '../screens/AdminScreen';
import CustomTabBar from './CustomTabBar';

export type UserTabParamList = {
  홈Tab: undefined;
  증권Tab: undefined;
  발견Tab: undefined;
  랭킹Tab: undefined;
  플로월드Tab: undefined;
  마이페이지Tab: undefined;
};

const Tab = createBottomTabNavigator<UserTabParamList>();
const HomeStack = createNativeStackNavigator();
const StockStack = createNativeStackNavigator();
const DiscoverStack = createNativeStackNavigator();
const LearnStack = createNativeStackNavigator();
const FloWorldStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="홈" component={HomeScreen} />
      <HomeStack.Screen name="거래내역" component={TransactionScreen} />
    </HomeStack.Navigator>
  );
}

function StockNavigator() {
  return (
    <StockStack.Navigator screenOptions={{ headerShown: false }}>
      <StockStack.Screen name="증권메인" component={StockScreen} />
      <StockStack.Screen name="종목상세" component={StockDetailScreen} />
      <StockStack.Screen name="종목검색" component={SearchScreen} />
      <StockStack.Screen name="거래" component={TradingScreen} />
      <StockStack.Screen name="AI분석" component={ChatScreen} />
    </StockStack.Navigator>
  );
}

function DiscoverNavigator() {
  return (
    <DiscoverStack.Navigator screenOptions={{ headerShown: false }}>
      <DiscoverStack.Screen name="발견메인" component={DiscoverScreen} />
      <DiscoverStack.Screen name="USStock" component={USStockScreen} />
      <DiscoverStack.Screen name="KRStock" component={KRStockScreen} />
      <DiscoverStack.Screen name="Bond" component={BondScreen} />
      <DiscoverStack.Screen name="ETF" component={ETFScreen} />
      <DiscoverStack.Screen name="종목상세D" component={StockDetailScreen} />
    </DiscoverStack.Navigator>
  );
}

function FloWorldNavigator() {
  return (
    <FloWorldStack.Navigator screenOptions={{ headerShown: false }}>
      <FloWorldStack.Screen name="플로월드메인" component={FloWorldScreen} />
      <FloWorldStack.Screen name="이벤트상세" component={EventDetailScreen} />
      <FloWorldStack.Screen name="학습메인" component={LearningScreen} />
      <FloWorldStack.Screen name="코스목록" component={CourseListScreen} />
      <FloWorldStack.Screen name="레슨" component={LessonScreen} />
      <FloWorldStack.Screen name="레슨상세" component={LessonDetailScreen} />
    </FloWorldStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="프로필메인" component={ProfileScreen} />
      <ProfileStack.Screen name="관리자대시보드" component={AdminScreen} />
    </ProfileStack.Navigator>
  );
}

export default function UserTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="홈Tab" component={HomeNavigator} />
      <Tab.Screen name="증권Tab" component={StockNavigator} />
      <Tab.Screen name="발견Tab" component={DiscoverNavigator} />
      <Tab.Screen name="랭킹Tab" component={RankingScreen} />
      <Tab.Screen name="플로월드Tab" component={FloWorldNavigator} />
      <Tab.Screen name="마이페이지Tab" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}
