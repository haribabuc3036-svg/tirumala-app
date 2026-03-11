import { type ComponentProps } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export type Service = {
  id: string;
  title: string;
  description: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconImage?: string;
  images?: string[];
  url: string;
  tag?: string;
  tagColor?: string;
  showOnOverview?: boolean;
  overviewOrder?: number;
  /** Resolved single active booking date (next upcoming or currently-open slot). */
  bookingDate?: string | null;
  /** Full array of scheduled booking dates for the year, as ISO strings. */
  bookingDates?: string[] | null;
  instructions?: string[] | null;
  /** Custom CTA button label shown on the service detail page (default: "Check Availability"). */
  buttonText?: string | null;
  /** Custom CTA URL (overrides `url` when set). */
  buttonUrl?: string | null;
};

export type ServiceCategory = {
  id: string;
  heading: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  image?: string;
  services: Service[];
};

export type ServiceCatalogRow = {
  id: string;
  category_id: string;
  category_heading: string;
  category_icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  category_image: string | null;
  category_order: number;
  title: string;
  description: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  image: string | null;
  url: string;
  tag: string | null;
  tag_color: string | null;
  sort_order: number;
  show_on_overview: boolean;
  overview_order: number;
  created_at: string;
  updated_at: string;
};
