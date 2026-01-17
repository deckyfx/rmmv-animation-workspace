/**
 * Animation Scene - Main Phaser scene for rendering RMMV animations
 *
 * Receives animation data from PreloadScene (assets already loaded)
 * and renders the animation.
 */

import Phaser from 'phaser';
import type { RMMVAnimation, RMMVCellData } from '@decky.fx/rmmv-animation-player';
import { useAnimationStore } from '@react/store/useAnimationStore';
import { getCellCoordinates, RMMVAnimationPosition } from '@decky.fx/rmmv-animation-player';
import { Target } from '@phaser/objects/Target';

export interface AnimationSceneData {
  animation: RMMVAnimation;
}

/**
 * Main animation preview scene
 * Renders RMMV animations with 16:9 aspect ratio
 */
export class AnimationScene extends Phaser.Scene {
  /** Reference to Zustand store unsubscribe function */
  private unsubscribe?: () => void;

  /** Current animation being displayed */
  private animation!: RMMVAnimation;

  /** Target object for animation positioning */
  private target?: Target;

  /** Container for animation sprites */
  private animationContainer?: Phaser.GameObjects.Container;

  /** Graphics object for drawing bounding boxes in preview mode */
  private boundingBoxGraphics?: Phaser.GameObjects.Graphics;

  /** Title text showing animation name */
  private titleText?: Phaser.GameObjects.Text;

  /** Frame timing accumulator (in milliseconds) */
  private frameAccumulator = 0;

  /** Current playback state */
  private isPlaying = false;
  private currentFrameIndex = 0;
  private playbackSpeed = 1.0;

  constructor() {
    super({ key: 'AnimationScene' });
  }

  /**
   * Initialize scene with animation data
   */
  init(data: AnimationSceneData): void {
    this.animation = data.animation;

    // Always start at frame 0 to process timing events on empty frames
    // Empty frames may have sound effects or flash effects even without visuals
    this.currentFrameIndex = 0;
  }


  /**
   * Preload is not used - PreloadScene handles asset loading
   */
  preload(): void {
    // Assets already loaded by PreloadScene
  }

  /**
   * Create scene elements
   */
  create(): void {
    // Create background grid
    this.createBackgroundGrid();

    // Create title text showing animation name
    this.createTitleText();

    // Create target stickman at center
    this.target = new Target(
      this,
      this.cameras.main.centerX,
      this.cameras.main.centerY
    );

    // Position animation container based on animation position setting
    const animationPos = this.getAnimationPosition();
    this.animationContainer = this.add.container(animationPos.x, animationPos.y);

    // Create graphics object for bounding boxes in preview mode
    this.boundingBoxGraphics = this.add.graphics();
    this.boundingBoxGraphics.setDepth(1000); // Draw on top of everything

    // Render the animation (assets already loaded)
    this.renderAnimation();

    // Subscribe to playback controls only
    this.subscribeToPlaybackControls();

    // Setup canvas click detection for cell editing
    this.setupClickDetection();
  }

  /**
   * Update loop
   */
  override update(_time: number, delta: number): void {
    if (!this.isPlaying || this.animation.frames.length === 0) {
      return;
    }

    // Accumulate time (delta is in milliseconds)
    this.frameAccumulator += delta * this.playbackSpeed;

    // Get current frame timing (in 1/60s, convert to ms)
    const currentFrame = this.animation.frames[this.currentFrameIndex];

    // Empty frames are valid (blank frames for timing)
    if (!currentFrame || currentFrame.length === 0) {
      // Default timing for empty frames: 4 frames (1/15 second)
      this.frameAccumulator = 0;
      this.advanceFrame();
      return;
    }

    // Default frame duration: 4 ticks (1/15 second = ~66.7ms)
    // TODO: Find where RMMV stores frame timing
    const frameDurationMs = (4 / 60) * 1000;

    // Check if we should advance to next frame
    if (this.frameAccumulator >= frameDurationMs) {
      this.frameAccumulator = 0;
      this.advanceFrame();
    }
  }

