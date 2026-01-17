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

  const handleAddFrame = () => {
    addFrame();
  };

  return (
    <div className="frames-toolbox">
      <h3 className="section-title">Frames</h3>

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

              <button
                className="frame-item-delete"
                onClick={(e) => handleDelete(index, e)}
                title="Delete frame"
              >
                <i className="fa-solid fa-trash"></i>
              </button>
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
