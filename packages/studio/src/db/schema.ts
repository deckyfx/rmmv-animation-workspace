/**
 * Database Schema Definitions
 *
 * Drizzle ORM schema for RMMV Animation Studio database.
 * Normalized structure with separate tables for animations, frames, and timings.
 */

import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Animations table
 * Stores main animation metadata and sprite sheet references
 */
export const animations = sqliteTable('animations', {
  /** Animation ID (primary key, matches RMMV ID) */
  id: integer('id').primaryKey(),

  /** Animation display name */
  name: text('name').notNull(),

  /**
   * Position type (where animation appears on target)
   * 0 = Head, 1 = Center, 2 = Feet, 3 = Screen
   */
  position: integer('position').notNull(),

  /** First sprite sheet filename (without .png extension) */
  animation1Name: text('animation1Name').notNull().default(''),

  /** Hue rotation for first sprite sheet (0-360 degrees) */
  animation1Hue: integer('animation1Hue').notNull().default(0),

  /** Second sprite sheet filename (optional, without .png extension) */
  animation2Name: text('animation2Name').notNull().default(''),

  /** Hue rotation for second sprite sheet (0-360 degrees) */
  animation2Hue: integer('animation2Hue').notNull().default(0),

  /** Timestamp when animation was created */
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),

  /** Timestamp when animation was last updated */
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Animation frames table
 * Stores frame-by-frame cell data for animations
 * Each frame contains an array of cells (sprite instances)
 */
export const animationFrames = sqliteTable('animation_frames', {
  /** Frame ID (auto-increment primary key) */
  id: integer('id').primaryKey({ autoIncrement: true }),

  /** Animation ID (foreign key) */
  animationId: integer('animation_id')
    .notNull()
    .references(() => animations.id, { onDelete: 'cascade' }),

  /** Frame index (0-based, represents frame position in sequence) */
  frameIndex: integer('frame_index').notNull(),

  /**
   * Frame cells data (JSON array)
   * Format: RMMVCellData[] = Array<[cellId, x, y, scale, rotation, flip, opacity, blendMode]>
   * Example: [[0, 2, 3, 250, 4, 0, 255, 1], [1, 0, 0, 200, 0, 0, 255, 0]]
   * Empty frames: []
   */
  cells: text('cells', { mode: 'json' })
    .notNull()
    .$type<
      Array<
        [
          cellId: number,
          x: number,
          y: number,
          scale: number,
          rotation: number,
          flip: number,
          opacity: number,
          blendMode: number
        ]
      >
    >()
    .default(sql`'[]'`),

  /** Timestamp when frame was created */
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),

  /** Timestamp when frame was last updated */
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Animation timings table
 * Stores sound effects and screen flash events for animations
 * Triggered at specific frame numbers during playback
 */
export const animationTimings = sqliteTable('animation_timings', {
  /** Timing ID (auto-increment primary key) */
  id: integer('id').primaryKey({ autoIncrement: true }),

  /** Animation ID (foreign key) */
  animationId: integer('animation_id')
    .notNull()
    .references(() => animations.id, { onDelete: 'cascade' }),

  /** Frame number when this timing event triggers (0-indexed) */
  frame: integer('frame').notNull(),

  /**
   * Flash scope - what to flash
   * 0 = None, 1 = Target, 2 = Screen, 3 = Hide Target
   */
  flashScope: integer('flash_scope').notNull().default(0),

  /**
   * RGBA color for screen flash (JSON array)
   * Format: [R, G, B, Intensity]
   * Example: [255, 255, 255, 255] = white flash at max intensity
   */
  flashColor: text('flash_color', { mode: 'json' })
    .notNull()
    .$type<[number, number, number, number]>()
    .default(sql`'[0, 0, 0, 0]'`),

  /** Duration of flash effect in frames */
  flashDuration: integer('flash_duration').notNull().default(0),

  /** Sound effect filename (nullable, without extension) */
  seName: text('se_name'),

  /** Sound effect volume (0-100, nullable) */
  seVolume: integer('se_volume'),

  /** Sound effect pitch (10-200+, nullable) */
  sePitch: integer('se_pitch'),

  /** Sound effect pan (-100 to +100, nullable) */
  sePan: integer('se_pan'),

  /** Timestamp when timing was created */
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),

  /** Timestamp when timing was last updated */
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Type exports for use in application code
 */
export type Animation = typeof animations.$inferSelect;
export type NewAnimation = typeof animations.$inferInsert;

export type AnimationFrame = typeof animationFrames.$inferSelect;
export type NewAnimationFrame = typeof animationFrames.$inferInsert;

export type AnimationTiming = typeof animationTimings.$inferSelect;
export type NewAnimationTiming = typeof animationTimings.$inferInsert;
