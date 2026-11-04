import { MessageType } from './message';
import { UserProfile } from './user';

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
  members: ConversationMembers;
  lastMessage?: ConversationLastMessage | string;
  lastMessageAt?: number;
}

export interface UserConversationItem {
  chatId: string;
  lastMessageAt: number;
  unreadCount: number;
  otherUser?: UserProfile;
  lastMessageText?: string;
}

export interface NotificationItem {
  id: string;
  content: string;
  timestamp: number;
  isRead: boolean;
  conversationId?: string;
}
