# AnimationPlayerManager Test Page

This is a test page to verify that `AnimationPlayerManager` works correctly with the asset preload fix.

## Purpose

Test the fix for the issue where `AnimationPlayerManager.play()` would throw:
```
Error: Assets not loaded. Call preload() first.
```

Even though assets were already loaded in Phaser.

## Files

- **animationConfig.json** - Exported animation config (Hit Physical animation)
- **example.html** - Test page HTML with live console log
- **example.ts** - Phaser game with PreloadScene and MainScene
- **README.md** - This file

## How to Run

1. Start the development server:
   ```bash
   bun run dev
   ```

2. Open your browser to:
   ```
   http://localhost:3000/example
   ```

3. The page will:
   - Initialize Phaser game
   - Load assets using `AnimationPlayerManager`
   - Auto-play the animation on startup
   - Show all console logs in real-time

4. Use the "Play Animation" button to manually replay the animation

## Expected Behavior

### ✅ Success (After Fix)

Console should show:
```
✅ [ExampleGame] Phaser game initialized
✅ [PreloadScene] Starting preload...
✅ [PreloadScene] AnimationPlayerManager created
✅ [PreloadScene] Animation registered: Hit Physical
📦 [PreloadScene] Assets to load: { spritesheets: 1, soundEffects: 1 }
📦 [PreloadScene] Loading sprite sheet: anim_Hit1 from /assets/img/animations/Hit1.png
🔊 [PreloadScene] Loading sound effect: se_Blow3 from /assets/se/Blow3.ogg
✅ [PreloadScene] All assets loaded
✅ [PreloadScene] Create called, transitioning to MainScene...
✅ [MainScene] Create called
✅ [MainScene] AnimationPlayerManager retrieved from registry
✅ [MainScene] Scene setup complete, ready to play animations
🎬 [MainScene] playAnimation() called
🎬 [MainScene] Calling animationManager.play(1, ...)
✅ [MainScene] Animation started successfully!
```

### ❌ Failure (Before Fix)

Console would show:
```
...
🎬 [MainScene] playAnimation() called
🎬 [MainScene] Calling animationManager.play(1, ...)
❌ [MainScene] Animation failed: Error: Assets not loaded. Call preload() first.
```

## What This Tests

1. **AnimationPlayerManager.registerAnimation()** - Registering animation config
2. **AnimationPlayerManager.assets()** - Getting aggregated assets
3. **Phaser asset loading** - Loading sprite sheets and sound effects
4. **AnimationPlayerManager.play()** - Playing animation with preloaded assets
5. **AnimationPlayer constructor parameter** - The `assetsPreloaded = true` fix

## Architecture Flow

```
User opens /example
    ↓
ExampleGame initialized
    ↓
PreloadScene.preload()
    ↓
AnimationPlayerManager.registerAnimation(config)
    ↓
AnimationPlayerManager.assets() → { spritesheets, soundEffects }
    ↓
Phaser loads all assets
    ↓
PreloadScene.create() → registry.set('animationManager', manager)
    ↓
MainScene.create() → registry.get('animationManager')
    ↓
MainScene.playAnimation()
    ↓
AnimationPlayerManager.play(1, { x, y })
    ↓
new AnimationPlayer(scene, config, true)  ← assetsPreloaded = true
    ↓
player.play() → ✅ Works! (skips assets check)
```

## The Fix Explained

**Before**:
```typescript
const player = new AnimationPlayer(scene, config);
// player.assetsLoaded = false (default)
await player.play();  // THROWS ERROR!
```

**After**:
```typescript
const player = new AnimationPlayer(scene, config, true);
// player.assetsLoaded = true (from parameter)
await player.play();  // ✅ Works!
```

## Debugging Tips

If the animation fails to play:

1. **Check console logs** - The page shows all logs in real-time
2. **Check assets** - Verify Hit1.png and Blow3.ogg exist
3. **Check network tab** - Verify assets are loading (200 status)
4. **Check player instance** - Use browser devtools to inspect `this.animationManager`

## Files Location

Assets used:
- `/assets/img/animations/Hit1.png` - Sprite sheet
- `/assets/se/Blow3.ogg` - Sound effect

## Next Steps

If this test works, the fix is successful and can be used in your Phaser project!
