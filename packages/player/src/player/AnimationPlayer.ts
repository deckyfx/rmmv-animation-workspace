/**
 * RMMV Animation Player - Standalone SDK for Phaser
 *
 * Plays RMMV animations in any Phaser 3 project using exported animation configs.
 * Framework-agnostic and fully self-contained.
 *
 * @example
 * ```typescript
 * // In your Phaser scene
 * import { AnimationPlayer } from './sdk/player/AnimationPlayer';
 *
 * // Load animation config (exported from RMMV Animation Studio)
 * const config = await fetch('/animations/MyAnimation_export.json').then(r => r.json());
 *
 * // Create player instance
 * const player = new AnimationPlayer(this, config);
 *
 * // Load assets
 * await player.preload();
 *
 * // Play animation at target position
 * player.play({ x: 400, y: 300 }, { loop: false, speed: 1.0 });
 * ```
 */

import Phaser from 'phaser';
import type { RMMVAnimation, RMMVCellData, RMMVAnimationTiming, AnimationTarget } from '../types/rmmv';
import { getCellCoordinates, RMMVFlashScope, RMMVAnimationPosition } from '../types/rmmv';

/**
 * Exported animation config format (from /api/animations/:id/export)
 */
export interface AnimationConfig {
  /** Animation data */
  animation: RMMVAnimation;
  /** Required assets */
  assets: {
    /** Sprite sheets */
    spritesheets: Array<{
      name: string;
      path: string;
      hue: number;
      slot: number;
    }>;
    /** Sound effects */
    soundEffects: Array<{
      name: string;
      path: string;
    }>;
  };
  /** Metadata */
  metadata?: {
    exportedAt: string;
    exportedFrom: string;
    version: string;
    animationId: number;
    animationName: string;
  };
}

/**
 * Playback options
 */
export interface PlaybackOptions {
  /** Loop animation continuously */
  loop?: boolean;
  /** Playback speed multiplier (1.0 = normal) */
  speed?: number;
  /** Called when animation completes (not called for looped animations) */
  onComplete?: () => void;
  /** Called each frame */
  onUpdate?: (frameIndex: number) => void;
}

/**
 * Target position for animation
 */
export interface TargetPosition {
  x: number;
  y: number;
}

/**
 * AnimationPlayer - Standalone RMMV animation player for Phaser
 *
 * Loads and plays RMMV animations from exported config files.
 * Handles all asset loading, rendering, and timing automatically.
 */
export class AnimationPlayer {
  /** Phaser scene reference */
  private scene: Phaser.Scene;

  /** Animation configuration */
  private config: AnimationConfig;

  /** Animation data */
  private animation: RMMVAnimation;

  /** Container for animation sprites */
  private container?: Phaser.GameObjects.Container;

  /** Animation target (for flash effects and positioning) */
  private target?: AnimationTarget;

  /** Whether assets have been preloaded */
  private assetsLoaded = false;

  /** Current playback state */
  private isPlaying = false;
  private isPaused = false;
  private currentFrameIndex = 0;
  private frameAccumulator = 0;
  private playbackSpeed = 1.0;
  private looping = false;
  private onComplete?: () => void;
  private onUpdate?: (frameIndex: number) => void;

  /** Promise resolve function for async play */
  private playResolve?: () => void;

  /** Active flash tween timers (for cleanup) */
  private activeFlashTimers: Phaser.Time.TimerEvent[] = [];

  /**
   * Create animation player
   *
   * @param scene - Phaser scene to render animation in
   * @param config - Animation configuration from export
   * @param assetsPreloaded - Whether assets are already loaded in Phaser (default: false)
   */
  constructor(scene: Phaser.Scene, config: AnimationConfig, assetsPreloaded = false) {
    this.scene = scene;
    this.config = config;
    this.animation = config.animation;
    this.assetsLoaded = assetsPreloaded;
  }

