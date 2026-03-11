import admin from 'firebase-admin';
import { env } from './env';

// Prevent re-initialisation on hot reload
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.firebase.projectId,
      clientEmail: env.firebase.clientEmail,
      privateKey: env.firebase.privateKey,
    }),
    databaseURL: env.firebase.databaseURL,
  });
}

/** Firebase Admin app instance */
export const firebaseAdmin = admin;

/** Realtime Database (Admin SDK gives full access, no rules restriction) */
export const rtdb = admin.database();

/** Cloud Firestore (if needed later) */
export const firestore = admin.firestore();
