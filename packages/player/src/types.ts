/**
 * Type definitions and constants only (no Phaser dependencies)
 * Safe to import on server-side code
 */

export type {
  RMMVAnimation,
  RMMVAnimationsData,
  RMMVFrame,
  RMMVCellData,
  RMMVAnimationTiming,
  RMMVSoundEffect,
  RMMVSpriteSheetConfig,
  CellCoordinates,
} from './types/rmmv';

export {
  getCellCoordinates,
  getCellId,
  RMMVAnimationPosition,
  RMMVBlendMode,
  RMMVFlashScope,
  RMMV_CELL_SIZE,
  RMMV_SPRITE_SHEET_CONFIG,
} from './types/rmmv';
