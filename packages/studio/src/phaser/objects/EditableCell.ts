/**
 * EditableCell - Interactive cell with drag, resize, and rotate handles
 *
 * Provides visual editing for animation cells in preview mode:
 * - Drag sprite to move
 * - Drag corner handle to resize (aspect ratio locked)
 * - Drag rotation handle to rotate
 * - Shows cell index
 * - Edit button to open cell dialog
 */

import Phaser from 'phaser';
import type { RMMVCellData } from '@decky.fx/rmmv-animation-player';
import { CellMoveHandle } from './CellMoveHandle';
import { CellResizeHandle } from './CellResizeHandle';
import { CellRotateHandle } from './CellRotateHandle';
import { CellEditHandle } from './CellEditHandle';
import { CellDeleteHandle } from './CellDeleteHandle';
import { CellNameInfo } from './CellNameInfo';

export interface EditableCellConfig {
  /** Cell index in frame */
  index: number;
  /** Cell data array */
  cellData: RMMVCellData;
  /** Sprite key */
  spriteKey: string;
  /** Frame key */
  frameKey: string;
  /** On cell data changed callback */
  onChange: (index: number, newData: RMMVCellData) => void;
  /** On edit button clicked callback */
  onEdit: (index: number, cellData: RMMVCellData) => void;
  /** On delete button clicked callback */
  onDelete: (index: number) => void;
}

export class EditableCell extends Phaser.GameObjects.Container {
  private config: EditableCellConfig;
  private sprite: Phaser.GameObjects.Sprite;
  private cellData: RMMVCellData;
  private cellColor: number; // Unique color for this cell

  // Visual elements
  private boundingBox?: Phaser.GameObjects.Graphics;
  private dragHandle?: CellMoveHandle;
  private resizeHandle?: CellResizeHandle;
  private rotateHandle?: CellRotateHandle;
  private nameInfo?: CellNameInfo;
  private editHandle?: CellEditHandle;
  private deleteHandle?: CellDeleteHandle;

  // Color palette for cells (distinct, vibrant colors)
  private static readonly COLOR_PALETTE = [
    0xff6b6b, // Red
    0x4ecdc4, // Teal
    0xffe66d, // Yellow
    0xa8e6cf, // Mint
    0xff8b94, // Pink
    0xc7ceea, // Lavender
    0xffd3b6, // Peach
    0xaaffaa, // Light Green
    0xffaaa5, // Coral
    0xb4f8c8, // Pastel Green
    0xfbe7c6, // Cream
    0xa0c4ff, // Sky Blue
    0xbdb2ff, // Periwinkle
    0xffc6ff, // Light Pink
    0xfdffb6, // Pale Yellow
  ];

  // Drag state
  private isDragging = false;
  private isResizing = false;
  private isRotating = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private resizeStartDistance = 0;
  private resizeStartScale = 0;
  private rotateStartAngle = 0;
  private rotateStartRotation = 0;

  constructor(scene: Phaser.Scene, config: EditableCellConfig) {
    super(scene, 0, 0);
    this.config = config;
    this.cellData = [...config.cellData] as RMMVCellData;

    // Assign color from palette based on index
    this.cellColor = EditableCell.COLOR_PALETTE[config.index % EditableCell.COLOR_PALETTE.length] || 0x6495ed;

    // Extract cell properties
    const [_cellId, x, y, scale, rotation, flip, opacity, blendMode] = this.cellData;

    // Create main sprite
    this.sprite = scene.add.sprite(0, 0, config.spriteKey, config.frameKey);

    // Apply transformations
    const finalScale = scale / 100;
    this.sprite.setScale(finalScale);
    this.sprite.setRotation((rotation * Math.PI) / 180);
    this.sprite.setAlpha(opacity / 255);

    if (flip) {
      this.sprite.setFlipX(true);
    }

    // Apply blend mode
    const blendModes = [
      Phaser.BlendModes.NORMAL,
      Phaser.BlendModes.ADD,
      Phaser.BlendModes.MULTIPLY,
      Phaser.BlendModes.SCREEN,
    ];
    this.sprite.setBlendMode(blendModes[blendMode] || Phaser.BlendModes.NORMAL);

    this.add(this.sprite);

    // Set container position
    this.setPosition(x, y);

    // Create interactive elements
    this.createBoundingBox();
    this.createHandles();
    this.createIndexDisplay();
    this.createButtons();

    // Setup interactions
    this.setupDragInteraction();

    scene.add.existing(this);
  }

