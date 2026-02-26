export type PlaceRegion = {
  id: string;
  title: string;
  subtitle?: string;
};

export type PlaceSummary = {
  id: string;
  name: string;
  distanceFromTirumalaKm: number;
  description: string;
  mapsUrl: string;
  photos: string[];
};

export type PlaceDetail = PlaceSummary & {
  regionId: string;
};

export type PlaceRegionWithMeta = PlaceRegion & {
  placeCount: number;
  previewPhoto?: string;
};
