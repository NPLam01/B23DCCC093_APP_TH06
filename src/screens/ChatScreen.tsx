import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AntDesign from '@react-native-vector-icons/ant-design';
import { Colors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { RootStackScreenProps } from '../navigation/types';
import Avatar from '../components/Avatar';
import OnlineStatus from '../components/OnlineStatus';
import ChatBubble from '../components/ChatBubble';
import MessageInput from '../components/MessageInput';
import { getUserProfile } from '../services/userService';
import { Message, UserProfile } from '../types';

type Props = RootStackScreenProps<'Chat'>;

export default function ChatScreen({ route, navigation }: Props) {
  const { chatId, otherUser: initialOtherUser } = route.params;
  const { currentUser } = useAuth();
  const [otherUser, setOtherUser] = useState<UserProfile>(initialOtherUser);
  const flatListRef = useRef<FlatList<Message>>(null);

  const {
    messages,
    isLoading,
    isSending,
    isSendingLocation,
    sendText,
    sendLocation,
  } = useChat(chatId, currentUser?.uid, otherUser.uid);

  // Poll / refresh partner status periodically or on mount
  useEffect(() => {
    let isMounted = true;
    const fetchLatestUser = async () => {
      const latest = await getUserProfile(otherUser.uid);
      if (latest && isMounted) {
        setOtherUser(latest);
      }
    };
    fetchLatestUser();
    const interval = setInterval(fetchLatestUser, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [otherUser.uid]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSendText = async (text: string) => {
    try {
      await sendText(text);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  };

  const handleSendLocation = async () => {
    try {
      await sendLocation();
    } catch (error: any) {
      if (error?.message === 'PERMISSION_DENIED') {
        Alert.alert(
          'Quyền bị từ chối',
          'Bạn cần cấp quyền truy cập vị trí trong Cài đặt thiết bị để sử dụng tính năng này.',
        );
      } else {
        Alert.alert(
          'Lỗi định vị',
          'Không thể lấy tọa độ hiện tại. Vui lòng bật GPS và thử lại.',
        );
      }
    }
  };

  const isOnline = otherUser.status?.state === 'online';

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isMine = item.senderId === currentUser?.uid;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showDateHeader =
      !prevMsg ||
      new Date(item.createdAt).toDateString() !==
        new Date(prevMsg.createdAt).toDateString();

    return (
      <ChatBubble
        message={item}
        isMine={isMine}
        showDateHeader={showDateHeader}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Quay lại">
          <AntDesign name="arrow-left" size={22} color={Colors.primary} />
        </TouchableOpacity>

        <Avatar
          name={otherUser.name}
          size={42}
          showOnline
          isOnline={isOnline}
        />

        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {otherUser.name}
          </Text>
          <OnlineStatus isOnline={isOnline} size={7} />
        </View>
      </View>

      {/* Chat messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Avatar name={otherUser.name} size={64} />
                <Text style={styles.emptyTitle}>
                  Bắt đầu cuộc trò chuyện với {otherUser.name}
                </Text>
                <Text style={styles.emptySubtitle}>
                  Gửi tin nhắn hoặc chia sẻ vị trí của bạn ngay bây giờ!
                </Text>
              </View>
            }
          />
        )}

        {/* Input Bar */}
        <MessageInput
          onSendText={handleSendText}
          onSendLocation={handleSendLocation}
          isSending={isSending}
          isSendingLocation={isSendingLocation}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: {
    padding: 8,
    marginRight: 6,
    marginLeft: -4,
  },
  headerInfo: {
    marginLeft: 10,
    flex: 1,
  },
  headerName: {
    color: Colors.textMain,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  messageList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 8,
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
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    color: Colors.textMain,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
