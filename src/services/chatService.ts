import {
  ref,
  push,
  update,
  onValue,
  get,
  set,
  remove,
  onDisconnect,
  increment,
  query,
  orderByKey,
  limitToLast,
  endBefore,
} from 'firebase/database';
import { db, auth } from './firebase';
import { getChatId } from '../utils/getChatId';
import { Message, UserConversationItem, UserProfile } from '../types';

/**
 * Gửi tin nhắn đa năng (Text, Ảnh, Vị trí) bằng MỘT lệnh update() multi-path duy nhất
 */
export const sendMessage = async ({
  convId,
  senderId,
  senderName,
  text = '',
  type = 'text',
  imageUrl,
  latitude,
  longitude,
}: {
  convId: string;
  senderId: string;
  senderName: string;
  text?: string;
  type: 'text' | 'image' | 'location';
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
}): Promise<string> => {
  const now = Date.now();
  const messagesRef = ref(db, `messages/${convId}`);
  const newMsgRef = push(messagesRef);
  const messageId = newMsgRef.key;
  if (!messageId) throw new Error('Không thể tạo ID tin nhắn.');

  // Xác định nội dung hiển thị tóm tắt cho lastMessage và thông báo
  let previewText = text.trim();
  if (type === 'image') {
    previewText = '📷 Hình ảnh';
  } else if (type === 'location') {
    previewText = '📍 Vị trí';
  }

  const messageData: Partial<Message> = {
    id: messageId,
    senderId,
    senderName,
    text: previewText,
    type,
    createdAt: now,
    recalled: false,
    ...(imageUrl ? { imageUrl } : {}),
    ...(latitude !== undefined ? { latitude } : {}),
    ...(longitude !== undefined ? { longitude } : {}),
  };

  // Lấy danh sách thành viên của cuộc trò chuyện
  let members: Record<string, boolean> = {};
  let isGroupConv = convId.startsWith('group_');
  const convSnap = await get(ref(db, `conversations/${convId}`));

  if (convSnap.exists()) {
    const convData = convSnap.val();
    isGroupConv = convData.type === 'group' || isGroupConv;
    members = convData.members || {};

    // Nếu là nhóm chat: Người gửi BẮT BUỘC phải đang là thành viên của nhóm
    if (isGroupConv && (!members || !members[senderId])) {
      throw new Error('Bạn không còn là thành viên của nhóm này và không thể gửi tin nhắn.');
    }
  } else {
    // Nếu là chat 1-1 chưa lưu node conversations (tạo mới từ hai UID)
    const uids = convId.split('_');
    uids.forEach(u => {
      if (u) members[u] = true;
    });
  }

  const updates: Record<string, any> = {};

  // 1. Ghi tin nhắn vào cả messages/{convId} và conversations/{convId}/messages (tương thích)
  updates[`messages/${convId}/${messageId}`] = messageData;
  updates[`conversations/${convId}/messages/${messageId}`] = messageData;

  // 2. Cập nhật conversations/{convId}
  updates[`conversations/${convId}/id`] = convId;
  if (!isGroupConv) {
    updates[`conversations/${convId}/members/${senderId}`] = true;
  }
  updates[`conversations/${convId}/lastMessage`] = {
    text: previewText,
    senderId,
    type,
    createdAt: now,
    recalled: false,
  };
  updates[`conversations/${convId}/lastMessageAt`] = now;
  updates[`conversations/${convId}/lastSenderId`] = senderId;

  // 3. Tắt trạng thái đang gõ của người gửi khi gửi tin
  updates[`typing/${convId}/${senderId}`] = null;

  // 4. Cập nhật userConversations và tạo thông báo cho tất cả thành viên trong 1 atomic update
  const memberList = Object.keys(members);
  if (!isGroupConv && !memberList.includes(senderId)) {
    memberList.push(senderId);
  }

  memberList.forEach(mUid => {
    if (!isGroupConv) {
      updates[`conversations/${convId}/members/${mUid}`] = true;
    }

    if (mUid === senderId) {
      // Người gửi: số tin chưa đọc giữ nguyên là 0
      updates[`userConversations/${senderId}/${convId}/lastMessageAt`] = now;
      updates[`userConversations/${senderId}/${convId}/unreadCount`] = 0;
    } else {
      // Người nhận: tăng unreadCount bằng increment(1)
      updates[`userConversations/${mUid}/${convId}/lastMessageAt`] = now;
      updates[`userConversations/${mUid}/${convId}/unreadCount`] = increment(1);

      // Ghi thông báo vào notifications/{uid}
      const notifRef = push(ref(db, `notifications/${mUid}`));
      const notifId = notifRef.key;
      if (notifId) {
        updates[`notifications/${mUid}/${notifId}`] = {
          id: notifId,
          type: 'message',
          convId,
          fromUid: senderId,
          fromName: senderName,
          text: `${senderName}: ${previewText}`,
          createdAt: now,
          read: false,
        };
      }
    }
  });

  // Thực hiện MỘT lệnh update() nhiều đường dẫn (multi-path update)
  await update(ref(db), updates);
  return messageId;
};

