/**
 * CellMoveHandle - Draggable handle for moving cells
 */

import Phaser from 'phaser';

export class CellMoveHandle extends Phaser.GameObjects.Container {
  private circle: Phaser.GameObjects.Graphics;
  private icon: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, color: number) {
    super(scene, x, y);

    // Create circle background
    this.circle = scene.add.graphics();
    this.circle.fillStyle(0xffffff, 1);
    this.circle.fillCircle(0, 0, 12);
    this.circle.lineStyle(3, color, 1);
    this.circle.strokeCircle(0, 0, 12);
    this.add(this.circle);

    // Create icon
    const colorHex = `#${color.toString(16).padStart(6, '0')}`;
    this.icon = scene.add.text(0, 0, '\uf0b2', {
      fontSize: '14px',
      color: colorHex,
      fontFamily: 'FontAwesome',
    });
    this.icon.setOrigin(0.5, 0.5);
    this.add(this.icon);

    // Make interactive
    this.setSize(24, 24);
    this.setInteractive(
      new Phaser.Geom.Circle(6, 6, 12),
      Phaser.Geom.Circle.Contains
    );

    // Add cursor feedback
    this.on('pointerover', () => {
      scene.input.setDefaultCursor('move');
    });
    this.on('pointerout', () => {
      scene.input.setDefaultCursor('default');
    });

    scene.add.existing(this);
  }
}
