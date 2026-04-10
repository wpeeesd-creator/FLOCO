import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import AssetDetailScreen from '../screens/AssetDetailScreen';
import InvestScreen from '../screens/InvestScreen';
import StockDetailScreen from '../screens/StockDetailScreen';
import TradingScreen from '../screens/TradingScreen';
import ChatScreen from '../screens/ChatScreen';
import TransactionScreen from '../screens/TransactionScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import ExchangeDetailScreen from '../screens/transaction/ExchangeDetailScreen';
import DepositScreen from '../screens/transaction/DepositScreen';
import ExchangeAlertScreen from '../screens/transaction/ExchangeAlertScreen';
import SearchScreen from '../screens/SearchScreen';
import USStockScreen from '../screens/discover/USStockScreen';
import KRStockScreen from '../screens/discover/KRStockScreen';
import BondScreen from '../screens/discover/BondScreen';
import ETFScreen from '../screens/discover/ETFScreen';
import RankingTabScreen from '../screens/RankingTabScreen';
import PostDetailScreen from '../screens/community/PostDetailScreen';
import PostWriteScreen from '../screens/community/PostWriteScreen';
import LearningScreen from '../screens/LearningScreen';
import LessonPlayerScreen from '../screens/learning/LessonPlayerScreen';
import CourseListScreen from '../screens/CourseListScreen';
import LessonScreen from '../screens/LessonScreen';
import LessonDetailScreen from '../screens/LessonDetailScreen';
import WrongAnswerScreen from '../screens/WrongAnswerScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BadgeScreen from '../screens/BadgeScreen';
import RewardHistoryScreen from '../screens/RewardHistoryScreen';
import AdminScreen from '../screens/AdminScreen';
import AdminStatsScreen from '../screens/admin/AdminStatsScreen';
import AdminTradeLogScreen from '../screens/admin/AdminTradeLogScreen';
import AdminReportScreen from '../screens/admin/AdminReportScreen';
import AdminLearningStatsScreen from '../screens/admin/AdminLearningStatsScreen';
import AdminPopularStocksScreen from '../screens/admin/AdminPopularStocksScreen';
import AdminEventScreen from '../screens/admin/AdminEventScreen';
import SurveyScreen from '../screens/SurveyScreen';
import SurveyResultScreen from '../screens/SurveyResultScreen';
import SchoolSetupScreen from '../screens/SchoolSetupScreen';
import PortfolioAIScreen from '../screens/PortfolioAIScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsScreen from '../screens/TermsScreen';
import RealNameVerifyScreen from '../screens/RealNameVerifyScreen';
import DailyMissionScreen from '../screens/DailyMissionScreen';
import EventScreen from '../screens/EventScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import NewsScreen from '../screens/NewsScreen';
import NotificationScreen from '../screens/NotificationScreen';
import WebViewScreen from '../screens/WebViewScreen';
import CustomTabBar from './CustomTabBar';

export type UserTabParamList = {
  홈Tab: undefined;
  투자Tab: undefined;
  랭킹Tab: undefined;
  학습Tab: undefined;
  마이페이지Tab: undefined;
};

const Tab = createBottomTabNavigator<UserTabParamList>();
const HomeStack = createNativeStackNavigator();
const InvestStack = createNativeStackNavigator();
const RankingStack = createNativeStackNavigator();
const LearnStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function HomeNavigator() {
  return (
    <HomeStack.Navigator id="HomeStack" screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="홈" component={HomeScreen} />
      <HomeStack.Screen name="자산상세" component={AssetDetailScreen} />
      <HomeStack.Screen name="보상내역" component={RewardHistoryScreen} />
      <HomeStack.Screen name="거래내역" component={TransactionScreen} />
      <HomeStack.Screen name="환전상세" component={ExchangeDetailScreen} />
      <HomeStack.Screen name="달러채우기" component={DepositScreen} />
      <HomeStack.Screen name="환율알림" component={ExchangeAlertScreen} />
      <HomeStack.Screen name="이벤트" component={EventScreen} />
      <HomeStack.Screen name="이벤트상세" component={EventDetailScreen} />
      <HomeStack.Screen name="거래상세" component={TransactionDetailScreen} />
      <HomeStack.Screen name="알림" component={NotificationScreen} />
      <HomeStack.Screen name="데일리미션" component={DailyMissionScreen} />
      <HomeStack.Screen name="AI분석" component={PortfolioAIScreen} />
      <HomeStack.Screen name="WebView" component={WebViewScreen} />
    </HomeStack.Navigator>
  );
}