  /**
   * Get animation position based on animation.position and target
   */
  private getAnimationPosition(): { x: number; y: number } {
    if (!this.target) {
      // Fallback to screen center if no target
      return {
        x: this.cameras.main.centerX,
        y: this.cameras.main.centerY,
      };
    }

    const positions = this.target.getPositionPoints();

    // Use animation's stored position value
    switch (this.animation.position) {
      case RMMVAnimationPosition.HEAD:
        return positions.head;
      case RMMVAnimationPosition.CENTER:
        return positions.center;
      case RMMVAnimationPosition.FEET:
        return positions.feet;
      case RMMVAnimationPosition.SCREEN:
        // Screen position ignores target, uses absolute screen center
        return {
          x: this.cameras.main.centerX,
          y: this.cameras.main.centerY,
        };
      default:
        // Default to center
        return positions.center;
    }
  }

  /**
   * Create title text showing animation name
   */
  private createTitleText(): void {
    const { width } = this.cameras.main;

    this.titleText = this.add.text(width / 2, 24, this.animation.name, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        fill: true,
      },
    });

    this.titleText.setOrigin(0.5, 0);
    this.titleText.setDepth(1000); // Ensure it's always on top
  }

  /**
   * Create background grid for visual reference
   */
  private createBackgroundGrid(): void {
    const graphics = this.add.graphics();
    const { width, height } = this.cameras.main;

    // Draw grid
    graphics.lineStyle(1, 0x333333, 0.3);

    const gridSize = 50;
    for (let x = 0; x <= width; x += gridSize) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += gridSize) {
      graphics.lineBetween(0, y, width, y);
    }

    // Draw center cross
    graphics.lineStyle(2, 0x666666, 0.5);
    graphics.lineBetween(width / 2, 0, width / 2, height);
    graphics.lineBetween(0, height / 2, width, height / 2);
  }

  /**
   * Subscribe to Zustand store for playback controls and frame selection
   * Animation selection is handled by creating new Phaser instance
   */
  private subscribeToPlaybackControls(): void {
    let previousPlayback = useAnimationStore.getState().playback;
    let previousActiveFrame = useAnimationStore.getState().activeFrameIndex;

    // Subscribe to playback state changes and active frame changes
    this.unsubscribe = useAnimationStore.subscribe((state) => {
      const currentPlayback = state.playback;
      const currentActiveFrame = state.activeFrameIndex;

      // Check if playback state changed
      const playbackChanged =
        currentPlayback.isPlaying !== previousPlayback.isPlaying ||
        currentPlayback.speed !== previousPlayback.speed ||
        currentPlayback.currentFrame !== previousPlayback.currentFrame;

      // Check if active frame changed
      const activeFrameChanged = currentActiveFrame !== previousActiveFrame;

      if (playbackChanged || activeFrameChanged) {
        // Sync playback state
        this.isPlaying = currentPlayback.isPlaying;
        this.playbackSpeed = currentPlayback.speed;

        // If playback just started, clean up preview and start animation
        if (currentPlayback.isPlaying && !previousPlayback.isPlaying) {
          this.currentFrameIndex = currentPlayback.currentFrame;
          this.frameAccumulator = 0;
          this.renderCurrentFrame();
          this.processTimingEvents();
        }
        // If playback just stopped, render preview of active frame
        else if (!currentPlayback.isPlaying && previousPlayback.isPlaying) {
          this.renderPreviewFrame();
        }
        // If active frame changed while not playing, render preview
        else if (activeFrameChanged && !this.isPlaying) {
          this.renderPreviewFrame();
        }
        // If frame changed from outside during playback
        else if (
          currentPlayback.currentFrame !== this.currentFrameIndex &&
          currentPlayback.currentFrame !== previousPlayback.currentFrame
        ) {
          this.currentFrameIndex = currentPlayback.currentFrame;
          this.frameAccumulator = 0;
          this.renderCurrentFrame();
        }

        previousPlayback = currentPlayback;
        previousActiveFrame = currentActiveFrame;
      }
    });
  }

  /**
   * Advance to next frame
   */
  private advanceFrame(): void {
    this.currentFrameIndex++;

    // Check if we reached the end
    if (this.currentFrameIndex >= this.animation.frames.length) {
      // Stop playback and reset to beginning
      this.currentFrameIndex = 0;
      this.isPlaying = false;
      useAnimationStore.getState().pause();
      this.renderCurrentFrame();
      return;
    }

    // Check for timing events at this frame
    this.processTimingEvents();

    // Render new frame
    this.renderCurrentFrame();
  }

  /**
   * Process timing events (sound effects, flashes) for current frame
   */
  private processTimingEvents(): void {
    if (!this.animation.timings || this.animation.timings.length === 0) {
      return;
    }

    // Find all timing events that trigger on current frame
    const timings = this.animation.timings.filter(
      (timing) => timing.frame === this.currentFrameIndex
    );

    for (const timing of timings) {
      // Play sound effect if specified
      if (timing.se && timing.se.name && timing.se.name !== '') {
        this.playSoundEffect(timing.se);
      }

      // TODO: Handle flash effects (flashScope, flashColor, flashDuration)
    }
  }

  /**
   * Play preloaded sound effect with volume, pitch, and pan
   */
  private playSoundEffect(se: {
    name: string;
    volume: number;
    pitch: number;
    pan: number;
  }): void {
    const key = `se_${se.name}`;

    // Safety check: ensure cache is available
    if (!this.cache || !this.cache.audio) {
      console.warn(`[SE] Audio cache not available, skipping: ${key}`);
      return;
    }

    // Check if sound was preloaded
    if (!this.cache.audio.exists(key)) {
      console.error(`[SE] Sound not preloaded: ${key}`);
      return;
    }

    // Volume: 0-100 in RMMV, need 0-1 for Phaser
    const volume = se.volume / 100;

    // Pitch: 100 = normal in RMMV, need to convert to rate (detune in Phaser)
    // Pitch 50 = half speed, 100 = normal, 200 = double speed
    const rate = se.pitch / 100;

    // Pan: -100 to +100 in RMMV, need -1 to +1 for Phaser
    const pan = se.pan / 100;

    try {
      this.sound.play(key, {
        volume,
        rate,
        pan,
      });
    } catch (err) {
      console.error(`[SE] Error playing sound: ${key}`, err);
    }
  }

  /**
   * Render animation in the scene (initial render)
   * If a frame is active for editing, show that frame; otherwise show first frame
   */
  private renderAnimation(): void {
    this.renderPreviewFrame();
  }

  /**
   * Render preview frame (for editing mode)
   * Shows the selected active frame, or first frame if no frame is active
   */
  private renderPreviewFrame(): void {
    const activeFrameIndex = useAnimationStore.getState().activeFrameIndex;

    if (activeFrameIndex !== null && activeFrameIndex < this.animation.frames.length) {
      // Render the active frame for editing
      this.currentFrameIndex = activeFrameIndex;
      this.renderCurrentFrame();
    } else {
      // No active frame, render first frame by default
      this.currentFrameIndex = 0;
      this.renderCurrentFrame();
    }
  }

  /**
   * Get sprite sheet name for a given cellId
   *
   * Uses dynamic 100-based indexing pattern:
   * - cellId 0-99 → sheet 0 (animation1Name)
   * - cellId 100-199 → sheet 1 (animation2Name)
   * - cellId 200-299 → sheet 2 (animation3Name) [future]
   * - cellId 300-399 → sheet 3 (animation4Name) [future]
   * - etc.
   *
   * Formula:
   * - Sheet index = Math.floor(cellId / 100)
   * - Cell position within sheet = cellId % 100 (0-99)
   *
   * @param cellId The cell ID from animation frame data
   * @returns Object with spriteKey and normalizedCellId, or null if sheet not available
   */
  private getSpriteSheetForCell(cellId: number): { spriteKey: string; normalizedCellId: number } | null {
    // Calculate which sprite sheet index (0-based)
    const sheetIndex = Math.floor(cellId / 100);
    // Calculate cell position within that sheet (0-99)
    const normalizedCellId = cellId % 100;

    // Map sheet index to animation property
    let sheetName = '';
    switch (sheetIndex) {
      case 0:
        sheetName = this.animation.animation1Name;
        break;
      case 1:
        sheetName = this.animation.animation2Name;
        break;
      // To add support for more sprite sheets in the future:
      // case 2:
      //   sheetName = this.animation.animation3Name;
      //   break;
      // case 3:
      //   sheetName = this.animation.animation4Name;
      //   break;
      default:
        // Sheet index not supported in current animation data format
        return null;
    }

    if (!sheetName) {
      return null;
    }

    return {
      spriteKey: `anim_${sheetName}`,
      normalizedCellId,
    };
  }

  /**
   * Render current frame
   */
  private renderCurrentFrame(): void {
    if (!this.animationContainer) return;

    // Clear previous content
    this.animationContainer.removeAll(true);

    // Clear previous bounding boxes
    if (this.boundingBoxGraphics) {
      this.boundingBoxGraphics.clear();
    }

    // Get current frame data
    const frame = this.animation.frames[this.currentFrameIndex];

    // Empty frames are valid (blank frames) - just clear and return
    if (!frame || frame.length === 0) {
      return;
    }

    // Frame structure: Each frame can have multiple cell arrays
    // frame = [[cellId, x, y, scale, rotation, flip, opacity, blendMode], ...]
    for (let cellIndex = 0; cellIndex < frame.length; cellIndex++) {
      const cell = frame[cellIndex] as RMMVCellData;
      if (!cell || !Array.isArray(cell) || cell.length < 8) {
        continue;
      }

      // Use named properties from RMMVCellData type
      const cellId = cell[0];
      const x = cell[1];
      const y = cell[2];
      const scale = cell[3];
      const rotation = cell[4];
      const flip = cell[5];
      const opacity = cell[6];
      const blendMode = cell[7];

      // Get sprite sheet and normalized cell ID for this cell
      const sheetInfo = this.getSpriteSheetForCell(cellId);
      if (!sheetInfo) {
        continue;
      }

      const { spriteKey, normalizedCellId } = sheetInfo;

      // Check if texture exists
      if (!this.textures.exists(spriteKey)) {
        continue;
      }

      // Get the full texture
      const texture = this.textures.get(spriteKey);

      // RMMV sprite sheets are 5 columns, 192x192 cells
      const COLUMNS = 5;
      const CELL_WIDTH = 192;
      const CELL_HEIGHT = 192;

      // Use normalized cellId for cell coordinates in the sprite sheet
      const cellCoords = getCellCoordinates(normalizedCellId, COLUMNS, CELL_WIDTH, CELL_HEIGHT);

      // Create a frame key for this specific cell
      const frameKey = `${spriteKey}_cell_${normalizedCellId}`;

      // Add frame to texture if not exists
      if (!texture.has(frameKey)) {
        texture.add(frameKey, 0, cellCoords.x, cellCoords.y, CELL_WIDTH, CELL_HEIGHT);
      }

      // Create sprite from the specific cell frame
      const sprite = this.add.sprite(x, y, spriteKey, frameKey);

      // Apply transformations
      // Scale: percentage (250 = 250% = 2.5x)
      const finalScale = scale / 100;
      sprite.setScale(finalScale);
      sprite.setRotation((rotation * Math.PI) / 180); // Convert degrees to radians
      sprite.setAlpha(opacity / 255); // Opacity 0-255 to 0-1

      // Apply flip (horizontal mirror)
      if (flip) {
        sprite.setFlipX(true);
      }

      // Apply blend mode
      // RMMV blend modes: 0=normal, 1=add, 2=multiply, 3=screen
      const blendModes = [
        Phaser.BlendModes.NORMAL,
        Phaser.BlendModes.ADD,
        Phaser.BlendModes.MULTIPLY,
        Phaser.BlendModes.SCREEN,
      ];
      sprite.setBlendMode(blendModes[blendMode] || Phaser.BlendModes.NORMAL);

      // Add to container
      this.animationContainer.add(sprite);

      // Draw bounding box in preview mode (when not playing animation)
      if (!this.isPlaying && this.boundingBoxGraphics && this.animationContainer) {
        const bounds = sprite.getBounds();

        // Draw semi-transparent bounding box
        this.boundingBoxGraphics.lineStyle(2, 0x6495ed, 0.6); // Blue border
        this.boundingBoxGraphics.strokeRect(
          bounds.x,
          bounds.y,
          bounds.width,
          bounds.height
        );

        // Draw corner markers for better visibility
        const cornerSize = 8;
        this.boundingBoxGraphics.lineStyle(2, 0xffffff, 0.8); // White corners

        // Top-left corner
        this.boundingBoxGraphics.lineBetween(bounds.x, bounds.y, bounds.x + cornerSize, bounds.y);
        this.boundingBoxGraphics.lineBetween(bounds.x, bounds.y, bounds.x, bounds.y + cornerSize);

        // Top-right corner
        this.boundingBoxGraphics.lineBetween(bounds.x + bounds.width, bounds.y, bounds.x + bounds.width - cornerSize, bounds.y);
        this.boundingBoxGraphics.lineBetween(bounds.x + bounds.width, bounds.y, bounds.x + bounds.width, bounds.y + cornerSize);

        // Bottom-left corner
        this.boundingBoxGraphics.lineBetween(bounds.x, bounds.y + bounds.height, bounds.x + cornerSize, bounds.y + bounds.height);
        this.boundingBoxGraphics.lineBetween(bounds.x, bounds.y + bounds.height, bounds.x, bounds.y + bounds.height - cornerSize);

        // Bottom-right corner
        this.boundingBoxGraphics.lineBetween(bounds.x + bounds.width, bounds.y + bounds.height, bounds.x + bounds.width - cornerSize, bounds.y + bounds.height);
        this.boundingBoxGraphics.lineBetween(bounds.x + bounds.width, bounds.y + bounds.height, bounds.x + bounds.width, bounds.y + bounds.height - cornerSize);
      }
    }
  }

  /**
   * Setup canvas click detection for cell editing
   */
  private setupClickDetection(): void {
    console.log('[AnimationScene] Setting up click detection');

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      console.log('[Click] Canvas clicked at', pointer.worldX, pointer.worldY);

      // Only handle clicks when a frame is active for editing
      const activeFrameIndex = useAnimationStore.getState().activeFrameIndex;
      console.log('[Click] Active frame index:', activeFrameIndex);

      if (activeFrameIndex === null) {
        console.log('[Click] No active frame, ignoring click');
        return;
      }

      // Don't handle clicks during playback
      if (this.isPlaying) {
        console.log('[Click] Animation is playing, ignoring click');
        return;
      }

      console.log('[Click] Checking for sprite hit...');

      // Check if click hit any sprite in the animation container
      if (this.animationContainer) {
        const sprites = this.animationContainer.list as Phaser.GameObjects.Sprite[];
        console.log('[Click] Found', sprites.length, 'sprites in container');

        for (let i = 0; i < sprites.length; i++) {
          const sprite = sprites[i];
          if (!sprite) continue;

          const bounds = sprite.getBounds();
          console.log(`[Click] Sprite ${i} bounds:`, bounds);

          // Check if pointer is within sprite bounds
          if (bounds.contains(pointer.worldX, pointer.worldY)) {
            console.log('[Click] Hit sprite', i);

            // Get the cell data for this sprite
            const frame = this.animation.frames[this.currentFrameIndex];
            if (frame && i < frame.length) {
              const cellData = frame[i] as RMMVCellData;

              console.log('[Click] Opening edit dialog for cell', i, cellData);
              // Open edit dialog
              useAnimationStore.getState().openEditCellDialog(i, cellData);
              return;
            }
          }
        }
      }

      console.log('[Click] No sprite hit, opening add dialog');

      // If we get here, no sprite was clicked - open add dialog
      // Convert screen coordinates to animation container coordinates
      const containerPos = this.animationContainer
        ? { x: this.animationContainer.x, y: this.animationContainer.y }
        : { x: 0, y: 0 };

      const clickPosition = {
        x: pointer.worldX - containerPos.x,
        y: pointer.worldY - containerPos.y,
      };

      console.log('[Click] Opening add dialog at position', clickPosition);
      useAnimationStore.getState().openAddCellDialog(clickPosition);
    });
  }

  /**
   * Cleanup when scene is shutdown
   */
  shutdown(): void {
    // Unsubscribe from store
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
