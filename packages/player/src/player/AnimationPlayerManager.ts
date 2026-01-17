/**
 * Animation Player Manager
 *
 * Centralized manager for multiple RMMV animations with asset preloading support.
 * Solves the asset loading problem by separating registration from playback.
 *
 * @example
 * ```typescript
 * // In Phaser scene preload
 * class GameScene extends Phaser.Scene {
 *   animationManager!: AnimationPlayerManager;
 *
 *   async preload() {
 *     this.animationManager = new AnimationPlayerManager(this);
 *
 *     // Register all animations
 *     const fireball = await fetch('/animations/fireball.json').then(r => r.json());
 *     const thunder = await fetch('/animations/thunder.json').then(r => r.json());
 *     this.animationManager.registerAnimations([fireball, thunder]);
 *
 *     // Preload ALL assets for ALL registered animations
 *     const assets = this.animationManager.assets();
 *     assets.spritesheets.forEach(sheet => {
 *       this.load.image(sheet.key, sheet.path);
 *     });
 *     assets.soundEffects.forEach(se => {
 *       this.load.audio(se.key, se.path);
 *     });
 *   }
 *
 *   create() {
 *     // Now animations play instantly (assets already loaded)
 *     this.animationManager.play(1, { x: 400, y: 300 }); // Fireball
 *     this.animationManager.play(2, { x: 200, y: 150 }); // Thunder
 *   }
 * }
 * ```
 */

import Phaser from 'phaser';
import { AnimationPlayer } from './AnimationPlayer';
import type { AnimationConfig, PlaybackOptions, TargetPosition } from './AnimationPlayer';

/**
 * Aggregated sprite sheet asset metadata
 */
export interface SpriteSheetAsset {
  /** Unique asset key for Phaser loader */
  key: string;
  /** Path to sprite sheet file */
  path: string;
  /** Hue rotation (0-360 degrees) */
  hue: number;
}

/**
 * Aggregated sound effect asset metadata
 */
export interface SoundEffectAsset {
  /** Unique asset key for Phaser loader */
  key: string;
  /** Path to sound effect file */
  path: string;
}

/**
 * Aggregated assets from all registered animations
 */
export interface AggregatedAssets {
  /** All unique sprite sheets needed */
  spritesheets: SpriteSheetAsset[];
  /** All unique sound effects needed */
  soundEffects: SoundEffectAsset[];
}

/**
 * Animation Player Manager
 *
 * Manages multiple animation configs and provides centralized asset preloading.
 *
 * **Architecture Benefits**:
 * - Separates asset loading from animation playback
 * - Deduplicates assets across animations
 * - Enables instant playback (no loading delays)
 * - Automatic player lifecycle management
 * - Memory-efficient asset aggregation
 */
export class AnimationPlayerManager {
  /** Phaser scene reference */
  private scene: Phaser.Scene;

  /** Registry of animation configs by ID */
  private configs: Map<number, AnimationConfig>;

  /** Active animation players (currently playing) */
  private activePlayers: Map<number, AnimationPlayer[]>;