  /**
   * Preload all required assets (sprite sheets and sound effects)
   *
   * Call this once before playing the animation.
   * Can be called from scene's preload() or create() method.
   *
   * @returns Promise that resolves when all assets are loaded
   */
  async preload(): Promise<void> {
    if (this.assetsLoaded) {
      return;
    }

    const loadPromises: Promise<void>[] = [];

    // Load sprite sheets
    for (const sheet of this.config.assets.spritesheets) {
      const promise = new Promise<void>((resolve, reject) => {
        const key = `anim_${sheet.name}`;

        // Skip if already loaded
        if (this.scene.textures.exists(key)) {
          resolve();
          return;
        }

        this.scene.load.image(key, sheet.path);
        this.scene.load.once(`filecomplete-image-${key}`, () => resolve());
        this.scene.load.once(`loaderror`, () => reject(new Error(`Failed to load ${sheet.path}`)));
      });

      loadPromises.push(promise);
    }

    // Load sound effects
    for (const se of this.config.assets.soundEffects) {
      const promise = new Promise<void>((resolve, reject) => {
        const key = `se_${se.name}`;

        // Skip if already loaded
        if (this.scene.cache.audio.exists(key)) {
          resolve();
          return;
        }

        this.scene.load.audio(key, se.path);
        this.scene.load.once(`filecomplete-audio-${key}`, () => resolve());
        this.scene.load.once(`loaderror`, () => reject(new Error(`Failed to load ${se.path}`)));
      });

      loadPromises.push(promise);
    }

    // Start loading
    if (!this.scene.load.isLoading()) {
      this.scene.load.start();
    }

    // Wait for all assets to load
    await Promise.all(loadPromises);

    this.assetsLoaded = true;
  }

  /**
   * Play animation at target position
   *
   * Returns a Promise that resolves when animation completes.
   * For looped animations, the Promise never resolves.
   *
   * @param target - Animation target (object with position, tint, visibility methods) or simple position { x, y }. Optional for screen-positioned animations.
   * @param options - Playback options
   * @returns Promise that resolves when animation completes (does not resolve for looped animations)
   *
   * @example
   * ```typescript
   * // With Phaser sprite as target (flash effects enabled)
   * const sprite = this.add.sprite(100, 100, 'hero');
   * await player.play(sprite);
   *
   * // With custom target
   * const customTarget = {
   *   x: 100, y: 100, width: 64, height: 64,
   *   setTint: (c) => console.log('Tint:', c),
   *   clearTint: () => {},
   *   setVisible: (v) => {}
   * };
   * await player.play(customTarget);
   *
   * // With simple position (legacy)
   * await player.play({ x: 400, y: 300 });
   * ```
   */
  play(target?: AnimationTarget | TargetPosition, options: PlaybackOptions = {}): Promise<void> {
    if (!this.assetsLoaded) {
      throw new Error('Assets not loaded. Call preload() first.');
    }

    // Stop any current playback
    this.stop();

    // Apply options
    this.looping = options.loop ?? false;
    this.playbackSpeed = options.speed ?? 1.0;
    this.onComplete = options.onComplete;
    this.onUpdate = options.onUpdate;

    // Store target if it implements AnimationTarget interface
    if (target && 'setTint' in target && 'clearTint' in target && 'setVisible' in target) {
      this.target = target as AnimationTarget;
    } else {
      this.target = undefined;
    }

    // Calculate animation position based on animation.position
    const position = this.calculateAnimationPosition(target);

    // Create container at calculated position
    this.container = this.scene.add.container(position.x, position.y);

    // Start playback
    this.isPlaying = true;
    this.isPaused = false;
    this.currentFrameIndex = 0;
    this.frameAccumulator = 0;

    // Render first frame
    this.renderCurrentFrame();
    this.processTimingEvents();

    // Add update listener
    this.scene.events.on('update', this.update, this);

    // Return promise that resolves when animation completes
    return new Promise<void>((resolve) => {
      // For looped animations, promise never resolves
      if (this.looping) {
        // Store resolve but never call it for looped animations
        this.playResolve = undefined;
      } else {
        this.playResolve = resolve;
      }
    });
  }

  /**
   * Stop animation and cleanup
   *
   * If animation was started with play(), this will resolve the Promise early.
   */
  stop(): void {
    this.isPlaying = false;
    this.isPaused = false;

    // Remove update listener
    this.scene.events.off('update', this.update, this);

    // Destroy container
    if (this.container) {
      this.container.destroy(true);
      this.container = undefined;
    }

    // Clean up active flash timers
    for (const timer of this.activeFlashTimers) {
      timer.remove();
    }
    this.activeFlashTimers = [];

    // Clear target reference
    this.target = undefined;

    // Reset state
    this.currentFrameIndex = 0;
    this.frameAccumulator = 0;

    // Resolve promise if it exists (early stop)
    if (this.playResolve) {
      this.playResolve();
      this.playResolve = undefined;
    }
  }

  /**
   * Pause animation
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume animation
   */
  resume(): void {
    this.isPaused = false;
  }

