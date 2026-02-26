import { useEffect, useState } from 'react';
import { supabase } from '@/config/supabase';
import { type ServiceCategory } from '@/types/services';

type ServiceCatalogRow = {
  id: string;
  category_id: string;
  category_heading: string;
  category_icon: string;
  category_image: string | null;
  category_order: number;
  title: string;
  description: string;
  icon: string;
  image: string | null;
  url: string;
  tag: string | null;
  tag_color: string | null;
  sort_order: number;
};

function mapRowsToCategories(rows: ServiceCatalogRow[]): ServiceCategory[] {
  const categoryMap = new Map<string, ServiceCategory & { _order: number }>();

  for (const row of rows) {
    if (!categoryMap.has(row.category_id)) {
      categoryMap.set(row.category_id, {
        id: row.category_id,
        heading: row.category_heading,
        icon: row.category_icon as ServiceCategory['icon'],
        ...(row.category_image ? { image: row.category_image } : {}),
        services: [],
        _order: row.category_order,
      });
    }

    const bucket = categoryMap.get(row.category_id)!;
    bucket.services.push({
      id: row.id,
      title: row.title,
      description: row.description,
      icon: row.icon as ServiceCategory['services'][number]['icon'],
      ...(row.image ? { iconImage: row.image } : {}),
      url: row.url,
      ...(row.tag ? { tag: row.tag } : {}),
      ...(row.tag_color ? { tagColor: row.tag_color } : {}),
    });
  }

  return [...categoryMap.values()]
    .sort((a, b) => a._order - b._order)
    .map(({ _order, ...category }) => category);
}

export function useServicesCatalog() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      try {
        const { data, error: queryError } = await supabase
          .from('services_catalog')
          .select('*')
          .order('category_order', { ascending: true })
          .order('sort_order', { ascending: true });

        if (queryError) {
          throw new Error(queryError.message);
        }

        const mapped = mapRowsToCategories((data ?? []) as ServiceCatalogRow[]);

        if (!cancelled) {
          setCategories(mapped);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load services');
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadServices();
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading, error };
}
