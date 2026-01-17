/**
 * Target Object
 *
 * Represents the target entity (character/enemy) for animations.
 * Provides visual reference for animation positioning.
 */

import Phaser from 'phaser';

/**
 * Target configuration
 */
export interface TargetConfig {
  /** Width of target body */
  width: number;
  /** Height of target body */
  height: number;
  /** Color of target visualization */
  color: number;
  /** Opacity of target visualization */
  alpha: number;
}

/**
 * Default target configuration
 * Represents a human-sized target (48x64 pixels)
 */
export const DEFAULT_TARGET_CONFIG: TargetConfig = {
  width: 48,
  height: 64,
  color: 0x6495ed, // Cornflower blue
  alpha: 0.5,
};

/**
 * Target position points for animation anchoring
 */
export interface TargetPositionPoints {
  /** Head position (top of target) */
  head: { x: number; y: number };
  /** Center position (middle of target) */
  center: { x: number; y: number };
  /** Feet position (bottom of target) */
  feet: { x: number; y: number };
}

/**
 * Target object for animation positioning
 *
 * Renders a simple humanoid shape with three key position points:
 * - Head (top)
 * - Center (middle)
 * - Feet (bottom)
 */
export class Target extends Phaser.GameObjects.Container {
  private config: TargetConfig;
  private bodyGraphics: Phaser.GameObjects.Graphics;
  private headMarker: Phaser.GameObjects.Graphics;
  private centerMarker: Phaser.GameObjects.Graphics;
  private feetMarker: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: Partial<TargetConfig> = {}
  ) {
    super(scene, x, y);

    this.config = { ...DEFAULT_TARGET_CONFIG, ...config };

    // Create body graphics
    this.bodyGraphics = this.scene.add.graphics();
    this.headMarker = this.scene.add.graphics();
    this.centerMarker = this.scene.add.graphics();
    this.feetMarker = this.scene.add.graphics();

    // Add to container
    this.add([this.bodyGraphics, this.headMarker, this.centerMarker, this.feetMarker]);

    // Draw target
    this.draw();

    // Add to scene
    this.scene.add.existing(this);
  }

  /**
   * Draw the target visualization as a simple stickman
   */
  private draw(): void {
    const { height, color, alpha } = this.config;
    const halfHeight = height / 2;

    // Clear previous drawings
    this.bodyGraphics.clear();
    this.headMarker.clear();
    this.centerMarker.clear();
    this.feetMarker.clear();

    // Stickman dimensions (proportional to height)
    const headRadius = height * 0.15;
    const neckY = -halfHeight + headRadius * 2;
    const bodyLength = height * 0.4;
    const bodyEndY = neckY + bodyLength;
    const armLength = height * 0.3;
    const legLength = height * 0.35;

    // Draw stickman with lines
    this.bodyGraphics.lineStyle(3, color, alpha);

    // Head (circle)
    this.bodyGraphics.strokeCircle(0, -halfHeight + headRadius, headRadius);

    // Body (vertical line from neck to hips)
    this.bodyGraphics.lineBetween(0, neckY, 0, bodyEndY);

    // Arms (horizontal line with angle)
    const armY = neckY + bodyLength * 0.3;
    this.bodyGraphics.lineBetween(-armLength, armY, armLength, armY);

    // Legs (two lines from hips to feet)
    const legSpread = height * 0.15;
    this.bodyGraphics.lineBetween(0, bodyEndY, -legSpread, bodyEndY + legLength);
    this.bodyGraphics.lineBetween(0, bodyEndY, legSpread, bodyEndY + legLength);

    // Draw position markers (small circles)
    const markerRadius = 4;

    // Head marker (top of head)
    this.headMarker.fillStyle(0xff6b6b, 0.8);
    this.headMarker.fillCircle(0, -halfHeight, markerRadius);

    // Center marker (middle of body)
    this.centerMarker.fillStyle(0x51cf66, 0.8);
    this.centerMarker.fillCircle(0, 0, markerRadius);

    // Feet marker (bottom)
    this.feetMarker.fillStyle(0x4dabf7, 0.8);
    this.feetMarker.fillCircle(0, halfHeight, markerRadius);
  }

  /**
   * Get position points for animation anchoring
   * Returns world coordinates for head, center, and feet positions
   */
  getPositionPoints(): TargetPositionPoints {
    const halfHeight = this.config.height / 2;

    return {
      head: {
        x: this.x,
        y: this.y - halfHeight,
      },
      center: {
        x: this.x,
        y: this.y,
      },
      feet: {
        x: this.x,
        y: this.y + halfHeight,
      },
    };
  }

  /**
   * Update target configuration
   */
  updateConfig(config: Partial<TargetConfig>): void {
    this.config = { ...this.config, ...config };
    this.draw();
  }

  /**
   * Get target configuration
   */
  getConfig(): TargetConfig {
    return { ...this.config };
  }
}
