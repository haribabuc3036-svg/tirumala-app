import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// ─────────────────────────────────────────────────────────────────────────────
//  Replace the placeholder values below with your actual Firebase project
//  credentials. You can find them in the Firebase Console under:
//  Project Settings → General → Your apps → SDK setup and configuration
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCEiH2gA93htUaDIfXks9YKORnTcDsBWwQ",
  authDomain: "tirumala-app.firebaseapp.com",
  databaseURL: "https://tirumala-app-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tirumala-app",
  storageBucket: "tirumala-app.firebasestorage.app",
  messagingSenderId: "567928641684",
  appId: "1:567928641684:web:6a2c05422529aa599a3c81",
  measurementId: "G-23RK1Q12D0"
};

// Prevent re-initialising during hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getDatabase(app);
