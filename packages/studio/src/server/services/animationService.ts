/**
 * Animation Service
 *
 * Business logic layer for animation CRUD operations.
 * Handles database interactions through Drizzle ORM.
 */

import { eq, asc } from 'drizzle-orm';
import { getDatabase } from '@db/client';
import { animations, animationFrames, animationTimings } from '@db/schema';
import type { RMMVAnimation, RMMVFrame, RMMVAnimationTiming, RMMVCellData } from '@decky.fx/rmmv-animation-player/types';

/**
 * Standard RMMV cell size (192×192 pixels)
 * Copied from player package to avoid importing Phaser on server side
 */
const RMMV_CELL_SIZE = 192;

/**
 * Cell coordinates in sprite sheet grid
 */
interface CellCoordinates {
  row: number;
  col: number;
  x: number;
  y: number;
}

/**
 * Calculate cell coordinates from cellId using row-major indexing
 * Copied from player package to avoid importing Phaser on server side
 *
 * Formula: cellId = (row * columns) + column
 */
function getCellCoordinates(
  cellId: number,
  columns: number,
  cellWidth = RMMV_CELL_SIZE,
  cellHeight = RMMV_CELL_SIZE
): CellCoordinates {
  const row = Math.floor(cellId / columns);
  const col = cellId % columns;

  return {
    row,
    col,
    x: col * cellWidth,
    y: row * cellHeight,
  };
}

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

/**
 * Duplicate an existing animation
 * Creates a copy with a new ID and modified name
 *
 * @param id - Animation ID to duplicate
 * @returns Created duplicate animation object
 */
export async function duplicateAnimation(id: number): Promise<RMMVAnimation> {
  // Get original animation
  const original = await getAnimationById(id);
  if (!original) {
    throw new Error(`Animation ${id} not found`);
  }

  // Find next available ID
  const allAnimations = await getAllAnimations();
  const validAnimations = allAnimations.filter((a) => a != null);
  const maxId = validAnimations.length > 0
    ? Math.max(...validAnimations.map((a) => a.id))
    : 0;
  const newId = maxId + 1;

  // Create duplicate with modified name
  const duplicateName = `${original.name} (Copy)`;

  const duplicateData: RMMVAnimation = {
    ...original,
    id: newId,
    name: duplicateName,
  };

  // Use createAnimation to insert the duplicate
  return await createAnimation(duplicateData);
}

/**
 * Get sprite sheet dimensions and calculate column count
 */
async function getSpriteSheetColumns(sheetName: string): Promise<number> {
  try {
    const filePath = `../../assets/img/animations/${sheetName}.png`;
    const imageFile = Bun.file(filePath);
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read PNG width from header (bytes 16-19, big-endian)
    if (buffer[0] === 0x89 && buffer[1] === 0x50) { // PNG signature
      const width = buffer.readUInt32BE(16);
      return Math.floor(width / RMMV_CELL_SIZE);
    }

    // Default to 5 columns if can't read
    return 5;
  } catch (error) {
    console.error(`Error reading sprite sheet ${sheetName}:`, error);
    return 5; // Default fallback
  }
}

/**
 * Interface for enriched cell data with sprite positioning
 */
export interface CellWithSpriteData {
  /** Cell index in frame */
  cellIndex: number;
  /** Raw cell data [cellId, x, y, scale, rotation, flip, opacity, blendMode] */
  cellData: RMMVCellData;
  /** Sprite positioning info (null for empty cells with cellId -1) */
  sprite: {
    /** Sprite sheet name (without .png) */
    sheetName: string;
    /** Full path to sprite sheet */
    sheetPath: string;
    /** Cell ID in sprite sheet (0-99 for sheet 1, 100-199 for sheet 2) */
    cellId: number;
    /** Normalized cell ID (0-based within sheet) */
    normalizedCellId: number;
    /** Grid row */
    row: number;
    /** Grid column */
    col: number;
    /** X pixel position for background-position */
    x: number;
    /** Y pixel position for background-position */
    y: number;
    /** Number of columns in this sprite sheet */
    columns: number;
  } | null;
}

/**
 * Get frame cells with calculated sprite positions
 * Returns cell data enriched with sprite sheet info and CSS positioning
 *
 * @param animationId - Animation ID
 * @param frameIndex - Frame index (0-based)
 * @returns Array of cells with sprite positioning data
 */
export async function getFrameCellsWithSprites(
  animationId: number,
  frameIndex: number
): Promise<CellWithSpriteData[]> {
  // Get animation
  const animation = await getAnimationById(animationId);
  if (!animation) {
    throw new Error(`Animation ${animationId} not found`);
  }

  // Validate frame index
  if (frameIndex < 0 || frameIndex >= animation.frames.length) {
    throw new Error(`Frame index ${frameIndex} out of bounds`);
  }

  const frame = animation.frames[frameIndex];
  if (!frame) {
    throw new Error(`Frame ${frameIndex} is null or undefined`);
  }

  // Get sprite sheet column counts
  const sheet1Columns = animation.animation1Name
    ? await getSpriteSheetColumns(animation.animation1Name)
    : 5;
  const sheet2Columns = animation.animation2Name
    ? await getSpriteSheetColumns(animation.animation2Name)
    : 5;

  // Maximum cellId for sheet 1 (0-99 by default)
  const sheet1MaxCells = 100;

  // Process each cell
  const cellsWithSprites: CellWithSpriteData[] = frame.map((cellData, cellIndex) => {
    const cellId = cellData[0];

    // Handle empty cells (cellId -1)
    if (cellId < 0) {
      return {
        cellIndex,
        cellData,
        sprite: null,
      };
    }

    // Determine which sprite sheet to use
    const useSheet2 = cellId >= sheet1MaxCells && animation.animation2Name;
    const sheetName = useSheet2 ? animation.animation2Name : animation.animation1Name;
    const columns = useSheet2 ? sheet2Columns : sheet1Columns;
    const normalizedCellId = useSheet2 ? cellId - sheet1MaxCells : cellId;

    // Calculate grid position
    const coords = getCellCoordinates(normalizedCellId, columns);

    return {
      cellIndex,
      cellData,
      sprite: sheetName
        ? {
            sheetName,
            sheetPath: `/assets/img/animations/${sheetName}.png`,
            cellId,
            normalizedCellId,
            row: coords.row,
            col: coords.col,
            x: coords.x,
            y: coords.y,
            columns,
          }
        : null,
    };
  });

  return cellsWithSprites;
}
