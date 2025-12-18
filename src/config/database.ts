import 'dotenv/config';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const nodeEnv = process.env.NODE_ENV ?? 'development';

if (nodeEnv === 'development') {
  neonConfig.fetchEndpoint = 'http://neon-local:5432/sql';
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

// For test environment, don't configure special endpoints
if (nodeEnv === 'test') {
  // Tests will use the DATABASE_URL from environment
  // Connection failures will be handled gracefully in tests
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export { db, sql };
