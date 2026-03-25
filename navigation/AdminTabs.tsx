import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AdminScreen from '../screens/AdminScreen';
import RankingScreen from '../screens/RankingScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type AdminTabParamList = {
  대시보드: undefined;
  유저관리: undefined;
  랭킹관리: undefined;
  내정보: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0066FF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0.5,
          borderTopColor: '#F2F2F7',
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="대시보드"
        component={AdminScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="랭킹관리"
        component={RankingScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="내정보"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
