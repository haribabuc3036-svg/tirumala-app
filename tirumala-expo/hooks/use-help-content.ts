import { useEffect, useState } from 'react';
import { supabase } from '@/config/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type HelpFaq = {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
};

export type HelpDressCodeItem = {
  id: number;
  section: 'men' | 'women' | 'general';
  content: string;
  sort_order: number;
};

export type HelpDosDontItem = {
  id: number;
  type: 'do' | 'dont';
  content: string;
  sort_order: number;
};

export type HelpContactItem = {
  id: number;
  label: string;
  sub_label: string;
  icon: string;
  url: string;
  sort_order: number;
};

export type HelpContent = {
  faqs: HelpFaq[];
  dressCode: {
    men: HelpDressCodeItem[];
    women: HelpDressCodeItem[];
    general: HelpDressCodeItem[];
  };
  dos: HelpDosDontItem[];
  donts: HelpDosDontItem[];
  contactSupport: HelpContactItem[];
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHelpContent() {
  const [content, setContent] = useState<HelpContent>({
    faqs: [],
    dressCode: { men: [], women: [], general: [] },
    dos: [],
    donts: [],
    contactSupport: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [faqsRes, dressCodeRes, dosDontsRes, contactRes] = await Promise.all([
          supabase
            .from('help_faqs')
            .select('id, question, answer, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
          supabase
            .from('help_dress_code')
            .select('id, section, content, sort_order')
            .eq('is_active', true)
            .order('section', { ascending: true })
            .order('sort_order', { ascending: true }),
          supabase
            .from('help_dos_donts')
            .select('id, type, content, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
          supabase
            .from('help_contact_support')
            .select('id, label, sub_label, icon, url, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
        ]);

        if (faqsRes.error) throw new Error(faqsRes.error.message);
        if (dressCodeRes.error) throw new Error(dressCodeRes.error.message);
        if (dosDontsRes.error) throw new Error(dosDontsRes.error.message);
        if (contactRes.error) throw new Error(contactRes.error.message);

        if (cancelled) return;

        const dressCodeItems = (dressCodeRes.data ?? []) as HelpDressCodeItem[];
        const dosDontsItems = (dosDontsRes.data ?? []) as HelpDosDontItem[];

        setContent({
          faqs: (faqsRes.data ?? []) as HelpFaq[],
          dressCode: {
            men: dressCodeItems.filter((r) => r.section === 'men'),
            women: dressCodeItems.filter((r) => r.section === 'women'),
            general: dressCodeItems.filter((r) => r.section === 'general'),
          },
          dos: dosDontsItems.filter((r) => r.type === 'do'),
          donts: dosDontsItems.filter((r) => r.type === 'dont'),
          contactSupport: (contactRes.data ?? []) as HelpContactItem[],
        });
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load help content');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { content, loading, error };
}
