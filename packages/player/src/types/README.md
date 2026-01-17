# RMMV Animation Format Reference

Complete type definitions for RPG Maker MV Animations.json format, verified through testing.

## Cell Data Structure

**Format**: `[cellId, x, y, scale, rotation, flip, opacity, blendMode]`

### Example from RMMV Editor:
- **Pattern**: 1
- **X**: 2
- **Y**: 3
- **Scale**: 250%
- **Rotation**: 4°
- **Mirror**: No
- **Opacity**: 255
- **Blend**: Additive

### JSON Representation:
```json
[0, 2, 3, 250, 4, 0, 255, 1]
```

### Field Mappings:

| Index | Field | RMMV Value | JSON Value | Notes |
|-------|-------|------------|------------|-------|
| 0 | cellId | Pattern 1 | 0 | 0-indexed (Pattern 1 = cell 0) |
| 1 | x | X: 2 | 2 | Pixel offset from animation position |
| 2 | y | Y: 3 | 3 | Pixel offset from animation position |
| 3 | scale | Scale: 250% | 250 | 100 = 1x, 200 = 2x, 250 = 2.5x |
| 4 | rotation | Rotation: 4° | 4 | Degrees (0-360) |
| 5 | flip | Mirror: No | 0 | 0 = no flip, 1 = horizontal flip |
| 6 | opacity | Opacity: 255 | 255 | 0 = transparent, 255 = opaque |
| 7 | blendMode | Blend: Additive | 1 | 0=Normal, 1=Additive, 2=Multiply, 3=Screen |

## Frame Indexing

**Important**: RMMV editor UI uses 1-based indexing, but JSON uses 0-based arrays.

| RMMV Editor | JSON Index | Description |
|-------------|------------|-------------|
| Frame 1 | `frames[0]` | First frame |
| Frame 2 | `frames[1]` | Second frame |
| Frame 3 | `frames[2]` | Third frame |

### Example:
```json
"frames": [
  [],                              // Frame 1 in UI: empty
  [[0, 2, 3, 250, 4, 0, 255, 1]],  // Frame 2 in UI: one cell
  [[1, 0, 0, 200, 0, 0, 255, 1]]   // Frame 3 in UI: one cell
]
```

## Empty Cells

Cells with `cellId = -1` are empty/inactive placeholders:

```json
[-1, 0, 0, 0, 0, 0, 0, 0]  // Empty cell
```

These are ignored during rendering.

## Sprite Sheet Structure

RMMV animation sprite sheets use a **row-major indexing** system:

- **Cell Size**: Always 192px × 192px
- **Grid Columns**: Typically 3-5 columns (varies per sheet)
- **Grid Rows**: Variable (depends on sprite sheet)
- **Location**: `assets/img/animations/[SheetName].png`

### Cell Indexing (Row-Major, 0-based)

**Formula**: `cellId = (row * columns) + column`

**Example with 5 columns**:

```
┌────┬────┬────┬────┬────┐
│ 0  │ 1  │ 2  │ 3  │ 4  │  Row 0 (Pattern 1-5)
├────┼────┼────┼────┼────┤
│ 5  │ 6  │ 7  │ 8  │ 9  │  Row 1 (Pattern 6-10)
├────┼────┼────┼────┼────┤
│ 10 │ 11 │ 12 │ 13 │ 14 │  Row 2 (Pattern 11-15)
├────┼────┼────┼────┼────┤
│ 15 │ 16 │ 17 │ 18 │ 19 │  Row 3 (Pattern 16-20)
├────┼────┼────┼────┼────┤
│ 20 │ 21 │ 22 │ 23 │ 24 │  Row 4 (Pattern 21-25)
└────┴────┴────┴────┴────┘

cellId 0  = row 0, col 0
cellId 1  = row 0, col 1
cellId 5  = row 1, col 0 (first cell of second row)
cellId 6  = row 1, col 1
```

**Example with 3 columns**:

```
┌────┬────┬────┐
│ 0  │ 1  │ 2  │  Row 0
├────┼────┼────┤
│ 3  │ 4  │ 5  │  Row 1
├────┼────┼────┤
│ 6  │ 7  │ 8  │  Row 2
└────┴────┴────┘

cellId 3 = row 1, col 0 (first cell of second row)
```

**Calculating Coordinates**:
```typescript
import { getCellCoordinates } from '@sdk/types/rmmv';

// For a 5-column sprite sheet
const coords = getCellCoordinates(cellId, 5);
// Returns: { row, col, x, y }

// cellId 6 with 5 columns → { row: 1, col: 1, x: 192, y: 192 }
```

**Important Notes**:
- Column count varies per sprite sheet (3-5 typically)
- Real RMMV data shows cellIds up to 112+ for larger sheets
- Must know column count to calculate correct cell position
- Renderer needs to slice sprite sheet at calculated (x, y) coordinates

## Blend Modes

| Value | RMMV Name | Phaser Equivalent | Description |
|-------|-----------|-------------------|-------------|
| 0 | Normal | `NORMAL` | Standard blending |
| 1 | Additive | `ADD` | Additive (brightens) |
| 2 | Multiply | `MULTIPLY` | Multiply (darkens) |
| 3 | Screen | `SCREEN` | Screen (inverse multiply) |

## Animation Positions

| Value | Name | Description |
|-------|------|-------------|
| 0 | Head | Animation appears at target's head |
| 1 | Center | Animation appears at target's center |
| 2 | Feet | Animation appears at target's feet |
| 3 | Screen | Animation appears at fixed screen position |

## Timing Events (SE & Flash)

Timing events trigger sound effects and screen flashes at specific frames.

