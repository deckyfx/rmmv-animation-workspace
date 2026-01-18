import Phaser from 'phaser';
import { AnimationPlayerManager } from '@decky.fx/rmmv-animation-player';
import type { AnimationConfig } from '@decky.fx/rmmv-animation-player';
import animationConfigData from './animationConfig.json';

/**
 * PreloadScene - Loads assets using AnimationPlayerManager
 */
class PreloadScene extends Phaser.Scene {
  private animationManager!: AnimationPlayerManager;

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    console.log('✅ [PreloadScene] Starting preload...');

    // Create loading text
    const { width, height } = this.cameras.main;
    const loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
      fontSize: '32px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5);

    // Initialize AnimationPlayerManager
    this.animationManager = new AnimationPlayerManager(this);
    console.log('✅ [PreloadScene] AnimationPlayerManager created');

    // Register animation config
    const animationConfig: AnimationConfig = animationConfigData as AnimationConfig;
    this.animationManager.registerAnimation(animationConfig);
    console.log('✅ [PreloadScene] Animation registered:', animationConfig.animation.name);

    // Get aggregated assets from manager
    const assets = this.animationManager.assets();
    console.log('📦 [PreloadScene] Assets to load:', {
      spritesheets: assets.spritesheets.length,
      soundEffects: assets.soundEffects.length,
    });

    // Load sprite sheets
    assets.spritesheets.forEach((sheet) => {
      console.log(`📦 [PreloadScene] Loading sprite sheet: ${sheet.key} from /${sheet.path}`);
      this.load.image(sheet.key, `/${sheet.path}`);
    });

    // Load sound effects
    assets.soundEffects.forEach((se) => {
      console.log(`🔊 [PreloadScene] Loading sound effect: ${se.key} from /${se.path}`);
      this.load.audio(se.key, [`/${se.path}`]);
    });

    // Progress events
    this.load.on('progress', (value: number) => {
      loadingText.setText(`Loading... ${Math.round(value * 100)}%`);
    });

    this.load.on('complete', () => {
      console.log('✅ [PreloadScene] All assets loaded');
    });
  }

  create(): void {
    console.log('✅ [PreloadScene] Create called, transitioning to MainScene...');

    // Pass animation manager to MainScene via registry
    this.registry.set('animationManager', this.animationManager);

    // Start MainScene
    this.scene.start('MainScene');
  }
}

/**
 * MainScene - Plays animations using AnimationPlayerManager
 */
class MainScene extends Phaser.Scene {
  private animationManager!: AnimationPlayerManager;
  private target!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    console.log('✅ [MainScene] Create called');

    // Get animation manager from registry
    this.animationManager = this.registry.get('animationManager') as AnimationPlayerManager;

    if (!this.animationManager) {
      console.error('❌ [MainScene] AnimationPlayerManager not found in registry!');
      return;
    }

    // IMPORTANT: Update scene reference to MainScene (manager was created in PreloadScene)
    this.animationManager.setScene(this);
    console.log('✅ [MainScene] AnimationPlayerManager retrieved from registry and scene updated');

    // Create background
    const { width, height } = this.cameras.main;
    this.add.rectangle(0, 0, width, height, 0x1a1a1a).setOrigin(0);

    // Create grid
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x333333, 0.3);
    const gridSize = 50;
    for (let x = 0; x <= width; x += gridSize) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += gridSize) {
      graphics.lineBetween(0, y, width, y);
    }

    // Create target (simple circle)
    this.target = this.add.graphics();
    this.target.fillStyle(0xff6b6b, 1.0);
    this.target.fillCircle(0, 0, 50);
    this.target.setPosition(width / 2, height / 2);

    // Create instructions
    this.add
      .text(width / 2, 50, 'Click "Play Animation" to test AnimationPlayerManager', {
        fontSize: '20px',
        color: '#4ecdc4',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    console.log('✅ [MainScene] Scene setup complete, ready to play animations');

    // Auto-play animation on startup
    this.time.delayedCall(500, () => {
      this.playAnimation();
    });
  }

  /**
   * Play animation using AnimationPlayerManager
   */
  async playAnimation(): Promise<void> {
    console.log('🎬 [MainScene] playAnimation() called');

    try {
      const { width, height } = this.cameras.main;

      console.log('🎬 [MainScene] Calling animationManager.play(1, ...)');
      console.log('🎬 [MainScene] Position:', { x: width / 2, y: height / 2 });
      console.log('🎬 [MainScene] AnimationManager instance:', this.animationManager);

      // Play animation at center
      const player = await this.animationManager.play(
        1, // Animation ID
        { x: width / 2, y: height / 2 }
      );

      console.log('🎬 [MainScene] play() returned:', player);

      if (player) {
        console.log('✅ [MainScene] Animation started successfully!');
        console.log('✅ [MainScene] Player instance:', player);
      } else {
        console.error('❌ [MainScene] animationManager.play() returned null');
        console.error('❌ [MainScene] Check if animation ID 1 is registered');
      }
    } catch (error) {
      console.error('❌ [MainScene] Animation failed:', error);
      if (error instanceof Error) {
        console.error('❌ [MainScene] Error message:', error.message);
        console.error('❌ [MainScene] Error stack:', error.stack);
      }
    }
  }
}

/**
 * Phaser Game Configuration
 */
export class ExampleGame extends Phaser.Game {
  constructor() {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'game-container',
      backgroundColor: '#1a1a1a',
      scene: [PreloadScene, MainScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
    };

    super(config);
    console.log('✅ [ExampleGame] Phaser game initialized');
  }
}
