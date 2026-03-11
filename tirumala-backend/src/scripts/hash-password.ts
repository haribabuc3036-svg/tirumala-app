/**
 * hash-password.ts
 * ────────────────
 * Utility to generate a bcrypt hash for a plain-text password.
 *
 * Usage:
 *   npx ts-node src/scripts/hash-password.ts <your-password>
 *
 * Copy the printed hash and paste it as `passwordHash` in src/config/users.ts
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

async function main() {
  const password = process.argv[2];

  if (!password) {
    console.error('Usage: npx ts-node src/scripts/hash-password.ts <password>');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  console.log('\nBcrypt hash for your password:\n');
  console.log(hash);
  console.log('\nPaste this as `passwordHash` in src/config/users.ts\n');
}

main().catch(console.error);
