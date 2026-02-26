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

const BASE = 'https://ttdevasthanams.ap.gov.in/home';

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'darshan',
    heading: 'Darshan',
    icon: 'eye-outline',
    services: [
      {
        id: 'sed',
        title: 'Special Entry Darshan',
        description:
          'Book ₹300 Special Entry Darshan (SED) tickets online for Srivari Temple, Tirumala. Tickets are released monthly and are available on a first-come-first-served basis.',
        icon: 'ticket-confirmation-outline',
        url: `${BASE}/sed`,
        tag: '₹ 300',
        tagColor: '#2196F3',
      },
      {
        id: 'sed-ammavari',
        title: 'SED — Ammavari Temple',
        description:
          'Book ₹200 Special Entry Darshan tickets for Sri Padmavathi Ammavari Temple, Tiruchanoor. Monthly quota released online.',
        icon: 'ticket-account',
        url: `${BASE}/sed-ammavari-temple`,
        tag: '₹ 200',
        tagColor: '#9C27B0',
      },
      {
        id: 'differently-abled',
        title: 'Sr. Citizen / Differently Abled',
        description:
          'Dedicated darshan quota for senior citizens (60+) and differently-abled pilgrims. A valid ID proof is required at the time of reporting.',
        icon: 'wheelchair-accessibility',
        url: `${BASE}/physically-challenged`,
        tag: 'Priority',
        tagColor: '#FF9800',
      },
      {
        id: 'ssd-token',
        title: 'Sarva Darshan Token',
        description:
          'Free Sarva Darshan (SSD) tokens are issued at physical counters in Tirumala on a first-come-first-served basis. No online booking required.',
        icon: 'counter',
        url: 'https://www.tirumala.org/',
        tag: 'Free',
        tagColor: '#4CAF50',
      },
    ],
  },
  {
    id: 'sevas',
    heading: 'Sevas',
    icon: 'flower-outline',
    services: [
      {
        id: 'arjitha-sevas',
        title: 'Arjitha Sevas',
        description:
          'Book premium sevas such as Suprabhatam, Thomala, Asthadala Pada Padmaradhana, Kalyanam, Unjal Seva, Arjitha Brahmotsavam and more. Monthly quota released online.',
        icon: 'flower-tulip-outline',
        url: `${BASE}/arjitha-seva`,
        tag: 'Seva',
        tagColor: '#9C27B0',
      },
      {
        id: 'angapradakshinam',
        title: 'Angapradakshinam',
        description:
          'Register for Angapradakshinam — a full-body circumambulation of Srivari temple by rolling on the ground. Monthly tokens released online.',
        icon: 'rotate-right',
        url: `${BASE}/angapradakshinam`,
      },
      {
        id: 'angapradakshinam-locals',
        title: 'Angapradakshinam (Locals)',
        description:
          'Angapradakshinam e-DIP registration for locals of Tirupati (Urban & Rural), Tirumala, Chandragiri and Renigunta mandals.',
        icon: 'account-check-outline',
        url: `${BASE}/angapradakshinam-local`,
        tag: 'Locals',
        tagColor: '#607D8B',
      },
      {
        id: 'seva-edip',
        title: 'Seva E-Dip',
        description:
          'Electronic dip (E-Dip) registration for Arjitha Seva participation. Open for Suprabhatam, Thomala, Archana and Asthadala Pada Padmaradhana sevas.',
        icon: 'ballot-outline',
        url: `${BASE}/seva-edip`,
      },
      {
        id: 'homam',
        title: 'Sri Srinivasa Divyanugraha Homam',
        description:
          'Book homam participation tickets at Saptha Gau Pradhakshina shala, Alipiri. Monthly quota released online.',
        icon: 'fire',
        url: `${BASE}/homam`,
      },
    ],
  },
  {
    id: 'virtual-sevas',
    heading: 'Virtual Sevas',
    icon: 'monitor-star',
    services: [
      {
        id: 'online-sevas',
        title: 'Online Sevas (Virtual)',
        description:
          'Participate in Kalyanothsavam, Unjal Seva, Arjitha Brahmotsavam and Sahasra Deepalankara Seva virtually from anywhere in the world.',
        icon: 'television-play',
        url: `${BASE}/online-sevas`,
        tag: 'Online',
        tagColor: '#2196F3',
      },
      {
        id: 'virtual-srivari',
        title: 'Srivari Temple Virtual Darshan',
        description:
          'Take virtual darshan of Lord Venkateswara Swamy in Srivari Temple, Tirumala, streamed live by TTD.',
        icon: 'webcam',
        url: `${BASE}/virtual-darshan`,
        tag: 'Live',
        tagColor: '#4CAF50',
      },
      {
        id: 'virtual-ammavari',
        title: 'Ammavari Temple Virtual Darshan',
        description:
          'Virtual participation sevas at Sri Padmavathi Ammavari Temple, Tiruchanoor — watch live seva from home.',
        icon: 'webcam-off',
        url: `${BASE}/virtual-darshan`,
      },
    ],
  },
  {
    id: 'accommodation',
    heading: 'Accommodation',
    icon: 'bed-outline',
    services: [
      {
        id: 'accommodation',
        title: 'Cottage / Room Booking',
        description:
          'Online booking for TTD guest houses, cottages and rooms in Tirumala and Tirupati. Accommodation quota for each month is released online in advance.',
        icon: 'home-city-outline',
        url: `${BASE}/accommodation`,
      },
    ],
  },
  {
    id: 'donations',
    heading: 'Donations & e-Hundi',
    icon: 'hand-coin-outline',
    services: [
      {
        id: 'swami-ehundi',
        title: 'Swamyvari (e-Hundi)',
        description:
          'Make online donations to Srivari Hundi, Tirumala. All donations go directly to the Srivari temple trust for religious and charitable activities.',
        icon: 'piggy-bank-outline',
        url: `${BASE}/swami-ehundi`,
      },
      {
        id: 'ammavari-ehundi',
        title: 'Ammavari (e-Hundi)',
        description:
          'Online donations to Sri Padmavathi Ammavari Temple hundi, Tiruchanoor. Receipts are issued for all donations.',
        icon: 'hand-heart-outline',
        url: `${BASE}/ammavari-ehundi`,
      },
      {
        id: 'srivani',
        title: 'SRIVANI & Trust Donations',
        description:
          'Donate ₹10,000+ to SRIVANI Trust and earn exclusive break darshan privileges. Donors get same-day darshan slots at 4:00 PM daily.',
        icon: 'certificate-outline',
        url: `${BASE}/srivani`,
        tag: '₹ 10k+',
        tagColor: '#FF9800',
      },
      {
        id: 'usses',
        title: 'SV Pranadana Trust — USSES',
        description:
          'Udayasthamana Seva Sponsorship (USSES) — sponsor all sevas from sunrise to sunset for one full day at Srivari Temple.',
        icon: 'weather-sunny',
        url: `${BASE}/usses`,
      },
      {
        id: 'donor-privileges',
        title: 'Donor / USSES Privileges',
        description:
          'View and avail break darshan and accommodation privileges for existing SRIVANI and USSES donors.',
        icon: 'star-circle-outline',
        url: `${BASE}/donor-privileges`,
      },
    ],
  },
  {
    id: 'publications',
    heading: 'Publications & Products',
    icon: 'book-open-page-variant-outline',
    services: [
      {
        id: 'sapthagiri',
        title: 'Sapthagiri Magazine',
        description:
          "Subscribe to TTD's renowned monthly spiritual magazine Sapthagiri, published in Telugu and English with devotional articles, temple news and history.",
        icon: 'newspaper-variant-outline',
        url: `${BASE}/sapthagiri`,
      },
      {
        id: 'diaries',
        title: 'Diaries / Calendars / Panchangam',
        description:
          "Order TTD's annual diaries, wall calendars and Telugu Panchangam (almanac) online. Limited copies available each year.",
        icon: 'calendar-text-outline',
        url: `${BASE}/diaries`,
      },
      {
        id: 'panchagavya',
        title: 'Panchagavya Products',
        description:
          'Buy pure Panchagavya-based products (soap, ghee, tooth powder, etc.) prepared by TTD using traditional methods.',
        icon: 'cow',
        url: `${BASE}/panchagavya`,
      },
    ],
  },
  {
    id: 'venues',
    heading: 'Venues & Payments',
    icon: 'office-building-outline',
    services: [
      {
        id: 'kalyanavedika',
        title: 'Kalyanavedika',
        description:
          "Register for TTD's Kalyanavedika — a subsidised marriage assistance scheme for economically weaker sections conducted at Tirumala.",
        icon: 'ring',
        url: `${BASE}/kalyanavedika`,
      },
      {
        id: 'kalyanamandapam',
        title: 'Kalyanamandapam',
        description:
          'Book TTD Kalyanamandapam halls for weddings and functions in Tirupati and nearby locations.',
        icon: 'door-open',
        url: `${BASE}/kalyanamandapam`,
      },
      {
        id: 'lease-rental',
        title: 'Lease & Rental Payments',
        description:
          'Pay your TTD property lease and rental dues online securely through the portal.',
        icon: 'file-sign',
        url: `${BASE}/lease-rental`,
      },
      {
        id: 'demand-collection',
        title: 'Demand Collection Balance',
        description:
          'Check and pay outstanding TTD demand collection balances online.',
        icon: 'receipt',
        url: `${BASE}/demand-collection`,
      },
    ],
  },
  {
    id: 'temples',
    heading: 'TTD Temples',
    icon: 'temple-hindu',
    services: [
      {
        id: 'ttd-temples',
        title: 'TTD Temples',
        description:
          'Explore all temples managed by TTD across India — including those in Chennai, Hyderabad, Bengaluru, Visakhapatnam and more — and book local temple sevas.',
        icon: 'map-marker-multiple-outline',
        url: `${BASE}/ttd-temples`,
      },
    ],
  },
];

/** Look up a single service by its id across all categories */
export function findServiceById(id: string): Service | undefined {
  for (const cat of SERVICE_CATEGORIES) {
    const svc = cat.services.find((s) => s.id === id);
    if (svc) return svc;
  }
  return undefined;
}
