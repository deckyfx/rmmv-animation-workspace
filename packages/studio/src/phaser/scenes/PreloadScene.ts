/**
 * Preload Scene - Loads assets for selected animation
 *
 * This scene is created fresh for each animation selection.
 * It loads the required sprite sheets, then transitions to AnimationScene.
 */

import Phaser from 'phaser';
import type { RMMVAnimation } from '@decky.fx/rmmv-animation-player';

export interface PreloadSceneData {
  animation: RMMVAnimation;
}

/**
 * Preload scene for loading animation assets
 */
export class PreloadScene extends Phaser.Scene {
  private animation!: RMMVAnimation;
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'PreloadScene' });
  }

  /**
   * Initialize with animation data
   */
  init(data: PreloadSceneData): void {
    this.animation = data.animation;
  }

  /**
   * Preload animation assets
   */
  preload(): void {
    const { width, height } = this.cameras.main;

    // Create loading bar background
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);

    // Create loading bar
    this.progressBar = this.add.graphics();

    // Create loading text
    this.loadingText = this.add.text(width / 2, height / 2 - 60, 'Loading Assets...', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
    });
    this.loadingText.setOrigin(0.5);

    // Create percentage text
    const percentText = this.add.text(width / 2, height / 2 - 5, '0%', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
    });
    percentText.setOrigin(0.5);

    // Load sprite sheets for this animation
    this.load.setPath('/assets/img/animations');

    const assetsToLoad: string[] = [];
    if (this.animation.animation1Name) {
      assetsToLoad.push(this.animation.animation1Name);
    }
    if (this.animation.animation2Name) {
      assetsToLoad.push(this.animation.animation2Name);
    }

    for (const filename of assetsToLoad) {
      const key = `anim_${filename}`;
      this.load.image(key, `${filename}.png`);
    }

    // Load sound effects from timing events
    this.load.setPath('/assets/se');

    if (this.animation.timings && this.animation.timings.length > 0) {
      // Extract unique SE names from timing events
      const seNames = new Set<string>();
      for (const timing of this.animation.timings) {
        if (timing.se && timing.se.name && timing.se.name !== '') {
          seNames.add(timing.se.name);
        }
      }

      // Load each SE (try both .ogg and .m4a formats)
      for (const seName of seNames) {
        const key = `se_${seName}`;
        this.load.audio(key, [`${seName}.ogg`, `${seName}.m4a`]);
      }
    }

    // Setup load progress
    this.load.on('progress', (progress: number) => {
      // Update progress bar
      this.progressBar.clear();
      this.progressBar.fillStyle(0x4a9eff, 1);
      this.progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * progress, 30);

      // Update percentage text
      percentText.setText(`${Math.round(progress * 100)}%`);
    });

    // Log loading errors
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error(`[PreloadScene] Failed to load: ${file.key} - ${file.url}`);
    });
  }

  /**
   * Create scene and transition to AnimationScene
   */
  create(): void {
    // Start AnimationScene with the animation data
    this.scene.start('AnimationScene', { animation: this.animation });
  }
}
