/**
 * Basic Usage Example
 *
 * Demonstrates how to use the RMMV Animation SDK in a Phaser project.
 */

import Phaser from 'phaser';
import { AnimationPlayer } from '../src/sdk/player/AnimationPlayer';
import type { AnimationConfig } from '../src/sdk/player/AnimationPlayer';

/**
 * Example scene showing basic animation playback
 */
class BasicAnimationScene extends Phaser.Scene {
  private animationPlayer?: AnimationPlayer;

  constructor() {
    super({ key: 'BasicAnimationScene' });
  }

  /**
   * Phaser create method
   */
  async create() {
    // Add background
    this.cameras.main.setBackgroundColor('#1a1a1a');

    // Add title text
    this.add
      .text(400, 50, 'Click to Play Animation', {
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Load animation config
    try {
      const config: AnimationConfig = await fetch('/animations/Fireball_export.json').then((r) =>
        r.json()
      );

      // Create animation player
      this.animationPlayer = new AnimationPlayer(this, config);

      // Preload assets
      console.log('Loading animation assets...');
      await this.animationPlayer.preload();
      console.log('Assets loaded successfully!');

      // Add instruction
      this.add
        .text(400, 500, 'Click anywhere to play animation', {
          fontSize: '16px',
          color: '#888888',
        })
        .setOrigin(0.5);

      // Play animation on click
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        this.playAnimationAtPosition(pointer.x, pointer.y);
      });
    } catch (error) {
      console.error('Failed to load animation:', error);
      this.add
        .text(400, 300, 'Failed to load animation', {
          fontSize: '24px',
          color: '#ff6b6b',
        })
        .setOrigin(0.5);
    }
  }

  /**
   * Play animation at clicked position
   */
  private playAnimationAtPosition(x: number, y: number): void {
    if (!this.animationPlayer) {
      console.warn('Animation player not initialized');
      return;
    }

    console.log(`Playing animation at (${x}, ${y})`);

    this.animationPlayer.play(
      { x, y },
      {
        loop: false,
        speed: 1.0,
        onComplete: () => {
          console.log('Animation finished!');
        },
        onUpdate: (frameIndex) => {
          console.log(`Frame: ${frameIndex}/${this.animationPlayer!.getFrameCount()}`);
        },
      }
    );
  }

  /**
   * Cleanup when scene shuts down
   */
  shutdown() {
    if (this.animationPlayer) {
      this.animationPlayer.destroy();
    }
  }
}

/**
 * Phaser game configuration
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#1a1a1a',
  scene: [BasicAnimationScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false,
    },
  },
};

/**
 * Initialize Phaser game
 */
const game = new Phaser.Game(config);

export default game;