  /**
   * Update loop - called every frame by Phaser
   */
  private update(_time: number, delta: number): void {
    if (!this.isPlaying || this.isPaused || this.animation.frames.length === 0) {
      return;
    }

    // Accumulate time (delta is in milliseconds)
    this.frameAccumulator += delta * this.playbackSpeed;

    // Default frame duration: 4 ticks (1/15 second = ~66.7ms)
    const frameDurationMs = (4 / 60) * 1000;

    // Check if we should advance to next frame
    if (this.frameAccumulator >= frameDurationMs) {
      this.frameAccumulator = 0;
      this.advanceFrame();
    }
  }

  /**
   * Advance to next frame
   */
  private advanceFrame(): void {
    this.currentFrameIndex++;

    // Check if animation completed
    if (this.currentFrameIndex >= this.animation.frames.length) {
      if (this.looping) {
        // Loop back to start
        this.currentFrameIndex = 0;
      } else {
        // Animation finished
        this.stop();

        // Call onComplete callback (for backward compatibility)
        if (this.onComplete) {
          this.onComplete();
        }

        // Resolve promise
        if (this.playResolve) {
          this.playResolve();
          this.playResolve = undefined;
        }
        return;
      }
    }

    // Render new frame
    this.renderCurrentFrame();
    this.processTimingEvents();

    // Trigger update callback
    if (this.onUpdate) {
      this.onUpdate(this.currentFrameIndex);
    }
  }

  /**
   * Render current frame sprites
   */
  private renderCurrentFrame(): void {
    if (!this.container) return;

    // Clear previous content
    this.container.removeAll(true);

    // Get current frame data
    const frame = this.animation.frames[this.currentFrameIndex];

    // Empty frames are valid (blank frames)
    if (!frame || frame.length === 0) {
      return;
    }

    // Render each cell in the frame
    for (const cell of frame) {
      if (!cell || !Array.isArray(cell) || cell.length < 8) {
        continue;
      }

      this.renderCell(cell as RMMVCellData);
    }
  }

  /**
   * Render single cell sprite
   */
  private renderCell(cell: RMMVCellData): void {
    if (!this.container) return;

    const [cellId, x, y, scale, rotation, flip, opacity, blendMode] = cell;

    // Get sprite sheet for this cell
    const sheetInfo = this.getSpriteSheetForCell(cellId);
    if (!sheetInfo) {
      return;
    }

    const { spriteKey, normalizedCellId } = sheetInfo;

    // Check if texture exists
    if (!this.scene.textures.exists(spriteKey)) {
      return;
    }

    // Get the full texture
    const texture = this.scene.textures.get(spriteKey);

    // RMMV sprite sheets are 5 columns, 192x192 cells
    const COLUMNS = 5;
    const CELL_WIDTH = 192;
    const CELL_HEIGHT = 192;

    // Calculate cell coordinates in the sprite sheet
    const cellCoords = getCellCoordinates(normalizedCellId, COLUMNS, CELL_WIDTH, CELL_HEIGHT);

    // Create a frame key for this specific cell
    const frameKey = `${spriteKey}_cell_${normalizedCellId}`;

    // Add frame to texture if not exists
    if (!texture.has(frameKey)) {
      texture.add(frameKey, 0, cellCoords.x, cellCoords.y, CELL_WIDTH, CELL_HEIGHT);
    }

    // Create sprite from the specific cell frame
    const sprite = this.scene.add.sprite(x, y, spriteKey, frameKey);

    // Apply transformations
    const finalScale = scale / 100;
    sprite.setScale(finalScale);
    sprite.setRotation((rotation * Math.PI) / 180);
    sprite.setAlpha(opacity / 255);

    // Apply flip
    if (flip) {
      sprite.setFlipX(true);
    }

    // Apply blend mode
    const blendModes = [
      Phaser.BlendModes.NORMAL,
      Phaser.BlendModes.ADD,
      Phaser.BlendModes.MULTIPLY,
      Phaser.BlendModes.SCREEN,
    ];
    sprite.setBlendMode(blendModes[blendMode] || Phaser.BlendModes.NORMAL);

    // Add to container
    this.container.add(sprite);
  }

  /**
   * Get sprite sheet info for a cell ID
   */
  private getSpriteSheetForCell(cellId: number): { spriteKey: string; normalizedCellId: number } | null {
    // Calculate which sprite sheet index (0-based)
    const sheetIndex = Math.floor(cellId / 100);
    const normalizedCellId = cellId % 100;

    // Find sprite sheet by slot
    const sheet = this.config.assets.spritesheets.find((s) => s.slot === sheetIndex + 1);
    if (!sheet) {
      return null;
    }

    return {
      spriteKey: `anim_${sheet.name}`,
      normalizedCellId,
    };
  }

