/**
 * CellRotateHandle - Top handle for rotating cells
 */

import Phaser from 'phaser';

export class CellRotateHandle extends Phaser.GameObjects.Container {
  private circle: Phaser.GameObjects.Graphics;
  private icon: Phaser.GameObjects.Text;
  private line: Phaser.GameObjects.Graphics;
  private color: number;

  constructor(scene: Phaser.Scene, x: number, y: number, color: number, lineLength: number = 20) {
    super(scene, x, y);
    this.color = color;

    // Create connecting line
    this.line = scene.add.graphics();
    this.line.lineStyle(2, color, 0.6);
    this.line.lineBetween(0, lineLength, 0, 0);
    this.add(this.line);

    // Create circle background
    this.circle = scene.add.graphics();
    this.circle.fillStyle(0xffffff, 1);
    this.circle.fillCircle(0, 0, 10);
    this.circle.lineStyle(3, color, 1);
    this.circle.strokeCircle(0, 0, 10);
    this.add(this.circle);

    // Create icon
    const colorHex = `#${color.toString(16).padStart(6, '0')}`;
    this.icon = scene.add.text(0, 0, '\uf2f9', {
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
      scene.input.setDefaultCursor('grab');
    });
    this.on('pointerout', () => {
      scene.input.setDefaultCursor('default');
    });

    scene.add.existing(this);
  }

  updatePosition(x: number, y: number, lineLength: number = 20): void {
    this.setPosition(x, y);

    // Update line length
    this.line.clear();
    this.line.lineStyle(2, this.color, 0.6);
    this.line.lineBetween(0, lineLength, 0, 0);
  }
}
