-- Initial Database Schema Migration
-- Creates tables for animations, frames, and timings

-- Animations table
CREATE TABLE IF NOT EXISTS animations (
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  animation1Name TEXT NOT NULL DEFAULT '',
  animation1Hue INTEGER NOT NULL DEFAULT 0,
  animation2Name TEXT NOT NULL DEFAULT '',
  animation2Hue INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Animation frames table
CREATE TABLE IF NOT EXISTS animation_frames (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  animation_id INTEGER NOT NULL,
  frame_index INTEGER NOT NULL,
  cells TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (animation_id) REFERENCES animations(id) ON DELETE CASCADE
);

-- Animation timings table
CREATE TABLE IF NOT EXISTS animation_timings (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  animation_id INTEGER NOT NULL,
  frame INTEGER NOT NULL,
  flash_scope INTEGER NOT NULL DEFAULT 0,
  flash_color TEXT NOT NULL DEFAULT '[0, 0, 0, 0]',
  flash_duration INTEGER NOT NULL DEFAULT 0,
  se_name TEXT,
  se_volume INTEGER,
  se_pitch INTEGER,
  se_pan INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (animation_id) REFERENCES animations(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_animation_frames_animation_id ON animation_frames(animation_id);
CREATE INDEX IF NOT EXISTS idx_animation_frames_frame_index ON animation_frames(frame_index);
CREATE INDEX IF NOT EXISTS idx_animation_timings_animation_id ON animation_timings(animation_id);
CREATE INDEX IF NOT EXISTS idx_animation_timings_frame ON animation_timings(frame);

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;