/**
 * Gửi tin nhắn text (hàm tương thích ngược với TH5)
 */
export const sendTextMessage = async (
  senderId: string,
  recipientId: string,
  text: string,
  senderName: string = 'Tôi',
): Promise<string> => {
  const chatId = getChatId(senderId, recipientId);
  return sendMessage({
    convId: chatId,
    senderId,
    senderName,
    text,
    type: 'text',
  });
};

/**
 * Gửi tin nhắn vị trí
 */
export const sendLocationMessage = async (
  senderId: string,
  recipientId: string,
  latitude: number,
  longitude: number,
  senderName: string = 'Tôi',
): Promise<string> => {
  const chatId = getChatId(senderId, recipientId);
  return sendMessage({
    convId: chatId,
    senderId,
    senderName,
    text: `📍 Vị trí: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    type: 'location',
    latitude,
    longitude,
  });
};

/**
 * Thu hồi tin nhắn: chỉ người gửi mới được thu hồi, đánh dấu recalled: true
 */
export const recallMessage = async (
  convId: string,
  msgId: string,
  currentUid: string,
): Promise<void> => {
  // Lấy dữ liệu tin nhắn
  let msgSnap = await get(ref(db, `messages/${convId}/${msgId}`));
  if (!msgSnap.exists()) {
    msgSnap = await get(ref(db, `conversations/${convId}/messages/${msgId}`));
  }
  if (!msgSnap.exists()) throw new Error('Không tìm thấy tin nhắn.');

  const msgData = msgSnap.val();
  if (msgData.senderId !== currentUid) {
    throw new Error('Chỉ người gửi mới có thể thu hồi tin nhắn.');
  }

  const updates: Record<string, any> = {};
  updates[`messages/${convId}/${msgId}/recalled`] = true;
  updates[`conversations/${convId}/messages/${msgId}/recalled`] = true;

  // Nếu tin cuối của cuộc trò chuyện bị thu hồi, cập nhật dòng tin cuối
  const convSnap = await get(ref(db, `conversations/${convId}`));
  if (convSnap.exists()) {
    const conv = convSnap.val();
    if (
      conv.lastMessage &&
      (conv.lastMessage.createdAt === msgData.createdAt || conv.lastMessageAt === msgData.createdAt)
    ) {
      updates[`conversations/${convId}/lastMessage/text`] = 'Tin nhắn đã được thu hồi';
      updates[`conversations/${convId}/lastMessage/recalled`] = true;
    }
  }

  await update(ref(db), updates);
};

/**
 * Thả / đổi / hủy cảm xúc trên tin nhắn
 */
export const toggleReaction = async (
  convId: string,
  msgId: string,
  currentUid: string,
  currentUserName: string,
  emoji: string,
): Promise<void> => {
  let reactionSnap = await get(ref(db, `messages/${convId}/${msgId}/reactions/${currentUid}`));
  const currentEmoji = reactionSnap.val();

  // Nhấn lại emoji đang có -> hủy cảm xúc; chọn emoji mới -> đổi
  const newEmoji = currentEmoji === emoji ? null : emoji;

  const updates: Record<string, any> = {};
  updates[`messages/${convId}/${msgId}/reactions/${currentUid}`] = newEmoji;
  updates[`conversations/${convId}/messages/${msgId}/reactions/${currentUid}`] = newEmoji;

  // Gửi thông báo đến người gửi tin nhắn (nếu thả cảm xúc mới và không phải tự thả cho chính mình)
  if (newEmoji) {
    let msgSnap = await get(ref(db, `messages/${convId}/${msgId}`));
    if (!msgSnap.exists()) {
      msgSnap = await get(ref(db, `conversations/${convId}/messages/${msgId}`));
    }
    if (msgSnap.exists()) {
      const msg = msgSnap.val();
      if (msg.senderId && msg.senderId !== currentUid) {
        const notifRef = push(ref(db, `notifications/${msg.senderId}`));
        const notifId = notifRef.key;
        if (notifId) {
          updates[`notifications/${msg.senderId}/${notifId}`] = {
            id: notifId,
            type: 'reaction',
            convId,
            fromUid: currentUid,
            fromName: currentUserName,
            text: `${currentUserName} đã thả cảm xúc ${emoji} vào tin nhắn của bạn`,
            createdAt: Date.now(),
            read: false,
          };
        }
      }
    }
  }

  await update(ref(db), updates);
};

/**
 * Cập nhật trạng thái đang soạn tin (typing indicator) kèm onDisconnect()
 */
export const setTypingStatus = async (
  convId: string,
  uid: string,
  isTyping: boolean,
): Promise<void> => {
  const effectiveUid = uid || auth.currentUser?.uid;
  if (!convId || !effectiveUid) return;
  try {
    const typingRef = ref(db, `typing/${convId}/${effectiveUid}`);
    if (isTyping) {
      await set(typingRef, true);
      onDisconnect(typingRef).remove();
    } else {
      await remove(typingRef);
    }
  } catch (error) {
    console.warn('Error updating typing status:', error);
  }
};

/**
 * Lắng nghe ai đang gõ trong cuộc trò chuyện (loại trừ currentUid)
 */
export const subscribeTypingStatus = (
  convId: string,
  currentUid: string,
  callback: (typingUids: string[]) => void,
): (() => void) => {
  if (!convId) return () => {};
  const effectiveUid = currentUid || auth.currentUser?.uid || '';
  const typingRef = ref(db, `typing/${convId}`);

  const unsubscribe = onValue(
    typingRef,
    snapshot => {
      const list: string[] = [];
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          if (child.key !== effectiveUid && (child.val() === true || !!child.val())) {
            list.push(child.key as string);
          }
        });
      }
      callback(list);
    },
    error => {
      console.warn('Error reading typing status:', error);
    },
  );

  return unsubscribe;
};

/**
 * Đánh dấu đã xem và ghi thời điểm đọc cuối vào readStatus/{convId}/{uid}
 */
export const markConversationAsRead = async (
  convId: string,
  currentUid: string,
): Promise<void> => {
  if (!convId || !currentUid) return;
  const now = Date.now();
  const updates: Record<string, any> = {};
  updates[`userConversations/${currentUid}/${convId}/unreadCount`] = 0;
  updates[`readStatus/${convId}/${currentUid}`] = now;
  try {
    await update(ref(db), updates);
  } catch (error) {
    console.warn('Error marking conversation read:', error);
  }
};

/**
 * Lắng nghe thời điểm đã xem của các thành viên trong cuộc trò chuyện
 */
export const subscribeReadStatus = (
  convId: string,
  callback: (statusMap: Record<string, number>) => void,
): (() => void) => {
  if (!convId) return () => {};
  const readRef = ref(db, `readStatus/${convId}`);

  const unsubscribe = onValue(
    readRef,
    snapshot => {
      const map: Record<string, number> = {};
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          map[child.key as string] = child.val() as number;
        });
      }
      callback(map);
    },
    error => {
      console.warn('Error reading read status:', error);
    },
  );

  return unsubscribe;
};

/**
 * Lắng nghe 20 tin nhắn mới nhất (limitToLast(20))
 */
export const subscribeMessages = (
  convId: string,
  callback: (messages: Message[]) => void,
  limitCount: number = 20,
): (() => void) => {
  if (!convId) return () => {};
  const messagesQuery = query(
    ref(db, `messages/${convId}`),
    orderByKey(),
    limitToLast(limitCount),
  );

  const parseSnap = (snapshot: any) => {
    const list: Message[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((child: any) => {
        const val = child.val();
        list.push({
          id: child.key || val.id,
          senderId: val.senderId,
          senderName: val.senderName,
          text: val.text,
          type: val.type || 'text',
          createdAt: val.createdAt || Date.now(),
          latitude: val.latitude,
          longitude: val.longitude,
          imageUrl: val.imageUrl,
          recalled: !!val.recalled,
          reactions: val.reactions || {},
        });
      });
    }
    list.sort((a, b) => a.createdAt - b.createdAt);
    return list;
  };

  const unsubscribe = onValue(
    messagesQuery,
    snapshot => {
      if (snapshot.exists()) {
        callback(parseSnap(snapshot));
      } else {
        // Fallback đọc từ conversations/{convId}/messages nếu messages chưa có
        const legacyQuery = query(
          ref(db, `conversations/${convId}/messages`),
          orderByKey(),
          limitToLast(limitCount),
        );
        onValue(
          legacyQuery,
          legacySnap => {
            callback(parseSnap(legacySnap));
          },
          { onlyOnce: true },
        );
      }
    },
    error => {
      console.warn('Error reading messages:', error);
    },
  );

  return unsubscribe;
};

/**
 * Tải thêm 20 tin nhắn cũ hơn (phân trang khi kéo lên đầu)
 */
export const loadOlderMessages = async (
  convId: string,
  oldestMessageId: string,
  count: number = 20,
): Promise<Message[]> => {
  if (!convId || !oldestMessageId) return [];

  const olderQuery = query(
    ref(db, `messages/${convId}`),
    orderByKey(),
    endBefore(oldestMessageId),
    limitToLast(count),
  );

  const snapshot = await get(olderQuery);
  const list: Message[] = [];
  if (snapshot.exists()) {
    snapshot.forEach(child => {
      const val = child.val();
      list.push({
        id: child.key || val.id,
        senderId: val.senderId,
        senderName: val.senderName,
        text: val.text,
        type: val.type || 'text',
        createdAt: val.createdAt || Date.now(),
        latitude: val.latitude,
        longitude: val.longitude,
        imageUrl: val.imageUrl,
        recalled: !!val.recalled,
        reactions: val.reactions || {},
      });
    });
  }
  list.sort((a, b) => a.createdAt - b.createdAt);
  return list;
};

/**
 * Lắng nghe danh sách hội thoại của người dùng (hỗ trợ cả 1-1 và Group chat)
 */
export const subscribeUserConversations = (
  currentUid: string,
  callback: (conversations: UserConversationItem[]) => void,
): (() => void) => {
  if (!currentUid) {
    callback([]);
    return () => {};
  }
  const userConvRef = ref(db, `userConversations/${currentUid}`);

  const unsubscribe = onValue(
    userConvRef,
    async snapshot => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const convList: UserConversationItem[] = [];
      const promises: Promise<void>[] = [];

      snapshot.forEach(child => {
        const chatId = child.key as string;
        const val = child.val() || {};
        const lastMessageAt = val.lastMessageAt || 0;
        const unreadCount = val.unreadCount || 0;

        const p = (async () => {
          try {
            // Lấy thông tin phòng chat từ conversations/{chatId}
            const convSnap = await get(ref(db, `conversations/${chatId}`));
            if (!convSnap.exists()) {
              // Phòng chat không tồn tại
              return;
            }

            const conv = convSnap.val();
            const isGroup = conv.type === 'group' || chatId.startsWith('group_');

            // NẾU LÀ NHÓM CHAT: Người dùng hiện tại BẮT BUỘC phải còn trong members
            if (isGroup && (!conv.members || !conv.members[currentUid])) {
              // Tự động dọn dẹp node thừa trong userConversations nếu đã rời nhóm
              remove(ref(db, `userConversations/${currentUid}/${chatId}`)).catch(() => {});
              return;
            }

            const item: UserConversationItem = {
              chatId,
              type: isGroup ? 'group' : 'direct',
              lastMessageAt,
              unreadCount,
              otherUser: undefined,
              lastMessageText: '',
            };

            if (isGroup) {
              item.name = conv.name || 'Nhóm chat';
              item.memberCount = conv.members ? Object.keys(conv.members).length : 0;
            }

            if (conv.lastMessage) {
              const lm = conv.lastMessage;
              if (lm.recalled) {
                item.lastMessageText = 'Tin nhắn đã được thu hồi';
              } else if (lm.type === 'image') {
                item.lastMessageText = '📷 Hình ảnh';
              } else if (lm.type === 'location') {
                item.lastMessageText = '📍 Vị trí';
              } else {
                item.lastMessageText = typeof lm === 'string' ? lm : lm.text || '';
              }
              if (lm.createdAt && !item.lastMessageAt) {
                item.lastMessageAt = lm.createdAt;
              }
            }

            // Nếu là chat 1-1, lấy thông tin đối phương
            if (item.type === 'direct') {
              const uids = chatId.split('_');
              const otherUid = uids[0] === currentUid ? uids[1] : uids[0];
              if (otherUid) {
                const userSnap = await get(ref(db, `users/${otherUid}`));
                if (userSnap.exists()) {
                  item.otherUser = userSnap.val() as UserProfile;
                }
              }
            }

            convList.push(item);
          } catch (e) {
            console.warn('Error resolving conversation item info:', e);
          }
        })();

        promises.push(p);
      });

      await Promise.all(promises);

      // Sắp xếp mới nhất lên đầu
      convList.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
      callback(convList);
    },
    error => {
      console.warn('Error reading user conversations:', error);
    },
  );

  return unsubscribe;
};
