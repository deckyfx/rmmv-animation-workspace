/**
 * Animation Parser - Validates and parses RMMV Animations.json
 *
 * Reads raw JSON data and validates against type definitions, providing
 * detailed error messages for malformed data.
 */

import type {
  RMMVAnimationsData,
  RMMVAnimation,
} from '../types/rmmv';

/**
 * Validation result for animation data
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Error messages if validation failed */
  errors: string[];
  /** Warning messages for non-critical issues */
  warnings: string[];
}

/**
 * Parser for RMMV Animation data
 *
 * Validates structure, types, and value ranges according to RMMV specification
 */
export class AnimationParser {
  /**
   * Parse and validate Animations.json data
   *
   * @param data - Raw JSON data from Animations.json
   * @returns Validated RMMVAnimationsData or throws on critical errors
   * @throws {Error} If data structure is fundamentally invalid
   */
  static parse(data: unknown): RMMVAnimationsData {
    const result = this.validate(data);

    if (!result.valid) {
      throw new Error(`Invalid animation data:\n${result.errors.join('\n')}`);
    }

    if (result.warnings.length > 0) {
      console.warn('Animation data warnings:', result.warnings);
    }

    return data as RMMVAnimationsData;
  }

  /**
   * Validate animation data without throwing errors
   *
   * @param data - Raw data to validate
   * @returns Validation result with detailed errors and warnings
   */
  static validate(data: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check root structure
    if (!Array.isArray(data)) {
      errors.push('Root data must be an array');
      return { valid: false, errors, warnings };
    }

    // Check index 0 is null
    if (data[0] !== null) {
      warnings.push('Index 0 should be null (RMMV convention)');
    }

    // Validate each animation
    for (let i = 1; i < data.length; i++) {
      const anim = data[i];
      if (anim === null || anim === undefined) {
        continue; // Empty slots are valid
      }

      const animErrors = this.validateAnimation(anim, i);
      errors.push(...animErrors.map((e) => `Animation ${i}: ${e}`));
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate single animation object
   */
  private static validateAnimation(anim: unknown, index: number): string[] {
    const errors: string[] = [];

    if (typeof anim !== 'object' || anim === null) {
      errors.push('Animation must be an object');
      return errors;
    }

    const a = anim as Record<string, unknown>;

    // Required fields
    if (typeof a.id !== 'number') {
      errors.push('Missing or invalid "id" field');
    } else if (a.id !== index) {
      errors.push(`Animation ID ${a.id} does not match array index ${index}`);
    }

    if (typeof a.name !== 'string') {
      errors.push('Missing or invalid "name" field');
    }

    if (typeof a.position !== 'number') {
      errors.push('Missing or invalid "position" field');
    } else if (a.position < 0 || a.position > 3) {
      errors.push(`Invalid position ${a.position} (must be 0-3)`);
    }

    if (typeof a.animation1Name !== 'string') {
      errors.push('Missing or invalid "animation1Name" field');
    }

    if (typeof a.animation1Hue !== 'number') {
      errors.push('Missing or invalid "animation1Hue" field');
    } else if (a.animation1Hue < 0 || a.animation1Hue > 360) {
      errors.push(`Invalid animation1Hue ${a.animation1Hue} (must be 0-360)`);
    }

    if (typeof a.animation2Name !== 'string') {
      errors.push('Missing or invalid "animation2Name" field');
    }

    if (typeof a.animation2Hue !== 'number') {
      errors.push('Missing or invalid "animation2Hue" field');
    } else if (a.animation2Hue < 0 || a.animation2Hue > 360) {
      errors.push(`Invalid animation2Hue ${a.animation2Hue} (must be 0-360)`);
    }

    // Validate frames array
    if (!Array.isArray(a.frames)) {
      errors.push('Missing or invalid "frames" field');
    } else {
      for (let i = 0; i < a.frames.length; i++) {
        const frameErrors = this.validateFrame(a.frames[i], i);
        errors.push(...frameErrors.map((e) => `Frame ${i}: ${e}`));
      }
    }

    // Validate timings array
    if (!Array.isArray(a.timings)) {
      errors.push('Missing or invalid "timings" field');
    } else {
      for (let i = 0; i < a.timings.length; i++) {
        const timingErrors = this.validateTiming(a.timings[i], i);
        errors.push(...timingErrors.map((e) => `Timing ${i}: ${e}`));
      }
    }

    return errors;
  }

  /**
   * Validate single frame (array of cells)
   */
  private static validateFrame(frame: unknown, _index: number): string[] {
    const errors: string[] = [];

    if (!Array.isArray(frame)) {
      errors.push('Frame must be an array');
      return errors;
    }

    for (let i = 0; i < frame.length; i++) {
      const cellErrors = this.validateCell(frame[i], i);
      errors.push(...cellErrors.map((e) => `Cell ${i}: ${e}`));
    }

    return errors;
  }

  /**
   * Validate single cell data tuple
   */
  private static validateCell(cell: unknown, _index: number): string[] {
    const errors: string[] = [];

    if (!Array.isArray(cell)) {
      errors.push('Cell must be an array');
      return errors;
    }

    if (cell.length !== 8) {
      errors.push(`Cell must have 8 elements (got ${cell.length})`);
      return errors;
    }

    const [cellId, x, y, scale, rotation, flip, opacity, blendMode] = cell;

    // Validate each field
    if (typeof cellId !== 'number') {
      errors.push('cellId must be a number');
    } else if (cellId !== -1 && cellId < 0) {
      errors.push(`cellId ${cellId} must be -1 or non-negative`);
    }
    // Note: cellId upper limit varies by sprite sheet size (not always 5×5=24)
    // Real RMMV data shows cellIds up to 112+ for larger sprite sheets

    if (typeof x !== 'number') {
      errors.push('x must be a number');
    }

    if (typeof y !== 'number') {
      errors.push('y must be a number');
    }

    if (typeof scale !== 'number') {
      errors.push('scale must be a number');
    } else if (scale < 0) {
      errors.push(`scale ${scale} must be positive`);
    }

    if (typeof rotation !== 'number') {
      errors.push('rotation must be a number');
    } else if (rotation < -360 || rotation > 360) {
      errors.push(`rotation ${rotation} out of range (-360 to 360)`);
    }
    // Note: Negative values rotate counter-clockwise, positive rotate clockwise

    if (typeof flip !== 'number') {
      errors.push('flip must be a number');
    } else if (flip !== 0 && flip !== 1) {
      errors.push(`flip ${flip} must be 0 or 1`);
    }

    if (typeof opacity !== 'number') {
      errors.push('opacity must be a number');
    } else if (opacity < 0 || opacity > 255) {
      errors.push(`opacity ${opacity} out of range (0-255)`);
    }

    if (typeof blendMode !== 'number') {
      errors.push('blendMode must be a number');
    } else if (blendMode < 0 || blendMode > 3) {
      errors.push(`blendMode ${blendMode} out of range (0-3)`);
    }

    return errors;
  }

  /**
   * Validate timing event
   */
  private static validateTiming(timing: unknown, _index: number): string[] {
    const errors: string[] = [];

    if (typeof timing !== 'object' || timing === null) {
      errors.push('Timing must be an object');
      return errors;
    }

    const t = timing as Record<string, unknown>;

    if (typeof t.frame !== 'number') {
      errors.push('Missing or invalid "frame" field');
    } else if (t.frame < 0) {
      errors.push(`frame ${t.frame} must be non-negative`);
    }

    // SE can be null or object
    if (t.se !== null) {
      if (typeof t.se !== 'object') {
        errors.push('se must be null or object');
      } else {
        const seErrors = this.validateSoundEffect(t.se);
        errors.push(...seErrors);
      }
    }

    if (typeof t.flashScope !== 'number') {
      errors.push('Missing or invalid "flashScope" field');
    } else if (t.flashScope < 0 || t.flashScope > 3) {
      errors.push(`flashScope ${t.flashScope} out of range (0-3)`);
    }

    if (!Array.isArray(t.flashColor)) {
      errors.push('Missing or invalid "flashColor" field');
    } else if (t.flashColor.length !== 4) {
      errors.push(`flashColor must have 4 elements (got ${t.flashColor.length})`);
    } else {
      for (let i = 0; i < 4; i++) {
        const val = t.flashColor[i];
        if (typeof val !== 'number') {
          errors.push(`flashColor[${i}] must be a number`);
        } else if (val < 0 || val > 255) {
          errors.push(`flashColor[${i}] value ${val} out of range (0-255)`);
        }
      }
    }

    if (typeof t.flashDuration !== 'number') {
      errors.push('Missing or invalid "flashDuration" field');
    } else if (t.flashDuration < 0) {
      errors.push(`flashDuration ${t.flashDuration} must be non-negative`);
    }

    return errors;
  }

  /**
   * Validate sound effect object
   */
  private static validateSoundEffect(se: unknown): string[] {
    const errors: string[] = [];

    if (typeof se !== 'object' || se === null) {
      errors.push('SE must be an object');
      return errors;
    }

    const s = se as Record<string, unknown>;

    if (typeof s.name !== 'string') {
      errors.push('SE missing or invalid "name" field');
    }

    if (typeof s.volume !== 'number') {
      errors.push('SE missing or invalid "volume" field');
    } else if (s.volume < 0 || s.volume > 100) {
      errors.push(`SE volume ${s.volume} out of range (0-100)`);
    }

    if (typeof s.pitch !== 'number') {
      errors.push('SE missing or invalid "pitch" field');
    } else if (s.pitch < 10 || s.pitch > 200) {
      errors.push(`SE pitch ${s.pitch} out of range (10-200)`);
    }
    // Note: RMMV editor typically shows 50-150, but real data shows wider range

    if (typeof s.pan !== 'number') {
      errors.push('SE missing or invalid "pan" field');
    } else if (s.pan < -100 || s.pan > 100) {
      errors.push(`SE pan ${s.pan} out of range (-100 to 100)`);
    }

    return errors;
  }

  /**
   * Get animation by ID from parsed data
   *
   * @param data - Parsed animations data
   * @param id - Animation ID to retrieve
   * @returns Animation object or null if not found
   */
  static getAnimationById(
    data: RMMVAnimationsData,
    id: number
  ): RMMVAnimation | null {
    if (id < 0 || id >= data.length) {
      return null;
    }

    const animation = data[id];
    return animation ?? null;
  }

  /**
   * Get all valid animations (excluding null entries)
   *
   * @param data - Parsed animations data
   * @returns Array of all valid animation objects
   */
  static getAllAnimations(data: RMMVAnimationsData): RMMVAnimation[] {
    return data.filter((anim): anim is RMMVAnimation => anim !== null);
  }

  /**
   * Get sprite sheet names used by an animation
   *
   * @param animation - Animation to analyze
   * @returns Array of sprite sheet filenames (without .png extension)
   */
  static getSpriteSheetNames(animation: RMMVAnimation): string[] {
    const names: string[] = [];

    if (animation.animation1Name && animation.animation1Name !== '') {
      names.push(animation.animation1Name);
    }

    if (animation.animation2Name && animation.animation2Name !== '') {
      names.push(animation.animation2Name);
    }

    return names;
  }

  /**
   * Get all unique cell IDs used in an animation (excluding -1)
   *
   * @param animation - Animation to analyze
   * @returns Set of cell IDs used across all frames
   */
  static getUsedCellIds(animation: RMMVAnimation): Set<number> {
    const cellIds = new Set<number>();

    for (const frame of animation.frames) {
      for (const cell of frame) {
        const [cellId] = cell;
        if (cellId !== -1) {
          cellIds.add(cellId);
        }
      }
    }

    return cellIds;
  }
}
