import { ref, onValue, get, update } from 'firebase/database';
import { db } from './firebase';
import { UserProfile } from '../types';

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return snapshot.val() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const subscribeUsers = (
  currentUid: string,
  callback: (users: UserProfile[]) => void,
): (() => void) => {
  const usersRef = ref(db, 'users');

  const unsubscribe = onValue(
    usersRef,
    snapshot => {
      const list: UserProfile[] = [];
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          const val = child.val() as UserProfile;
          // Filter out current user
          if (val.uid !== currentUid) {
            list.push(val);
          }
        });
      }
      callback(list);
    },
    error => {
      console.error('Error listening to users:', error);
    },
  );

  return unsubscribe;
};

export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserProfile>,
): Promise<void> => {
  const userRef = ref(db, `users/${uid}`);
  await update(userRef, updates);
};
