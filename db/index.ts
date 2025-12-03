import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from "@shared/schema";

const client = createClient({
  url: 'file:./local.db',
});

export const db = drizzle(client, { schema });

// Helper to guard routes that require database
export function assertDb() {
  if (!db) {
    const error = new Error('Database not available');
    (error as any).status = 503;
    throw error;
  }
  return db;
}
