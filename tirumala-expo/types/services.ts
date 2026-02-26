import { type ComponentProps } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export type Service = {
  id: string;
  title: string;
  description: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  url: string;
  tag?: string;
  tagColor?: string;
};

export type ServiceCategory = {
  id: string;
  heading: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  services: Service[];
};

export type ServiceCatalogRow = {
  id: string;
  category_id: string;
  category_heading: string;
  category_icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  category_order: number;
  title: string;
  description: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  url: string;
  tag: string | null;
  tag_color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
