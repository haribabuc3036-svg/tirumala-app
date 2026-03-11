export type PlaceRegionSeed = {
  id: string;
  title: string;
  subtitle?: string;
  sortOrder: number;
};

export type PlaceSeed = {
  id: string;
  regionId: string;
  name: string;
  distanceFromTirumalaKm: number;
  description: string;
  mapsUrl: string;
  sortOrder: number;
  photos: string[];
};

export const PLACE_REGIONS_SEED: PlaceRegionSeed[] = [
  { id: 'tirumala', title: 'Tirumala', subtitle: 'Temple hills and sacred spots', sortOrder: 0 },
  { id: 'tirupati', title: 'Tirupati', subtitle: 'Pilgrim city attractions', sortOrder: 1 },
  { id: 'chandragiri', title: 'Chandragiri', subtitle: 'Historic forts and heritage', sortOrder: 2 },
  { id: 'vadamalapeta', title: 'Vadamalapeta', subtitle: 'Nearby village temples', sortOrder: 3 },
  { id: 'chittoor', title: 'Chittoor', subtitle: 'Nature and spiritual places', sortOrder: 4 },
  { id: 'nearby-cities', title: 'Near By Cities', subtitle: 'Popular day-trip destinations', sortOrder: 5 },
];

export const PLACES_SEED: PlaceSeed[] = [
  {
    id: 'srivari-temple',
    regionId: 'tirumala',
    name: 'Sri Venkateswara Swamy Temple',
    distanceFromTirumalaKm: 0,
    description:
      'The main temple of Lord Venkateswara and the spiritual heart of Tirumala. Pilgrims visit for darshan and major festivals throughout the year.',
    mapsUrl: 'https://maps.app.goo.gl/6n4Jx4MqqUj9q7Bf7',
    sortOrder: 0,
    photos: [
      'https://images.unsplash.com/photo-1581822261290-991b38693d1b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600106612257-0fcf7db4f0af?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'akasa-ganga',
    regionId: 'tirumala',
    name: 'Akasa Ganga',
    distanceFromTirumalaKm: 3,
    description:
      'A sacred waterfall where water is traditionally used for temple rituals. The surroundings are scenic and peaceful.',
    mapsUrl: 'https://maps.app.goo.gl/QzwvY6qkZ7JrQ2Yr8',
    sortOrder: 1,
    photos: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'govindaraja-temple',
    regionId: 'tirupati',
    name: 'Sri Govindaraja Swamy Temple',
    distanceFromTirumalaKm: 22,
    description:
      'Historic Vaishnavite temple in Tirupati known for its impressive gopuram and traditional architecture.',
    mapsUrl: 'https://maps.app.goo.gl/iJYxk5vCDfSGw9sZ9',
    sortOrder: 0,
    photos: [
      'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'chandragiri-fort',
    regionId: 'chandragiri',
    name: 'Chandragiri Fort',
    distanceFromTirumalaKm: 28,
    description:
      'A historic fort associated with the Vijayanagara empire, featuring a museum and evening light show.',
    mapsUrl: 'https://maps.app.goo.gl/W3nZd5xQF4ZAfMDb7',
    sortOrder: 0,
    photos: [
      'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'kanipakam',
    regionId: 'chittoor',
    name: 'Kanipakam Vinayaka Temple',
    distanceFromTirumalaKm: 72,
    description:
      'Famous temple dedicated to Lord Ganesha, known for its self-manifested idol and strong local devotion.',
    mapsUrl: 'https://maps.app.goo.gl/2sGxB4h9v8T6QcKf8',
    sortOrder: 0,
    photos: [
      'https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
    ],
  },
];
