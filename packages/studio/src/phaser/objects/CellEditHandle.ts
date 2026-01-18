/**
 * CellEditHandle - Edit button with clickable area
 */

import Phaser from 'phaser';

export class CellEditHandle extends Phaser.GameObjects.Container {
  private button: Phaser.GameObjects.Container;
  private hitArea: Phaser.GameObjects.Rectangle;
  private bg: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, color: number) {
    super(scene, x, y);

    // Create visual button
    this.bg = scene.add.graphics();
    this.bg.fillStyle(color, 1);
    this.bg.fillRoundedRect(-14, -14, 28, 28, 4);

    const icon = scene.add.text(-8, -10, '✎', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    });

    this.button = scene.add.container(0, 0, [this.bg, icon]);
    this.add(this.button);

    // Create invisible hit area
    this.hitArea = scene.add.rectangle(0, 0, 28, 28, 0xffffff, 0);
    this.add(this.hitArea);

    // Make interactive
    this.setSize(28, 28);
    this.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, 28, 28),
      Phaser.Geom.Rectangle.Contains
    );

    // Add cursor feedback
    this.on('pointerover', () => {
      scene.input.setDefaultCursor('pointer');
    });
    this.on('pointerout', () => {
      scene.input.setDefaultCursor('default');
    });

    scene.add.existing(this);
  }

  updateColor(color: number): void {
    this.bg.clear();
    this.bg.fillStyle(color, 1);
    this.bg.fillRoundedRect(-14, -14, 28, 28, 4);
  }
}
