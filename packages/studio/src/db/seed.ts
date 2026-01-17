/**
 * Database Seed Script
 *
 * Reads Animations.json and populates SQLite database.
 * Run with: bun run db:seed
 *
 * This script:
 * 1. Runs the initial migration (creates tables)
 * 2. Purges existing data (fresh start)
 * 3. Reads Animations.json
 * 4. Inserts animations, frames, and timings into database
 */

import { readFileSync } from 'fs';
import { initDatabase, executeRawSQL, getDatabase } from './client';
import { animations, animationFrames, animationTimings } from './schema';
import type { RMMVAnimationsData } from '@decky.fx/rmmv-animation-player';

const ANIMATIONS_JSON_PATH = '../../assets/data/Animations.json';
const MIGRATION_SQL_PATH = './src/db/migrations/0000_init.sql';

/**
 * Run migration SQL to create tables
 */
function runMigration() {
  console.log('📋 Running migration...');
  const migrationSQL = readFileSync(MIGRATION_SQL_PATH, 'utf-8');
  executeRawSQL(migrationSQL);
  console.log('✅ Migration completed');
}

/**
 * Purge all data from database
 * Clears animations, frames, and timings tables
 */
async function purgeData() {
  console.log('🗑️  Purging existing data...');
  const db = getDatabase();

  try {
    // Delete in order: timings, frames, then animations (respects foreign keys)
    await db.delete(animationTimings);
    await db.delete(animationFrames);
    await db.delete(animations);

    console.log('✅ Data purged');
  } catch (error) {
    console.error('❌ Error purging data:', error);
    throw error;
  }
}

/**
 * Load and parse Animations.json
 */
function loadAnimationsJSON(): RMMVAnimationsData {
  console.log(`📂 Loading ${ANIMATIONS_JSON_PATH}...`);

  try {
    const jsonData = readFileSync(ANIMATIONS_JSON_PATH, 'utf-8');
    const data = JSON.parse(jsonData) as RMMVAnimationsData;

    console.log(`✅ Loaded ${data.filter((a) => a !== null).length} animations`);
    return data;
  } catch (error) {
    console.error('❌ Error loading Animations.json:', error);
    throw error;
  }
}

/**
 * Insert animations into database
 */
async function seedDatabase(data: RMMVAnimationsData) {
  console.log('🌱 Seeding database...');

  const db = getDatabase();
  let animationsInserted = 0;
  let framesInserted = 0;
  let timingsInserted = 0;

  for (const animation of data) {
    // Skip null entries (RMMV uses array index as ID, so index 0 is null)
    if (!animation) {
      continue;
    }

    try {
      // Insert animation
      await db.insert(animations).values({
        id: animation.id,
        name: animation.name,
        position: animation.position,
        animation1Name: animation.animation1Name,
        animation1Hue: animation.animation1Hue,
        animation2Name: animation.animation2Name,
        animation2Hue: animation.animation2Hue,
      });
      animationsInserted++;

      // Insert frames
      for (let frameIndex = 0; frameIndex < animation.frames.length; frameIndex++) {
        const frame = animation.frames[frameIndex];
        await db.insert(animationFrames).values({
          animationId: animation.id,
          frameIndex,
          cells: frame as any, // Cast to any to satisfy Drizzle type
        });
        framesInserted++;
      }

      // Insert timings
      for (const timing of animation.timings) {
        await db.insert(animationTimings).values({
          animationId: animation.id,
          frame: timing.frame,
          flashScope: timing.flashScope,
          flashColor: timing.flashColor as any, // Cast to any to satisfy Drizzle type
          flashDuration: timing.flashDuration,
          seName: timing.se?.name || null,
          seVolume: timing.se?.volume || null,
          sePitch: timing.se?.pitch || null,
          sePan: timing.se?.pan || null,
        });
        timingsInserted++;
      }
    } catch (error) {
      console.error(`❌ Error seeding animation ${animation.id} (${animation.name}):`, error);
      throw error;
    }
  }

  console.log('✅ Seeding completed');
  console.log(`   - Animations: ${animationsInserted}`);
  console.log(`   - Frames: ${framesInserted}`);
  console.log(`   - Timings: ${timingsInserted}`);
}

/**
 * Main seed function
 * Runs the complete seeding process
 */
async function seed() {
  console.log('🚀 Starting database seed...\n');

  try {
    // Initialize database connection
    initDatabase();

    // Run migration to create tables
    runMigration();

    // Purge existing data
    await purgeData();

    // Load JSON data
    const data = loadAnimationsJSON();

    // Seed database
    await seedDatabase(data);

    console.log('\n✅ Database seed completed successfully!');
    console.log(`📍 Database location: ./data/animations.db`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed if executed directly
if (import.meta.main) {
  seed();
}

export { seed };
