/**
 * RMMV Animation Type Definitions
 *
 * Type definitions for RPG Maker MV Animations.json format.
 * Based on official RMMV data structure.
 */

/**
 * Sound effect configuration for animation timing
 *
 * Example from RMMV:
 * - SE: Blow3
 * - Volume: 90
 * - Pitch: 100
 * - Pan: 0
 *
 * Becomes: { "name": "Blow3", "volume": 90, "pitch": 100, "pan": 0 }
 */
export interface RMMVSoundEffect {
  /**
   * Sound effect filename (without extension)
   * File located in: audio/se/[name].ogg or audio/se/[name].m4a
   * Example: "Blow3" → plays audio/se/Blow3.ogg
   */
  name: string;

  /**
   * Volume level
   * Range: 0-100
   * - 0 = silent
   * - 100 = maximum volume
   * - Default in RMMV: 90
   */
  volume: number;

  /**
   * Pitch adjustment
   * Range: Typically 50-150 in RMMV editor, but real data shows 10-200+
   * - 50 = half speed, lower pitch
   * - 100 = normal speed and pitch (default)
   * - 150 = 1.5x speed, higher pitch
   * - Values outside 50-150 are used in practice
   */
  pitch: number;

  /**
   * Stereo pan position
   * Range: -100 to +100
   * - -100 = full left
   * - 0 = center (default)
   * - +100 = full right
   */
  pan: number;
}

/**
 * Timing event configuration for animations
 * Controls when sound effects and screen flashes occur
 *
 * Example from RMMV:
 * - Start From Frame: 1 (UI) → frame: 0 (JSON)
 * - SE: Blow3 → se.name: "Blow3"
 * - Flash: Target → flashScope: 1
 * - White Color (255,255,255) + Max Intensity (255) → flashColor: [255,255,255,255]
 * - Duration: 2 frames → flashDuration: 2
 */
export interface RMMVAnimationTiming {
  /**
   * Frame number when this timing event triggers (0-indexed)
   * Note: "Start From Frame: 1" in RMMV UI = frame: 0 in JSON
   */
  frame: number;

  /**
   * Sound effect to play at this frame
   * Can be null if no SE is specified
   */
  se: RMMVSoundEffect | null;

  /**
   * Flash scope - what to flash
   * - 0 = None (no flash)
   * - 1 = Target (flash the target)
   * - 2 = Screen (flash entire screen)
   * - 3 = Hide Target (flash and hide target temporarily)
   */
  flashScope: number;

  /**
   * RGBA color for screen flash [R, G, B, Intensity]
   * - [0-2] = RGB color values (0-255)
   * - [3] = Intensity/Alpha (0-255, where 255 = max intensity)
   *
   * Example: White flash at max intensity = [255, 255, 255, 255]
   */
  flashColor: [number, number, number, number];

  /**
   * Duration of flash effect in frames
   * At 60 FPS: 1 frame ≈ 16.67ms
   */
  flashDuration: number;
}

/**
 * Single cell data in an animation frame
 *
 * Format: [cellId, x, y, scale, rotation, flip, opacity, blendMode]
 *
 * Examples:
 * - Sheet 0, Pattern 1: [0, 2, 3, 250, 4, 0, 255, 1] → animation1Name cell 0
 * - Sheet 0, Pattern 5: [4, 0, 0, 100, 0, 0, 255, 0] → animation1Name cell 4
 * - Sheet 1, Pattern 1: [100, 2, 3, 250, 4, 0, 255, 1] → animation2Name cell 0
 * - Sheet 1, Pattern 5: [104, 0, 0, 100, 0, 0, 255, 0] → animation2Name cell 4
 * - Sheet 2, Pattern 1: [200, 0, 0, 100, 0, 0, 255, 0] → animation3Name cell 0 [future]
 * - Sheet 3, Pattern 1: [300, 0, 0, 100, 0, 0, 255, 0] → animation4Name cell 0 [future]
 */
