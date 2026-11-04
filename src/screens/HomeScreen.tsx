import React from 'react';
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
import { useConversations } from '../hooks/useConversations';
import { TabScreenProps } from '../navigation/types';
import Avatar from '../components/Avatar';
import AppInput from '../components/AppInput';
import { formatConversationTime } from '../utils/formatTime';
import { UserConversationItem } from '../types';

type Props = TabScreenProps<'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { currentUser } = useAuth();
  const { conversations, searchQuery, setSearchQuery, isLoading } = useConversations(
    currentUser?.uid,
  );

  const handleOpenChat = (item: UserConversationItem) => {
    if (!item.otherUser) return;
    navigation.navigate('Chat', {
      chatId: item.chatId,
      otherUser: item.otherUser,
    });
  };

  const renderItem = ({ item }: { item: UserConversationItem }) => {
    const otherUser = item.otherUser;
    if (!otherUser) return null;

    const isOnline = otherUser.status?.state === 'online';
    const unread = item.unreadCount || 0;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleOpenChat(item)}
        activeOpacity={0.75}>
        <Avatar
          name={otherUser.name}
          size={52}
          showOnline
          isOnline={isOnline}
        />
        <View style={styles.chatInfo}>
          <View style={styles.chatHeaderRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {otherUser.name}
            </Text>
            <Text style={styles.timeText}>
              {formatConversationTime(item.lastMessageAt)}
            </Text>
          </View>
          <View style={styles.chatMessageRow}>
            <Text
              style={[
                styles.lastMessageText,
                unread > 0 ? styles.lastMessageUnread : null,
              ]}
              numberOfLines={1}>
              {item.lastMessageText || 'Bắt đầu trò chuyện'}
            </Text>
            {unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unread > 99 ? '99+' : unread}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.appName}>BlueTalk</Text>
        <Text style={styles.title}>Tin nhắn</Text>
      </View>

      <View style={styles.searchContainer}>
        <AppInput
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon={<AntDesign name="search" size={16} color={Colors.textSecondary} />}
        />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.chatId}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AntDesign name="message" size={44} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>
                {searchQuery ? `Không tìm thấy "${searchQuery}"` : 'Chưa có cuộc trò chuyện nào'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Thử tìm với tên hoặc email khác'
                  : 'Hãy vào tab Danh bạ và chọn một người để bắt đầu nhắn tin!'}
              </Text>
            </View>
          }
          contentContainerStyle={conversations.length === 0 ? styles.flexGrow : undefined}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  appName: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.textMain,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    color: Colors.textMain,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  chatMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessageText: {
    color: Colors.textSecondary,
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  lastMessageUnread: {
    color: Colors.textMain,
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 80,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
    paddingTop: 40,
  },
  emptyTitle: {
    color: Colors.textMain,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  flexGrow: {
    flexGrow: 1,
  },
});
