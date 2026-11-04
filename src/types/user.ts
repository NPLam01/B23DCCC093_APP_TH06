export interface UserStatus {
  state: 'online' | 'offline';
  lastChanged: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatar?: string;
  avatarColor?: string;
  avatarInitials?: string;
  status?: UserStatus;
}
