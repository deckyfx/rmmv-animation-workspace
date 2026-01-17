/**
 * PlaybackControls Component
 *
 * Controls for playing and controlling animation playback
 */

import { useAnimationStore } from '@react/store/useAnimationStore';
import './PlaybackControls.css';

export function PlaybackControls() {
  const selectedAnimation = useAnimationStore((state) => state.selectedAnimation);
  const playback = useAnimationStore((state) => state.playback);

  // Don't show controls if no animation selected
  if (!selectedAnimation) {
    return null;
  }

  const handlePlay = () => {
    // Reset to beginning and play
    useAnimationStore.getState().stop(); // Reset to frame 0
    useAnimationStore.getState().play();
  };

  return (
    <div className="playback-controls">
      <div className="playback-info">
        <span className="animation-name">{selectedAnimation.name}</span>
      </div>

      <div className="playback-buttons">
        <button
          className="playback-button play-button"
          onClick={handlePlay}
          disabled={playback.isPlaying}
          title="Play animation once"
        >
          <span className="play-icon">▶</span>
          <span className="play-text">Play</span>
        </button>
      </div>

      <div className="playback-settings">
        <label>
          Speed:
          <select
            value={playback.speed}
            onChange={(e) => {
              useAnimationStore.getState().setPlayback({ speed: Number(e.target.value) });
            }}
          >
            <option value="0.25">0.25×</option>
            <option value="0.5">0.5×</option>
            <option value="1">1×</option>
            <option value="1.5">1.5×</option>
            <option value="2">2×</option>
          </select>
        </label>
      </div>
    </div>
  );
}
