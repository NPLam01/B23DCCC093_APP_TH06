import { ref, push, set, update, onValue, get } from 'firebase/database';
import { db } from './firebase';
import { AppNotification } from '../types';

/**
 * Gửi một thông báo tới người dùng
 */
export const sendNotification = async (
  toUid: string,
  notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>,
): Promise<void> => {
  if (!toUid) return;
  const notifRef = push(ref(db, `notifications/${toUid}`));
  const notifId = notifRef.key;
  if (!notifId) return;

  const newNotif: AppNotification = {
    ...notification,
    id: notifId,
    createdAt: Date.now(),
    read: false,
  };

  await set(notifRef, newNotif);
};

/**
 * Lắng nghe danh sách thông báo của người dùng theo thời gian thực
 */
export const subscribeNotifications = (
  uid: string,
  callback: (notifications: AppNotification[]) => void,
): (() => void) => {
  if (!uid) {
    callback([]);
    return () => { };
  }

  const notifsRef = ref(db, `notifications/${uid}`);
  const unsubscribe = onValue(
    notifsRef,
    snapshot => {
      const list: AppNotification[] = [];
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          const val = child.val();
          list.push({
            id: child.key || val.id,
            type: val.type,
            convId: val.convId,
            fromUid: val.fromUid,
            fromName: val.fromName,
            text: val.text,
            createdAt: val.createdAt || Date.now(),
            read: !!val.read,
          });
        });
      }
      // Sắp xếp mới nhất lên đầu
      list.sort((a, b) => b.createdAt - a.createdAt);
      callback(list);
    },
    error => {
      console.warn('Error reading notifications:', error);
    },
  );

  return unsubscribe;
};

/**
 * Đánh dấu một thông báo đã đọc
 */
export const markNotificationAsRead = async (
  uid: string,
  notificationId: string,
): Promise<void> => {
  if (!uid || !notificationId) return;
  const notifRef = ref(db, `notifications/${uid}/${notificationId}/read`);
  await set(notifRef, true);
};

/**
 * Đánh dấu tất cả thông báo là đã đọc
 */
export const markAllNotificationsAsRead = async (uid: string): Promise<void> => {
  if (!uid) return;
  try {
    const notifsRef = ref(db, `notifications/${uid}`);
    const snapshot = await get(notifsRef);

    if (!snapshot.exists()) return;

    const updates: Record<string, any> = {};
    snapshot.forEach((child: any) => {
      if (!child.val().read) {
        updates[`notifications/${uid}/${child.key}/read`] = true;
      }
    });

    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
    }
  } catch (error) {
    console.warn('Error marking all notifications as read:', error);
  }
};

