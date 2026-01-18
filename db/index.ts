import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Wrap WebSocket to allow self-signed certs (needed for local development/proxying)
class CustomWebSocket extends ws {
  constructor(address: string, protocols?: string | string[], options?: any) {
    // Force rejectUnauthorized: false for all connections to avoid SSL errors
    // This fixes "IP: 127.0.0.1 is not in the cert's list" when connecting to local DB/services
    const newOptions = { ...options, rejectUnauthorized: false };
    super(address, protocols, newOptions);
  }
}

// This is the correct way neon config - DO NOT change this
neonConfig.webSocketConstructor = CustomWebSocket;

// Allow running without DATABASE_URL for local development (Simple Player mode only)
export const isDbAvailable = !!process.env.DATABASE_URL;

if (!isDbAvailable) {
  console.warn('⚠️  Running in development mode WITHOUT database (Simple Player only)');
  console.warn('   Only /api/proxy/* endpoints will work');
  console.warn('   To use full features, set DATABASE_URL environment variable');
}

// Export pool and db (will be null if no DATABASE_URL)
export const pool = isDbAvailable ? new Pool({ connectionString: process.env.DATABASE_URL! }) : null;
export const db = isDbAvailable ? drizzle({ client: pool!, schema }) : null;

// Helper to guard routes that require database
export function assertDb() {
  if (!db || !isDbAvailable) {
    const error = new Error('Database not available in local development mode');
    (error as any).status = 503;
    throw error;
  }
  return db;
}