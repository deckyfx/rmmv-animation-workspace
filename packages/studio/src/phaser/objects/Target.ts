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

  /** Original color and alpha for tint restoration */
  private originalColor: number;
  private originalAlpha: number;

  /** Current tint state */
  private isTinted = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: Partial<TargetConfig> = {}
  ) {
    super(scene, x, y);

    this.config = { ...DEFAULT_TARGET_CONFIG, ...config };

    // Store original color and alpha
    this.originalColor = this.config.color;
    this.originalAlpha = this.config.alpha;

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
   * Draw the target visualization as a simple solid circle
   */
  private draw(): void {
    const { height, color, alpha } = this.config;
    const halfHeight = height / 2;

    // Clear previous drawings
    this.bodyGraphics.clear();
    this.headMarker.clear();
    this.centerMarker.clear();
    this.feetMarker.clear();

    // Draw simple solid circle (radius = half of height)
    const radius = halfHeight;
    this.bodyGraphics.fillStyle(color, alpha);
    this.bodyGraphics.fillCircle(0, 0, radius);

    // Draw position markers (small circles)
    const markerRadius = 4;

    // Head marker (top)
    this.headMarker.fillStyle(0xff6b6b, 0.8);
    this.headMarker.fillCircle(0, -halfHeight, markerRadius);

    // Center marker (middle)
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

  /**
   * Apply tint color to target (implements AnimationTarget interface)
   * For Graphics-based target, we replace the color directly for flash effect
   *
   * @param color - Tint color in 0xRRGGBB format
   */
  setTint(color: number): void {
    console.log('[Target] setTint called with color:', '0x' + color.toString(16).padStart(6, '0'));
    console.log('[Target] isTinted before:', this.isTinted);

    if (this.isTinted) {
      console.log('[Target] Already tinted, skipping');
      return; // Already tinted
    }

    this.isTinted = true;

    // Use tint color directly for flash effect (don't blend)
    console.log('[Target] Applying tint - original color:', '0x' + this.originalColor.toString(16).padStart(6, '0'));
    this.config.color = color;
    this.config.alpha = 1.0; // Flash at full opacity
    console.log('[Target] New color:', '0x' + this.config.color.toString(16).padStart(6, '0'), 'alpha:', this.config.alpha);
    this.draw();
    console.log('[Target] Redraw complete');
  }

  /**
   * Remove tint from target (implements AnimationTarget interface)
   */
  clearTint(): void {
    console.log('[Target] clearTint called');
    console.log('[Target] isTinted before:', this.isTinted);

    if (!this.isTinted) {
      console.log('[Target] Not tinted, skipping');
      return; // Not tinted
    }

    this.isTinted = false;

    // Restore original color and alpha
    console.log('[Target] Restoring original - color:', '0x' + this.originalColor.toString(16).padStart(6, '0'), 'alpha:', this.originalAlpha);
    this.config.color = this.originalColor;
    this.config.alpha = this.originalAlpha;
    this.draw();
    console.log('[Target] Restore complete');
  }

  /**
   * Set visibility of target (implements AnimationTarget interface)
   * Uses Phaser Container's built-in setVisible method
   *
   * @param visible - Whether target should be visible
   */
  override setVisible(visible: boolean): this {
    return super.setVisible(visible);
  }
}
