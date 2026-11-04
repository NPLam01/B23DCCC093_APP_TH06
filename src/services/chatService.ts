import {
  ref,
  push,
  update,
  onValue,
  get,
  set,
  serverTimestamp,
  increment,
} from 'firebase/database';
import { db } from './firebase';
import { getChatId } from '../utils/getChatId';
import { Message, UserConversationItem, UserProfile } from '../types';

export const sendTextMessage = async (
  senderId: string,
  recipientId: string,
  text: string,
): Promise<string> => {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('EMPTY_MESSAGE');

  const chatId = getChatId(senderId, recipientId);
  const messagesRef = ref(db, `conversations/${chatId}/messages`);
  const newMsgRef = push(messagesRef);
  const messageId = newMsgRef.key;
  if (!messageId) throw new Error('FAILED_TO_GENERATE_ID');

  const now = Date.now();
  const messageData: Partial<Message> = {
    id: messageId,
    senderId,
    text: trimmed,
    type: 'text',
    createdAt: now,
  };

  const updates: Record<string, any> = {};
  // 1. New message
  updates[`conversations/${chatId}/messages/${messageId}`] = messageData;
  // 2. Members
  updates[`conversations/${chatId}/members/${senderId}`] = true;
  updates[`conversations/${chatId}/members/${recipientId}`] = true;
  // 3. Last message in conversation
  updates[`conversations/${chatId}/lastMessage`] = {
    text: trimmed,
    senderId,
    type: 'text',
    createdAt: now,
  };
  updates[`conversations/${chatId}/lastMessageAt`] = now;
  // 4. Sender userConversations (unread count remains 0 for sender)
  updates[`userConversations/${senderId}/${chatId}/lastMessageAt`] = now;
  updates[`userConversations/${senderId}/${chatId}/unreadCount`] = 0;
  // 5. Recipient userConversations (increment unread count)
  updates[`userConversations/${recipientId}/${chatId}/lastMessageAt`] = now;
  updates[`userConversations/${recipientId}/${chatId}/unreadCount`] = increment(1);

  await update(ref(db), updates);
  return messageId;
};

export const sendLocationMessage = async (
  senderId: string,
  recipientId: string,
  latitude: number,
  longitude: number,
): Promise<string> => {
  const chatId = getChatId(senderId, recipientId);
  const messagesRef = ref(db, `conversations/${chatId}/messages`);
  const newMsgRef = push(messagesRef);
  const messageId = newMsgRef.key;
  if (!messageId) throw new Error('FAILED_TO_GENERATE_ID');

  const now = Date.now();
  const locationText = `📍 Vị trí: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  const messageData: Partial<Message> = {
    id: messageId,
    senderId,
    text: locationText,
    type: 'location',
    createdAt: now,
    latitude,
    longitude,
  };

  const updates: Record<string, any> = {};
  updates[`conversations/${chatId}/messages/${messageId}`] = messageData;
  updates[`conversations/${chatId}/members/${senderId}`] = true;
  updates[`conversations/${chatId}/members/${recipientId}`] = true;
  updates[`conversations/${chatId}/lastMessage`] = {
    text: locationText,
    senderId,
    type: 'location',
    createdAt: now,
  };
  updates[`conversations/${chatId}/lastMessageAt`] = now;
  updates[`userConversations/${senderId}/${chatId}/lastMessageAt`] = now;
  updates[`userConversations/${senderId}/${chatId}/unreadCount`] = 0;
  updates[`userConversations/${recipientId}/${chatId}/lastMessageAt`] = now;
  updates[`userConversations/${recipientId}/${chatId}/unreadCount`] = increment(1);

  await update(ref(db), updates);
  return messageId;
};

export const subscribeMessages = (
  chatId: string,
  callback: (messages: Message[]) => void,
): (() => void) => {
  const messagesRef = ref(db, `conversations/${chatId}/messages`);

  const unsubscribe = onValue(
    messagesRef,
    snapshot => {
      const list: Message[] = [];
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          const val = child.val();
          list.push({
            id: child.key || val.id,
            senderId: val.senderId,
            text: val.text,
            type: val.type || 'text',
            createdAt: val.createdAt || Date.now(),
            latitude: val.latitude,
            longitude: val.longitude,
          });
        });
      }
      // Sort ascending by createdAt
      list.sort((a, b) => a.createdAt - b.createdAt);
      callback(list);
    },
    error => {
      console.error('Error subscribing to messages:', error);
    },
  );

  return unsubscribe;
};

export const markConversationAsRead = async (
  currentUid: string,
  chatId: string,
): Promise<void> => {
  try {
    const unreadRef = ref(db, `userConversations/${currentUid}/${chatId}/unreadCount`);
    await set(unreadRef, 0);
  } catch (error) {
    console.warn('Error marking conversation as read:', error);
  }
};

export const subscribeUserConversations = (
  currentUid: string,
  callback: (conversations: UserConversationItem[]) => void,
): (() => void) => {
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

        // Extract partner UID from chatId (format: uidA_uidB)
        const uids = chatId.split('_');
        const otherUid = uids[0] === currentUid ? uids[1] : uids[0];

        const item: UserConversationItem = {
          chatId,
          lastMessageAt,
          unreadCount,
          otherUser: undefined,
          lastMessageText: '',
        };

        convList.push(item);

        const p = (async () => {
          try {
            // Fetch partner profile
            if (otherUid) {
              const userSnap = await get(ref(db, `users/${otherUid}`));
              if (userSnap.exists()) {
                item.otherUser = userSnap.val() as UserProfile;
              }
            }
            // Fetch last message text
            const lastMsgSnap = await get(ref(db, `conversations/${chatId}/lastMessage`));
            if (lastMsgSnap.exists()) {
              const lastMsgVal = lastMsgSnap.val();
              item.lastMessageText = typeof lastMsgVal === 'string' ? lastMsgVal : lastMsgVal.text;
              if (lastMsgVal.createdAt && !item.lastMessageAt) {
                item.lastMessageAt = lastMsgVal.createdAt;
              }
            }
          } catch (e) {
            console.warn('Error resolving conversation item info:', e);
          }
        })();

        promises.push(p);
      });

      await Promise.all(promises);

      // Sort by lastMessageAt descending (newest on top)
      convList.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
      callback(convList);
    },
    error => {
      console.error('Error subscribing to user conversations:', error);
    },
  );

  return unsubscribe;
};