export type RMMVCellData = [
  /**
   * Cell ID from sprite sheet - uses 100-based indexing pattern
   *
   * Pattern: cellId = (sheetIndex * 100) + cellPosition
   * - 0-99: Cells from animation1Name (sheet 0)
   *   - 0 = First cell (top-left), standard 5×5 grid uses 0-24
   * - 100-199: Cells from animation2Name (sheet 1)
   *   - 100 = First cell (top-left), 101 = second cell, etc.
   * - 200-299: Cells from animation3Name (sheet 2) [future]
   * - 300-399: Cells from animation4Name (sheet 3) [future]
   * - And so on...
   *
   * Normalized: cellId % 100 gives position within sheet (0-99)
   * Sheet index: Math.floor(cellId / 100)
   *
   * Special: -1 = Empty/inactive cell (not rendered)
   */
  cellId: number,

  /** X offset from animation position (in pixels) */
  x: number,

  /** Y offset from animation position (in pixels) */
  y: number,

  /**
   * Scale percentage
   * - 100 = normal size (1x)
   * - 200 = double size (2x)
   * - 250 = 2.5x size
   */
  scale: number,

  /**
   * Rotation in degrees
   * Range: -360 to 360
   * - Positive values rotate clockwise
   * - Negative values rotate counter-clockwise
   * - Example: -90° = 270° clockwise
   */
  rotation: number,

  /**
   * Mirror/Flip
   * - 0 = No mirror
   * - 1 = Horizontal mirror
   */
  flip: number,

  /**
   * Opacity
   * - 0 = fully transparent
   * - 255 = fully opaque
   */
  opacity: number,

  /**
   * Blend mode
   * - 0 = Normal
   * - 1 = Additive
   * - 2 = Multiply
   * - 3 = Screen
   */
  blendMode: number
];

/**
 * Single animation frame containing multiple cells
 *
 * Each frame is an array of cell data. Empty frames are represented as [].
 *
 * Note: Frame indexing
 * - frames[0] = "Frame 1" in RMMV editor UI
 * - frames[1] = "Frame 2" in RMMV editor UI
 * - etc.
 *
 * Example:
 * ```
 * frames: [
 *   [],                              // Frame 1 (index 0): empty
 *   [[0, 2, 3, 250, 4, 0, 255, 1]],  // Frame 2 (index 1): one cell
 *   [[1, 0, 0, 200, 0, 0, 255, 1]],  // Frame 3 (index 2): one cell
 * ]
 * ```
 */
export type RMMVFrame = RMMVCellData[];

/**
 * Complete animation definition from Animations.json
 *
 * Example structure:
 * ```json
 * {
 *   "id": 1,
 *   "name": "Hit Physical",
 *   "position": 1,
 *   "animation1Name": "Hit1",
 *   "animation1Hue": 0,
 *   "animation2Name": "",
 *   "animation2Hue": 0,
 *   "frames": [
 *     [],
 *     [[0, 2, 3, 250, 4, 0, 255, 1]],
 *     [[1, 0, 0, 200, 0, 0, 255, 1]]
 *   ],
 *   "timings": [...]
 * }
 * ```
 */
export interface RMMVAnimation {
  /** Animation ID (unique identifier, 1-based) */
  id: number;

  /** Animation display name shown in RMMV editor */
  name: string;

  /**
   * Position type (where animation appears on target)
   * - 0 = Head
   * - 1 = Center
   * - 2 = Feet
   * - 3 = Screen (fixed position)
   */
  position: number;

  /**
   * First sprite sheet filename (without .png extension)
   * Located in: img/animations/[animation1Name].png
   * Contains patterns in 5x5 grid (192x192px cells)
   * Used for cellId 0-99 in frame data (sheet index 0)
   */
  animation1Name: string;

  /**
   * Hue rotation for first sprite sheet (0-360 degrees)
   * Applies color shift to the sprite sheet
   */
  animation1Hue: number;

  /**
   * Second sprite sheet filename (optional, without .png extension)
   * Empty string "" means no second sprite sheet
   * Located in: img/animations/[animation2Name].png
   * Used for cellId 100-199 in frame data (sheet index 1)
   *
   * Note: System supports extensible pattern (200-299 = sheet 2, 300-399 = sheet 3, etc.)
   * though RMMV format currently only defines animation1Name and animation2Name
   */
  animation2Name: string;

  /**
   * Hue rotation for second sprite sheet (0-360 degrees)
   * Applies color shift to the second sprite sheet
   */
  animation2Hue: number;

  /**
   * Array of animation frames
   * Each frame contains multiple cells (sprite instances)
   * Empty frames are represented as []
   */
  frames: RMMVFrame[];

