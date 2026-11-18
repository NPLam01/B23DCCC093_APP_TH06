import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AntDesign from '@react-native-vector-icons/ant-design';
import { Colors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { TabScreenProps } from '../navigation/types';
import NotificationItem from '../components/NotificationItem';
import {
  subscribeNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notificationService';
import { getUserProfile } from '../services/userService';
import { AppNotification } from '../types';
import { ref, get } from 'firebase/database';
import { db } from '../services/firebase';

type Props = TabScreenProps<'Notifications'>;

export default function NotificationScreen({ navigation }: Props) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;

    setIsLoading(true);
    const unsubscribe = subscribeNotifications(currentUser.uid, list => {
      setNotifications(list);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handlePressNotification = async (item: AppNotification) => {
    if (!currentUser?.uid) return;

    // Đánh dấu đã đọc
    if (!item.read) {
      await markNotificationAsRead(currentUser.uid, item.id);
    }

    // Mở đúng cuộc trò chuyện
    if (item.convId) {
      try {
        const convSnap = await get(ref(db, `conversations/${item.convId}`));
        if (convSnap.exists()) {
          const conv = convSnap.val();
          const isGroup = conv.type === 'group' || item.convId.startsWith('group_');
          if (isGroup) {
            navigation.navigate('Chat', {
              chatId: item.convId,
              isGroup: true,
              groupName: conv.name || 'Nhóm chat',
            });
            return;
          }
        }

        // Nếu là chat 1-1, tìm profile đối phương
        const uids = item.convId.split('_');
        const otherUid = uids[0] === currentUser.uid ? uids[1] : uids[0];
        const otherProfile = otherUid ? await getUserProfile(otherUid) : null;

        navigation.navigate('Chat', {
          chatId: item.convId,
          otherUser: otherProfile || {
            uid: otherUid || item.fromUid,
            name: item.fromName || 'Người dùng',
            email: '',
          },
        });
      } catch (e) {
        console.warn('Error navigating to chat from notification:', e);
      }
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUser?.uid) return;
    await markAllNotificationsAsRead(currentUser.uid);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Thông báo</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
            <Text style={styles.markAll}>Đánh dấu tất cả đã đọc</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => n.id}
          renderItem={({ item }) => (
            <NotificationItem
              item={{
                id: item.id,
                content: item.text,
                timestamp: item.createdAt,
                isRead: item.read,
                conversationId: item.convId,
              }}
              onPress={() => handlePressNotification(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <AntDesign name="bell" size={44} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
              <Text style={styles.emptyDesc}>
                Các thông báo về tin nhắn mới, nhóm chat và cảm xúc sẽ xuất hiện tại đây.
              </Text>
            </View>
          }
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
        />
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: Colors.textMain,
    fontSize: 24,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  markAll: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    color: Colors.textMain,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyDesc: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