  /**
   * Create animation manager
   *
   * @param scene - Phaser scene instance
   */
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.configs = new Map();
    this.activePlayers = new Map();
  }

  /**
   * Register single animation config
   *
   * Call this during initialization (before preload completes) to register
   * animations that will be available for playback.
   *
   * @param config - Animation config from export API or JSON
   */
  registerAnimation(config: AnimationConfig): void {
    const id = config.animation.id;
    if (this.configs.has(id)) {
      console.warn(`Animation ${id} already registered, overwriting`);
    }
    this.configs.set(id, config);
  }

  /**
   * Register multiple animation configs at once
   *
   * Convenience method for bulk registration.
   *
   * @param configs - Array of animation configs
   */
  registerAnimations(configs: AnimationConfig[]): void {
    configs.forEach(config => this.registerAnimation(config));
  }

  /**
   * Unregister animation config
   *
   * Removes animation from registry. Does not affect currently playing instances.
   *
   * @param animationId - Animation ID to unregister
   * @returns True if animation was registered and removed
   */
  unregisterAnimation(animationId: number): boolean {
    return this.configs.delete(animationId);
  }

  /**
   * Get aggregated assets from all registered animations
   *
   * Call this in Phaser's preload phase to get all unique assets that need
   * to be loaded for registered animations.
   *
   * **Deduplication**: Assets are deduplicated by name across all configs.
   *
   * @returns Aggregated sprite sheets and sound effects
   *
   * @example
   * ```typescript
   * preload() {
   *   const assets = this.animationManager.assets();
   *
   *   // Load sprite sheets
   *   assets.spritesheets.forEach(sheet => {
   *     this.load.image(sheet.key, sheet.path);
   *   });
   *
   *   // Load sound effects
   *   assets.soundEffects.forEach(se => {
   *     this.load.audio(se.key, se.path);
   *   });
   * }
   * ```
   */
  assets(): AggregatedAssets {
    const spritesheets = new Map<string, SpriteSheetAsset>();
    const soundEffects = new Map<string, SoundEffectAsset>();

    // Aggregate assets from all configs
    for (const config of this.configs.values()) {
      // Collect sprite sheets
      for (const sheet of config.assets.spritesheets) {
        if (!spritesheets.has(sheet.name)) {
          spritesheets.set(sheet.name, {
            key: sheet.name,
            path: sheet.path,
            hue: sheet.hue,
          });
        }
      }

      // Collect sound effects
      for (const se of config.assets.soundEffects) {
        if (!soundEffects.has(se.name)) {
          soundEffects.set(se.name, {
            key: se.name,
            path: se.path,
          });
        }
      }
    }

    return {
      spritesheets: Array.from(spritesheets.values()),
      soundEffects: Array.from(soundEffects.values()),
    };
  }

  /**
   * Play animation by ID
   *
   * Creates AnimationPlayer instance and plays animation immediately.
   * Returns a Promise that resolves when animation completes.
   *
   * **Prerequisite**: Assets must be preloaded via `assets()` method.
   * **Automatic Cleanup**: Player is destroyed when animation completes.
   *
   * @param animationId - Animation ID from registered config
   * @param position - Target position for animation
   * @param options - Playback options (loop, speed, callbacks)
   * @returns Promise that resolves with AnimationPlayer when animation completes, or null if config not found
   *
   * @example
   * ```typescript
   * // Await animation completion
   * const player = await this.animationManager.play(1, { x: enemy.x, y: enemy.y });
   * console.log('Animation finished!');
   *
   * // Chain animations sequentially
   * await this.animationManager.play(1, { x: 400, y: 300 });
   * await this.animationManager.play(2, { x: 400, y: 300 });
   *
   * // Play multiple animations in parallel
   * await Promise.all([
   *   this.animationManager.play(1, { x: 100, y: 100 }),
   *   this.animationManager.play(2, { x: 200, y: 200 }),
   *   this.animationManager.play(3, { x: 300, y: 300 }),
   * ]);
   * ```
   */
  async play(
    animationId: number,
    position: TargetPosition,
    options?: PlaybackOptions
  ): Promise<AnimationPlayer | null> {
    const config = this.configs.get(animationId);
    if (!config) {
      console.warn(`[AnimationPlayerManager] Animation config not found: ${animationId}`);
      return null;
    }

    // Create player for this animation
    const player = new AnimationPlayer(this.scene, config);

    // Track active player
    if (!this.activePlayers.has(animationId)) {
      this.activePlayers.set(animationId, []);
    }
    this.activePlayers.get(animationId)!.push(player);

    // Cleanup function
    const cleanup = () => {
      // Remove from active players
      const players = this.activePlayers.get(animationId);
      if (players) {
        const index = players.indexOf(player);
        if (index !== -1) {
          players.splice(index, 1);
        }
        if (players.length === 0) {
          this.activePlayers.delete(animationId);
        }
      }

      // Destroy player
      player.destroy();
    };

    // Wrap onComplete to include cleanup
    const originalOnComplete = options?.onComplete;
    const wrappedOptions: PlaybackOptions = {
      ...options,
      onComplete: () => {
        cleanup();
        originalOnComplete?.();
      },
    };

    // Play animation and await completion
    try {
      await player.play(position, wrappedOptions);
    } catch (error) {
      // Cleanup on error
      cleanup();
      throw error;
    }

    return player;
  }

  /**
   * Stop all active animations
   *
   * Stops and destroys all currently playing animation instances.
   */
  stopAll(): void {
    for (const players of this.activePlayers.values()) {
      for (const player of players) {
        player.stop();
        player.destroy();
      }
    }
    this.activePlayers.clear();
  }

  /**
   * Stop all instances of specific animation
   *
   * @param animationId - Animation ID to stop
   */
  stop(animationId: number): void {
    const players = this.activePlayers.get(animationId);
    if (players) {
      for (const player of players) {
        player.stop();
        player.destroy();
      }
      this.activePlayers.delete(animationId);
    }
  }

  /**
   * Get active player count for specific animation
   *
   * @param animationId - Animation ID
   * @returns Number of active instances
   */
  getActiveCount(animationId: number): number {
    return this.activePlayers.get(animationId)?.length ?? 0;
  }

  /**
   * Get total active player count across all animations
   *
   * @returns Total number of active animation instances
   */
  getTotalActiveCount(): number {
    let total = 0;
    for (const players of this.activePlayers.values()) {
      total += players.length;
    }
    return total;
  }

  /**
   * Check if animation is registered
   *
   * @param animationId - Animation ID to check
   * @returns True if animation config is registered
   */
  isRegistered(animationId: number): boolean {
    return this.configs.has(animationId);
  }

  /**
   * Get registered animation IDs
   *
   * @returns Array of registered animation IDs
   */
  getRegisteredIds(): number[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Destroy manager and clean up all resources
   *
   * Stops all active animations and clears registry.
   * Call this in scene shutdown.
   */
  destroy(): void {
    this.stopAll();
    this.configs.clear();
  }
}