  /**
   * Array of timing events (sound effects and screen flashes)
   * Triggered at specific frame numbers during animation playback
   */
  timings: RMMVAnimationTiming[];
}

/**
 * Complete Animations.json file structure
 * Array where index 0 is null, and subsequent indices are animation objects
 */
export type RMMVAnimationsData = (RMMVAnimation | null)[];

/**
 * Standard RMMV cell size (192×192 pixels)
 * This is the fixed size for all sprite sheet cells in RPG Maker MV
 *
 * Use this constant anywhere cell dimensions are needed:
 * - Calculating sprite sheet columns: width / RMMV_CELL_SIZE
 * - Slicing sprite sheets: x = col * RMMV_CELL_SIZE
 * - Background positioning and rendering
 */
export const RMMV_CELL_SIZE = 192;

/**
 * Sprite sheet cell configuration
 *
 * RMMV sprite sheets vary in size:
 * - Standard: 5×5 grid (25 cells)
 * - Variable: 3-5 columns, variable rows
 * - Cell size: Always 192×192 pixels (RMMV_CELL_SIZE)
 */
export interface RMMVSpriteSheetConfig {
  /** Number of columns in sprite sheet grid (typically 3-5) */
  columns: number;
  /** Number of rows in sprite sheet grid (variable) */
  rows: number;
  /** Width of each cell in pixels (always RMMV_CELL_SIZE = 192) */
  cellWidth: number;
  /** Height of each cell in pixels (always RMMV_CELL_SIZE = 192) */
  cellHeight: number;
}

/**
 * Standard RMMV sprite sheet configuration
 * Default 5×5 grid with 192×192 pixel cells
 * Note: Actual sprite sheets may vary - use getCellCoordinates() for dynamic calculation
 */
export const RMMV_SPRITE_SHEET_CONFIG: RMMVSpriteSheetConfig = {
  columns: 5,
  rows: 5,
  cellWidth: RMMV_CELL_SIZE,
  cellHeight: RMMV_CELL_SIZE,
};

/**
 * Cell coordinates in sprite sheet grid
 */
export interface CellCoordinates {
  /** Row index (0-based) */
  row: number;
  /** Column index (0-based) */
  col: number;
  /** X pixel position (col * cellWidth) */
  x: number;
  /** Y pixel position (row * cellHeight) */
  y: number;
}

/**
 * Calculate cell coordinates from cellId using row-major indexing
 *
 * Formula: cellId = (row * columns) + column
 *
 * Example with 5 columns:
 * - cellId 0 → row 0, col 0
 * - cellId 4 → row 0, col 4
 * - cellId 5 → row 1, col 0
 * - cellId 6 → row 1, col 1
 *
 * @param cellId - Cell ID from animation data (0-indexed)
 * @param columns - Number of columns in sprite sheet
 * @param cellWidth - Width of each cell in pixels (default: RMMV_CELL_SIZE = 192)
 * @param cellHeight - Height of each cell in pixels (default: RMMV_CELL_SIZE = 192)
 * @returns Cell coordinates with row, col, x, y
 */
export function getCellCoordinates(
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
 * Calculate cellId from row and column coordinates
 *
 * Formula: cellId = (row * columns) + column
 *
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @param columns - Number of columns in sprite sheet
 * @returns cellId for use in animation data
 */
export function getCellId(row: number, col: number, columns: number): number {
  return row * columns + col;
}

/**
 * Blend mode enumeration matching RMMV values
 */
export enum RMMVBlendMode {
  NORMAL = 0,
  ADDITIVE = 1,
  MULTIPLY = 2,
  SCREEN = 3,
}

/**
 * Animation position enumeration
 */
export enum RMMVAnimationPosition {
  HEAD = 0,
  CENTER = 1,
  FEET = 2,
  SCREEN = 3,
}

/**
 * Flash scope enumeration
 * Determines what gets flashed during animation timing events
 */
export enum RMMVFlashScope {
  /** No flash effect */
  NONE = 0,
  /** Flash the target of the animation */
  TARGET = 1,
  /** Flash the entire screen */
  SCREEN = 2,
  /** Flash and temporarily hide the target */
  HIDE_TARGET = 3,
}
