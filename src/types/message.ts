export type MessageType = 'text' | 'location';

export interface Message {
  id: string;
  senderId: string;
  text: string;
  type: MessageType;
  createdAt: number;
  latitude?: number;
  longitude?: number;
}
