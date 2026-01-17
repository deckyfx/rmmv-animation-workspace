/**
 * Combat System Example
 *
 * Demonstrates using RMMV animations in an RPG-style combat system.
 */

import Phaser from 'phaser';
import { AnimationPlayer } from '../src/sdk/player/AnimationPlayer';
import type { AnimationConfig } from '../src/sdk/player/AnimationPlayer';

/**
 * Simple actor class (player or enemy)
 */
class Actor {
  public sprite: Phaser.GameObjects.Sprite;
  public hp: number;
  public maxHp: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    hp: number
  ) {
    this.sprite = scene.add.sprite(x, y, texture);
    this.hp = hp;
    this.maxHp = hp;
  }

  takeDamage(amount: number): boolean {
    this.hp = Math.max(0, this.hp - amount);
    return this.hp === 0;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }
}

/**
 * Combat scene with RMMV animations
 */
class CombatScene extends Phaser.Scene {
  private player?: Actor;
  private enemy?: Actor;
  private animations: Map<string, AnimationConfig> = new Map();
  private currentPlayer?: AnimationPlayer;

  constructor() {
    super({ key: 'CombatScene' });
  }

  preload() {
    // Load actor sprites (placeholder - replace with actual assets)
    this.load.image('hero', 'assets/sprites/hero.png');
    this.load.image('enemy', 'assets/sprites/enemy.png');
  }

  async create() {
    // Setup background
    this.cameras.main.setBackgroundColor('#2a2a2a');

    // Create actors
    this.player = new Actor(this, 200, 300, 'hero', 100);
    this.enemy = new Actor(this, 600, 300, 'enemy', 80);

    // Load animation configs
    await this.loadAnimations();

    // Add UI
    this.createUI();

    // Add combat controls
    this.addCombatControls();
  }

  /**
   * Load all combat animations
   */
  private async loadAnimations() {
    const animationNames = ['Slash', 'Fireball', 'Heal', 'Lightning'];

    for (const name of animationNames) {
      try {
        const config: AnimationConfig = await fetch(
          `/animations/${name}_export.json`
        ).then((r) => r.json());

        this.animations.set(name, config);
        console.log(`Loaded animation: ${name}`);
      } catch (error) {
        console.warn(`Failed to load animation ${name}:`, error);
      }
    }
  }

