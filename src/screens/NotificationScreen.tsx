import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import AntDesign from '@react-native-vector-icons/ant-design';
import { Colors } from '../constants/colors';
import { TabScreenProps } from '../navigation/types';
import NotificationItem from '../components/NotificationItem';
import { NotificationItem as NotificationType } from '../types';

type Props = TabScreenProps<'Notifications'>;

const INITIAL_NOTIFICATIONS: NotificationType[] = [
  {
    id: 'notif_1',
    content: 'Chào mừng bạn đến với BlueTalk! Hãy kết nối với bạn bè trong danh bạ.',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 mins ago
    isRead: false,
  },
  {
    id: 'notif_2',
    content: 'Tính năng chia sẻ vị trí realtime bằng Google Maps hiện đã sẵn sàng.',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    isRead: false,
  },
  {
    id: 'notif_3',
    content: 'Hệ thống xác thực và cơ sở dữ liệu Firebase Realtime Database đã hoạt động.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    isRead: true,
  },
];

export default function NotificationScreen({ navigation: _navigation }: Props) {
  const [notifications, setNotifications] = useState<NotificationType[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Thông báo</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllNotificationsAsRead} activeOpacity={0.7}>
            <Text style={styles.markAll}>Đánh dấu tất cả đã đọc</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={n => n.id}
        renderItem={({ item }) => (
          <NotificationItem item={item} onPress={() => markNotificationAsRead(item.id)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AntDesign name="bell" size={40} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Không có thông báo nào</Text>
          </View>
        }
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    color: Colors.textMain,
    fontSize: 24,
    fontWeight: '700',
  },
  markAll: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 12,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
