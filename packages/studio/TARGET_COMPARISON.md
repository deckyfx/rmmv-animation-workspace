# Animation Target Comparison: Shape vs Sprite

This document explains the differences between shape-based and sprite-based animation targets, particularly how tinting works differently for each.

## Target Types

### 1. Shape Target (Graphics-based)

**File**: `src/phaser/objects/Target.ts`

**Implementation**:
- Uses `Phaser.GameObjects.Graphics`
- Manually draws shapes using graphics primitives (circles, lines, rectangles)
- Color is set via `fillStyle()` and `lineStyle()`

**How Tinting Works**:
```typescript
setTint(color: number): void {
  // Replace the fill color entirely
  this.config.color = color;
  this.draw(); // Redraw with new color
}
```

- **Color Replacement**: The shape's color is completely replaced
- **Full Control**: Can set any color directly
- **CPU-Bound**: Requires redrawing the entire shape
- **Example**: White circle becomes red circle (complete color replacement)

**Pros**:
- Simple, lightweight
- Full control over color
- No texture/sprite assets needed

**Cons**:
- Cannot render complex images
- CPU-intensive for complex shapes
- Limited visual detail

---

### 2. Sprite Target (Sprite-based)

**File**: `src/phaser/objects/SpriteTarget.ts`

**Implementation**:
- Uses `Phaser.GameObjects.Sprite`
- Renders a texture/image
- Uses Phaser's built-in GPU-accelerated tint system

**How Tinting Works**:
```typescript
setTint(color: number): void {
  // Apply color overlay (multiplicative blend)
  this.sprite.setTint(color);
}
```

- **Color Overlay**: Tint is multiplied with the sprite's pixels
- **Multiplicative Blend**: `final_color = sprite_color * tint_color`
- **GPU-Accelerated**: Uses WebGL shaders for performance
- **Example**: Lamia sprite with red tint shows red-tinted version (overlay effect)

**Tint Color Behavior**:
- `0xFFFFFF` (white) = no change (1.0 * color = color)
- `0xFF0000` (red) = only red channel visible
- `0x00FF00` (green) = only green channel visible
- `0x808080` (gray) = darkens by 50%

**Pros**:
- Renders complex artwork
- GPU-accelerated (very fast)
- Realistic visual representation
- Can show actual enemy sprites

**Cons**:
- Requires texture assets
- Tint is an overlay (not replacement)
- Slightly more memory usage

---

## Flash Effect Differences

### Shape Target Flash Example

```typescript
// Original: White circle (0xFFFFFF)
target.setTint(0xFF0000); // Now: Red circle

// Color was replaced: white → red
```

**Visual Result**: Complete color change from white to red.

---

### Sprite Target Flash Example

```typescript
// Original: Full-color Lamia sprite
target.setTint(0xFF0000); // Now: Red-tinted Lamia

// Color was overlaid: original * red = red-tinted version
```

**Visual Result**: Lamia sprite with red overlay (like a red light shining on it).

**Technical Details**:
- RGB multiplication per pixel
- Red tint (0xFF0000): Keeps red channel (R), removes green (G) and blue (B)
- Green parts of sprite become black (0 * G = 0)
- Red/yellow parts remain visible (red contains red channel)

**Special Case - White Flash**:

Since white tint (0xFFFFFF) in multiplicative blending equals no change:
```
final_color = original × white / 255 = original × 1 = original
```

The `SpriteTarget` uses special handling for bright colors:
- **Brightness ≥ 192** (75%+): Uses `setTintFill()` (color replacement)
- **Brightness < 192**: Uses `setTint()` (color overlay)

This ensures white flash (0xFFFFFF) turns the sprite white instead of doing nothing!

See `WHITE_FLASH_FIX.md` for detailed explanation.

---

## Implementation in AnimationScene

The scene supports both target types via the `TargetType` enum:

```typescript
export enum TargetType {
  SHAPE = 'shape',   // Original graphics-based target
  SPRITE = 'sprite', // New sprite-based target
}

// Configure in AnimationScene.ts:
private targetType: TargetType = TargetType.SPRITE;
```

**Switching Target Types**:

```typescript
// Use shape target (simple circle)
this.targetType = TargetType.SHAPE;

// Use sprite target (Lamia enemy)
this.targetType = TargetType.SPRITE;
```

---

## AnimationTarget Interface

Both targets implement the same interface, making them interchangeable:

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

This allows flash effects to work seamlessly with either target type!

---

## Use Cases

### When to Use Shape Target

- Quick prototyping
- Simple visualization
- No sprite assets available
- Performance testing (CPU-based)
- Educational purposes (show basic concepts)

### When to Use Sprite Target

- Production-ready previews
- Realistic enemy representation
- Testing with actual game graphics
- Demonstrating real visual effects
- Better understanding of in-game appearance

---

## Performance Comparison

| Aspect | Shape Target | Sprite Target |
|--------|-------------|---------------|
| **Rendering** | CPU (Canvas2D) | GPU (WebGL) |
| **Tinting** | Redraw entire shape | Shader-based overlay |
| **Memory** | Minimal (no textures) | Moderate (texture loaded) |
| **Speed** | Fast for simple shapes | Very fast (GPU-accelerated) |
| **Complexity** | Limited detail | Full artwork |
| **Flash Effect** | Color replacement | Color overlay |

---

## Code Example: Using Both Targets

```typescript
// Shape-based target (original)
const shapeTarget = new Target(scene, 400, 300);
shapeTarget.setTint(0xFF0000); // Circle turns red

// Sprite-based target (new)
const spriteTarget = new SpriteTarget(scene, {
  texture: 'enemy_lamia',
  x: 400,
  y: 300,
  scale: 0.5,
});
spriteTarget.setTint(0xFF0000); // Lamia gets red overlay

// Both implement AnimationTarget interface!
function flashEffect(target: AnimationTarget) {
  target.setTint(0xFF0000);
  setTimeout(() => target.clearTint(), 500);
}

flashEffect(shapeTarget);  // Works!
flashEffect(spriteTarget); // Works!
```

---

## Summary

**Shape Target**:
- Graphics-based, CPU rendering
- Tint = color replacement
- Simple but limited

**Sprite Target**:
- Sprite-based, GPU rendering
- Tint = color overlay (multiplicative)
- Complex and realistic

Both work seamlessly with RMMV flash effects thanks to the `AnimationTarget` interface!
