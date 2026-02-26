import { type ComponentProps } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

function pickIconFromText(text: string): IconName {
  const normalized = text.toLowerCase();

  if (normalized.includes('accommodation')) return 'home-city-outline';
  if (normalized.includes('special entry darshan') || normalized.includes('sed')) return 'ticket-confirmation-outline';
  if (normalized.includes('darshan')) return 'account-group-outline';
  if (normalized.includes('arjitha seva') || normalized.includes('online seva') || normalized.includes('seva')) return 'hands-pray';
  if (normalized.includes('angapradakshinam')) return 'walk';
  if (normalized.includes('e-dip') || normalized.includes('edip')) return 'brightness-5';
  if (normalized.includes('srivani')) return 'shield-star-outline';
  if (normalized.includes('donation') || normalized.includes('hundi') || normalized.includes('trust')) return 'hand-coin-outline';
  if (normalized.includes('disabled') || normalized.includes('differently abled') || normalized.includes('senior citizen')) return 'human-wheelchair';
  if (normalized.includes('kalyanavedika') || normalized.includes('kalyanamandapam')) return 'office-building-outline';
  if (normalized.includes('temple')) return 'temple-hindu';
  if (normalized.includes('homam')) return 'fire-circle';
  if (normalized.includes('products') || normalized.includes('panchagavya')) return 'shopping-outline';

  return 'star-circle-outline';
}

export function resolveTtdIcon(text: string, fallback?: IconName): IconName {
  const mapped = pickIconFromText(text);
  if (mapped !== 'star-circle-outline') {
    return mapped;
  }
  return fallback ?? 'star-circle-outline';
}
