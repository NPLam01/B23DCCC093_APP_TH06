export type MessageType = 'text' | 'location' | 'image';

export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  text: string;
  type: MessageType;
  createdAt: number;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  recalled?: boolean;
  reactions?: Record<string, string>; // { [uid]: emoji } e.g. { uid1: '❤️', uid2: '👍' }
  // Temporary client fields for image upload progress
  uploadStatus?: 'uploading' | 'failed' | 'success';
  localUri?: string;
}
