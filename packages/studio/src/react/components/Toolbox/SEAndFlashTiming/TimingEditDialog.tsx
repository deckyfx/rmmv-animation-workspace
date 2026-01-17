/**
 * Timing Edit Dialog Component
 *
 * Dialog 2: Add/Edit timing configuration
 * Includes frame input, SE button, flash type selector, RGBA sliders, and preview
 */

import { useState, useEffect } from 'react';
import { Dialog } from '@react/components/common/Dialog/Dialog';
import { NumberInput } from '@react/components/common/NumberInput/NumberInput';
import { SEPickerDialog } from './SEPickerDialog';
import type { RMMVAnimationTiming, RMMVSoundEffect } from '@decky.fx/rmmv-animation-player';
import './TimingEditDialog.css';

interface TimingEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (timing: RMMVAnimationTiming) => void;
  initialTiming?: RMMVAnimationTiming;
  maxFrame: number;
}

const FLASH_SCOPE_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Target' },
  { value: 2, label: 'Screen' },
  { value: 3, label: 'Hide Target' },
];

export function TimingEditDialog({
  isOpen,
  onClose,
  onSave,
  initialTiming,
  maxFrame,
}: TimingEditDialogProps) {
  const [frame, setFrame] = useState(0);
  const [flashScope, setFlashScope] = useState(0);
  const [flashDuration, setFlashDuration] = useState(0);
  const [flashR, setFlashR] = useState(255);
  const [flashG, setFlashG] = useState(255);
  const [flashB, setFlashB] = useState(255);
  const [flashIntensity, setFlashIntensity] = useState(255);
  const [se, setSE] = useState<RMMVSoundEffect | null>(null);
  const [isSEPickerOpen, setIsSEPickerOpen] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // Initialize state from initialTiming
  useEffect(() => {
    if (isOpen) {
      if (initialTiming) {
        setFrame(initialTiming.frame);
        setFlashScope(initialTiming.flashScope);
        setFlashDuration(initialTiming.flashDuration);
        setFlashR(initialTiming.flashColor[0]);
        setFlashG(initialTiming.flashColor[1]);
        setFlashB(initialTiming.flashColor[2]);
        setFlashIntensity(initialTiming.flashColor[3]);
        setSE(initialTiming.se);
      } else {
        // Reset to defaults for new timing
        setFrame(0);
        setFlashScope(0);
        setFlashDuration(0);
        setFlashR(255);
        setFlashG(255);
        setFlashB(255);
        setFlashIntensity(255);
        setSE(null);
      }
    }
  }, [isOpen, initialTiming]);

  // Cleanup audio on unmount or close
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [audio]);

  useEffect(() => {
    if (!isOpen && audio) {
      audio.pause();
      audio.src = '';
      setAudio(null);
    }
  }, [isOpen, audio]);

  const handleSave = () => {
    const timing: RMMVAnimationTiming = {
      frame,
      flashScope,
      flashDuration,
      flashColor: [flashR, flashG, flashB, flashIntensity],
      se,
    };
    onSave(timing);
  };

  const handleSESelect = (selectedSE: RMMVSoundEffect) => {
    setSE(selectedSE);
    setIsSEPickerOpen(false);
  };

  const handleRemoveSE = () => {
    setSE(null);
  };

  const handlePreviewSE = () => {
    if (!se || !se.name) return;

    // Stop previous audio
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    // Create and play new audio
    const newAudio = new Audio(`/assets/se/${se.name}.ogg`);
    newAudio.volume = se.volume / 100;
    newAudio.playbackRate = se.pitch / 100;

    newAudio.play().catch((error) => {
      console.error('Failed to play SE:', error);
      // Try with .m4a extension if .ogg fails
      const fallbackAudio = new Audio(`/assets/se/${se.name}.m4a`);
      fallbackAudio.volume = se.volume / 100;
      fallbackAudio.playbackRate = se.pitch / 100;
      fallbackAudio.play().catch(() => {
        console.error('Failed to play SE with fallback extension');
      });
      setAudio(fallbackAudio);
    });

    setAudio(newAudio);
  };

  const previewColor = `rgba(${flashR}, ${flashG}, ${flashB}, ${flashIntensity / 255})`;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialTiming ? 'Edit Timing Event' : 'Add Timing Event'}
      size="large"
    >
      <div className="timing-edit-dialog">
        <div className="timing-edit-content">
          {/* Frame and Duration */}
          <div className="timing-edit-section">
            <label>
              Frame
              <NumberInput
                value={frame}
                onChange={setFrame}
                min={0}
                max={maxFrame - 1}
              />
              <span className="timing-hint">Frame {frame + 1}</span>
            </label>

            <label>
              Duration (frames)
              <NumberInput
                value={flashDuration}
                onChange={setFlashDuration}
                min={0}
                max={999}
              />
            </label>
          </div>

          {/* SE Section */}
          <div className="timing-edit-section">
            <h4>Sound Effect</h4>
            <div className="timing-se-display">
              {se && se.name ? (
                <div className="timing-se-info">
                  <i className="fa-solid fa-volume-high"></i>
                  <span className="timing-se-name">{se.name}</span>
                  <span className="timing-se-params">
                    [Vol: {se.volume}, Pitch: {se.pitch}, Pan: {se.pan}]
                  </span>
                  <button
                    className="timing-se-preview-inline"
                    onClick={handlePreviewSE}
                    title="Preview SE"
                  >
                    <i className="fa-solid fa-play"></i>
                  </button>
                  <button
                    className="timing-se-remove"
                    onClick={handleRemoveSE}
                    title="Remove SE"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              ) : (
                <div className="timing-se-empty">No SE selected</div>
              )}
            </div>
            <button className="timing-se-btn" onClick={() => setIsSEPickerOpen(true)}>
              <i className="fa-solid fa-music"></i>
              {se && se.name ? 'Change SE' : 'Select SE'}
            </button>
          </div>

          {/* Flash Section */}
          <div className="timing-edit-section">
            <h4>Flash Effect</h4>

            <label>
              Flash Type
              <select
                value={flashScope}
                onChange={(e) => setFlashScope(parseInt(e.target.value, 10))}
              >
                {FLASH_SCOPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {flashScope > 0 && (
              <>
                <div className="timing-flash-sliders">
                  <label>
                    Red
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={flashR}
                      onChange={(e) => setFlashR(parseInt(e.target.value, 10))}
                    />
                    <span>{flashR}</span>
                  </label>

                  <label>
                    Green
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={flashG}
                      onChange={(e) => setFlashG(parseInt(e.target.value, 10))}
                    />
                    <span>{flashG}</span>
                  </label>

                  <label>
                    Blue
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={flashB}
                      onChange={(e) => setFlashB(parseInt(e.target.value, 10))}
                    />
                    <span>{flashB}</span>
                  </label>

                  <label>
                    Intensity
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={flashIntensity}
                      onChange={(e) => setFlashIntensity(parseInt(e.target.value, 10))}
                    />
                    <span>{flashIntensity}</span>
                  </label>
                </div>

                <div className="timing-flash-preview">
                  <label>Preview</label>
                  <div
                    className="timing-flash-preview-box"
                    style={{ backgroundColor: previewColor }}
                  >
                    <span>Flash Color</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="timing-edit-footer">
          <button className="btn-secondary" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            <i className="fa-solid fa-check"></i>
            {initialTiming ? 'Update' : 'Add'}
          </button>
        </div>

        <SEPickerDialog
          isOpen={isSEPickerOpen}
          onClose={() => setIsSEPickerOpen(false)}
          onSelect={handleSESelect}
          initialSE={se}
        />
      </div>
    </Dialog>
  );
}
