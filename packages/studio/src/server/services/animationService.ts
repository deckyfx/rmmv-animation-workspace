/**
 * Animation Service
 *
 * Business logic layer for animation CRUD operations.
 * Handles database interactions through Drizzle ORM.
 */

import { eq, asc } from 'drizzle-orm';
import { getDatabase } from '@db/client';
import { animations, animationFrames, animationTimings } from '@db/schema';
import type { RMMVAnimation, RMMVFrame, RMMVAnimationTiming } from '@decky.fx/rmmv-animation-player/types';

/**
 * Get all animations (metadata with frame count)
 * Used for list view
 *
 * @returns Array of animations with basic metadata
 */
export async function getAllAnimations() {
  const db = getDatabase();

  const result = await db.select({
    id: animations.id,
    name: animations.name,
    position: animations.position,
    animation1Name: animations.animation1Name,
    animation1Hue: animations.animation1Hue,
    animation2Name: animations.animation2Name,
    animation2Hue: animations.animation2Hue,
  }).from(animations).orderBy(asc(animations.id));

  // Get frame count for each animation
  const animationsWithFrameCount = await Promise.all(
    result.map(async (anim) => {
      const frames = await db
        .select()
        .from(animationFrames)
        .where(eq(animationFrames.animationId, anim.id));

      return {
        ...anim,
        frames: frames.length > 0 ? new Array(frames.length).fill([]) : [[]],
        timings: [],
      };
    })
  );

  return animationsWithFrameCount;
}

/**
 * Get single animation by ID (full data with frames and timings)
 *
 * @param id - Animation ID
 * @returns Complete animation object or null if not found
 */
export async function getAnimationById(id: number): Promise<RMMVAnimation | null> {
  const db = getDatabase();

  // Get animation metadata
  const [animation] = await db
    .select()
    .from(animations)
    .where(eq(animations.id, id))
    .limit(1);

  if (!animation) {
    return null;
  }

  // Get frames
  const framesResult = await db
    .select()
    .from(animationFrames)
    .where(eq(animationFrames.animationId, id))
    .orderBy(asc(animationFrames.frameIndex));

  // Get timings
  const timingsResult = await db
    .select()
    .from(animationTimings)
    .where(eq(animationTimings.animationId, id))
    .orderBy(asc(animationTimings.frame));

  // Transform to RMMV format
  const frames: RMMVFrame[] = framesResult.map((f: any) => f.cells);

  const timings: RMMVAnimationTiming[] = timingsResult.map((t: any) => ({
    frame: t.frame,
    flashScope: t.flashScope,
    flashColor: t.flashColor,
    flashDuration: t.flashDuration,
    se: t.seName
      ? {
          name: t.seName,
          volume: t.seVolume || 90,
          pitch: t.sePitch || 100,
          pan: t.sePan || 0,
        }
      : null,
  }));

  return {
    id: animation.id,
    name: animation.name,
    position: animation.position,
    animation1Name: animation.animation1Name,
    animation1Hue: animation.animation1Hue,
    animation2Name: animation.animation2Name,
    animation2Hue: animation.animation2Hue,
    frames,
    timings,
  };
}

/**
 * Update animation
 * Updates animation metadata, frames, and timings
 *
 * @param id - Animation ID
 * @param animationData - Updated animation data
 * @returns Updated animation object
 */
export async function updateAnimation(id: number, animationData: RMMVAnimation): Promise<RMMVAnimation> {
  const db = getDatabase();

  // Update animation metadata
  await db
    .update(animations)
    .set({
      name: animationData.name,
      position: animationData.position,
      animation1Name: animationData.animation1Name,
      animation1Hue: animationData.animation1Hue,
      animation2Name: animationData.animation2Name,
      animation2Hue: animationData.animation2Hue,
      updatedAt: new Date(),
    })
    .where(eq(animations.id, id));

  // Delete existing frames and timings (cascade handles this, but being explicit)
  await db.delete(animationFrames).where(eq(animationFrames.animationId, id));
  await db.delete(animationTimings).where(eq(animationTimings.animationId, id));

  // Insert new frames
  for (let frameIndex = 0; frameIndex < animationData.frames.length; frameIndex++) {
    await db.insert(animationFrames).values({
      animationId: id,
      frameIndex,
      cells: animationData.frames[frameIndex] as any,
    });
  }

  // Insert new timings
  for (const timing of animationData.timings) {
    await db.insert(animationTimings).values({
      animationId: id,
      frame: timing.frame,
      flashScope: timing.flashScope,
      flashColor: timing.flashColor as any,
      flashDuration: timing.flashDuration,
      seName: timing.se?.name || null,
      seVolume: timing.se?.volume || null,
      sePitch: timing.se?.pitch || null,
      sePan: timing.se?.pan || null,
    });
  }

  // Return updated animation
  const updated = await getAnimationById(id);
  if (!updated) {
    throw new Error(`Failed to retrieve updated animation ${id}`);
  }

  return updated;
}

/**
 * Delete animation by ID
 * Cascades to delete associated frames and timings
 *
 * @param id - Animation ID
 * @returns True if deleted, false if not found
 */
export async function deleteAnimation(id: number): Promise<boolean> {
  const db = getDatabase();

  // Check if animation exists before deleting
  const existing = await getAnimationById(id);
  if (!existing) {
    return false;
  }

  await db.delete(animations).where(eq(animations.id, id));

  return true;
}

/**
 * Create new animation
 * Inserts animation with frames and timings
 *
 * @param animationData - New animation data
 * @returns Created animation object
 */
export async function createAnimation(animationData: RMMVAnimation): Promise<RMMVAnimation> {
  const db = getDatabase();

  // Insert animation metadata
  await db.insert(animations).values({
    id: animationData.id,
    name: animationData.name,
    position: animationData.position,
    animation1Name: animationData.animation1Name,
    animation1Hue: animationData.animation1Hue,
    animation2Name: animationData.animation2Name,
    animation2Hue: animationData.animation2Hue,
  });

  // Insert frames
  for (let frameIndex = 0; frameIndex < animationData.frames.length; frameIndex++) {
    await db.insert(animationFrames).values({
      animationId: animationData.id,
      frameIndex,
      cells: animationData.frames[frameIndex] as any,
    });
  }

  // Insert timings
  for (const timing of animationData.timings) {
    await db.insert(animationTimings).values({
      animationId: animationData.id,
      frame: timing.frame,
      flashScope: timing.flashScope,
      flashColor: timing.flashColor as any,
      flashDuration: timing.flashDuration,
      seName: timing.se?.name || null,
      seVolume: timing.se?.volume || null,
      sePitch: timing.se?.pitch || null,
      sePan: timing.se?.pan || null,
    });
  }

  // Return created animation
  const created = await getAnimationById(animationData.id);
  if (!created) {
    throw new Error(`Failed to retrieve created animation ${animationData.id}`);
  }

  return created;
}
