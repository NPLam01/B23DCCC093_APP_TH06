export type NotificationType = 'message' | 'group_add' | 'reaction';

export interface AppNotification {
  id: string;
  type: NotificationType;
  convId: string;
  fromUid: string;
  fromName?: string;
  text: string;
  createdAt: number;
  read: boolean;
}

