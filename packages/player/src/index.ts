/**
 * @decky.fx/rmmv-animation-player
 *
 * Standalone animation player for RPG Maker MV animations in Phaser 3.
 *
 * @packageDocumentation
 */

// Main animation player
export { AnimationPlayer } from './player/AnimationPlayer';
export type { AnimationConfig, PlaybackOptions, TargetPosition } from './player/AnimationPlayer';

// Type definitions
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

// Parser utilities
export { AnimationParser } from './parsers/AnimationParser';
export type { ValidationResult } from './parsers/AnimationParser';

// Asset loader utilities
export { AssetLoader, assetLoader } from './loader/AssetLoader';
export type { PreloadedAsset } from './loader/AssetLoader';
