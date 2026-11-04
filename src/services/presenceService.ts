import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { db } from './firebase';

/**
 * Quản lý trạng thái hiện diện (presence) của người dùng sử dụng
 * /.info/connected và onDisconnect() theo thời gian thực.
 */
export const setupPresence = (uid: string): (() => void) => {
  if (!uid) return () => {};

  const connectedRef = ref(db, '.info/connected');
  const userStatusRef = ref(db, `users/${uid}/status`);

  const unsubscribe = onValue(connectedRef, async snapshot => {
    if (snapshot.val() === false) {
      return;
    }

    try {
      // Khi mất kết nối hoặc đóng ứng dụng, Firebase server sẽ tự động cập nhật offline
      const disconnectRef = onDisconnect(userStatusRef);
      await disconnectRef.set({
        state: 'offline',
        lastChanged: serverTimestamp(),
      });

      // Đặt trạng thái online khi đang kết nối
      await set(userStatusRef, {
        state: 'online',
        lastChanged: serverTimestamp(),
      });
    } catch (error) {
      console.warn('Presence setup warning:', error);
    }
  });

  return () => {
    unsubscribe();
    // Khi cleanup unmount / logout, cập nhật offline
    try {
      set(userStatusRef, {
        state: 'offline',
        lastChanged: serverTimestamp(),
      });
    } catch (e) {
      // ignore
    }
  };
};

export const setManualStatus = async (uid: string, state: 'online' | 'offline'): Promise<void> => {
  if (!uid) return;
  const userStatusRef = ref(db, `users/${uid}/status`);
  await set(userStatusRef, {
    state,
    lastChanged: serverTimestamp(),
  });
};
