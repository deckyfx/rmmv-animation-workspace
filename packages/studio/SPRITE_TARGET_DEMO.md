# Sprite-Based Animation Target Demo

## What Was Implemented

A new **sprite-based animation target** that allows rendering complex enemy sprites (like the Lamia) instead of simple shapes. This demonstrates how flash effects work differently on sprites vs graphics.

---

## Files Created/Modified

### New Files

1. **`src/phaser/objects/SpriteTarget.ts`** - Sprite-based target class
2. **`TARGET_COMPARISON.md`** - Detailed comparison documentation
3. **`SPRITE_TARGET_DEMO.md`** - This file

### Modified Files

1. **`src/phaser/scenes/PreloadScene.ts`** - Added Lamia sprite loading
2. **`src/phaser/scenes/AnimationScene.ts`** - Added target type switching

---

## How It Works

### 1. Target Types

AnimationScene now supports two target types via the `TargetType` enum:

```typescript
export enum TargetType {
  SHAPE = 'shape',   // Original graphics-based target (circle)
  SPRITE = 'sprite', // New sprite-based target (Lamia enemy)
}
```

### 2. Current Configuration

The default is currently set to **SPRITE**:

```typescript
private targetType: TargetType = TargetType.SPRITE;
```

This means animations will now target the **Lamia sprite** instead of the simple circle!

---

## Visual Differences

### When Flash Effects Trigger

#### Shape Target (Graphics):
- **Before Flash**: White circle
- **During Flash (0xFF0000)**: Red circle
- **Effect**: Complete color replacement

#### Sprite Target (Sprite):
- **Before Flash**: Full-color Lamia sprite
- **During Flash (0xFF0000)**: Red-tinted Lamia sprite
- **Effect**: Color overlay (multiplicative blend)

---

## How Tinting Works

### Graphics-Based (Shape Target)

```typescript
// Target.ts
setTint(color: number): void {
  this.config.color = color; // Replace color
  this.draw();               // Redraw entire shape
}
```

**What happens**: The entire shape is redrawn with the new color. CPU-intensive.

---

### Sprite-Based (Sprite Target)

```typescript
// SpriteTarget.ts
setTint(color: number): void {
  this.sprite.setTint(color); // Apply tint shader
}
```

**What happens**: A GPU shader applies a color overlay. Very fast!

---

## Tint Color Math (Sprite Only)

Phaser sprites use **multiplicative blending**:

```
final_color = original_pixel_color * tint_color / 255
```

### Examples:

**Red Tint (0xFF0000)**:
```
Original:  RGB(100, 200, 50)   [greenish]
Tint:      RGB(255, 0, 0)      [red]
Result:    RGB(100, 0, 0)      [dark red, no green/blue]
```

**White Tint (0xFFFFFF)** (no change):
```
Original:  RGB(100, 200, 50)
Tint:      RGB(255, 255, 255)
Result:    RGB(100, 200, 50)  [unchanged]
```

**Gray Tint (0x808080)** (50% darker):
```
Original:  RGB(100, 200, 50)
Tint:      RGB(128, 128, 128)
Result:    RGB(50, 100, 25)   [50% darker]
```

---

## Switching Target Types

To switch between targets, modify `AnimationScene.ts`:

```typescript
// Line 42 in AnimationScene.ts
private targetType: TargetType = TargetType.SPRITE; // Change this!

// Options:
// TargetType.SPRITE  → Lamia enemy sprite
// TargetType.SHAPE   → Simple circle (original)
```

---

## Asset Loading

The Lamia sprite is preloaded in `PreloadScene.ts`:

```typescript
// Load enemy sprites for targets
this.load.setPath('/assets/img/enemies');
this.load.image('enemy_lamia', 'Lamia.png');
```

**Location**: `/assets/img/enemies/Lamia.png`

---

## Interface Compliance

Both targets implement the **`AnimationTarget`** interface:

```typescript
interface AnimationTarget {
  x: number;
  y: number;
  width: number;
  height: number;
  setTint(color: number): void;
  clearTint(): void;
  setVisible(visible: boolean): void;
}
```

Plus the custom `getPositionPoints()` method for animation anchoring:

```typescript
interface TargetPositionPoints {
  head: { x: number; y: number };
  center: { x: number; y: number };
  feet: { x: number; y: number };
}
```

This ensures **flash effects work identically** regardless of target type!

---

## Testing Flash Effects

### Try These Animations:

1. **Attack animations** - Red flash on hit
2. **Heal animations** - Green/white flash
3. **Fire animations** - Orange/yellow screen flash
4. **Lightning animations** - White/cyan flash

### What to Observe:

**With Shape Target**:
- Circle changes color completely
- Effect is very obvious (color replacement)

**With Sprite Target**:
- Lamia sprite gets color overlay
- More realistic (like colored lighting)
- Original artwork partially visible through tint

---

## Advanced Usage: Multiple Enemy Sprites

You can extend this to support multiple enemy types:

```typescript
// In PreloadScene.ts
this.load.image('enemy_lamia', 'Lamia.png');
this.load.image('enemy_dragon', 'Dragon.png');
this.load.image('enemy_skeleton', 'Skeleton.png');

// In AnimationScene.ts
private createTarget(): void {
  const enemyType = 'enemy_lamia'; // or 'enemy_dragon', etc.

  this.target = new SpriteTarget(this, {
    texture: enemyType,
    x: centerX,
    y: centerY,
    scale: 0.5,
  });
  this.add.existing(this.target);
}
```

---

## Performance Comparison

| Metric | Shape Target | Sprite Target |
|--------|-------------|---------------|
| **Rendering** | CPU (Canvas2D) | GPU (WebGL) |
| **Tinting Speed** | Slow (redraw) | Very Fast (shader) |
| **Memory Usage** | Low | Moderate |
| **Visual Quality** | Simple | High Detail |
| **Best For** | Prototyping | Production |

---

## Summary

✅ **Created**: Sprite-based animation target (SpriteTarget)
✅ **Loaded**: Lamia enemy sprite asset
✅ **Integrated**: Target type switching in AnimationScene
✅ **Maintained**: AnimationTarget interface compliance
✅ **Demonstrated**: How tinting differs for sprites vs shapes

**Result**: Flash effects now work on complex enemy sprites with realistic color overlay effects!

---

## Next Steps (Optional)

1. **UI Control**: Add a toggle in React UI to switch target types
2. **Multiple Sprites**: Load and switch between different enemies
3. **Scale Control**: Add UI slider to adjust sprite scale
4. **Position Control**: Allow dragging targets to different positions
5. **Blend Modes**: Experiment with additive/multiply blend modes
