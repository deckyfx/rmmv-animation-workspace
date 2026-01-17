/**
 * Frames Component
 *
 * Photoshop layer-style frame list for animation editing
 * - Lists all frames directly in toolbox
 * - Click frame to toggle active state
 * - Add/Delete frame buttons
 * - Shows cell count for each frame
 */

import { useAnimationStore } from '@react/store/useAnimationStore';
import type { RMMVAnimation } from '@decky.fx/rmmv-animation-player';
import './Frames.css';

interface FramesProps {
  animation: RMMVAnimation;
}

export function Frames({ animation }: FramesProps) {
  const activeFrameIndex = useAnimationStore((state) => state.activeFrameIndex);
  const setActiveFrame = useAnimationStore((state) => state.setActiveFrame);
  const addFrame = useAnimationStore((state) => state.addFrame);
  const deleteFrame = useAnimationStore((state) => state.deleteFrame);
  const copyFrame = useAnimationStore((state) => state.copyFrame);
  const reverseFrames = useAnimationStore((state) => state.reverseFrames);
  const removeEmptyFrames = useAnimationStore((state) => state.removeEmptyFrames);
  const mirrorFrames = useAnimationStore((state) => state.mirrorFrames);

  const handleFrameClick = (index: number) => {
    // Toggle: if already active, deselect; otherwise select
    if (activeFrameIndex === index) {
      setActiveFrame(null);
    } else {
      setActiveFrame(index);
    }
  };

  const handleDelete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent frame selection when clicking delete

    if (animation.frames.length <= 1) {
      alert('Cannot delete the last frame');
      return;
    }

    if (confirm(`Delete Frame ${index + 1}?`)) {
      deleteFrame(index);
    }
  };

  const handleCopy = (index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent frame selection when clicking copy
    copyFrame(index);
  };

  const handleAddFrame = () => {
    addFrame();
  };

  const handleReverse = () => {
    if (confirm('Reverse frame order?')) {
      reverseFrames();
    }
  };

  const handleRemoveEmpty = () => {
    const emptyCount = animation.frames.filter((f) => f.length === 0).length;
    if (emptyCount === 0) {
      alert('No empty frames to remove');
      return;
    }
    if (confirm(`Remove ${emptyCount} empty frame${emptyCount !== 1 ? 's' : ''}?`)) {
      removeEmptyFrames();
    }
  };

  const handleMirror = () => {
    const resultCount = animation.frames.length * 2;
    if (confirm(`Create mirrored IN-OUT animation?\n${animation.frames.length} frames → ${resultCount} frames`)) {
      mirrorFrames();
    }
  };

  return (
    <div className="frames-toolbox">
      <h3 className="section-title">Frames</h3>

      {/* Quick Operations */}
      <div className="frames-quick-ops">
        <button
          className="frames-quick-btn"
          onClick={handleReverse}
          title="Reverse frame order"
        >
          <i className="fa-solid fa-arrow-down-up-across-line"></i>
          Reverse
        </button>

        <button
          className="frames-quick-btn"
          onClick={handleRemoveEmpty}
          title="Remove all empty frames"
        >
          <i className="fa-solid fa-broom"></i>
          Clean
        </button>

        <button
          className="frames-quick-btn"
          onClick={handleMirror}
          title="Append reversed copy for IN-OUT animation"
        >
          <i className="fa-solid fa-right-left"></i>
          Mirror
        </button>
      </div>

      <div className="frames-list">
        {animation.frames.map((frame, index) => {
          const isActive = activeFrameIndex === index;
          const cellCount = frame.length;

          return (
            <div
              key={index}
              className={`frame-item ${isActive ? 'frame-item-active' : ''}`}
              onClick={() => handleFrameClick(index)}
            >
              <div className="frame-item-content">
                <div className="frame-item-icon">
                  <i className="fa-solid fa-layer-group"></i>
                </div>

                <div className="frame-item-info">
                  <div className="frame-item-title">Frame {index + 1}</div>
                  <div className="frame-item-meta">
                    {cellCount === 0 ? (
                      <span className="frame-item-empty">Empty</span>
                    ) : (
                      <span className="frame-item-count">
                        {cellCount} cell{cellCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="frame-item-actions">
                <button
                  className="frame-item-copy"
                  onClick={(e) => handleCopy(index, e)}
                  title="Copy frame"
                >
                  <i className="fa-solid fa-copy"></i>
                </button>

                <button
                  className="frame-item-delete"
                  onClick={(e) => handleDelete(index, e)}
                  title="Delete frame"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button className="frames-add-btn" onClick={handleAddFrame}>
        <i className="fa-solid fa-plus"></i>
        ADD FRAME
      </button>
    </div>
  );
}
