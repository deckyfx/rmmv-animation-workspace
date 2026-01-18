/**
 * Asset Loader - Preloads sprite sheets before Phaser rendering
 *
 * Handles asset loading independently of Phaser scene lifecycle
 */

import type { RMMVAnimation } from '../types/rmmv';

/**
 * Preloaded asset data with HTMLImageElement
 */
export interface PreloadedAsset {
  /** Asset key/name */
  key: string;
  /** Sprite sheet filename */
  filename: string;
  /** Loaded HTMLImageElement */
  image: HTMLImageElement;
  /** Timestamp when loaded */
  loadedAt: number;
}

/**
 * Asset loader for RMMV sprite sheets
 *
 * Preloads images before passing them to Phaser
 */
export class AssetLoader {
  /** Cache of loaded assets */
  private cache: Map<string, PreloadedAsset> = new Map();

  /**
   * Load all required assets for an animation
   *
   * @param animation - Animation to load assets for
   * @returns Promise that resolves with loaded assets
   */
  async loadAnimationAssets(animation: RMMVAnimation): Promise<PreloadedAsset[]> {
    const assetsToLoad: string[] = [];

    // Collect sprite sheet names
    if (animation.animation1Name) {
      assetsToLoad.push(animation.animation1Name);
    }
    if (animation.animation2Name) {
      assetsToLoad.push(animation.animation2Name);
    }

    if (assetsToLoad.length === 0) {
      console.warn('No sprite sheets specified for animation:', animation.name);
      return [];
    }

    // Load assets in parallel
    const loadPromises = assetsToLoad.map((filename) => this.loadAsset(filename));
    const results = await Promise.allSettled(loadPromises);

    // Collect successfully loaded assets
    const loadedAssets: PreloadedAsset[] = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (!result) continue;

      if (result.status === 'fulfilled') {
        loadedAssets.push(result.value);
      } else {
        console.error(`Failed to load ${assetsToLoad[i]}:`, result.reason);
      }
    }

    return loadedAssets;
  }

  /**
   * Load a single asset (with caching)
   *
   * @param filename - Sprite sheet filename (without extension)
   * @returns Promise that resolves with loaded asset
   */
  private async loadAsset(filename: string): Promise<PreloadedAsset> {
    const key = `anim_${filename}`;

    // Check cache first
    if (this.cache.has(key)) {
      const cached = this.cache.get(key)!;
      return cached;
    }

    // Load from server
    const url = `/assets/img/animations/${filename}.png`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();

    // Create HTMLImageElement
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve();
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Failed to load image: ${filename}`));
      };
      img.src = objectUrl;
    });

    // Cache the loaded asset
    const asset: PreloadedAsset = {
      key,
      filename,
      image: img,
      loadedAt: Date.now(),
    };

    this.cache.set(key, asset);

    return asset;
  }

  /**
   * Get a cached asset
   */
  getCachedAsset(filename: string): PreloadedAsset | undefined {
    const key = `anim_${filename}`;
    return this.cache.get(key);
  }

  /**
   * Clear all cached assets
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear specific asset from cache
   */
  clearAsset(filename: string): void {
    const key = `anim_${filename}`;
    this.cache.delete(key);
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

/**
 * Global asset loader instance
 */
export const assetLoader = new AssetLoader();
