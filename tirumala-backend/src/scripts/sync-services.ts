import { syncServicesCatalog } from '../services/supabase.service';

async function main() {
  const upserted = await syncServicesCatalog();
  console.log(`✅ Synced services catalog to Supabase. Rows upserted: ${upserted}`);
}

main().catch((err) => {
  console.error('❌ Failed to sync services catalog:', err.message);
  process.exit(1);
});
