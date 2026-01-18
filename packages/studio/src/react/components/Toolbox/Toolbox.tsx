/**
 * Toolbox Component
 *
 * Right panel containing animation editing tools
 * - General Settings
 * - SE and Flash Timing
 * - Frames Editor
 */

import { useAnimationStore } from '@react/store/useAnimationStore';
import { GeneralSettings } from './GeneralSettings/GeneralSettings';
import { Spritesheets } from './Spritesheets/Spritesheets';
import { SEAndFlashTiming } from './SEAndFlashTiming/SEAndFlashTiming';
import { Frames } from './Frames/Frames';
import { CellEditDialog } from './Frames/CellEditDialog';
import './Toolbox.css';

export function Toolbox() {
  const selectedAnimation = useAnimationStore(
    (state) => state.selectedAnimation
  );

  if (!selectedAnimation) {
    return (
      <div className="toolbox">
        <div className="toolbox-empty">
          <p>No animation selected</p>
          <p className="hint">Select an animation to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="toolbox">
      <div className="toolbox-section">
        <GeneralSettings animation={selectedAnimation} />
      </div>

      <div className="toolbox-section">
        <Spritesheets animation={selectedAnimation} />
      </div>

      <div className="toolbox-section">
        <SEAndFlashTiming animation={selectedAnimation} />
      </div>

      <div className="toolbox-section">
        <Frames animation={selectedAnimation} />
      </div>

      {/* Cell Edit Dialog */}
      <CellEditDialog animation={selectedAnimation} />
    </div>
  );
}
