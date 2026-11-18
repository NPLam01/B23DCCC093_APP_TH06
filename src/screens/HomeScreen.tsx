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
import { leaveGroupConversation } from '../services/groupService';
import { Alert } from 'react-native';

type Props = TabScreenProps<'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { currentUser } = useAuth();
  const { conversations, searchQuery, setSearchQuery, isLoading } = useConversations(
    currentUser?.uid,
  );

  const handleOpenChat = (item: UserConversationItem) => {
    if (item.type === 'group') {
      navigation.navigate('Chat', {
        chatId: item.chatId,
        isGroup: true,
        groupName: item.name || 'Nhóm chat',
      });
    } else if (item.otherUser) {
      navigation.navigate('Chat', {
        chatId: item.chatId,
        otherUser: item.otherUser,
      });
    }
  };

  const handleLongPressConversation = (item: UserConversationItem) => {
    if (item.type !== 'group' || !currentUser?.uid) return;
    const groupTitle = item.name || 'Nhóm chat';
    Alert.alert(groupTitle, 'Tùy chọn cuộc trò chuyện', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Rời nhóm',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Xác nhận rời nhóm',
            `Bạn có chắc chắn muốn rời khỏi nhóm "${groupTitle}" không?`,
            [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Rời nhóm',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await leaveGroupConversation(
                      item.chatId,
                      currentUser.uid,
                      currentUser.name || 'Người dùng',
                    );
                    Alert.alert('Thành công', `Bạn đã rời khỏi nhóm "${groupTitle}".`);
                  } catch (e) {
                    Alert.alert('Lỗi', 'Không thể rời nhóm lúc này.');
                  }
                },
              },
            ],
          );
        },
      },
    ]);
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const renderItem = ({ item }: { item: UserConversationItem }) => {
    const isGroup = item.type === 'group';
    const otherUser = item.otherUser;

    // Nếu là chat 1-1 mà chưa load được otherUser thì bỏ qua
    if (!isGroup && !otherUser) return null;

    const isOnline = !isGroup && otherUser?.status?.state === 'online';
    const unread = item.unreadCount || 0;
    const title = isGroup ? item.name || 'Nhóm chat' : otherUser?.name || 'Trò chuyện';

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleOpenChat(item)}
        onLongPress={() => handleLongPressConversation(item)}
        delayLongPress={400}
        activeOpacity={0.75}>
        {isGroup ? (
          <View style={styles.groupAvatarCircle}>
            <AntDesign name="team" size={24} color={Colors.white} />
          </View>
        ) : (
          <Avatar
            name={otherUser?.name}
            size={52}
            showOnline
            isOnline={isOnline}
          />
        )}

        <View style={styles.chatInfo}>
          <View style={styles.chatHeaderRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {title}
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
              {item.lastMessageText || 'Bắt đầu cuộc trò chuyện'}
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

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>BlueTalk</Text>
          <Text style={styles.title}>Tin nhắn</Text>
        </View>

        {/* Nút Tạo nhóm mới */}
        <TouchableOpacity
          style={styles.createGroupBtn}
          onPress={handleCreateGroup}
          activeOpacity={0.8}
          accessibilityLabel="Tạo nhóm mới">
          <AntDesign name="plus" size={16} color={Colors.white} />
          <Text style={styles.createGroupBtnText}>Tạo nhóm</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <AppInput
          placeholder="Tìm kiếm tin nhắn, nhóm hoặc bạn bè..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon={<AntDesign name="search" size={16} color={Colors.textSecondary} />}
        />
      </View>

      {/* List Conversations */}
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
                  ? 'Thử tìm với từ khóa khác'
                  : 'Hãy vào tab Danh bạ hoặc bấm Tạo nhóm để bắt đầu nhắn tin realtime!'}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  createGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  createGroupBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
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
  groupAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
