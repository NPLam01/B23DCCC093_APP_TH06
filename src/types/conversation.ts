import { MessageType } from './message';
import { UserProfile } from './user';

export type ConversationType = 'direct' | 'group';

export interface ConversationMembers {
  [uid: string]: boolean;
}

export interface ConversationLastMessage {
  text: string;
  senderId: string;
  createdAt: number;
  type?: MessageType;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string; // group name
  createdBy?: string;
  createdAt?: number;
  members: ConversationMembers;
  lastMessage?: ConversationLastMessage | string;
  lastMessageAt?: number;
  lastSenderId?: string;
}

export interface UserConversationItem {
  chatId: string;
  type: ConversationType;
  name?: string;
  lastMessageAt: number;
  unreadCount: number;
  otherUser?: UserProfile; // For 1-1 chat
  memberCount?: number; // For group chat
  lastMessageText?: string;
  lastSenderId?: string;
}

// Keep backwards-compatibility for components referencing NotificationItem
export interface NotificationItem {
  id: string;
  content: string;
  timestamp: number;
  isRead: boolean;
  conversationId?: string;
}