### Example from RMMV Editor:
```
no 001
SE: Blow3
Start From Frame: 1
Flash: Target
White Color (255,255,255)
Max Intensity (255)
Duration 2 Frame
```

### JSON Representation:
```json
{
  "frame": 0,
  "se": {
    "name": "Blow3",
    "volume": 90,
    "pitch": 100,
    "pan": 0
  },
  "flashScope": 1,
  "flashColor": [255, 255, 255, 255],
  "flashDuration": 2
}
```

### Timing Field Mappings:

| RMMV UI | JSON Field | Example Value | Notes |
|---------|------------|---------------|-------|
| Start From Frame: 1 | `frame` | 0 | **0-indexed!** Frame 1 = frame 0 |
| SE: Blow3 | `se.name` | "Blow3" | Sound effect filename (no extension) |
| Volume | `se.volume` | 90 | 0-100 |
| Pitch | `se.pitch` | 100 | 50-150 (100 = normal) |
| Pan | `se.pan` | 0 | -100 (left) to +100 (right) |
| Flash: Target | `flashScope` | 1 | See flash scope table below |
| Color RGB | `flashColor[0-2]` | [255,255,255] | Red, Green, Blue |
| Max Intensity | `flashColor[3]` | 255 | 0-255 (alpha/intensity) |
| Duration | `flashDuration` | 2 | Number of frames |

### Flash Scope Values:

| Value | RMMV Name | Description |
|-------|-----------|-------------|
| 0 | None | No flash effect |
| 1 | Target | Flash the animation target |
| 2 | Screen | Flash entire screen |
| 3 | Hide Target | Flash and temporarily hide target |

### Sound Effect (SE) Parameters:

The `se` field can be `null` if no sound effect is specified, or an object with these properties:

```json
{
  "name": "Blow3",
  "volume": 90,
  "pitch": 100,
  "pan": 0
}
```

**Field Details:**

| Field | RMMV UI | Range | Default | Description |
|-------|---------|-------|---------|-------------|
| `name` | SE: Blow3 | string | "" | Filename without extension (.ogg/.m4a) |
| `volume` | Volume: 90 | 0-100 | 90 | 0=silent, 100=max volume |
| `pitch` | Pitch: 100 | 50-150 | 100 | Playback speed/pitch (100=normal) |
| `pan` | Pan: 0 | -100 to +100 | 0 | Stereo position (-100=left, 0=center, +100=right) |

**Location:** Sound files are in `audio/se/[name].ogg` or `audio/se/[name].m4a`

**Example:**
- RMMV UI: SE: Blow3, Volume: 90, Pitch: 100, Pan: 0
- JSON: `{"name": "Blow3", "volume": 90, "pitch": 100, "pan": 0}`

### Flash Color Array:

`flashColor` is always a 4-element array: `[R, G, B, Intensity]`

Examples:
- White flash, max intensity: `[255, 255, 255, 255]`
- Red flash, half intensity: `[255, 0, 0, 127]`
- Blue flash, low intensity: `[0, 0, 255, 64]`
- No flash (scope=0): `[0, 0, 0, 0]`

## Complete Animation Structure

```json
{
  "id": 1,
  "name": "Hit Physical",
  "position": 1,
  "animation1Name": "Hit1",
  "animation1Hue": 0,
  "animation2Name": "",
  "animation2Hue": 0,
  "frames": [
    [],
    [[0, 2, 3, 250, 4, 0, 255, 1]]
  ],
  "timings": [
    {
      "frame": 0,
      "se": {
        "name": "Blow3",
        "volume": 90,
        "pitch": 100,
        "pan": 0
      },
      "flashScope": 1,
      "flashColor": [255, 255, 255, 255],
      "flashDuration": 2
    }
  ]
}
```

## Animations.json File Structure

The root structure is an array where:
- **Index 0**: Always `null` (unused)
- **Index 1+**: Animation objects with matching IDs

```json
[
  null,
  { "id": 1, "name": "Animation 1", ... },
  { "id": 2, "name": "Animation 2", ... },
  ...
]
```

## TypeScript Usage

```typescript
import type { RMMVAnimation, RMMVCellData, RMMVFrame } from '@sdk/types/rmmv';

// Parse animation
const animation: RMMVAnimation = data[1]; // Get animation ID 1

// Access frame data
const frame2: RMMVFrame = animation.frames[1]; // Frame 2 in UI

// Access cell data
const cell: RMMVCellData = frame2[0];
const [cellId, x, y, scale, rotation, flip, opacity, blendMode] = cell;
```

## Validation Rules

1. **cellId**: -1 (empty) or non-negative integer
   - Standard sprite sheets use 5×5 grid (0-24)
   - **Real RMMV data shows cellIds up to 112+** for larger sprite sheets
   - Sprite sheet size varies per animation (3-5 columns, variable rows)
2. **x, y**: Any number (pixel coordinates)
3. **scale**: Typically 50-300 (0.5x to 3x), but can be any positive number
4. **rotation**: -360 to 360 degrees
   - Positive = clockwise, Negative = counter-clockwise
   - Example: -90° = 270° clockwise
5. **flip**: 0 or 1 only
6. **opacity**: 0-255
7. **blendMode**: 0, 1, 2, or 3 only
8. **SE pitch**: Typically 50-150 in editor, **but real data shows 10-200+**

## Performance Considerations

- **Lazy Loading**: Load sprite sheets on-demand, not all at once
- **LRU Cache**: Keep only recently used sprite sheets in memory
- **Empty Cells**: Skip rendering cells with `cellId = -1`
- **Frame Rate**: RMMV runs at 60 FPS, each frame = ~16.67ms
