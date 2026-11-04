import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { ref, set, serverTimestamp } from 'firebase/database';
import { auth, db } from './firebase';
import { UserProfile } from '../types';

export const getAuthErrorMessage = (error: any): string => {
  const code = error?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email này đã được đăng ký tài khoản khác.';
    case 'auth/invalid-email':
      return 'Địa chỉ email không đúng định dạng.';
    case 'auth/weak-password':
      return 'Mật khẩu phải có ít nhất 6 ký tự.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email hoặc mật khẩu không chính xác.';
    case 'auth/too-many-requests':
      return 'Quá nhiều lần thử thất bại. Vui lòng thử lại sau.';
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền.';
    default:
      return error?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
  }
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
): Promise<UserProfile> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const user = userCredential.user;

  await updateProfile(user, { displayName: name.trim() });

  const userProfile: UserProfile = {
    uid: user.uid,
    name: name.trim(),
    email: user.email || email.trim(),
    avatar: '',
    status: {
      state: 'online',
      lastChanged: Date.now(),
    },
  };

  const userRef = ref(db, `users/${user.uid}`);
  try {
    await Promise.race([
      set(userRef, {
        uid: userProfile.uid,
        name: userProfile.name,
        email: userProfile.email,
        avatar: '',
        status: {
          state: 'online',
          lastChanged: serverTimestamp(),
        },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DATABASE_WRITE_TIMEOUT')), 5000),
      ),
    ]);
  } catch (dbError) {
    console.warn('Realtime database write warning (will sync when online):', dbError);
  }

  return userProfile;
};

export const loginUser = async (email: string, password: string): Promise<FirebaseUser> => {
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return userCredential.user;
};

export const logoutUser = async (): Promise<void> => {
  const currentUid = auth.currentUser?.uid;
  if (currentUid) {
    try {
      const statusRef = ref(db, `users/${currentUid}/status`);
      await set(statusRef, {
        state: 'offline',
        lastChanged: serverTimestamp(),
      });
    } catch (e) {
      // ignore
    }
  }
  await signOut(auth);
};

export const subscribeAuthState = (
  callback: (user: FirebaseUser | null) => void,
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};
