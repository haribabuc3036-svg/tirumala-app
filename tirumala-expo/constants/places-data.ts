export type Region = {
  id: string;
  title: string;
  subtitle?: string;
};

export type Place = {
  id: string;
  regionId: string;
  name: string;
  distanceFromTirumalaKm: number;
  description: string;
  mapsUrl: string;
  photos: string[];
};

export const REGIONS: Region[] = [
  { id: 'tirumala', title: 'Tirumala', subtitle: 'Temple hills and sacred spots' },
  { id: 'tirupati', title: 'Tirupati', subtitle: 'Pilgrim city attractions' },
  { id: 'chandragiri', title: 'Chandragiri', subtitle: 'Historic forts and heritage' },
  { id: 'vadamalapeta', title: 'Vadamalapeta', subtitle: 'Nearby village temples' },
  { id: 'chittoor', title: 'Chittoor', subtitle: 'Nature and spiritual places' },
  { id: 'nearby-cities', title: 'Near By Cities', subtitle: 'Popular day-trip destinations' },
];

export const PLACES: Place[] = [
  {
    id: 'srivari-temple',
    regionId: 'tirumala',
    name: 'Sri Venkateswara Swamy Temple',
    distanceFromTirumalaKm: 0,
    description:
      'The main temple of Lord Venkateswara and the spiritual heart of Tirumala. Pilgrims visit for darshan and major festivals throughout the year.',
    mapsUrl: 'https://maps.app.goo.gl/6n4Jx4MqqUj9q7Bf7',
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
    photos: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'silathoranam',
    regionId: 'tirumala',
    name: 'Silathoranam',
    distanceFromTirumalaKm: 1.5,
    description:
      'A natural rock arch near Chakra Teertham, considered geologically unique and spiritually significant.',
    mapsUrl: 'https://maps.app.goo.gl/MX4QhyNmz8fNz5Vs8',
    photos: [
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'kapila-theertham',
    regionId: 'tirupati',
    name: 'Kapila Theertham',
    distanceFromTirumalaKm: 21,
    description:
      'A Shiva temple and waterfall at the foothills of Tirumala, especially vibrant during monsoon.',
    mapsUrl: 'https://maps.app.goo.gl/C8P4jF2YjGmYEQFj8',
    photos: [
      'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80',
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
    photos: [
      'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'vadamalapeta-temple',
    regionId: 'vadamalapeta',
    name: 'Village Temple Circuit',
    distanceFromTirumalaKm: 35,
    description:
      'A set of peaceful local temples around Vadamalapeta offering a calm devotional atmosphere.',
    mapsUrl: 'https://maps.app.goo.gl/eR6skWuJQJ1XRKfQ8',
    photos: [
      'https://images.unsplash.com/photo-1597149833265-60c372daea22?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
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
    photos: [
      'https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'talakona',
    regionId: 'chittoor',
    name: 'Talakona Waterfalls',
    distanceFromTirumalaKm: 58,
    description:
      'The tallest waterfall in Andhra Pradesh, surrounded by forest trails and biodiversity.',
    mapsUrl: 'https://maps.app.goo.gl/2qzT8Y6x2FG8s9tG7',
    photos: [
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'srikalahasti',
    regionId: 'nearby-cities',
    name: 'Srikalahasti Temple',
    distanceFromTirumalaKm: 38,
    description:
      'Ancient Shiva temple, one of the Pancha Bhoota sthalas, popular for Rahu-Ketu puja.',
    mapsUrl: 'https://maps.app.goo.gl/gPrGZsTtEo7rTj6N7',
    photos: [
      'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'vellore',
    regionId: 'nearby-cities',
    name: 'Vellore Golden Temple',
    distanceFromTirumalaKm: 110,
    description:
      'Sri Lakshmi Narayani temple known for its gold-covered architecture and serene star-shaped pathway.',
    mapsUrl: 'https://maps.app.goo.gl/Xi8JpQPn14EwCaiD8',
    photos: [
      'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1524492449090-1e45f0ef5f8f?auto=format&fit=crop&w=1200&q=80',
    ],
  },
];

export function getRegionById(regionId: string): Region | undefined {
  return REGIONS.find((region) => region.id === regionId);
}

export function getPlacesByRegion(regionId: string): Place[] {
  return PLACES.filter((place) => place.regionId === regionId);
}

export function getPlaceById(placeId: string): Place | undefined {
  return PLACES.find((place) => place.id === placeId);
}
