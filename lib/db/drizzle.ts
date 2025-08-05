// lib/db/drizzle.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Global variables to store the connection (using different names to avoid conflicts)
let _client: postgres.Sql | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

// Lazy initialization function
function initializeDatabase() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is not set');
  }

  if (!_client) {
    _client = postgres(process.env.POSTGRES_URL);
  }

  if (!_db) {
    _db = drizzle(_client, { schema });
  }

  return { client: _client, db: _db };
}

// Export getter functions instead of direct exports
export function getClient() {
  return initializeDatabase().client;
}

export function getDb() {
  return initializeDatabase().db;
}

// For backward compatibility, export db that initializes on first access
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const database = getDb();
    return (database as any)[prop];
  }
});

export const client = new Proxy({} as postgres.Sql, {
  get(target, prop) {
    const postgresClient = getClient();
    return (postgresClient as any)[prop];
  }
});