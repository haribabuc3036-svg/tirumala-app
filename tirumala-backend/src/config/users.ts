/**
 * ─── Admin Users ───────────────────────────────────────────────────────────────
 *
 * Add / remove the 1-5 trusted users who are allowed to push data to the backend.
 * Passwords MUST be bcrypt hashes — never store plain text here.
 *
 * To generate a hash for a new password, run:
 *   npx ts-node src/scripts/hash-password.ts yourpassword
 *
 * Then paste the printed hash as `passwordHash` below.
 */

export interface AdminUser {
  username: string;
  /** bcrypt hash of the password */
  passwordHash: string;
}

export const adminUsers: AdminUser[] = [
  // ── Example — replace with your own users ──────────────────────────────────
  // {
  //   username: 'admin',
  //   passwordHash: '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  // },
  // {
  //   username: 'harib',
  //   passwordHash: '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  // },
];
