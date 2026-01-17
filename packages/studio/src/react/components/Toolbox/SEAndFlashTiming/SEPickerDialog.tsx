/**
 * SE Picker Dialog Component
 *
 * Dialog 3: Select SE from list with volume, pitch, pan sliders and preview
 */

import { useState, useEffect } from 'react';
import { Dialog } from '@react/components/common/Dialog/Dialog';
import type { RMMVSoundEffect } from '@decky.fx/rmmv-animation-player';
import './SEPickerDialog.css';

interface SEPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (se: RMMVSoundEffect) => void;
  initialSE: RMMVSoundEffect | null;
}

interface SEFile {
  filename: string;
  path: string;
}

export function SEPickerDialog({ isOpen, onClose, onSelect, initialSE }: SEPickerDialogProps) {
  const [seFiles, setSEFiles] = useState<SEFile[]>([]);
  const [selectedFilename, setSelectedFilename] = useState('');
  const [volume, setVolume] = useState(90);
  const [pitch, setPitch] = useState(100);
  const [pan, setPan] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // Fetch available SE files
  useEffect(() => {
    if (!isOpen) return;

    const fetchSEFiles = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/se');
        const data = await response.json();
        setSEFiles(data.seFiles || []);
      } catch (error) {
        console.error('Failed to fetch SE files:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSEFiles();
  }, [isOpen]);

  // Initialize state from initialSE
  useEffect(() => {
    if (isOpen) {
      if (initialSE && initialSE.name) {
        setSelectedFilename(initialSE.name);
        setVolume(initialSE.volume);
        setPitch(initialSE.pitch);
        setPan(initialSE.pan);
      } else {
        setSelectedFilename('');
        setVolume(90);
        setPitch(100);
        setPan(0);
      }
      setSearchQuery('');
    }
  }, [isOpen, initialSE]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [audio]);

  const handleSelect = () => {
    if (selectedFilename) {
      const se: RMMVSoundEffect = {
        name: selectedFilename,
        volume,
        pitch,
        pan,
      };
      onSelect(se);
    }
  };

  const handlePreview = () => {
    if (!selectedFilename) return;

    const selectedFile = seFiles.find((f) => f.filename === selectedFilename);
    if (!selectedFile) return;

    // Stop previous audio
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    // Create and play new audio
    const newAudio = new Audio(selectedFile.path);
    newAudio.volume = volume / 100;
    newAudio.playbackRate = pitch / 100;

    // Note: Pan is not directly supported in HTML5 Audio API
    // Would require Web Audio API for proper pan implementation

    newAudio.play().catch((error) => {
      console.error('Failed to play SE:', error);
    });

    setAudio(newAudio);
  };

  // Filter SE files by search query
  const filteredFiles = seFiles.filter((file) =>
    file.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Select Sound Effect" size="large">
      <div className="se-picker">
        <div className="se-picker-content">
          {/* Left side: File list */}
          <div className="se-picker-list">
            <div className="se-search">
              <i className="fa-solid fa-search"></i>
              <input
                type="text"
                placeholder="Search sound effects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="se-files">
              {isLoading && (
                <div className="se-loading">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <p>Loading sound effects...</p>
                </div>
              )}

              {!isLoading && filteredFiles.length === 0 && (
                <div className="se-empty">
                  <i className="fa-solid fa-volume-high"></i>
                  <p>No sound effects found</p>
                </div>
              )}

              {!isLoading &&
                filteredFiles.map((file) => (
                  <button
                    key={file.filename}
                    className={`se-file-item ${
                      selectedFilename === file.filename ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedFilename(file.filename)}
                  >
                    <i className="fa-solid fa-volume-high"></i>
                    <span>{file.filename}</span>
                    {selectedFilename === file.filename && (
                      <i className="fa-solid fa-check"></i>
                    )}
                  </button>
                ))}
            </div>
          </div>

          {/* Right side: Parameters and preview */}
          <div className="se-picker-controls">
            <div className="se-controls-section">
              <h4>Sound Parameters</h4>

              <div className="se-param">
                <label>
                  <i className="fa-solid fa-volume-high"></i>
                  Volume
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                  disabled={!selectedFilename}
                />
                <span>{volume}</span>
              </div>

              <div className="se-param">
                <label>
                  <i className="fa-solid fa-music"></i>
                  Pitch
                </label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={pitch}
                  onChange={(e) => setPitch(parseInt(e.target.value, 10))}
                  disabled={!selectedFilename}
                />
                <span>{pitch}</span>
              </div>

              <div className="se-param">
                <label>
                  <i className="fa-solid fa-sliders"></i>
                  Pan
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={pan}
                  onChange={(e) => setPan(parseInt(e.target.value, 10))}
                  disabled={!selectedFilename}
                />
                <span>{pan > 0 ? `+${pan}` : pan}</span>
              </div>
            </div>

            <button
              className="se-preview-btn"
              onClick={handlePreview}
              disabled={!selectedFilename}
            >
              <i className="fa-solid fa-play"></i>
              Preview Sound
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="se-picker-footer">
          <button className="btn-secondary" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSelect}
            disabled={!selectedFilename}
          >
            <i className="fa-solid fa-check"></i>
            Select
          </button>
        </div>
      </div>
    </Dialog>
  );
}
