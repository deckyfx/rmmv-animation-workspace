/**
 * CellResizeHandle - Corner handle for resizing cells
 */

import Phaser from 'phaser';

export class CellResizeHandle extends Phaser.GameObjects.Container {
  private circle: Phaser.GameObjects.Graphics;
  private icon: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, color: number) {
    super(scene, x, y);

    // Create circle background
    this.circle = scene.add.graphics();
    this.circle.fillStyle(0xffffff, 1);
    this.circle.fillCircle(0, 0, 10);
    this.circle.lineStyle(3, color, 1);
    this.circle.strokeCircle(0, 0, 10);
    this.add(this.circle);

    // Create icon
    const colorHex = `#${color.toString(16).padStart(6, '0')}`;
    this.icon = scene.add.text(0, 0, '\uf31e', {
      fontSize: '12px',
      color: colorHex,
      fontFamily: 'FontAwesome',
    });
    this.icon.setOrigin(0.5, 0.5);
    this.add(this.icon);

    // Make interactive
    this.setSize(20, 20);
    this.setInteractive(
      new Phaser.Geom.Circle(5, 5, 10),
      Phaser.Geom.Circle.Contains
    );

    // Add cursor feedback
    this.on('pointerover', () => {
      scene.input.setDefaultCursor('nwse-resize');
    });
    this.on('pointerout', () => {
      scene.input.setDefaultCursor('default');
    });

    scene.add.existing(this);
  }

  updatePosition(x: number, y: number): void {
    this.setPosition(x, y);
  }
}
