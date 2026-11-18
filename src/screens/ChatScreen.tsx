import React, { useRef, useEffect, useState, useMemo } from 'react';
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
import ChatBubble from '../components/ChatBubble';
import MessageInput from '../components/MessageInput';
import MessageActionModal from '../components/MessageActionModal';
import ImageViewerModal from '../components/ImageViewerModal';
import { getUserProfile } from '../services/userService';
import { pickFromCamera, pickFromGallery } from '../services/uploadService';
import { leaveGroupConversation } from '../services/groupService';
import { formatLastSeen } from '../utils/formatTime';
import { Message, UserProfile } from '../types';
import { ref, onValue, get } from 'firebase/database';
import { db } from '../services/firebase';

type Props = RootStackScreenProps<'Chat'>;

export default function ChatScreen({ route, navigation }: Props) {
  const {
    chatId,
    otherUser: initialOtherUser,
    isGroup = false,
    groupName: initialGroupName,
  } = route.params;

  const { currentUser } = useAuth();
  const [otherUser, setOtherUser] = useState<UserProfile | undefined>(initialOtherUser);
  const [groupName, setGroupName] = useState<string>(initialGroupName || 'Nhóm chat');
  const [groupMembers, setGroupMembers] = useState<Record<string, boolean>>({});
  const [onlineMembersCount, setOnlineMembersCount] = useState<number>(0);

  // Modals state
  const [actionMessage, setActionMessage] = useState<Message | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  // Tên của các thành viên đang gõ trong nhóm
  const [typingNamesMap, setTypingNamesMap] = useState<Record<string, string>>({});

  const flatListRef = useRef<FlatList<Message>>(null);

  const {
    messages,
    isLoading,
    isLoadingOlder,
    loadMore,
    isSending,
    isSendingLocation,
    typingUids,
    readStatusMap,
    handleTyping,
    sendText,
    sendLocation,
    sendImage,
    retryImageUpload,
    recall,
    react,
  } = useChat(chatId, currentUser?.uid, currentUser?.name || 'Tôi');

  // Lắng nghe tên của thành viên đang gõ
  useEffect(() => {
    if (typingUids.length === 0) return;
    typingUids.forEach(async uid => {
      if (!typingNamesMap[uid]) {
        try {
          const profile = await getUserProfile(uid);
          if (profile?.name) {
            setTypingNamesMap(prev => ({ ...prev, [uid]: profile.name }));
          }
        } catch {}
      }
    });
  }, [typingUids, typingNamesMap]);

  const typingName = useMemo(() => {
    if (typingUids.length === 0) return '';
    const firstUid = typingUids[0];
    return typingNamesMap[firstUid] || (otherUser?.uid === firstUid ? otherUser.name : '');
  }, [typingUids, typingNamesMap, otherUser]);

  // Lấy và lắng nghe thông tin người dùng / nhóm
  useEffect(() => {
    let isMounted = true;

    if (isGroup) {
      // Đọc thông tin nhóm và thành viên
      const convRef = ref(db, `conversations/${chatId}`);
      const unsub = onValue(
        convRef,
        async snapshot => {
          if (!isMounted || !snapshot.exists()) return;
          try {
            const val = snapshot.val();
            if (val.name) setGroupName(val.name);
            const members = val.members || {};
            setGroupMembers(members);

            // Đếm số thành viên online
            const uids = Object.keys(members);
            let onlineCount = 0;
            await Promise.all(
              uids.map(async u => {
                try {
                  const uSnap = await get(ref(db, `users/${u}/status/state`));
                  if (uSnap.exists() && uSnap.val() === 'online') {
                    onlineCount++;
                  }
                } catch {
                  // Ignore read error for single user
                }
              }),
            );
            if (isMounted) setOnlineMembersCount(onlineCount);
          } catch (e) {
            console.warn('Error fetching group online status:', e);
          }
        },
        error => {
          console.warn('Error reading conversation:', error);
        },
      );

      return () => {
        isMounted = false;
        unsub();
      };
    } else if (otherUser?.uid) {
      // Chat 1-1: Lắng nghe trạng thái online/offline của đối phương
      const userRef = ref(db, `users/${otherUser.uid}`);
      const unsub = onValue(
        userRef,
        snapshot => {
          if (!isMounted || !snapshot.exists()) return;
          setOtherUser(snapshot.val() as UserProfile);
        },
        error => {
          console.warn('Error reading other user profile:', error);
        },
      );

      return () => {
        isMounted = false;
        unsub();
      };
    }
  }, [chatId, isGroup, otherUser?.uid]);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (messages.length > 0 && !isLoadingOlder) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isLoadingOlder]);

  // Xử lý gửi tin nhắn văn bản
  const handleSendText = async (text: string) => {
    try {
      await sendText(text);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  };

  // Xử lý gửi vị trí
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
        Alert.alert('Lỗi định vị', 'Không thể lấy tọa độ hiện tại. Vui lòng bật GPS và thử lại.');
      }
    }
  };

  // Xử lý gửi ảnh từ Camera
  const handlePickCamera = async () => {
    const asset = await pickFromCamera();
    if (asset?.uri) {
      await sendImage(asset.uri);
    }
  };

  // Xử lý gửi ảnh từ Thư viện
  const handlePickGallery = async () => {
    const asset = await pickFromGallery();
    if (asset?.uri) {
      await sendImage(asset.uri);
    }
  };

  // Tìm tin nhắn cuối cùng do mình gửi
  const lastMyMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].senderId === currentUser?.uid && !messages[i].recalled) {
        return messages[i];
      }
    }
    return null;
  }, [currentUser?.uid, messages]);

  // Tính thời gian xem cao nhất của thành viên khác
  const lastReadTime = useMemo(() => {
    if (!lastMyMessage) return null;
    let maxRead = 0;
    Object.entries(readStatusMap).forEach(([uid, ts]) => {
      if (uid !== currentUser?.uid && ts > maxRead) {
        maxRead = ts;
      }
    });
    return maxRead >= lastMyMessage.createdAt ? maxRead : null;
  }, [currentUser?.uid, lastMyMessage, readStatusMap]);

  // Kiểm tra ai đang gõ
  const isSomeoneTyping = typingUids.length > 0;

  // Kiểm tra người dùng hiện tại có đang là thành viên nhóm không
  const isMember = useMemo(() => {
    if (!isGroup) return true;
    if (!currentUser?.uid) return false;
    // Nếu chưa tải xong groupMembers thì tạm thời xem như là thành viên
    if (Object.keys(groupMembers).length === 0) return true;
    return !!groupMembers[currentUser.uid];
  }, [isGroup, currentUser?.uid, groupMembers]);

  // Xử lý xác nhận rời nhóm
  const handleConfirmLeaveGroup = () => {
    Alert.alert(
      'Rời nhóm',
      `Bạn có chắc chắn muốn rời khỏi nhóm "${groupName}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Rời nhóm',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!currentUser?.uid) return;
              await leaveGroupConversation(
                chatId,
                currentUser.uid,
                currentUser.name || 'Người dùng',
              );
              Alert.alert('Thành công', 'Bạn đã rời khỏi nhóm chat.');
              navigation.goBack();
            } catch (error) {
              console.warn('Error leaving group:', error);
              Alert.alert('Lỗi', 'Không thể rời khỏi nhóm lúc này. Vui lòng thử lại.');
            }
          },
        },
      ],
    );
  };

  // Tiêu đề phụ (subtitle) trên header
  const renderHeaderSubtitle = () => {
    if (isGroup && !isMember) {
      return (
        <Text style={[styles.headerStatus, styles.notMemberSubtitle]}>
          Bạn không còn trong nhóm
        </Text>
      );
    }

    if (isSomeoneTyping) {
      const label = isGroup && typingName ? `${typingName} đang soạn tin…` : 'đang soạn tin…';
      return (
        <Text style={[styles.headerStatus, styles.typingText]}>
          {label}
        </Text>
      );
    }

    if (isGroup) {
      return (
        <Text style={styles.headerStatus}>
          {onlineMembersCount > 0 ? `${onlineMembersCount} người trực tuyến` : `${Object.keys(groupMembers).length} thành viên`}
        </Text>
      );
    }

    if (otherUser) {
      const isOnline = otherUser.status?.state === 'online';
      if (isOnline) {
        return <Text style={[styles.headerStatus, { color: Colors.online }]}>Đang hoạt động</Text>;
      }
      return (
        <Text style={styles.headerStatus}>
          {formatLastSeen(otherUser.status?.lastChanged)}
        </Text>
      );
    }

    return null;
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isMine = item.senderId === currentUser?.uid;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showDateHeader =
      !prevMsg ||
      new Date(item.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

    const isLastFromMe = lastMyMessage?.id === item.id;

    return (
      <ChatBubble
        message={item}
        isMine={isMine}
        isGroup={isGroup}
        showDateHeader={showDateHeader}
        isLastFromMe={isLastFromMe}
        readTime={isLastFromMe ? lastReadTime : null}
        onLongPress={msg => setActionMessage(msg)}
        onPressImage={url => setViewerImage(url)}
        onRetryUpload={retryImageUpload}
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

        {isGroup ? (
          <View style={styles.groupAvatarCircle}>
            <AntDesign name="team" size={22} color={Colors.white} />
          </View>
        ) : (
          <Avatar
            name={otherUser?.name}
            size={42}
            showOnline
            isOnline={otherUser?.status?.state === 'online'}
          />
        )}

        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {isGroup ? groupName : otherUser?.name || 'Trò chuyện'}
          </Text>
          {renderHeaderSubtitle()}
        </View>

        {isGroup && isMember && (
          <TouchableOpacity
            style={styles.leaveGroupBtn}
            onPress={handleConfirmLeaveGroup}
            activeOpacity={0.7}
            accessibilityLabel="Rời nhóm">
            <AntDesign name="logout" size={14} color={Colors.danger} />
            <Text style={styles.leaveGroupText}>Rời nhóm</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Chat messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
            // Hỗ trợ tải thêm tin nhắn cũ khi kéo lên đầu danh sách
            onEndReached={loadMore}
            onEndReachedThreshold={0.1}
            ListHeaderComponent={
              isLoadingOlder ? (
                <View style={styles.loadingOlder}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingOlderText}>Đang tải tin cũ hơn...</Text>
                </View>
              ) : undefined
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                {isGroup ? (
                  <View style={styles.groupAvatarCircleLarge}>
                    <AntDesign name="team" size={32} color={Colors.white} />
                  </View>
                ) : (
                  <Avatar name={otherUser?.name} size={64} />
                )}
                <Text style={styles.emptyTitle}>
                  {isGroup
                    ? `Chào mừng bạn đến với ${groupName}`
                    : `Bắt đầu cuộc trò chuyện với ${otherUser?.name}`}
                </Text>
                <Text style={styles.emptySubtitle}>
                  Hãy gửi lời chào, chia sẻ hình ảnh hoặc vị trí của bạn ngay bây giờ!
                </Text>
              </View>
            }
          />
        )}

        {/* Bong bóng báo trạng thái đang soạn tin */}
        {isSomeoneTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <View style={styles.typingDotsContainer}>
                <View style={[styles.typingDot, styles.dot1]} />
                <View style={[styles.typingDot, styles.dot2]} />
                <View style={[styles.typingDot, styles.dot3]} />
              </View>
              <Text style={styles.typingBubbleText}>
                {isGroup && typingName ? `${typingName} đang soạn tin...` : 'đang soạn tin...'}
              </Text>
            </View>
          </View>
        )}

        {/* Input Bar hoặc Thông báo không còn trong nhóm */}
        {isGroup && !isMember ? (
          <View style={styles.notMemberBanner}>
            <AntDesign name="info-circle" size={16} color={Colors.textSecondary} />
            <Text style={styles.notMemberBannerText}>
              Bạn không còn là thành viên của nhóm này.
            </Text>
          </View>
        ) : (
          <MessageInput
            onSendText={handleSendText}
            onSendLocation={handleSendLocation}
            onPickCamera={handlePickCamera}
            onPickGallery={handlePickGallery}
            onTyping={handleTyping}
            isSending={isSending}
            isSendingLocation={isSendingLocation}
          />
        )}
      </KeyboardAvoidingView>

      {/* Action Menu (Sao chép, Thu hồi, Thả cảm xúc) */}
      <MessageActionModal
        visible={!!actionMessage}
        message={actionMessage}
        isMine={actionMessage?.senderId === currentUser?.uid}
        onClose={() => setActionMessage(null)}
        onRecall={msgId => recall(msgId)}
        onReact={(msgId, emoji) => react(msgId, emoji)}
      />

      {/* Xem ảnh toàn màn hình */}
      <ImageViewerModal
        visible={!!viewerImage}
        imageUrl={viewerImage || undefined}
        onClose={() => setViewerImage(null)}
      />
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
  headerStatus: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  typingText: {
    color: Colors.primary,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  groupAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatarCircleLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
  loadingOlder: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  loadingOlderText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  notMemberSubtitle: {
    color: Colors.error,
    fontWeight: '600',
  },
  notMemberBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  notMemberBannerText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    gap: 10,
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
  leaveGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 4,
    marginLeft: 6,
  },
  leaveGroupText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  typingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  typingBubbleText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
});
