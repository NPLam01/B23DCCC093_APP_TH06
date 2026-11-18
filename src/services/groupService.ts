import { ref, push, update, get, serverTimestamp, increment } from 'firebase/database';
import { db } from './firebase';
import { Conversation, UserProfile } from '../types';

/**
 * Tạo nhóm chat mới với danh sách thành viên tối thiểu 2 người ngoài bản thân
 */
export const createGroupConversation = async (
  currentUid: string,
  currentUserName: string,
  groupName: string,
  selectedMembers: UserProfile[],
): Promise<string> => {
  const trimmedName = groupName.trim();
  if (!trimmedName) throw new Error('Tên nhóm không được để trống.');
  if (selectedMembers.length < 2) {
    throw new Error('Nhóm cần tối thiểu 2 thành viên ngoài bản thân.');
  }

  const groupRef = push(ref(db, 'conversations'));
  const groupId = groupRef.key || `group_${Date.now()}`;
  const now = Date.now();

  const membersObj: Record<string, boolean> = {
    [currentUid]: true,
  };
  selectedMembers.forEach(m => {
    membersObj[m.uid] = true;
  });

  const initialText = `${currentUserName} đã tạo nhóm "${trimmedName}"`;
  const updates: Record<string, any> = {};

  // 1. conversations/{groupId}
  updates[`conversations/${groupId}`] = {
    id: groupId,
    type: 'group',
    name: trimmedName,
    createdBy: currentUid,
    createdAt: now,
    members: membersObj,
    lastMessage: {
      text: initialText,
      senderId: currentUid,
      type: 'text',
      createdAt: now,
    },
    lastMessageAt: now,
    lastSenderId: currentUid,
  };

  // 2. Initial message
  const msgRef = push(ref(db, `messages/${groupId}`));
  const msgId = msgRef.key || `msg_${now}`;
  updates[`messages/${groupId}/${msgId}`] = {
    id: msgId,
    senderId: currentUid,
    senderName: currentUserName,
    text: initialText,
    type: 'text',
    createdAt: now,
    recalled: false,
  };

  // 3. userConversations cho từng thành viên
  Object.keys(membersObj).forEach(uid => {
    updates[`userConversations/${uid}/${groupId}`] = {
      lastMessageAt: now,
      unreadCount: uid === currentUid ? 0 : 1,
    };

    // 4. Gửi thông báo đến các thành viên khác
    if (uid !== currentUid) {
      const notifRef = push(ref(db, `notifications/${uid}`));
      const notifId = notifRef.key || `notif_${now}_${uid}`;
      updates[`notifications/${uid}/${notifId}`] = {
        id: notifId,
        type: 'group_add',
        convId: groupId,
        fromUid: currentUid,
        fromName: currentUserName,
        text: `Bạn đã được thêm vào nhóm "${trimmedName}"`,
        createdAt: now,
        read: false,
      };
    }
  });

  await update(ref(db), updates);
  return groupId;
};

/**
 * Đổi tên nhóm
 */
export const updateGroupName = async (
  groupId: string,
  newName: string,
  currentUid: string,
  currentUserName: string,
): Promise<void> => {
  const trimmed = newName.trim();
  if (!trimmed) throw new Error('Tên nhóm không được để trống.');

  const now = Date.now();
  const text = `${currentUserName} đã đổi tên nhóm thành "${trimmed}"`;

  const msgRef = push(ref(db, `messages/${groupId}`));
  const msgId = msgRef.key || `msg_${now}`;

  const updates: Record<string, any> = {};
  updates[`conversations/${groupId}/name`] = trimmed;
  updates[`conversations/${groupId}/lastMessage`] = {
    text,
    senderId: currentUid,
    type: 'text',
    createdAt: now,
  };
  updates[`conversations/${groupId}/lastMessageAt`] = now;
  updates[`messages/${groupId}/${msgId}`] = {
    id: msgId,
    senderId: currentUid,
    senderName: currentUserName,
    text,
    type: 'text',
    createdAt: now,
    recalled: false,
  };

  await update(ref(db), updates);
};

/**
 * Rời nhóm
 */
export const leaveGroupConversation = async (
  groupId: string,
  currentUid: string,
  currentUserName: string,
): Promise<void> => {
  const now = Date.now();
  const text = `${currentUserName} đã rời nhóm`;

  const msgRef = push(ref(db, `messages/${groupId}`));
  const msgId = msgRef.key || `msg_${now}`;

  // Lấy danh sách thành viên hiện tại để cập nhật thông báo
  let members: Record<string, boolean> = {};
  try {
    const convSnap = await get(ref(db, `conversations/${groupId}`));
    if (convSnap.exists()) {
      members = convSnap.val().members || {};
    }
  } catch (e) {
    console.warn('Error reading group members before leave:', e);
  }

  const updates: Record<string, any> = {};
  // 1. Xóa thành viên khỏi nhóm và xóa hội thoại của người rời
  updates[`conversations/${groupId}/members/${currentUid}`] = null;
  updates[`userConversations/${currentUid}/${groupId}`] = null;

  // 2. Cập nhật dòng tin nhắn cuối của nhóm
  updates[`conversations/${groupId}/lastMessage`] = {
    text,
    senderId: currentUid,
    type: 'text',
    createdAt: now,
  };
  updates[`conversations/${groupId}/lastMessageAt`] = now;
  updates[`conversations/${groupId}/lastSenderId`] = currentUid;

  // 3. Ghi tin nhắn hệ thống thông báo người rời nhóm
  const systemMsg = {
    id: msgId,
    senderId: currentUid,
    senderName: currentUserName,
    text,
    type: 'text',
    createdAt: now,
    recalled: false,
  };
  updates[`messages/${groupId}/${msgId}`] = systemMsg;
  updates[`conversations/${groupId}/messages/${msgId}`] = systemMsg;

  // 4. Cập nhật lastMessageAt cho các thành viên còn lại
  Object.keys(members).forEach(mUid => {
    if (mUid !== currentUid) {
      updates[`userConversations/${mUid}/${groupId}/lastMessageAt`] = now;
    }
  });

  await update(ref(db), updates);
};

