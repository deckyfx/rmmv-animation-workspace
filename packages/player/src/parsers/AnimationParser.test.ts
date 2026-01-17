/**
 * Animation Parser Tests
 *
 * Run with: bun test src/sdk/parsers/AnimationParser.test.ts
 */

import { describe, expect, test } from 'bun:test';
import { AnimationParser } from './AnimationParser';
import type { RMMVAnimationsData } from '@sdk/types/rmmv';

describe('AnimationParser', () => {
  describe('validate', () => {
    test('should accept valid minimal animation data', () => {
      const data: RMMVAnimationsData = [
        null,
        {
          id: 1,
          name: 'Test Animation',
          position: 1,
          animation1Name: 'Test1',
          animation1Hue: 0,
          animation2Name: '',
          animation2Hue: 0,
          frames: [],
          timings: [],
        },
      ];

      const result = AnimationParser.validate(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject non-array root data', () => {
      const data = { not: 'an array' };
      const result = AnimationParser.validate(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Root data must be an array');
    });

    test('should warn if index 0 is not null', () => {
      const data: RMMVAnimationsData = [
        // @ts-expect-error - Testing invalid data
        { id: 0, name: 'Invalid' },
      ];

      const result = AnimationParser.validate(data);
      expect(result.warnings).toContainEqual(
        expect.stringContaining('Index 0 should be null')
      );
    });

    test('should reject animation with mismatched ID and index', () => {
      const data: RMMVAnimationsData = [
        null,
        {
          id: 5, // ID doesn't match index 1
          name: 'Test',
          position: 1,
          animation1Name: '',
          animation1Hue: 0,
          animation2Name: '',
          animation2Hue: 0,
          frames: [],
          timings: [],
        },
      ];

      const result = AnimationParser.validate(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('does not match array index')
      );
    });

    test('should validate cell data ranges', () => {
      const data: RMMVAnimationsData = [
        null,
        {
          id: 1,
          name: 'Test',
          position: 1,
          animation1Name: 'Test1',
          animation1Hue: 0,
          animation2Name: '',
          animation2Hue: 0,
          frames: [
            [
              // Valid cell
              [0, 0, 0, 100, 0, 0, 255, 0],
              // Invalid cell - out of range values
              [25, 0, 0, 100, 361, 2, 256, 4],
            ],
          ],
          timings: [],
        },
      ];

      const result = AnimationParser.validate(data);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should accept -1 as valid cellId (empty cell)', () => {
      const data: RMMVAnimationsData = [
        null,
        {
          id: 1,
          name: 'Test',
          position: 1,
          animation1Name: 'Test1',
          animation1Hue: 0,
          animation2Name: '',
          animation2Hue: 0,
          frames: [[[-1, 0, 0, 0, 0, 0, 0, 0]]],
          timings: [],
        },
      ];

      const result = AnimationParser.validate(data);
      expect(result.valid).toBe(true);
    });

    test('should validate timing event structure', () => {
      const data: RMMVAnimationsData = [
        null,
        {
          id: 1,
          name: 'Test',
          position: 1,
          animation1Name: 'Test1',
          animation1Hue: 0,
          animation2Name: '',
          animation2Hue: 0,
          frames: [],
          timings: [
            {
              frame: 0,
              se: {
                name: 'Blow3',
                volume: 90,
                pitch: 100,
                pan: 0,
              },
              flashScope: 1,
              flashColor: [255, 255, 255, 255],
              flashDuration: 2,
            },
          ],
        },
      ];

      const result = AnimationParser.validate(data);
      expect(result.valid).toBe(true);
    });

    test('should accept null SE in timing', () => {
      const data: RMMVAnimationsData = [
        null,
        {
          id: 1,
          name: 'Test',
          position: 1,
          animation1Name: 'Test1',
          animation1Hue: 0,
          animation2Name: '',
          animation2Hue: 0,
          frames: [],
          timings: [
            {
              frame: 0,
              se: null,
              flashScope: 0,
              flashColor: [0, 0, 0, 0],
              flashDuration: 0,
            },
          ],
        },
      ];

      const result = AnimationParser.validate(data);
      expect(result.valid).toBe(true);
    });

    test('should validate SE parameter ranges', () => {
      const data: RMMVAnimationsData = [
        null,
        {
          id: 1,
          name: 'Test',
          position: 1,
          animation1Name: 'Test1',
          animation1Hue: 0,
          animation2Name: '',
          animation2Hue: 0,
          frames: [],
          timings: [
            {
              frame: 0,
              se: {
                name: 'Test',
                volume: 150, // Invalid: >100
                pitch: 200, // Invalid: >150
                pan: 150, // Invalid: >100
              },
              flashScope: 1,
              flashColor: [255, 255, 255, 255],
              flashDuration: 2,
            },
          ],
        },
      ];

      const result = AnimationParser.validate(data);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate hue range (0-360)', () => {
      const data: RMMVAnimationsData = [
        null,
        {
          id: 1,
          name: 'Test',
          position: 1,
          animation1Name: 'Test1',
          animation1Hue: 400, // Invalid
          animation2Name: '',
          animation2Hue: -10, // Invalid
          frames: [],
          timings: [],
        },
      ];

      const result = AnimationParser.validate(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('animation1Hue')
      );
      expect(result.errors).toContainEqual(
        expect.stringContaining('animation2Hue')
      );
    });
  });

  describe('parse', () => {
    test('should throw on invalid data', () => {
      const invalidData = { not: 'valid' };

      expect(() => {
        AnimationParser.parse(invalidData);
      }).toThrow('Invalid animation data');
    });

    test('should return validated data on success', () => {
      const data: RMMVAnimationsData = [
        null,
        {
          id: 1,
          name: 'Test',
          position: 1,
          animation1Name: 'Test1',
          animation1Hue: 0,
          animation2Name: '',
          animation2Hue: 0,
          frames: [],
          timings: [],
        },
      ];

      const result = AnimationParser.parse(data);
      expect(result).toEqual(data);
    });
  });

  describe('getAnimationById', () => {
    const data: RMMVAnimationsData = [
      null,
      { id: 1, name: 'Anim1', position: 1, animation1Name: '', animation1Hue: 0, animation2Name: '', animation2Hue: 0, frames: [], timings: [] },
      { id: 2, name: 'Anim2', position: 1, animation1Name: '', animation1Hue: 0, animation2Name: '', animation2Hue: 0, frames: [], timings: [] },
    ];

    test('should return animation by valid ID', () => {
      const anim = AnimationParser.getAnimationById(data, 1);
      expect(anim).not.toBeNull();
      expect(anim?.name).toBe('Anim1');
    });

    test('should return null for invalid ID', () => {
      expect(AnimationParser.getAnimationById(data, 99)).toBeNull();
      expect(AnimationParser.getAnimationById(data, -1)).toBeNull();
    });

    test('should return null for index 0', () => {
      expect(AnimationParser.getAnimationById(data, 0)).toBeNull();
    });
  });

  describe('getAllAnimations', () => {
    test('should return only non-null animations', () => {
      const data: RMMVAnimationsData = [
        null,
        { id: 1, name: 'Anim1', position: 1, animation1Name: '', animation1Hue: 0, animation2Name: '', animation2Hue: 0, frames: [], timings: [] },
        null,
        { id: 3, name: 'Anim3', position: 1, animation1Name: '', animation1Hue: 0, animation2Name: '', animation2Hue: 0, frames: [], timings: [] },
      ];

      const anims = AnimationParser.getAllAnimations(data);
      expect(anims).toHaveLength(2);
      expect(anims[0]?.name).toBe('Anim1');
      expect(anims[1]?.name).toBe('Anim3');
    });
  });

  describe('getSpriteSheetNames', () => {
    test('should return both sprite sheet names', () => {
      const anim = {
        id: 1,
        name: 'Test',
        position: 1,
        animation1Name: 'Sheet1',
        animation1Hue: 0,
        animation2Name: 'Sheet2',
        animation2Hue: 0,
        frames: [],
        timings: [],
      };

      const names = AnimationParser.getSpriteSheetNames(anim);
      expect(names).toEqual(['Sheet1', 'Sheet2']);
    });

    test('should exclude empty sheet names', () => {
      const anim = {
        id: 1,
        name: 'Test',
        position: 1,
        animation1Name: 'Sheet1',
        animation1Hue: 0,
        animation2Name: '',
        animation2Hue: 0,
        frames: [],
        timings: [],
      };

      const names = AnimationParser.getSpriteSheetNames(anim);
      expect(names).toEqual(['Sheet1']);
    });
  });

  describe('getUsedCellIds', () => {
    test('should return all unique cell IDs used', () => {
      const anim = {
        id: 1,
        name: 'Test',
        position: 1,
        animation1Name: 'Sheet1',
        animation1Hue: 0,
        animation2Name: '',
        animation2Hue: 0,
        frames: [
          [[0, 0, 0, 100, 0, 0, 255, 0] as [number, number, number, number, number, number, number, number]],
          [
            [1, 0, 0, 100, 0, 0, 255, 0] as [number, number, number, number, number, number, number, number],
            [2, 0, 0, 100, 0, 0, 255, 0] as [number, number, number, number, number, number, number, number]
          ],
          [[0, 0, 0, 100, 0, 0, 255, 0] as [number, number, number, number, number, number, number, number]], // Duplicate 0
        ],
        timings: [],
      };

      const cellIds = AnimationParser.getUsedCellIds(anim);
      expect(cellIds.size).toBe(3);
      expect(cellIds.has(0)).toBe(true);
      expect(cellIds.has(1)).toBe(true);
      expect(cellIds.has(2)).toBe(true);
    });

    test('should exclude -1 (empty cells)', () => {
      const anim = {
        id: 1,
        name: 'Test',
        position: 1,
        animation1Name: 'Sheet1',
        animation1Hue: 0,
        animation2Name: '',
        animation2Hue: 0,
        frames: [
          [[0, 0, 0, 100, 0, 0, 255, 0] as [number, number, number, number, number, number, number, number]],
          [[-1, 0, 0, 0, 0, 0, 0, 0] as [number, number, number, number, number, number, number, number]], // Empty cell
        ],
        timings: [],
      };

      const cellIds = AnimationParser.getUsedCellIds(anim);
      expect(cellIds.size).toBe(1);
      expect(cellIds.has(0)).toBe(true);
      expect(cellIds.has(-1)).toBe(false);
    });
  });
});