function InvestNavigator() {
  return (
    <InvestStack.Navigator id="InvestStack" screenOptions={{ headerShown: false }}>
      <InvestStack.Screen name="투자메인" component={InvestScreen} />
      <InvestStack.Screen
        name="종목상세"
        component={StockDetailScreen}
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
      <InvestStack.Screen name="종목검색" component={SearchScreen} />
      <InvestStack.Screen name="거래" component={TradingScreen} />
      <InvestStack.Screen name="AI분석" component={ChatScreen} />
      <InvestStack.Screen name="USStock" component={USStockScreen} />
      <InvestStack.Screen name="KRStock" component={KRStockScreen} />
      <InvestStack.Screen name="Bond" component={BondScreen} />
      <InvestStack.Screen name="ETF" component={ETFScreen} />
      <InvestStack.Screen name="뉴스" component={NewsScreen} />
      <InvestStack.Screen name="WebView" component={WebViewScreen} />
    </InvestStack.Navigator>
  );
}

function RankingNavigator() {
  return (
    <RankingStack.Navigator id="RankingStack" screenOptions={{ headerShown: false }}>
      <RankingStack.Screen name="랭킹메인" component={RankingTabScreen} />
      <RankingStack.Screen name="게시물상세" component={PostDetailScreen} />
      <RankingStack.Screen name="게시물작성" component={PostWriteScreen} />
    </RankingStack.Navigator>
  );
}

function LearnNavigator() {
  return (
    <LearnStack.Navigator id="LearnStack" screenOptions={{ headerShown: false }}>
      <LearnStack.Screen name="학습메인" component={LearningScreen} />
      <LearnStack.Screen name="레슨플레이어" component={LessonPlayerScreen} />
      <LearnStack.Screen name="LessonPlayer" component={LessonPlayerScreen} options={{ headerShown: false }} />
      <LearnStack.Screen name="코스목록" component={CourseListScreen} />
      <LearnStack.Screen name="레슨" component={LessonScreen} />
      <LearnStack.Screen name="레슨상세" component={LessonDetailScreen} />
      <LearnStack.Screen name="오답노트" component={WrongAnswerScreen} />
    </LearnStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator id="ProfileStack" screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="프로필메인" component={ProfileScreen} />
      <ProfileStack.Screen name="관리자대시보드" component={AdminScreen} />
      <ProfileStack.Screen name="관리자통계" component={AdminStatsScreen} />
      <ProfileStack.Screen name="거래로그" component={AdminTradeLogScreen} />
      <ProfileStack.Screen name="신고관리" component={AdminReportScreen} />
      <ProfileStack.Screen name="학습통계" component={AdminLearningStatsScreen} />
      <ProfileStack.Screen name="인기종목" component={AdminPopularStocksScreen} />
      <ProfileStack.Screen name="이벤트관리" component={AdminEventScreen} />
      <ProfileStack.Screen name="투자유형설문" component={SurveyScreen} />
      <ProfileStack.Screen name="투자유형결과" component={SurveyResultScreen} />
      <ProfileStack.Screen name="학교반설정" component={SchoolSetupScreen} />
      <ProfileStack.Screen name="개인정보처리방침" component={PrivacyPolicyScreen} />
      <ProfileStack.Screen name="서비스이용약관" component={TermsScreen} />
      <ProfileStack.Screen name="실명인증" component={RealNameVerifyScreen} />
      <ProfileStack.Screen name="배지" component={BadgeScreen} />
    </ProfileStack.Navigator>
  );
}

export default function UserTabs() {
  return (
    <Tab.Navigator
      id="UserTabs"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="홈Tab" component={HomeNavigator} />
      <Tab.Screen name="투자Tab" component={InvestNavigator} />
      <Tab.Screen name="랭킹Tab" component={RankingNavigator} />
      <Tab.Screen name="학습Tab" component={LearnNavigator} />
      <Tab.Screen name="마이페이지Tab" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}
