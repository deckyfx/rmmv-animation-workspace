/**
 * Database Client Singleton
 *
 * Manages SQLite database connection using Bun's native SQLite and Drizzle ORM.
 * Singleton pattern ensures single connection throughout application lifecycle.
 */

import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

/**
 * Database file path
 * Located in monorepo root for easy access
 *
 * In monorepo structure, server runs from packages/studio but database
 * is in workspace root, so we need to go up two levels
 */
const DB_PATH = process.env.DB_PATH || '../../data/animations.db';

/**
 * SQLite connection instance (Bun native)
 */
let sqlite: Database | null = null;

/**
 * Drizzle ORM instance
 */
let db: ReturnType<typeof drizzle> | null = null;

/**
 * Initialize database connection
 * Creates database file if it doesn't exist
 *
 * @returns Drizzle ORM instance
 */
export function initDatabase() {
  if (db) {
    return db;
  }

  // Create SQLite connection using Bun's native driver
  sqlite = new Database(DB_PATH, { create: true });

  // Enable foreign keys
  sqlite.run('PRAGMA foreign_keys = ON');

  // Enable WAL mode for better concurrent access
  sqlite.run('PRAGMA journal_mode = WAL');

  // Initialize Drizzle ORM with schema
  db = drizzle(sqlite, { schema });

  console.log(`✅ Database initialized at ${DB_PATH}`);

  return db;
}

/**
 * Get database instance
 * Initializes if not already connected
 *
 * @returns Drizzle ORM instance
 */
export function getDatabase() {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * Close database connection
 * Should be called during graceful shutdown
 */
export function closeDatabase() {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
    console.log('Database connection closed');
  }
}

/**
 * Execute raw SQL query (use with caution)
 * Primarily for migrations and maintenance scripts
 *
 * @param sql - SQL query string
 */
export function executeRawSQL(sql: string) {
  if (!sqlite) {
    throw new Error('Database not initialized');
  }
  return sqlite.exec(sql);
}

/**
 * Get raw SQLite instance (for advanced operations)
 */
export function getRawDatabase() {
  if (!sqlite) {
    throw new Error('Database not initialized');
  }
  return sqlite;
}

/**
 * Export database instance for convenience
 */
export { db };
