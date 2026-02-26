import { supabaseAdmin } from '../config/supabase';
import type { Database } from '../types/supabase';
import {
  SERVICE_CATEGORIES_SEED,
  type ServiceCategorySeed,
} from '../config/services.seed';

type DarshanRow = Database['public']['Tables']['darshan_updates']['Row'];
type DarshanInsert = Database['public']['Tables']['darshan_updates']['Insert'];
type SsdRow = Database['public']['Tables']['ssd_status']['Row'];
type SsdInsert = Database['public']['Tables']['ssd_status']['Insert'];
type ServiceCatalogRow = Database['public']['Tables']['services_catalog']['Row'];
type ServiceCatalogInsert = Database['public']['Tables']['services_catalog']['Insert'];
type ServiceCatalogUpdate = Database['public']['Tables']['services_catalog']['Update'];

// ─── Darshan Updates ───────────────────────────────────────────────────────────

/** Get all historical darshan updates, newest first */
export async function getAllDarshanUpdates(): Promise<DarshanRow[]> {
  const { data, error } = await supabaseAdmin
    .from('darshan_updates')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Get darshan updates paginated */
export async function getDarshanUpdates(page = 1, limit = 10): Promise<DarshanRow[]> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabaseAdmin
    .from('darshan_updates')
    .select('*')
    .order('date', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Insert a new darshan update record */
export async function insertDarshanUpdate(payload: DarshanInsert): Promise<DarshanRow> {
  const { data, error } = await supabaseAdmin
    .from('darshan_updates')
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Upsert by date (idempotent — safe to call multiple times for the same day) */
export async function upsertDarshanUpdate(payload: DarshanInsert): Promise<DarshanRow> {
  const { data, error } = await supabaseAdmin
    .from('darshan_updates')
    .upsert(payload, { onConflict: 'date' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─── SSD Status ───────────────────────────────────────────────────────────────

/** Get the most recent SSD status row */
export async function getLatestSsdStatus(): Promise<SsdRow | null> {
  const { data, error } = await supabaseAdmin
    .from('ssd_status')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/** Upsert the current SSD status */
export async function upsertSsdStatus(payload: SsdInsert): Promise<SsdRow> {
  const { data, error } = await supabaseAdmin
    .from('ssd_status')
    .upsert(payload, { onConflict: 'date' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─── Services Catalog ─────────────────────────────────────────────────────────

export type ServiceCategoryResponse = {
  id: string;
  heading: string;
  icon: string;
  services: {
    id: string;
    title: string;
    description: string;
    icon: string;
    url: string;
    tag?: string;
    tagColor?: string;
  }[];
};

function mapRowsToCategories(rows: ServiceCatalogRow[]): ServiceCategoryResponse[] {
  const map = new Map<string, ServiceCategoryResponse & { _order: number }>();

  for (const row of rows) {
    if (!map.has(row.category_id)) {
      map.set(row.category_id, {
        id: row.category_id,
        heading: row.category_heading,
        icon: row.category_icon,
        services: [],
        _order: row.category_order,
      });
    }

    const bucket = map.get(row.category_id)!;
    bucket.services.push({
      id: row.id,
      title: row.title,
      description: row.description,
      icon: row.icon,
      url: row.url,
      ...(row.tag ? { tag: row.tag } : {}),
      ...(row.tag_color ? { tagColor: row.tag_color } : {}),
    });
  }

  return [...map.values()]
    .sort((a, b) => a._order - b._order)
    .map(({ _order, ...category }) => category);
}

export async function getServicesCatalog(): Promise<ServiceCategoryResponse[]> {
  const { data, error } = await supabaseAdmin
    .from('services_catalog')
    .select('*')
    .order('category_order', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return mapRowsToCategories(data ?? []);
}

export async function getServiceById(serviceId: string): Promise<ServiceCatalogRow | null> {
  const { data, error } = await supabaseAdmin
    .from('services_catalog')
    .select('*')
    .eq('id', serviceId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createServiceCatalogItem(
  payload: ServiceCatalogInsert
): Promise<ServiceCatalogRow> {
  const { data, error } = await supabaseAdmin
    .from('services_catalog')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateServiceCatalogItem(
  serviceId: string,
  payload: ServiceCatalogUpdate
): Promise<ServiceCatalogRow | null> {
  const { data, error } = await supabaseAdmin
    .from('services_catalog')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', serviceId)
    .select('*')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteServiceCatalogItem(serviceId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('services_catalog')
    .delete()
    .eq('id', serviceId)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data?.id);
}

export async function syncServicesCatalog(
  seedData: ServiceCategorySeed[] = SERVICE_CATEGORIES_SEED
): Promise<number> {
  const payload: ServiceCatalogInsert[] = [];

  seedData.forEach((category, categoryIndex) => {
    category.services.forEach((service, serviceIndex) => {
      payload.push({
        id: service.id,
        category_id: category.id,
        category_heading: category.heading,
        category_icon: category.icon,
        category_order: categoryIndex,
        title: service.title,
        description: service.description,
        icon: service.icon,
        url: service.url,
        tag: service.tag ?? null,
        tag_color: service.tagColor ?? null,
        sort_order: serviceIndex,
      });
    });
  });

  const { error } = await supabaseAdmin
    .from('services_catalog')
    .upsert(payload, { onConflict: 'id' });

  if (error) throw new Error(error.message);
  return payload.length;
}
