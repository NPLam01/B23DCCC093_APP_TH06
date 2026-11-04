import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import {
  getDatabase,
  Database,
  connectDatabaseEmulator,
} from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectAuthEmulator } from 'firebase/auth';

/**
 * Cấu hình Firebase
 */
export const firebaseConfig = {
  apiKey: "AIzaSyBtYf1diKt4fk9Dtl4J1cHmtLpJvmsSm5o",
  authDomain: "chatapp-28b1a.firebaseapp.com",
  databaseURL: "https://chatapp-28b1a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chatapp-28b1a",
  storageBucket: "chatapp-28b1a.firebasestorage.app",
  messagingSenderId: "840558334655",
  appId: "1:840558334655:web:d5dc28fe854f343e24ac0a",
  measurementId: "G-X715B2Q4WE",
};

// Khởi tạo Firebase App
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Khởi tạo Authentication với AsyncStorage persistence
let authInstance: FirebaseAuth.Auth;
try {
  const getPersistence = (FirebaseAuth as any).getReactNativePersistence;
  if (typeof getPersistence === 'function') {
    authInstance = (FirebaseAuth as any).initializeAuth(app, {
      persistence: getPersistence(AsyncStorage),
    });
  } else {
    authInstance = FirebaseAuth.getAuth(app);
  }
} catch (error) {
  authInstance = FirebaseAuth.getAuth(app);
}

// Khởi tạo Realtime Database với databaseURL chính xác
export const db: Database = getDatabase(app, firebaseConfig.databaseURL);
export const auth = authInstance;

// Cấu hình Emulator (chỉ bật khi bạn thực sự chạy Firebase Local Emulator trên PC)
const USE_EMULATOR = false;

if (__DEV__ && USE_EMULATOR) {
  connectAuthEmulator(auth, 'http://10.0.2.2:9099', {
    disableWarnings: true,
  });
  connectDatabaseEmulator(db, '10.0.2.2', 9000);
}

export default app;
