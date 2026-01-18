/**
 * Cell Edit Dialog Component
 *
 * Dialog for adding/editing animation cells
 * - Select sprite slice from spritesheet
 * - Edit cell properties (x, y, scale, rotation, flip, opacity, blend)
 * - Preview selected cell
 * - Save/Discard/Delete
 */

import { useState, useEffect } from 'react';
import { Dialog } from '@react/components/common/Dialog/Dialog';
import { NumberInput } from '@react/components/common/NumberInput/NumberInput';
import { useAnimationStore } from '@react/store/useAnimationStore';
import type { RMMVCellData, RMMVAnimation } from '@decky.fx/rmmv-animation-player/types';
import { RMMV_CELL_SIZE } from '@decky.fx/rmmv-animation-player/types';
import './CellEditDialog.css';

interface CellEditDialogProps {
  animation: RMMVAnimation;
}

const BLEND_MODES = [
  { value: 0, label: 'Normal' },
  { value: 1, label: 'Additive' },
  { value: 2, label: 'Multiply' },
  { value: 3, label: 'Screen' },
];

export function CellEditDialog({ animation }: CellEditDialogProps) {
  const cellDialog = useAnimationStore((state) => state.cellDialog);
  const closeCellDialog = useAnimationStore((state) => state.closeCellDialog);
  const saveCell = useAnimationStore((state) => state.saveCell);
  const deleteCell = useAnimationStore((state) => state.deleteCell);

  // Cell properties
  const [cellId, setCellId] = useState(0);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [scale, setScale] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState(0);
  const [opacity, setOpacity] = useState(255);
  const [blendMode, setBlendMode] = useState(0);

  // Selected sprite sheet (1 or 2)
  const [selectedSheet, setSelectedSheet] = useState<1 | 2>(1);

  // Sprite sheet metadata (columns per sheet)
  const [sheetMetadata, setSheetMetadata] = useState<Record<string, { columns: number; cellSize: number }>>({});

  // Fetch sprite sheet metadata when dialog opens
  useEffect(() => {
    if (cellDialog.isOpen) {
      fetch('/api/spritesheets')
        .then((res) => res.json())
        .then((data) => {
          const metadata: Record<string, { columns: number; cellSize: number }> = {};
          data.spriteSheets?.forEach((sheet: { filename: string; columns: number; cellSize: number }) => {
            metadata[sheet.filename] = { columns: sheet.columns, cellSize: sheet.cellSize };
          });
          setSheetMetadata(metadata);
        })
        .catch((err) => console.error('Failed to load sprite sheet metadata:', err));
    }
  }, [cellDialog.isOpen]);

  // Initialize state from cellDialog
  useEffect(() => {
    if (cellDialog.isOpen) {
      if (cellDialog.mode === 'edit' && cellDialog.cellData) {
        // Edit mode: load existing cell data
        const cell = cellDialog.cellData;
        setCellId(cell[0]);
        setX(cell[1]);
        setY(cell[2]);
        setScale(cell[3]);
        setRotation(cell[4]);
        setFlip(cell[5]);
        setOpacity(cell[6]);
        setBlendMode(cell[7]);

        // Determine which sheet based on cellId
        setSelectedSheet(cell[0] >= 100 ? 2 : 1);
      } else if (cellDialog.mode === 'add' && cellDialog.clickPosition) {
        // Add mode: use defaults with click position
        setCellId(0);
        setX(cellDialog.clickPosition.x);
        setY(cellDialog.clickPosition.y);
        setScale(100);
        setRotation(0);
        setFlip(0);
        setOpacity(255);
        setBlendMode(0);
        setSelectedSheet(1);
      }
    }
  }, [cellDialog.isOpen, cellDialog.mode, cellDialog.cellData, cellDialog.clickPosition]);

  const handleSave = () => {
    const cellData: RMMVCellData = [
      cellId,
      x,
      y,
      scale,
      rotation,
      flip,
      opacity,
      blendMode,
    ];

    if (cellDialog.mode === 'edit' && cellDialog.cellIndex !== null) {
      saveCell(cellData, cellDialog.cellIndex);
    } else {
      saveCell(cellData);
    }
  };

  const handleDelete = () => {
    if (cellDialog.cellIndex !== null && confirm('Delete this cell?')) {
      deleteCell(cellDialog.cellIndex);
    }
  };

  const handleCellSelect = (selectedCellId: number) => {
    setCellId(selectedCellId);
  };

  // Get sprite sheet info
  const sheet1Name = animation.animation1Name;
  const sheet2Name = animation.animation2Name;
  const currentSheetName = selectedSheet === 1 ? sheet1Name : sheet2Name;
  const currentSheetPath = currentSheetName
    ? `/assets/img/animations/${currentSheetName}.png`
    : '';

  // Get current sheet metadata
  const currentColumns = currentSheetName ? (sheetMetadata[currentSheetName]?.columns || 5) : 5;

  // Calculate normalized cell ID (0-99 for sheet 1, 100-199 for sheet 2) for preview
  const normalizedCellId = cellId % 100;
  const col = normalizedCellId % currentColumns;
  const row = Math.floor(normalizedCellId / currentColumns);

  if (!cellDialog.isOpen) return null;

  // Build title with cell index
  let dialogTitle = 'Add Cell';
  if (cellDialog.mode === 'edit') {
    dialogTitle = cellDialog.cellIndex !== null
      ? `Edit Cell #${cellDialog.cellIndex}`
      : 'Edit Cell';
  }

  return (
    <Dialog
      isOpen={cellDialog.isOpen}
      onClose={closeCellDialog}
      title={dialogTitle}
      size="large"
    >
      <div className="cell-edit-dialog">
        <div className="cell-edit-content">
          {/* Left: Sprite Sheet Grid */}
          <div className="cell-edit-left">
            <div className="cell-sheet-selector">
              <button
                className={`cell-sheet-btn ${selectedSheet === 1 ? 'active' : ''}`}
                onClick={() => setSelectedSheet(1)}
                disabled={!sheet1Name}
              >
                <i className="fa-solid fa-image"></i>
                Sheet 1
                {sheet1Name && <span className="cell-sheet-name">{sheet1Name}</span>}
              </button>
              <button
                className={`cell-sheet-btn ${selectedSheet === 2 ? 'active' : ''}`}
                onClick={() => setSelectedSheet(2)}
                disabled={!sheet2Name}
              >
                <i className="fa-solid fa-image"></i>
                Sheet 2
                {sheet2Name && <span className="cell-sheet-name">{sheet2Name}</span>}
              </button>
            </div>

            {currentSheetName ? (
              <div className="cell-sprite-grid">
                {/* Show first 25 cells (5 rows × currentColumns) */}
                {Array.from({ length: currentColumns * 5 }, (_, i) => {
                  const actualCellId = selectedSheet === 1 ? i : i + 100;
                  const isSelected = cellId === actualCellId;
                  const gridCol = i % currentColumns;
                  const gridRow = Math.floor(i / currentColumns);

                  // Scale down from 192px cells to 64px display
                  const displaySize = 64;
                  const bgX = gridCol * displaySize;
                  const bgY = gridRow * displaySize;

                  return (
                    <div
                      key={i}
                      className={`cell-grid-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleCellSelect(actualCellId)}
                      title={`Cell ${actualCellId} (col:${gridCol}, row:${gridRow})`}
                    >
                      <div
                        className="cell-grid-preview"
                        style={{
                          backgroundImage: `url(${currentSheetPath})`,
                          backgroundPosition: `-${bgX}px -${bgY}px`,
                          backgroundSize: `${currentColumns * displaySize}px auto`,
                        }}
                      />
                      <div className="cell-grid-number">
                        {i}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="cell-no-sheet">
                <i className="fa-solid fa-image-slash"></i>
                <p>No sprite sheet selected</p>
              </div>
            )}
          </div>

          {/* Right: Properties and Preview */}
          <div className="cell-edit-right">
            {/* Preview */}
            <div className="cell-preview-section">
              <h4>Preview</h4>
              <div
                className="cell-preview-box"
                style={{
                  opacity: opacity / 255,
                }}
              >
                {currentSheetName && (
                  <div
                    className="cell-preview-sprite"
                    style={{
                      backgroundImage: `url(${currentSheetPath})`,
                      backgroundPosition: `-${col * RMMV_CELL_SIZE}px -${row * RMMV_CELL_SIZE}px`,
                      backgroundSize: `${currentColumns * RMMV_CELL_SIZE}px auto`,
                      transform: `scale(${scale / 100}) rotate(${rotation}deg) scaleX(${flip ? -1 : 1})`,
                      mixBlendMode: ['normal', 'screen', 'multiply', 'screen'][blendMode] as any,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Properties */}
            <div className="cell-properties">
              <h4>Properties</h4>

              <div className="cell-prop-group">
                <label>
                  Position X
                  <NumberInput
                    value={Math.round(x * 100) / 100}
                    onChange={setX}
                    min={-9999}
                    max={9999}
                    step={0.01}
                  />
                </label>

                <label>
                  Position Y
                  <NumberInput
                    value={Math.round(y * 100) / 100}
                    onChange={setY}
                    min={-9999}
                    max={9999}
                    step={0.01}
                  />
                </label>
              </div>

              <div className="cell-prop-group">
                <label>
                  Scale (%)
                  <NumberInput value={scale} onChange={setScale} min={1} max={500} />
                </label>

                <label>
                  Rotation (°)
                  <NumberInput value={rotation} onChange={setRotation} min={-360} max={360} />
                </label>
              </div>

              <div className="cell-prop-group">
                <label>
                  Mirror
                  <select value={flip} onChange={(e) => setFlip(parseInt(e.target.value))}>
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                  </select>
                </label>

                <label>
                  Blend Mode
                  <select value={blendMode} onChange={(e) => setBlendMode(parseInt(e.target.value))}>
                    {BLEND_MODES.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="cell-prop-group full-width">
                <label>
                  Opacity
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={opacity}
                    onChange={(e) => setOpacity(parseInt(e.target.value))}
                  />
                  <span className="cell-opacity-value">{opacity}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="cell-edit-footer">
          {cellDialog.mode === 'edit' && (
            <button className="btn-danger" onClick={handleDelete}>
              <i className="fa-solid fa-trash"></i>
              DELETE
            </button>
          )}
          <div className="cell-edit-footer-right">
            <button className="btn-secondary" onClick={closeCellDialog}>
              <i className="fa-solid fa-xmark"></i>
              DISCARD
            </button>
            <button className="btn-primary" onClick={handleSave}>
              <i className="fa-solid fa-check"></i>
              {cellDialog.mode === 'edit' ? 'UPDATE' : 'ADD'}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
