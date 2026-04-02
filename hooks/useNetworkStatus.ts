/**
 * 네트워크 상태 감지 훅 + 오프라인 배너 컴포넌트
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? true);
    });
    return () => unsubscribe();
  }, []);

  return { isConnected, isInternetReachable };
};

export const OfflineBanner = () => {
  const { isConnected } = useNetworkStatus();
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    if (!isConnected) {
      setVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -60,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }
  }, [isConnected]);

  if (!visible) return null;

  return React.createElement(
    Animated.View,
    {
      style: {
        transform: [{ translateY: slideAnim }],
        backgroundColor: '#FF3B30',
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
    React.createElement(Ionicons, { name: 'wifi-outline', size: 16, color: '#FFFFFF' }),
    React.createElement(
      Text,
      {
        style: {
          color: '#FFFFFF',
          fontSize: 13,
          fontWeight: 'bold',
          marginLeft: 8,
        },
      },
      '인터넷 연결을 확인해주세요'
    )
  );
};