  /**
   * Create UI elements
   */
  private createUI() {
    // Title
    this.add
      .text(400, 30, 'RPG Combat System', {
        fontSize: '28px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // HP bars
    this.add
      .text(200, 360, `HP: ${this.player!.hp}/${this.player!.maxHp}`, {
        fontSize: '16px',
        color: '#4caf50',
      })
      .setOrigin(0.5);

    this.add
      .text(600, 360, `HP: ${this.enemy!.hp}/${this.enemy!.maxHp}`, {
        fontSize: '16px',
        color: '#ff6b6b',
      })
      .setOrigin(0.5);
  }

  /**
   * Add combat action buttons
   */
  private addCombatControls() {
    const actions = [
      { name: 'Slash', key: '1', damage: 25 },
      { name: 'Fireball', key: '2', damage: 35 },
      { name: 'Lightning', key: '3', damage: 30 },
      { name: 'Heal', key: '4', damage: -20 },
    ];

    let yOffset = 450;

    for (const action of actions) {
      const button = this.add
        .text(100, yOffset, `[${action.key}] ${action.name}`, {
          fontSize: '18px',
          color: '#6495ed',
          backgroundColor: '#2a2a2a',
          padding: { x: 10, y: 5 },
        })
        .setInteractive()
        .on('pointerdown', () => this.performAction(action.name, action.damage))
        .on('pointerover', function (this: Phaser.GameObjects.Text) {
          this.setColor('#ffffff');
        })
        .on('pointerout', function (this: Phaser.GameObjects.Text) {
          this.setColor('#6495ed');
        });

      // Keyboard shortcuts
      this.input.keyboard?.on(`keydown-${action.key}`, () =>
        this.performAction(action.name, action.damage)
      );

      yOffset += 35;
    }
  }

  /**
   * Perform combat action with animation
   */
  private async performAction(animationName: string, damage: number) {
    if (!this.animations.has(animationName)) {
      console.warn(`Animation ${animationName} not loaded`);
      return;
    }

    if (!this.player || !this.enemy) {
      return;
    }

    // Get target position
    const target = animationName === 'Heal'
      ? this.player.getPosition()
      : this.enemy.getPosition();

    // Create animation player
    const config = this.animations.get(animationName)!;
    this.currentPlayer = new AnimationPlayer(this, config);

    try {
      // Preload assets
      await this.currentPlayer.preload();

      // Play animation
      this.currentPlayer.play(target, {
        loop: false,
        speed: 1.0,
        onComplete: () => {
          // Apply damage/healing when animation completes
          if (animationName === 'Heal') {
            this.healPlayer(Math.abs(damage));
          } else {
            this.damageEnemy(damage);
          }

          // Cleanup
          this.currentPlayer?.destroy();
          this.currentPlayer = undefined;
        },
      });
    } catch (error) {
      console.error('Failed to play animation:', error);
      this.currentPlayer?.destroy();
      this.currentPlayer = undefined;
    }
  }

  /**
   * Damage enemy and check for defeat
   */
  private damageEnemy(amount: number) {
    if (!this.enemy) return;

    const defeated = this.enemy.takeDamage(amount);

    // Flash enemy sprite
    this.tweens.add({
      targets: this.enemy.sprite,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 2,
    });

    // Update HP display
    this.updateHPDisplay();

    if (defeated) {
      this.enemyDefeated();
    } else {
      // Enemy counter-attack after delay
      this.time.delayedCall(1000, () => this.enemyCounterAttack());
    }
  }

  /**
   * Heal player
   */
  private healPlayer(amount: number) {
    if (!this.player) return;

    this.player.hp = Math.min(this.player.maxHp, this.player.hp + amount);

    // Healing effect
    this.tweens.add({
      targets: this.player.sprite,
      tint: 0x00ff00,
      duration: 200,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.player!.sprite.clearTint();
      },
    });

    this.updateHPDisplay();
  }

  /**
   * Enemy counter-attack
   */
  private async enemyCounterAttack() {
    if (!this.player || !this.enemy || this.enemy.hp === 0) return;

    console.log('Enemy attacks!');

    // Play enemy attack animation (if available)
    if (this.animations.has('Slash')) {
      const config = this.animations.get('Slash')!;
      const attackPlayer = new AnimationPlayer(this, config);

      await attackPlayer.preload();

      attackPlayer.play(this.player.getPosition(), {
        loop: false,
        onComplete: () => {
          // Damage player
          this.player!.takeDamage(15);

          // Flash player sprite
          this.tweens.add({
            targets: this.player!.sprite,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 2,
          });

          this.updateHPDisplay();

          // Check if player defeated
          if (this.player!.hp === 0) {
            this.playerDefeated();
          }

          attackPlayer.destroy();
        },
      });
    }
  }

  /**
   * Update HP display
   */
  private updateHPDisplay() {
    // Remove old HP texts and recreate
    // (In a real game, you'd update existing text objects)
    this.children.list
      .filter((obj) => obj instanceof Phaser.GameObjects.Text)
      .forEach((text) => {
        const t = text as Phaser.GameObjects.Text;
        if (t.text.startsWith('HP:')) {
          t.destroy();
        }
      });

    // Recreate HP displays
    this.add
      .text(200, 360, `HP: ${this.player!.hp}/${this.player!.maxHp}`, {
        fontSize: '16px',
        color: '#4caf50',
      })
      .setOrigin(0.5);

    this.add
      .text(600, 360, `HP: ${this.enemy!.hp}/${this.enemy!.maxHp}`, {
        fontSize: '16px',
        color: '#ff6b6b',
      })
      .setOrigin(0.5);
  }

  /**
   * Handle enemy defeat
   */
  private enemyDefeated() {
    console.log('Enemy defeated!');

    // Victory animation
    this.tweens.add({
      targets: this.enemy!.sprite,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        this.add
          .text(400, 300, 'VICTORY!', {
            fontSize: '48px',
            color: '#ffd700',
          })
          .setOrigin(0.5);
      },
    });
  }

  /**
   * Handle player defeat
   */
  private playerDefeated() {
    console.log('Player defeated!');

    // Game over
    this.tweens.add({
      targets: this.player!.sprite,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        this.add
          .text(400, 300, 'GAME OVER', {
            fontSize: '48px',
            color: '#ff6b6b',
          })
          .setOrigin(0.5);
      },
    });
  }

  /**
   * Cleanup
   */
  shutdown() {
    if (this.currentPlayer) {
      this.currentPlayer.destroy();
    }
  }
}

/**
 * Game configuration
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#2a2a2a',
  scene: [CombatScene],
};

/**
 * Initialize game
 */
const game = new Phaser.Game(config);

export default game;
