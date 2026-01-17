/**
 * Phaser Game Configuration
 *
 * Configuration for Phaser game instance with 16:9 aspect ratio
 */

import Phaser from 'phaser';
import { PreloadScene } from './scenes/PreloadScene';
import { AnimationScene } from './scenes/AnimationScene';
import type { RMMVAnimation } from '@decky.fx/rmmv-animation-player';

/**
 * Standard 16:9 aspect ratio dimensions
 * Can be scaled to fit container while maintaining ratio
 */
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/**
 * Phaser game configuration
 */
export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'phaser-container',
  backgroundColor: '#1a1a1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [PreloadScene, AnimationScene],
  physics: {
    // No physics needed for animation preview
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
  audio: {
    // Disable automatic audio context suspension to prevent errors
    // when destroying and recreating game instances
    disableWebAudio: false,
    noAudio: false,
  },
};

/**
 * Initialize Phaser game instance with animation
 * @param animation - Animation to load and display
 * @param containerId - ID of DOM element to mount Phaser canvas
 * @returns Phaser.Game instance
 */
export function initPhaser(
  animation: RMMVAnimation,
  containerId = 'phaser-container'
): Phaser.Game {
  const config = {
    ...phaserConfig,
    parent: containerId,
  };

  const game = new Phaser.Game(config);

  // Start with PreloadScene, passing animation data
  game.scene.start('PreloadScene', { animation });

  return game;
}
