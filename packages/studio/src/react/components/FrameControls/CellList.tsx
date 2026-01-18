/**
 * CellList Component
 *
 * Horizontal list of cells in current frame
 * Clicking a cell opens edit dialog - solves stacking issue
 */

import { useAnimationStore } from '@react/store/useAnimationStore';
import type { RMMVCellData } from '@decky.fx/rmmv-animation-player';
import { getCellCoordinates, RMMV_CELL_SIZE } from '@decky.fx/rmmv-animation-player';
import './CellList.css';

export function CellList() {
  const selectedAnimation = useAnimationStore((state) => state.selectedAnimation);
  const activeFrameIndex = useAnimationStore((state) => state.activeFrameIndex);

  if (!selectedAnimation || activeFrameIndex === null) {
    return null;
  }

  const currentFrame = selectedAnimation.frames[activeFrameIndex];

  // Debug: Log frame data
  console.log('CellList Debug:', {
    animationId: selectedAnimation.id,
    activeFrameIndex,
    currentFrame,
    frameLength: currentFrame?.length,
  });

  if (!currentFrame || currentFrame.length === 0) {
    return (
      <div className="cell-list">
        <div className="cell-list-empty">No cells in this frame</div>
      </div>
    );
  }

  const handleCellClick = (cellIndex: number, cellData: RMMVCellData) => {
    useAnimationStore.getState().openEditCellDialog(cellIndex, cellData);
  };

  // Color palette for cells (distinct, vibrant colors) - same as EditableCell
  const COLOR_PALETTE = [
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

  // Helper to get sprite sheet info
  const getSpriteSheetForCell = (cellId: number) => {
    if (cellId < 0) return null;

    // Determine which sprite sheet to use
    const sheet1MaxCells = selectedAnimation.animation1Name ? 100 : 0;

    if (cellId < sheet1MaxCells && selectedAnimation.animation1Name) {
      return {
        sheetName: selectedAnimation.animation1Name,
        normalizedCellId: cellId,
      };
    } else if (selectedAnimation.animation2Name) {
      return {
        sheetName: selectedAnimation.animation2Name,
        normalizedCellId: cellId - sheet1MaxCells,
      };
    }

    return null;
  };

  return (
    <div className="cell-list">
      <div className="cell-list-header">
        Cells in Frame {activeFrameIndex + 1}
      </div>
      <div className="cell-list-items">
        {currentFrame.map((cell, index) => {
          const cellColor = COLOR_PALETTE[index % COLOR_PALETTE.length] || 0x6495ed;
          const colorHex = `#${cellColor.toString(16).padStart(6, '0')}`;

          const cellId = cell[0];
          const sheetInfo = getSpriteSheetForCell(cellId);

          // Calculate sprite position
          let spriteStyle: React.CSSProperties = {};
          if (sheetInfo) {
            const imagePath = `/assets/img/animations/${sheetInfo.sheetName}.png`;

            // Assume 5 columns (typical for RMMV sprite sheets)
            const columns = 5;
            const coords = getCellCoordinates(sheetInfo.normalizedCellId, columns);

            // Scale down from 192px cells to 48px preview
            const displaySize = 48; // Preview size in CSS
            const scaleRatio = displaySize / RMMV_CELL_SIZE; // 48 / 192 = 0.25

            // Scale both position and size proportionally
            const scaledBgSize = columns * RMMV_CELL_SIZE * scaleRatio; // e.g., 5 * 192 * 0.25 = 240px
            const scaledX = coords.x * scaleRatio;
            const scaledY = coords.y * scaleRatio;

            spriteStyle = {
              backgroundImage: `url(${imagePath})`,
              backgroundPosition: `-${scaledX}px -${scaledY}px`,
              backgroundSize: `${scaledBgSize}px auto`,
              backgroundRepeat: 'no-repeat',
            };
          }

          return (
            <div
              key={index}
              className="cell-list-item"
              onClick={() => handleCellClick(index, cell)}
              style={{ borderColor: colorHex }}
              title={`Cell #${index} - Click to edit`}
            >
              <div className="cell-list-item-badge" style={{ backgroundColor: colorHex }}>
                {index}
              </div>
              {sheetInfo ? (
                <div className="cell-list-item-sprite" style={spriteStyle} />
              ) : (
                <div className="cell-list-item-icon">
                  <i className="fa-solid fa-image"></i>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
