# @decky.fx/rmmv-animation-player

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

### 1. Export Animation

Use RMMV Animation Studio to export your animation:

1. Open animation in the studio
2. Click "Export Animation"
3. Save the JSON file (e.g., `Fireball_export.json`)

### 2. Use in Your Phaser Project

```typescript
import Phaser from 'phaser';
import { AnimationPlayer } from '@decky.fx/rmmv-animation-player';
import type { AnimationConfig } from '@decky.fx/rmmv-animation-player';

class GameScene extends Phaser.Scene {
  private player?: AnimationPlayer;

  constructor() {
    super('GameScene');
  }

  async create() {
    // Load animation config
    const config: AnimationConfig = await fetch('/animations/Fireball_export.json')
      .then(r => r.json());

    // Create player
    this.player = new AnimationPlayer(this, config);

    // Preload assets
    await this.player.preload();

    // Play animation at position
    this.player.play(
      { x: 400, y: 300 },
      {
        loop: false,
        speed: 1.0,
        onComplete: () => console.log('Animation finished!'),
        onUpdate: (frame) => console.log(`Frame ${frame}`),
      }
    );
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

Play animation at target position.

```typescript
player.play(target: TargetPosition, options?: PlaybackOptions): void
```

**Parameters:**
- `target` - Position to play animation at `{ x: number, y: number }`
- `options` - Playback options:
  - `loop?: boolean` - Loop animation continuously (default: false)
  - `speed?: number` - Playback speed multiplier (default: 1.0)
  - `onComplete?: () => void` - Called when animation finishes (not for looped)
  - `onUpdate?: (frameIndex: number) => void` - Called each frame

**Example:**
```typescript
player.play(
  { x: 400, y: 300 },
  {
    loop: true,
    speed: 1.5,
    onUpdate: (frame) => console.log(`Frame ${frame}`),
  }
);
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

## Advanced Usage

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