  /**
   * Create bounding box around sprite
   */
  private createBoundingBox(): void {
    this.boundingBox = this.scene.add.graphics();
    this.boundingBox.lineStyle(1, this.cellColor, 1); // Use cell color

    const bounds = this.sprite.getBounds();
    const width = bounds.width;
    const height = bounds.height;

    this.boundingBox.strokeRect(-width / 2, -height / 2, width, height);
    this.add(this.boundingBox);
  }

  /**
   * Create drag, resize and rotate handles
   */
  private createHandles(): void {
    const bounds = this.sprite.getBounds();
    const width = bounds.width;
    const height = bounds.height;

    // Drag handle (center)
    this.dragHandle = new CellMoveHandle(this.scene, 0, 0, this.cellColor);
    this.add(this.dragHandle);

    // Resize handle (bottom-right corner)
    this.resizeHandle = new CellResizeHandle(this.scene, width / 2, height / 2, this.cellColor);
    this.add(this.resizeHandle);

    // Rotate handle (top-center)
    this.rotateHandle = new CellRotateHandle(this.scene, 0, -height / 2 - 20, this.cellColor, 20);
    this.add(this.rotateHandle);
  }

  /**
   * Create cell index display
   */
  private createIndexDisplay(): void {
    const bounds = this.sprite.getBounds();
    const width = bounds.width;
    const height = bounds.height;

    // Position at top-left corner
    this.nameInfo = new CellNameInfo(
      this.scene,
      -width / 2 + 5,
      -height / 2 + 5,
      this.config.index,
      this.cellColor
    );
    this.add(this.nameInfo);
  }

