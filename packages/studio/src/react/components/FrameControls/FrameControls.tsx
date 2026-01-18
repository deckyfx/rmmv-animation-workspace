/**
 * FrameControls Component
 *
 * Container for PlaybackControls (left) and CellList (right)
 */

import { PlaybackControls } from '../PlaybackControls/PlaybackControls';
import { CellList } from './CellList';
import './FrameControls.css';

export function FrameControls() {
  return (
    <div className="frame-controls">
      <PlaybackControls />
      <CellList />
    </div>
  );
}
