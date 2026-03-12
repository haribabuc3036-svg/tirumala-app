/**
 * Push Notification Service
 * - Stores/retrieves FCM tokens in Firebase RTDB under /push_tokens/
 * - Deduplicates booking reminders via /notification_log/
 * - Sends notifications via Firebase Admin SDK (FCM)
 */

import { firebaseAdmin, rtdb } from '../config/firebase';

// ─── Token Storage (RTDB) ────────────────────────────────────────────────────

function tokenKey(token: string): string {
  // Use base64url of the token as a safe RTDB key
  return Buffer.from(token).toString('base64').replace(/[.#$/[\]]/g, '_');
}

export async function upsertFcmToken(token: string, platform?: string): Promise<void> {
  const key = tokenKey(token);
  await rtdb.ref(`push_tokens/${key}`).set({
    token,
    platform: platform ?? 'unknown',
    updatedAt: Date.now(),
  });
}

export async function removeFcmToken(token: string): Promise<void> {
  const key = tokenKey(token);
  await rtdb.ref(`push_tokens/${key}`).remove();
}

export async function getAllFcmTokens(): Promise<string[]> {
  const snap = await rtdb.ref('push_tokens').once('value');
  if (!snap.exists()) return [];
  const data = snap.val() as Record<string, { token: string }>;
  return Object.values(data).map((entry) => entry.token);
}

// ─── Send Notifications (FCM) ────────────────────────────────────────────────

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface SendResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
}

export async function sendToTokens(
  tokens: string[],
  notification: NotificationPayload
): Promise<SendResult> {
  if (tokens.length === 0) return { successCount: 0, failureCount: 0, invalidTokens: [] };

  const result: SendResult = { successCount: 0, failureCount: 0, invalidTokens: [] };

  // FCM sendEachForMulticast accepts up to 500 tokens at a time
  const CHUNK = 500;
  for (let i = 0; i < tokens.length; i += CHUNK) {
    const chunk = tokens.slice(i, i + CHUNK);

    const response = await firebaseAdmin.messaging().sendEachForMulticast({
      tokens: chunk,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data
        ? Object.fromEntries(
            Object.entries(notification.data).map(([k, v]) => [k, String(v)])
          )
        : undefined,
      android: {
        priority: 'high',
        notification: { sound: 'default' },
      },
      apns: {
        payload: { aps: { sound: 'default' } },
      },
    });

    result.successCount += response.successCount;
    result.failureCount += response.failureCount;

    // Collect invalid/unregistered tokens for cleanup
    response.responses.forEach((res, idx) => {
      if (!res.success && res.error) {
        const code = res.error.code;
        if (
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/registration-token-not-registered'
        ) {
          result.invalidTokens.push(chunk[idx]);
        }
      }
    });
  }

  // Auto-cleanup stale tokens
  await Promise.all(result.invalidTokens.map((t) => removeFcmToken(t)));

  return result;
}

export async function broadcastNotification(notification: NotificationPayload): Promise<SendResult> {
  const tokens = await getAllFcmTokens();
  if (tokens.length === 0) {
    console.log('[push] No FCM tokens registered, skipping broadcast');
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }
  console.log(`[push] Broadcasting to ${tokens.length} device(s): "${notification.title}"`);
  return sendToTokens(tokens, notification);
}

// ─── Reminder Deduplication (RTDB) ───────────────────────────────────────────

function reminderKey(serviceId: string, bookingDate: string, type: string): string {
  // Compose a safe RTDB key
  const raw = `${serviceId}__${bookingDate}__${type}`;
  return raw.replace(/[.#$/[\]:]/g, '_');
}

export async function wasReminderSent(
  serviceId: string,
  bookingDate: string,
  type: '1hr' | '5min'
): Promise<boolean> {
  const key = reminderKey(serviceId, bookingDate, type);
  const snap = await rtdb.ref(`notification_log/${key}`).once('value');
  return snap.exists();
}

export async function markReminderSent(
  serviceId: string,
  bookingDate: string,
  type: '1hr' | '5min'
): Promise<void> {
  const key = reminderKey(serviceId, bookingDate, type);
  await rtdb.ref(`notification_log/${key}`).set({ sentAt: Date.now(), serviceId, bookingDate, type });
}