  /**
   * Create edit and delete buttons
   */
  private createButtons(): void {
    const bounds = this.sprite.getBounds();
    const width = bounds.width;
    const height = bounds.height;

    // Edit button (top-right) - uses cell color
    this.editHandle = new CellEditHandle(this.scene, width / 2 - 16, -height / 2 + 14, this.cellColor);
    this.editHandle.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.config.onEdit(this.config.index, this.cellData);
    });
    this.add(this.editHandle);

    // Delete button (top-right, next to edit)
    this.deleteHandle = new CellDeleteHandle(this.scene, width / 2 - 60, -height / 2 + 14);
    this.deleteHandle.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      if (confirm(`Delete cell #${this.config.index}?`)) {
        this.config.onDelete(this.config.index);
      }
    });
    this.add(this.deleteHandle);
  }

  /**
   * Setup drag interactions for move, resize, and rotate
   */
  private setupDragInteraction(): void {
    // Drag handle - move cell
    if (this.dragHandle) {
      this.dragHandle.on('pointerover', () => {
        this.scene.input.setDefaultCursor('move');
      });
      this.dragHandle.on('pointerout', () => {
        this.scene.input.setDefaultCursor('default');
      });
      this.dragHandle.on('pointerdown', (pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.isDragging = true;
        this.dragStartX = pointer.x - this.x;
        this.dragStartY = pointer.y - this.y;
      });
    }

    // Resize handle drag
    if (this.resizeHandle) {
      this.resizeHandle.on('pointerover', () => {
        this.scene.input.setDefaultCursor('nwse-resize');
      });
      this.resizeHandle.on('pointerout', () => {
        this.scene.input.setDefaultCursor('default');
      });
      this.resizeHandle.on('pointerdown', (pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.isResizing = true;
        this.resizeStartDistance = Phaser.Math.Distance.Between(this.x, this.y, pointer.x, pointer.y);
        this.resizeStartScale = this.cellData[3]; // scale value
      });
    }

    // Rotate handle drag
    if (this.rotateHandle) {
      this.rotateHandle.on('pointerover', () => {
        this.scene.input.setDefaultCursor('grab');
      });
      this.rotateHandle.on('pointerout', () => {
        this.scene.input.setDefaultCursor('default');
      });
      this.rotateHandle.on('pointerdown', (pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.isRotating = true;
        this.rotateStartAngle = Phaser.Math.Angle.Between(this.x, this.y, pointer.x, pointer.y);
        this.rotateStartRotation = this.cellData[4]; // rotation value
      });
    }

    // Global pointer move
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        // Move cell
        const newX = pointer.x - this.dragStartX;
        const newY = pointer.y - this.dragStartY;
        this.setPosition(newX, newY);
        this.updateCellData();
      } else if (this.isResizing) {
        const currentDistance = Phaser.Math.Distance.Between(this.x, this.y, pointer.x, pointer.y);
        const scaleFactor = currentDistance / this.resizeStartDistance;
        const newScale = Math.max(10, Math.min(500, this.resizeStartScale * scaleFactor)); // Clamp 10-500%

        this.cellData[3] = Math.round(newScale);
        this.sprite.setScale(newScale / 100);
        // Don't call updateVisuals() during drag - it causes blinking
      } else if (this.isRotating) {
        const currentAngle = Phaser.Math.Angle.Between(this.x, this.y, pointer.x, pointer.y);
        const angleDiff = Phaser.Math.RadToDeg(currentAngle - this.rotateStartAngle);
        const newRotation = (this.rotateStartRotation + angleDiff) % 360;

        this.cellData[4] = Math.round(newRotation);
        this.sprite.setRotation((newRotation * Math.PI) / 180);
        // Don't call updateVisuals() during drag - it causes blinking
      }
    });

    // Global pointer up
    this.scene.input.on('pointerup', (_pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        this.isDragging = false;
        this.notifyChange();
      } else if (this.isResizing || this.isRotating) {
        this.isResizing = false;
        this.isRotating = false;
        // Update visuals now that drag is complete
        this.updateVisuals();
        this.notifyChange();
      }
    });
  }

  /**
   * Update cell data based on current transform
   */
  private updateCellData(): void {
    this.cellData[1] = Math.round(this.x);
    this.cellData[2] = Math.round(this.y);
  }

  /**
   * Update visual elements after transform
   */
  private updateVisuals(): void {
    const bounds = this.sprite.getBounds();
    const width = bounds.width;
    const height = bounds.height;

    // Update bounding box
    if (this.boundingBox) {
      this.boundingBox.clear();
      this.boundingBox.lineStyle(3, this.cellColor, 1);
      this.boundingBox.strokeRect(-width / 2, -height / 2, width, height);
    }

    // Drag handle stays at center (0, 0) - no update needed

    // Update resize handle position (bottom-right corner)
    if (this.resizeHandle) {
      this.resizeHandle.updatePosition(width / 2, height / 2);
    }

    // Update rotate handle position (top-center)
    if (this.rotateHandle) {
      this.rotateHandle.updatePosition(0, -height / 2 - 20, 20);
    }

    // Update name info position (top-left)
    if (this.nameInfo) {
      this.nameInfo.setPosition(-width / 2 + 5, -height / 2 + 5);
    }

    // Update edit handle position and color (top-right)
    if (this.editHandle) {
      this.editHandle.setPosition(width / 2 - 16, -height / 2 + 14);
      this.editHandle.updateColor(this.cellColor);
    }

    // Update delete handle position (top-right, next to edit)
    if (this.deleteHandle) {
      this.deleteHandle.setPosition(width / 2 - 60, -height / 2 + 14);
    }
  }

  /**
   * Notify parent of cell data change
   */
  private notifyChange(): void {
    this.config.onChange(this.config.index, this.cellData);
  }

  /**
   * Cleanup
   */
  override destroy(fromScene?: boolean): void {
    this.sprite.destroy();
    this.boundingBox?.destroy();
    this.dragHandle?.destroy();
    this.resizeHandle?.destroy();
    this.rotateHandle?.destroy();
    this.nameInfo?.destroy();
    this.editHandle?.destroy();
    this.deleteHandle?.destroy();
    super.destroy(fromScene);
  }
}
