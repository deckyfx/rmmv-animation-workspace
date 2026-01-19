# @decky.fx/rmmv-animation-player

[![npm version](https://img.shields.io/npm/v/@decky.fx/rmmv-animation-player.svg)](https://www.npmjs.com/package/@decky.fx/rmmv-animation-player)
[![npm downloads](https://img.shields.io/npm/dm/@decky.fx/rmmv-animation-player.svg)](https://www.npmjs.com/package/@decky.fx/rmmv-animation-player)
[![license](https://img.shields.io/npm/l/@decky.fx/rmmv-animation-player.svg)](https://github.com/decky-fx/rmmv-animation-studio/blob/main/LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@decky.fx/rmmv-animation-player)](https://bundlephobia.com/package/@decky.fx/rmmv-animation-player)

Standalone animation player for RPG Maker MV animations in Phaser 3 projects.

## Overview

The RMMV Animation Player allows you to play RPG Maker MV animations in any Phaser 3 project using exported animation configs from [@decky.fx/rmmv-animation-studio](../studio). It's completely self-contained and framework-agnostic.

## Installation

### NPM

```bash
npm install @decky.fx/rmmv-animation-player
```

### Bun

```bash
bun add @decky.fx/rmmv-animation-player
```

### Yarn

```bash
yarn add @decky.fx/rmmv-animation-player
```

## Quick Start

### Recommended: Using AnimationPlayerManager

The **AnimationPlayerManager** is the recommended approach for production games. It separates asset preloading from animation playback, preventing loading delays during gameplay.

```typescript
import Phaser from 'phaser';
import { AnimationPlayerManager } from '@decky.fx/rmmv-animation-player';
import type { AnimationConfig } from '@decky.fx/rmmv-animation-player';

class GameScene extends Phaser.Scene {
  private animationManager!: AnimationPlayerManager;

  constructor() {
    super('GameScene');
  }

  async preload() {
    // 1. Create manager
    this.animationManager = new AnimationPlayerManager(this);

    // 2. Load and register animation configs
    const fireball: AnimationConfig = await fetch('/animations/Fireball.json').then(r => r.json());
    const thunder: AnimationConfig = await fetch('/animations/Thunder.json').then(r => r.json());
    const heal: AnimationConfig = await fetch('/animations/Heal.json').then(r => r.json());

    this.animationManager.registerAnimations([fireball, thunder, heal]);

    // 3. Get aggregated assets and preload ALL at once
    const assets = this.animationManager.assets();

    // Preload sprite sheets
    assets.spritesheets.forEach(sheet => {
      this.load.image(sheet.key, sheet.path);
    });

    // Preload sound effects
    assets.soundEffects.forEach(se => {
      this.load.audio(se.key, se.path);
    });
  }

  async create() {
    // 4. Play animations instantly (assets already loaded!)
    // No loading delays during gameplay!

    // Await animation completion
    await this.animationManager.play(1, { x: 400, y: 300 });
    console.log('Fireball finished!');

    // Chain animations sequentially
    await this.animationManager.play(2, { x: 400, y: 300 }); // Thunder
    await this.animationManager.play(3, { x: 100, y: 100 }); // Heal

    // Or play multiple in parallel
    await Promise.all([
      this.animationManager.play(1, { x: 100, y: 100 }),
      this.animationManager.play(2, { x: 200, y: 200 }),
      this.animationManager.play(3, { x: 300, y: 300 }),
    ]);
  }

  shutdown() {
    // Clean up on scene shutdown
    this.animationManager.destroy();
  }
}
```

**Benefits:**
- ✅ All assets preloaded in Phaser's preload phase
- ✅ Instant playback with no loading delays
- ✅ Automatic asset deduplication across animations
- ✅ Play by ID - simple and intuitive
- ✅ Automatic player lifecycle management

### Alternative: Using AnimationPlayer Directly

For simpler use cases or single animations, you can use `AnimationPlayer` directly:

```typescript
import Phaser from 'phaser';
import { AnimationPlayer } from '@decky.fx/rmmv-animation-player';
import type { AnimationConfig } from '@decky.fx/rmmv-animation-player';

class GameScene extends Phaser.Scene {
  private player?: AnimationPlayer;

  async create() {
    // Load animation config
    const config: AnimationConfig = await fetch('/animations/Fireball_export.json')
      .then(r => r.json());

    // Create player
    this.player = new AnimationPlayer(this, config);

    // Preload assets (happens here, may cause delay)
    await this.player.preload();

    // Play animation at position and await completion
    await this.player.play(
      { x: 400, y: 300 },
      {
        loop: false,
        speed: 1.0,
        onUpdate: (frame) => console.log(`Frame ${frame}`),
      }
    );

    console.log('Animation finished!');
  }
}
```

## API Reference

### AnimationPlayer

Main class for playing RMMV animations.

#### Constructor

```typescript
new AnimationPlayer(scene: Phaser.Scene, config: AnimationConfig)
```

**Parameters:**
- `scene` - Phaser scene to render animation in
- `config` - Animation configuration from export

#### Methods

##### preload()

Preload all required assets (sprite sheets and sound effects).

```typescript
await player.preload(): Promise<void>
```

**Must be called before playing the animation.**

##### play()

Play animation at target position or on an animation target. Returns a Promise that resolves when animation completes.

```typescript
player.play(target: AnimationTarget | TargetPosition, options?: PlaybackOptions): Promise<void>
```

**Parameters:**
- `target` - Animation target object or position:
  - `AnimationTarget` - Any object implementing the AnimationTarget interface (supports flash effects)
  - `TargetPosition` - Simple position object `{ x: number, y: number }`
- `options` - Playback options:
  - `loop?: boolean` - Loop animation continuously (default: false)
  - `speed?: number` - Playback speed multiplier (default: 1.0)
  - `onComplete?: () => void` - Callback when animation finishes (optional, can use Promise instead)
  - `onUpdate?: (frameIndex: number) => void` - Called each frame

**Returns:** Promise that resolves when animation completes (does not resolve for looped animations)

**Examples:**

```typescript
// Play at position (no flash effects)
await player.play({ x: 400, y: 300 }, {
  loop: false,
  speed: 1.5,
  onUpdate: (frame) => console.log(`Frame ${frame}`),
});

// Play on target sprite (supports flash effects)
const enemy = this.add.sprite(400, 300, 'enemy');
await player.play(enemy, {
  loop: false,
  onComplete: () => console.log('Hit!'),
});

// Chain animations on same target
await player.play(enemy);
await anotherPlayer.play(enemy);
```

##### stop()

Stop animation and cleanup.

```typescript
player.stop(): void
```

##### pause()

Pause animation.

```typescript
player.pause(): void
```

##### resume()

Resume paused animation.

```typescript
player.resume(): void
```

##### isAnimationPlaying()

Check if animation is currently playing.

```typescript
player.isAnimationPlaying(): boolean
```

##### getCurrentFrame()

Get current frame index.

```typescript
player.getCurrentFrame(): number
```

##### getFrameCount()

Get total frame count.

```typescript
player.getFrameCount(): number
```

##### getDuration()

Get animation duration in milliseconds (at normal speed).

```typescript
player.getDuration(): number
```

##### destroy()

Destroy player and cleanup resources.

```typescript
player.destroy(): void
```

### AnimationPlayerManager

Centralized manager for multiple animations with asset preloading support. **Recommended for production games.**

#### Constructor

```typescript
new AnimationPlayerManager(scene: Phaser.Scene)
```

**Parameters:**
- `scene` - Phaser scene instance

#### Methods

##### registerAnimation()

Register single animation config.

```typescript
manager.registerAnimation(config: AnimationConfig): void
```

**Example:**
```typescript
const fireball = await fetch('/animations/Fireball.json').then(r => r.json());
manager.registerAnimation(fireball);
```

##### registerAnimations()

Register multiple animation configs at once.

```typescript
manager.registerAnimations(configs: AnimationConfig[]): void
```

**Example:**
```typescript
const configs = await Promise.all([
  fetch('/animations/Fireball.json').then(r => r.json()),
  fetch('/animations/Thunder.json').then(r => r.json()),
]);
manager.registerAnimations(configs);
```

##### assets()

Get aggregated assets from all registered animations for preloading.

```typescript
manager.assets(): AggregatedAssets
```

**Returns:**
```typescript
{
  spritesheets: Array<{ key: string; path: string; hue: number }>;
  soundEffects: Array<{ key: string; path: string }>;
}
```

**Example:**
```typescript
const assets = manager.assets();

// In Phaser preload
assets.spritesheets.forEach(sheet => {
  this.load.image(sheet.key, sheet.path);
});

assets.soundEffects.forEach(se => {
  this.load.audio(se.key, se.path);
});
```

##### play()

Play animation by ID. Returns a Promise that resolves when animation completes.

```typescript
manager.play(
  animationId: number,
  position: TargetPosition,
  options?: PlaybackOptions
): Promise<AnimationPlayer | null>
```

**Parameters:**
- `animationId` - Animation ID from registered config
- `position` - Target position `{ x: number, y: number }`
- `options` - Same as AnimationPlayer options

**Returns:** Promise that resolves with AnimationPlayer instance when complete, or null if not found

**Example:**
```typescript
// Await animation completion
const player = await manager.play(1, { x: enemy.x, y: enemy.y });
console.log('Animation finished!');

// Chain animations sequentially
await manager.play(1, { x: 400, y: 300 });
await manager.play(2, { x: 400, y: 300 });

// Play multiple in parallel
await Promise.all([
  manager.play(1, { x: 100, y: 100 }),
  manager.play(2, { x: 200, y: 200 }),
  manager.play(3, { x: 300, y: 300 }),
]);
```

##### stop()

Stop all instances of specific animation.

```typescript
manager.stop(animationId: number): void
```

##### stopAll()

Stop all active animations.

```typescript
manager.stopAll(): void
```

##### unregisterAnimation()

Unregister animation config.

```typescript
manager.unregisterAnimation(animationId: number): boolean
```

**Returns:** True if animation was registered and removed

##### isRegistered()

Check if animation is registered.

```typescript
manager.isRegistered(animationId: number): boolean
```

##### getRegisteredIds()

Get array of registered animation IDs.

```typescript
manager.getRegisteredIds(): number[]
```

##### getActiveCount()

Get active player count for specific animation.

```typescript
manager.getActiveCount(animationId: number): number
```

##### getTotalActiveCount()

Get total active player count across all animations.

```typescript
manager.getTotalActiveCount(): number
```

##### destroy()

Destroy manager and cleanup all resources.

```typescript
manager.destroy(): void
```

## Advanced Usage

### Flash Effects

RMMV animations support flash effects for visual impact during battle animations. The player supports three types of flash effects:

#### Flash Scopes

- **TARGET (flashScope: 1)** - Tint the animation target with a color
- **SCREEN (flashScope: 2)** - Flash the entire screen
- **HIDE_TARGET (flashScope: 3)** - Tint and hide the target, then restore

#### AnimationTarget Interface

To use TARGET and HIDE_TARGET flash effects, pass an object implementing the `AnimationTarget` interface to `play()`:

```typescript
interface AnimationTarget {
  x: number;                        // X position
  y: number;                        // Y position
  width: number;                    // Width (for positioning)
  height: number;                   // Height (for positioning)
  setTint(color: number): void;     // Apply tint (0xRRGGBB format)
  clearTint(): void;                // Remove tint
  setVisible(visible: boolean): void; // Show/hide target
}
```

Phaser.GameObjects.GameObject (sprites, containers, etc.) naturally implements this interface:

```typescript
// Flash effects work automatically with Phaser sprites
const enemy = this.add.sprite(400, 300, 'enemy');

// Animation will apply flash effects (tinting, hiding) to the sprite
await player.play(enemy);
```

#### Custom Animation Targets

You can create custom objects that implement the interface:

```typescript
class CustomTarget implements AnimationTarget {
  x = 400;
  y = 300;
  width = 64;
  height = 64;

  setTint(color: number): void {
    console.log('Tinted with color:', color.toString(16));
    // Apply tint to your custom rendering
  }

  clearTint(): void {
    console.log('Tint cleared');
    // Remove tint from your custom rendering
  }

  setVisible(visible: boolean): void {
    console.log('Visibility:', visible);
    // Show/hide your custom object
  }
}

const target = new CustomTarget();
await player.play(target);
```

#### Flash Effect Timing

Flash effects are configured in animation timing events:
- **flashDuration**: Duration in animation frames (not milliseconds)
- **flashColor**: `[R, G, B, Intensity]` where each value is 0-255

Example: A flash with duration 5 will tint the target for 5 animation frames, then automatically clear.

### Multiple Animations

Play multiple animations simultaneously:

```typescript
class GameScene extends Phaser.Scene {
  private players: AnimationPlayer[] = [];

  async create() {
    // Load multiple animation configs
    const configs = await Promise.all([
      fetch('/animations/Fireball_export.json').then(r => r.json()),
      fetch('/animations/Lightning_export.json').then(r => r.json()),
      fetch('/animations/Heal_export.json').then(r => r.json()),
    ]);

    // Create players
    for (const config of configs) {
      const player = new AnimationPlayer(this, config);
      await player.preload();
      this.players.push(player);
    }

    // Play first animation
    this.players[0].play({ x: 400, y: 300 }, {
      onComplete: () => {
        // Play second animation when first finishes
        this.players[1].play({ x: 500, y: 300 });
      }
    });
  }

  shutdown() {
    // Cleanup all players
    this.players.forEach(p => p.destroy());
  }
}
```

### Chaining Animations

```typescript
async playSequence(animations: AnimationConfig[], position: TargetPosition) {
  for (const config of animations) {
    const player = new AnimationPlayer(this.scene, config);
    await player.preload();

    await new Promise<void>((resolve) => {
      player.play(position, {
        onComplete: () => {
          player.destroy();
          resolve();
        },
      });
    });
  }
}
```

### Dynamic Positioning

Play animation on moving targets:

```typescript
class GameScene extends Phaser.Scene {
  private enemy?: Phaser.GameObjects.Sprite;
  private player?: AnimationPlayer;

  async attackEnemy() {
    // Get enemy position
    const target = {
      x: this.enemy!.x,
      y: this.enemy!.y,
    };

    // Play attack animation at enemy position
    const config = await fetch('/animations/Slash_export.json').then(r => r.json());
    this.player = new AnimationPlayer(this, config);
    await this.player.preload();

    this.player.play(target, {
      onComplete: () => {
        // Damage enemy when animation finishes
        this.damageEnemy();
      },
    });
  }
}
```

### Custom Playback Speed

```typescript
// Slow motion (50% speed)
player.play({ x: 400, y: 300 }, { speed: 0.5 });

// Fast forward (2x speed)
player.play({ x: 400, y: 300 }, { speed: 2.0 });

// Very slow (25% speed)
player.play({ x: 400, y: 300 }, { speed: 0.25 });
```

### Looping Animations

```typescript
// Loop continuously
player.play({ x: 400, y: 300 }, { loop: true });

// Stop after 5 seconds
setTimeout(() => player.stop(), 5000);
```

## Export Format

Exported animation configs have this structure:

```typescript
interface AnimationConfig {
  // Animation data
  animation: {
    id: number;
    name: string;
    position: number; // 0=head, 1=center, 2=feet, 3=screen
    animation1Name: string;
    animation1Hue: number;
    animation2Name: string;
    animation2Hue: number;
    frames: Array<Array<[cellId, x, y, scale, rotation, flip, opacity, blendMode]>>;
    timings: Array<{
      frame: number;
      se: { name: string; volume: number; pitch: number; pan: number } | null;
      flashScope: number;
      flashColor: [number, number, number, number];
      flashDuration: number;
    }>;
  };

  // Required assets (relative paths)
  assets: {
    spritesheets: Array<{
      name: string;
      path: string; // e.g., "assets/img/animations/Hit1.png"
      hue: number;
      slot: number; // 1 or 2
    }>;
    soundEffects: Array<{
      name: string;
      path: string; // e.g., "assets/se/Blow1.ogg"
    }>;
  };

  // Metadata
  metadata: {
    exportedAt: string; // ISO timestamp
    exportedFrom: string; // "RMMV Animation Studio"
    version: string; // "1.0.0"
    animationId: number;
    animationName: string;
  };
}
```

## Asset Requirements

### Sprite Sheets

- Format: PNG images
- Cell size: 192×192 pixels
- Layout: 5 columns (RMMV standard)
- Path: Specified in export config (e.g., `assets/img/animations/`)

### Sound Effects

- Format: OGG audio files
- Path: Specified in export config (e.g., `assets/se/`)
- Properties: volume (0-100), pitch (10-200), pan (-100 to 100)

## Features

### Supported RMMV Features

[x] Multiple sprite sheets (animation1/animation2)
[x] Cell transformations (position, scale, rotation, flip)
[x] Opacity and blend modes (normal, additive, multiply, screen)
[x] Sound effects with volume/pitch/pan control
[x] Timing events
[x] Looping animations
[x] Playback speed control
[x] Frame-by-frame callbacks

### Not Yet Implemented

[] Screen flash effects (timing.flashScope, flashColor, flashDuration)
[] Hue shift for sprite sheets (animation1Hue, animation2Hue)
[] Position modes (head/center/feet/screen) - currently manual positioning

## Troubleshooting

### Assets Not Loading

**Problem:** Animation plays but sprites are invisible.

**Solution:**
- Verify asset paths in export config match your project structure
- Ensure sprite sheets are accessible from your web server
- Check browser console for 404 errors

```typescript
// Adjust base path if needed
const config = await fetch('/animations/MyAnimation_export.json').then(r => r.json());

// Update asset paths to match your structure
config.assets.spritesheets.forEach(sheet => {
  sheet.path = `/my-custom-path/${sheet.name}.png`;
});

const player = new AnimationPlayer(this, config);
```

### Sound Not Playing

**Problem:** Animation plays but no sound effects.

**Solutions:**
- Check browser allows autoplay (user interaction required)
- Verify audio files are in OGG format
- Check audio paths in export config

```typescript
// Enable audio context (after user interaction)
this.input.once('pointerdown', () => {
  this.sound.unlock();
});
```

### Animation Not Visible

**Problem:** Nothing appears when playing animation.

**Checklist:**
1. ✅ Called `await player.preload()` before playing
2. ✅ Target position is within camera bounds
3. ✅ Animation has frames (not empty)
4. ✅ Sprite sheets loaded successfully

```typescript
// Debug logging
console.log('Frame count:', player.getFrameCount());
console.log('Is playing:', player.isAnimationPlaying());
```

### Performance Issues

**Problem:** Animation stutters or lags.

**Solutions:**
- Reduce playback speed: `speed: 0.5`
- Limit concurrent animations
- Optimize sprite sheet sizes
- Use texture atlases for multiple animations

```typescript
// Limit to 3 concurrent animations
const MAX_CONCURRENT = 3;
if (this.activePlayers.length < MAX_CONCURRENT) {
  player.play(target);
  this.activePlayers.push(player);
}
```

## TypeScript Support

The SDK is written in TypeScript with full type definitions.

```typescript
import type {
  AnimationConfig,
  PlaybackOptions,
  TargetPosition,
  RMMVAnimation,
  RMMVCellData,
} from './rmmv-sdk';
```

## Browser Compatibility

- Modern browsers with ES2020 support
- Phaser 3.60.0+
- WebGL or Canvas renderer

## Examples

See `/examples` directory for complete working examples:
- `basic-usage.ts` - Simple animation playback
- `multiple-animations.ts` - Playing multiple animations
- `chaining.ts` - Sequential animation playback
- `combat-system.ts` - RPG-style combat with animations

## License

Same as main project.

## Support

For issues or questions:
- GitHub Issues: [repository link]
- Documentation: [link]
- Examples: [link]

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## Changelog

### v1.0.0 (Initial Release)
- AnimationPlayer class
- Asset loading and caching
- Full RMMV animation support
- TypeScript type definitions
- Export format specification
