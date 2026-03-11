import { supabaseAdmin } from '../config/supabase';
import { uploadPlacePhotoUrlToCloudinary } from '../services/cloudinary.service';

type PlacePhotoRow = {
  id: number;
  place_id: string;
  image_url: string;
  public_id: string | null;
};

async function main() {
  const { data, error } = await supabaseAdmin
    .from('place_photos')
    .select('id, place_id, image_url, public_id')
    .order('id', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch place photos: ${error.message}`);
  }

  const rows = (data ?? []) as PlacePhotoRow[];
  const pending = rows.filter((row) => !row.public_id);

  if (pending.length === 0) {
    console.log('✅ No place photos pending Cloudinary migration.');
    return;
  }

  let migrated = 0;

  for (const row of pending) {
    try {
      const uploaded = await uploadPlacePhotoUrlToCloudinary(
        row.image_url,
        `${row.place_id}-${row.id}-${Date.now()}`
      );

      const { error: updateError } = await supabaseAdmin
        .from('place_photos')
        .update({
          image_url: uploaded.secure_url,
          public_id: uploaded.public_id,
        })
        .eq('id', row.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      migrated += 1;
      console.log(`✅ Migrated photo ${row.id} -> ${uploaded.public_id}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null
            ? JSON.stringify(error)
            : String(error);
      console.error(`❌ Failed photo ${row.id}: ${message}`);
    }
  }

  console.log(`Done. Migrated ${migrated}/${pending.length} place photos to Cloudinary.`);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
