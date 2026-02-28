import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const env = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  /** Secret used to sign / verify JWT tokens */
  jwtSecret: required('JWT_SECRET'),
  /** Token expiry (default 7 days). Used for both the JWT and the cookie maxAge. */
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  /** Allowed CORS origin (browser frontend URL). Comma-separate multiple origins. */
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:8081',
  /** Cookie name for the JWT token */
  cookieName: process.env.COOKIE_NAME ?? 'auth_token',

  /** node-cron expression for the TTD website poller (default: every 5 min) */
  scrapeSchedule: process.env.SCRAPE_SCHEDULE ?? '*/5 * * * *',

  supabase: {
    url: required('SUPABASE_URL'),
    anonKey: required('SUPABASE_ANON_KEY'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  },

  firebase: {
    projectId: required('FIREBASE_PROJECT_ID'),
    clientEmail: required('FIREBASE_CLIENT_EMAIL'),
    privateKey: required('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    databaseURL: required('FIREBASE_DATABASE_URL'),
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER ?? 'tirumala/wallpapers',
    placesFolder: process.env.CLOUDINARY_PLACES_FOLDER ?? 'tirumala/places',
    servicesFolder: process.env.CLOUDINARY_SERVICES_FOLDER ?? 'tirumala/services',
    ssdLocationsFolder: process.env.CLOUDINARY_SSD_LOCATIONS_FOLDER ?? 'tirumala/ssd-locations',
  },
};
