import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import AntDesign from '@react-native-vector-icons/ant-design';
import { MainTabParamList } from './types';
import { Colors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { useConversations } from '../hooks/useConversations';
import { subscribeNotifications } from '../services/notificationService';
import { AppNotification } from '../types';

import HomeScreen from '../screens/HomeScreen';
import ContactsScreen from '../screens/ContactsScreen';
import NotificationScreen from '../screens/NotificationScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  Home: 'message',
  Contacts: 'team',
  Notifications: 'bell',
  Settings: 'setting',
};

function BadgeWrapper({ count, children }: { count: number; children: React.ReactNode }) {
  return (
    <View style={styles.badgeWrapper}>
      {children}
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </View>
  );
}

export default function MainNavigator() {
  const { currentUser } = useAuth();
  const { totalUnread } = useConversations(currentUser?.uid);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = subscribeNotifications(currentUser.uid, (list: AppNotification[]) => {
      const count = list.filter(n => !n.read).length;
      setUnreadNotifsCount(count);
    });
    return () => {
      unsub();
    };
  }, [currentUser?.uid]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color }) => {
          const iconName = TAB_ICONS[route.name] ?? 'question';
          const icon = <AntDesign name={iconName as any} size={22} color={color} />;

          if (route.name === 'Home') {
            return <BadgeWrapper count={totalUnread}>{icon}</BadgeWrapper>;
          }
          if (route.name === 'Notifications') {
            return <BadgeWrapper count={unreadNotifsCount}>{icon}</BadgeWrapper>;
          }
          return icon;
        },
      })}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Tin nhắn' }}
      />
      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{ tabBarLabel: 'Danh bạ' }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{ tabBarLabel: 'Thông báo' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Cài đặt' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 62,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  badgeWrapper: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
