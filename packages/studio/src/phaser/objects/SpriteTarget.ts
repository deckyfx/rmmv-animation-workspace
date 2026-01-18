import type { AnimationTarget } from '@decky.fx/rmmv-animation-player';
import type { TargetPositionPoints } from './Target';

/**
 * Configuration for sprite-based target
 */
export interface SpriteTargetConfig {
  /**
   * Sprite texture key (loaded in PreloadScene)
   */
  texture: string;

  /**
   * X position of target
   */
  x: number;

  /**
   * Y position of target
   */
  y: number;

  /**
   * Scale factor for sprite (default: 1.0)
   */
  scale?: number;

  /**
   * Initial alpha/opacity (default: 1.0)
   */
  alpha?: number;
}

/**
 * Sprite-based animation target that implements AnimationTarget interface
 *
 * This target uses Phaser.Sprite with built-in tint system:
 * - setTint() applies a color overlay (multiplicative blend)
 * - clearTint() removes the overlay
 * - Sprite tinting is GPU-accelerated and efficient
 *
 * Key differences from Graphics-based Target:
 * - Tint is an overlay, not a color replacement
 * - White tint (0xFFFFFF) = no change
 * - Red tint (0xFF0000) = only red channel visible
 * - GPU-accelerated (faster than redrawing graphics)
 *
 * @example
 * ```typescript
 * const target = new SpriteTarget(scene, {
 *   texture: 'enemy_lamia',
 *   x: 400,
 *   y: 300,
 *   scale: 1.5
 * });
 * scene.add.existing(target);
 *
 * // Flash effects will tint the sprite
 * target.setTint(0xFF0000); // Red overlay
 * target.clearTint();       // Remove overlay
 * ```
 */
export class SpriteTarget extends Phaser.GameObjects.Container implements AnimationTarget {
  private sprite: Phaser.GameObjects.Sprite;
  private config: Required<SpriteTargetConfig>;
  private isTinted: boolean = false;
  private originalBlendMode: Phaser.BlendModes | string | number = Phaser.BlendModes.NORMAL;

  /**
   * Create a new sprite-based target
   *
   * @param scene - Phaser scene
   * @param config - Target configuration
   */
  constructor(scene: Phaser.Scene, config: SpriteTargetConfig) {
    super(scene, config.x, config.y);

    // Store full config with defaults
    this.config = {
      texture: config.texture,
      x: config.x,
      y: config.y,
      scale: config.scale ?? 1.0,
      alpha: config.alpha ?? 1.0,
    };

    // Create sprite at origin (container handles positioning)
    this.sprite = scene.add.sprite(0, 0, this.config.texture);
    this.sprite.setScale(this.config.scale);
    this.sprite.setAlpha(this.config.alpha);
    this.sprite.setOrigin(0.5, 0.5);

    // Add sprite to container
    this.add(this.sprite);

    // Set container size based on sprite bounds
    this.setSize(this.sprite.displayWidth, this.sprite.displayHeight);
  }

  /**
   * Apply tint color to sprite (implements AnimationTarget interface)
   *
   * Special handling for different tint colors:
   * - White/Bright colors (>= 0xC0C0C0): Uses tintFill for full replacement
   * - Dark colors: Uses additive blend mode for brightening effect
   * - Other colors: Uses standard multiplicative tint
   *
   * @param color - Tint color in 0xRRGGBB format
   */
  setTint(color: number): void {
    if (this.isTinted) {
      return; // Already tinted
    }

    this.isTinted = true;
    this.originalBlendMode = this.sprite.blendMode;

    // Extract RGB components
    const r = (color >> 16) & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = color & 0xFF;

    // Calculate brightness (0-255)
    const brightness = (r + g + b) / 3;

    // For white/bright flashes (brightness >= 192), use tintFill to replace colors
    if (brightness >= 192) {
      // TintFill replaces the sprite texture with solid color (perfect for white flash)
      this.sprite.setTintFill(color);
    } else {
      // For colored flashes, use standard tint
      this.sprite.setTint(color);
    }
  }

  /**
   * Remove tint from sprite (implements AnimationTarget interface)
   */
  clearTint(): void {
    if (!this.isTinted) {
      return; // Not tinted
    }

    this.isTinted = false;
    this.sprite.clearTint();
    this.sprite.setBlendMode(this.originalBlendMode);
  }

  /**
   * Set visibility of sprite (implements AnimationTarget interface)
   *
   * @param visible - Whether sprite should be visible
   */
  override setVisible(visible: boolean): this {
    super.setVisible(visible);
    return this;
  }

  /**
   * Get sprite reference (for advanced usage)
   */
  getSprite(): Phaser.GameObjects.Sprite {
    return this.sprite;
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<SpriteTargetConfig> {
    return { ...this.config };
  }

  /**
   * Get position points for animation anchoring
   * Returns world coordinates for head, center, and feet positions
   * based on sprite bounds
   */
  getPositionPoints(): TargetPositionPoints {
    const halfHeight = this.sprite.displayHeight / 2;

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
   * Update sprite texture (allows switching enemy sprites)
   *
   * @param texture - New texture key
   */
  setTexture(texture: string): void {
    this.config.texture = texture;
    this.sprite.setTexture(texture);
    this.setSize(this.sprite.displayWidth, this.sprite.displayHeight);
  }

  /**
   * Update sprite scale (use this instead of Container's setScale)
   *
   * @param scale - New scale factor
   */
  setSpriteScale(scale: number): void {
    this.config.scale = scale;
    this.sprite.setScale(scale);
    this.setSize(this.sprite.displayWidth, this.sprite.displayHeight);
  }

  /**
   * Clean up resources
   */
  override destroy(fromScene?: boolean): void {
    this.sprite.destroy();
    super.destroy(fromScene);
  }
}
