import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';

const nodeEnv = process.env.NODE_ENV || 'development';

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

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export { sql, db };
