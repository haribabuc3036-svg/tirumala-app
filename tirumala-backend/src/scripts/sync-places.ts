import { syncPlacesCatalog } from '../services/supabase.service';

async function main() {
  const result = await syncPlacesCatalog();
  console.log(
    `✅ Synced places catalog to Supabase. Regions: ${result.regionsUpserted}, Places: ${result.placesUpserted}, Photos: ${result.photosInserted}`
  );
}

main().catch((err) => {
  console.error('❌ Failed to sync places catalog:', err.message);
  process.exit(1);
});
