/**
 * CellNameInfo - Display cell index number
 */

import Phaser from 'phaser';

export class CellNameInfo extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, index: number, color: number) {
    super(scene, x, y);

    // Create background
    this.bg = scene.add.graphics();
    this.bg.fillStyle(color, 0.9);
    this.bg.fillRoundedRect(0, 0, 40, 20, 4);
    this.add(this.bg);

    // Create text
    this.text = scene.add.text(20, 10, `#${index}`, {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Arial, sans-serif',
    });
    this.text.setOrigin(0.5);
    this.add(this.text);

    scene.add.existing(this);
  }

  updateIndex(index: number): void {
    this.text.setText(`#${index}`);
  }

  updateColor(color: number): void {
    this.bg.clear();
    this.bg.fillStyle(color, 0.9);
    this.bg.fillRoundedRect(0, 0, 40, 20, 4);
  }
}