  /**
   * Calculate animation position based on animation.position and target
   *
   * @param target - Animation target or position
   * @returns Position { x, y } for animation container
   */
  private calculateAnimationPosition(target?: AnimationTarget | TargetPosition): { x: number; y: number } {
    // For screen-positioned animations (position: 3), use center of screen
    if (this.animation.position === RMMVAnimationPosition.SCREEN) {
      const camera = this.scene.cameras.main;
      return {
        x: camera.centerX,
        y: camera.centerY,
      };
    }

    // If no target provided, default to center of screen
    if (!target) {
      const camera = this.scene.cameras.main;
      return {
        x: camera.centerX,
        y: camera.centerY,
      };
    }

    // Use target position
    const baseX = target.x;
    let baseY = target.y;

    // Adjust Y position based on animation.position if target has height
    if ('height' in target && typeof target.height === 'number') {
      switch (this.animation.position) {
        case RMMVAnimationPosition.HEAD:
          baseY -= target.height / 2;
          break;
        case RMMVAnimationPosition.CENTER:
          // No adjustment needed
          break;
        case RMMVAnimationPosition.FEET:
          baseY += target.height / 2;
          break;
      }
    }

    return { x: baseX, y: baseY };
  }

  /**
   * Process timing events for current frame (sound effects, flashes)
   */
  private processTimingEvents(): void {
    const timings = this.animation.timings.filter(
      (t: RMMVAnimationTiming) => t.frame === this.currentFrameIndex
    );

    for (const timing of timings) {
      // Play sound effect
      if (timing.se && timing.se.name) {
        const key = `se_${timing.se.name}`;
        if (this.scene.cache.audio.exists(key)) {
          this.scene.sound.play(key, {
            volume: (timing.se.volume || 90) / 100,
            rate: (timing.se.pitch || 100) / 100,
            detune: 0,
          });
        }
      }

      // Handle flash effects
      this.processFlashEffect(timing);
    }
  }

  /**
   * Process flash effect for a timing event
   */
  private processFlashEffect(timing: RMMVAnimationTiming): void {
    const { flashScope, flashColor, flashDuration } = timing;

    // No flash
    if (flashScope === RMMVFlashScope.NONE || flashDuration <= 0) {
      return;
    }

    // Convert RMMV flash color [R, G, B, Intensity] to Phaser tint (0xRRGGBB)
    const r = Math.floor((flashColor[0] || 0));
    const g = Math.floor((flashColor[1] || 0));
    const b = Math.floor((flashColor[2] || 0));
    const tintColor = (r << 16) | (g << 8) | b;

    // Calculate duration in milliseconds (RMMV uses 4 frames per animation frame at 15fps)
    const durationMs = (flashDuration / 4) * (1000 / 15);

    switch (flashScope) {
      case RMMVFlashScope.TARGET:
        // Flash target with tint
        if (this.target) {
          this.target.setTint(tintColor);

          const timer = this.scene.time.delayedCall(durationMs, () => {
            if (this.target) {
              this.target.clearTint();
            }
          });
          this.activeFlashTimers.push(timer);
        }
        break;

      case RMMVFlashScope.SCREEN:
        // Flash entire screen using camera
        const intensity = (flashColor[3] || 255) / 255;
        this.scene.cameras.main.flash(durationMs, r, g, b, false, undefined, intensity);
        break;

      case RMMVFlashScope.HIDE_TARGET:
        // Flash and hide target
        if (this.target) {
          this.target.setTint(tintColor);
          this.target.setVisible(false);

          const timer = this.scene.time.delayedCall(durationMs, () => {
            if (this.target) {
              this.target.clearTint();
              this.target.setVisible(true);
            }
          });
          this.activeFlashTimers.push(timer);
        }
        break;
    }
  }

  /**
   * Check if animation is currently playing
   */
  isAnimationPlaying(): boolean {
    return this.isPlaying && !this.isPaused;
  }

  /**
   * Get current frame index
   */
  getCurrentFrame(): number {
    return this.currentFrameIndex;
  }

  /**
   * Get total frame count
   */
  getFrameCount(): number {
    return this.animation.frames.length;
  }

  /**
   * Get animation duration in milliseconds (at normal speed)
   */
  getDuration(): number {
    const frameDurationMs = (4 / 60) * 1000; // Default frame duration
    return this.animation.frames.length * frameDurationMs;
  }

  /**
   * Destroy player and cleanup all resources
   */
  destroy(): void {
    this.stop();
    // Note: Scene and assets are not destroyed as they may be shared
  }
}
