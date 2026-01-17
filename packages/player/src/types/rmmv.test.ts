/**
 * RMMV Types Utility Tests
 *
 * Tests for cell coordinate calculation functions
 */

import { describe, expect, test } from 'bun:test';
import { getCellCoordinates, getCellId } from './rmmv';

describe('getCellCoordinates', () => {
  describe('5-column sprite sheet (standard)', () => {
    const columns = 5;

    test('should calculate first cell (0,0)', () => {
      const coords = getCellCoordinates(0, columns);
      expect(coords).toEqual({
        row: 0,
        col: 0,
        x: 0,
        y: 0,
      });
    });

    test('should calculate last cell of first row (0,4)', () => {
      const coords = getCellCoordinates(4, columns);
      expect(coords).toEqual({
        row: 0,
        col: 4,
        x: 192 * 4,
        y: 0,
      });
    });

    test('should calculate first cell of second row (1,0)', () => {
      const coords = getCellCoordinates(5, columns);
      expect(coords).toEqual({
        row: 1,
        col: 0,
        x: 0,
        y: 192,
      });
    });

    test('should calculate middle cell (1,1)', () => {
      const coords = getCellCoordinates(6, columns);
      expect(coords).toEqual({
        row: 1,
        col: 1,
        x: 192,
        y: 192,
      });
    });

    test('should calculate last cell in 5×5 grid (4,4)', () => {
      const coords = getCellCoordinates(24, columns);
      expect(coords).toEqual({
        row: 4,
        col: 4,
        x: 192 * 4,
        y: 192 * 4,
      });
    });

    test('should calculate cell beyond standard grid', () => {
      const coords = getCellCoordinates(112, columns);
      expect(coords).toEqual({
        row: 22, // 112 / 5 = 22
        col: 2, // 112 % 5 = 2
        x: 192 * 2,
        y: 192 * 22,
      });
    });
  });

  describe('3-column sprite sheet', () => {
    const columns = 3;

    test('should calculate first cell of second row', () => {
      const coords = getCellCoordinates(3, columns);
      expect(coords).toEqual({
        row: 1,
        col: 0,
        x: 0,
        y: 192,
      });
    });

    test('should calculate cell (2,1)', () => {
      const coords = getCellCoordinates(7, columns);
      expect(coords).toEqual({
        row: 2, // 7 / 3 = 2
        col: 1, // 7 % 3 = 1
        x: 192,
        y: 192 * 2,
      });
    });
  });

  describe('4-column sprite sheet', () => {
    const columns = 4;

    test('should calculate first cell of second row', () => {
      const coords = getCellCoordinates(4, columns);
      expect(coords).toEqual({
        row: 1,
        col: 0,
        x: 0,
        y: 192,
      });
    });

    test('should calculate cell (3,2)', () => {
      const coords = getCellCoordinates(14, columns);
      expect(coords).toEqual({
        row: 3, // 14 / 4 = 3
        col: 2, // 14 % 4 = 2
        x: 192 * 2,
        y: 192 * 3,
      });
    });
  });

  describe('custom cell dimensions', () => {
    test('should use custom width and height', () => {
      const coords = getCellCoordinates(6, 5, 100, 100);
      expect(coords).toEqual({
        row: 1,
        col: 1,
        x: 100,
        y: 100,
      });
    });
  });
});

describe('getCellId', () => {
  describe('5-column sprite sheet', () => {
    const columns = 5;

    test('should calculate cellId for (0,0)', () => {
      expect(getCellId(0, 0, columns)).toBe(0);
    });

    test('should calculate cellId for (0,4)', () => {
      expect(getCellId(0, 4, columns)).toBe(4);
    });

    test('should calculate cellId for (1,0)', () => {
      expect(getCellId(1, 0, columns)).toBe(5);
    });

    test('should calculate cellId for (1,1)', () => {
      expect(getCellId(1, 1, columns)).toBe(6);
    });

    test('should calculate cellId for (4,4)', () => {
      expect(getCellId(4, 4, columns)).toBe(24);
    });

    test('should calculate cellId for (22,2)', () => {
      expect(getCellId(22, 2, columns)).toBe(112);
    });
  });

  describe('3-column sprite sheet', () => {
    const columns = 3;

    test('should calculate cellId for (1,0)', () => {
      expect(getCellId(1, 0, columns)).toBe(3);
    });

    test('should calculate cellId for (2,1)', () => {
      expect(getCellId(2, 1, columns)).toBe(7);
    });
  });

  describe('4-column sprite sheet', () => {
    const columns = 4;

    test('should calculate cellId for (1,0)', () => {
      expect(getCellId(1, 0, columns)).toBe(4);
    });

    test('should calculate cellId for (3,2)', () => {
      expect(getCellId(3, 2, columns)).toBe(14);
    });
  });
});

describe('roundtrip conversions', () => {
  test('cellId → coordinates → cellId should be identity', () => {
    const columns = 5;
    const originalCellId = 17;

    const coords = getCellCoordinates(originalCellId, columns);
    const calculatedCellId = getCellId(coords.row, coords.col, columns);

    expect(calculatedCellId).toBe(originalCellId);
  });

  test('coordinates → cellId → coordinates should be identity', () => {
    const columns = 5;
    const originalRow = 3;
    const originalCol = 2;

    const cellId = getCellId(originalRow, originalCol, columns);
    const coords = getCellCoordinates(cellId, columns);

    expect(coords.row).toBe(originalRow);
    expect(coords.col).toBe(originalCol);
  });

  test('should work for all cells in 5×5 grid', () => {
    const columns = 5;

    for (let cellId = 0; cellId < 25; cellId++) {
      const coords = getCellCoordinates(cellId, columns);
      const calculatedCellId = getCellId(coords.row, coords.col, columns);
      expect(calculatedCellId).toBe(cellId);
    }
  });

  test('should work for large cellIds (112+)', () => {
    const columns = 5;
    const cellId = 112;

    const coords = getCellCoordinates(cellId, columns);
    const calculatedCellId = getCellId(coords.row, coords.col, columns);

    expect(calculatedCellId).toBe(cellId);
  });
});
