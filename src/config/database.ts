import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const nodeEnv = process.env.NODE_ENV ?? 'development';

// Only use neon-local endpoint if explicitly set via environment variable
// This allows local development with Docker or direct Neon connection
// if (nodeEnv === 'developments' && process.env.NEON_LOCAL_ENDPOINT) {
//   neonConfig.fetchEndpoint = process.env.NEON_LOCAL_ENDPOINT;
//   neonConfig.useSecureWebSocket = false;
//   neonConfig.poolQueryViaFetch = true;
// }

// For test environment, don't configure special endpoints
if (nodeEnv === 'test') {
  // Tests will use the DATABASE_URL from environment
  // Connection failures will be handled gracefully in tests
}

let sql: ReturnType<typeof neon>;
let db: ReturnType<typeof drizzle>;

if (!process.env.DATABASE_URL) {
  // In test mode, allow missing DATABASE_URL (tests will skip)
  if (nodeEnv === 'test') {
    // Create a dummy connection that will fail gracefully
    // Tests will check availability and skip if needed
    const dummyUrl = 'postgresql://dummy:dummy@localhost:5432/dummy';
    sql = neon(dummyUrl);
    db = drizzle(sql);
  } else {
    throw new Error('DATABASE_URL is required');
  }
} else {
  sql = neon(process.env.DATABASE_URL);
  db = drizzle(sql);
}

export { db, sql };
