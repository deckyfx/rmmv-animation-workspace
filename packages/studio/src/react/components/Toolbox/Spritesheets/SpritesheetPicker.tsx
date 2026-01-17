/**
 * Spritesheet Picker Component
 *
 * Nested dialog for selecting sprite sheet files
 * Shows list of available files with preview and hue adjustment
 */

import { useState, useEffect } from 'react';
import { Dialog } from '@react/components/common/Dialog/Dialog';
import './SpritesheetPicker.css';

interface SpritesheetPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (filename: string, hue: number) => void;
  initialFilename?: string;
  initialHue?: number;
}

interface SpriteSheet {
  filename: string;
  path: string;
}

export function SpritesheetPicker({
  isOpen,
  onClose,
  onSelect,
  initialFilename = '',
  initialHue = 0,
}: SpritesheetPickerProps) {
  const [spriteSheets, setSpriteSheets] = useState<SpriteSheet[]>([]);
  const [selectedFilename, setSelectedFilename] = useState(initialFilename);
  const [hue, setHue] = useState(initialHue);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch available sprite sheets
  useEffect(() => {
    if (!isOpen) return;

    const fetchSpriteSheets = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/spritesheets');
        const data = await response.json();
        setSpriteSheets(data.spriteSheets || []);
      } catch (error) {
        console.error('Failed to fetch sprite sheets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpriteSheets();
  }, [isOpen]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFilename(initialFilename);
      setHue(initialHue);
      setSearchQuery('');
    }
  }, [isOpen, initialFilename, initialHue]);

  const handleSave = () => {
    if (selectedFilename) {
      onSelect(selectedFilename, hue);
      onClose();
    }
  };

  const handleDiscard = () => {
    onClose();
  };

  // Filter sprite sheets by search query
  const filteredSheets = spriteSheets.filter((sheet) =>
    sheet.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get preview path for selected sprite
  const selectedSheet = spriteSheets.find((s) => s.filename === selectedFilename);
  const previewPath = selectedSheet?.path;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Select Spritesheet" size="large">
      <div className="spritesheet-picker">
        <div className="spritesheet-picker-content">
          {/* Left side: File list */}
          <div className="spritesheet-picker-list">
            <div className="spritesheet-search">
              <i className="fa-solid fa-search"></i>
              <input
                type="text"
                placeholder="Search sprite sheets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="spritesheet-files">
              {isLoading && (
                <div className="spritesheet-loading">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <p>Loading sprite sheets...</p>
                </div>
              )}

              {!isLoading && filteredSheets.length === 0 && (
                <div className="spritesheet-empty">
                  <i className="fa-solid fa-image"></i>
                  <p>No sprite sheets found</p>
                </div>
              )}

              {!isLoading &&
                filteredSheets.map((sheet) => (
                  <button
                    key={sheet.filename}
                    className={`spritesheet-file-item ${
                      selectedFilename === sheet.filename ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedFilename(sheet.filename)}
                  >
                    <i className="fa-solid fa-image"></i>
                    <span>{sheet.filename}</span>
                    {selectedFilename === sheet.filename && (
                      <i className="fa-solid fa-check"></i>
                    )}
                  </button>
                ))}
            </div>
          </div>

          {/* Right side: Preview and hue slider */}
          <div className="spritesheet-picker-preview">
            <div className="spritesheet-preview-container">
              {previewPath ? (
                <img
                  src={previewPath}
                  alt={selectedFilename}
                  className="spritesheet-preview-image"
                  style={{
                    filter: `hue-rotate(${hue}deg)`,
                  }}
                />
              ) : (
                <div className="spritesheet-preview-empty">
                  <i className="fa-solid fa-image"></i>
                  <p>Select a sprite sheet to preview</p>
                </div>
              )}
            </div>

            <div className="spritesheet-hue-control">
              <label htmlFor="hue-slider">
                <i className="fa-solid fa-palette"></i>
                Hue: {hue}°
              </label>
              <input
                id="hue-slider"
                type="range"
                min="0"
                max="360"
                value={hue}
                onChange={(e) => setHue(parseInt(e.target.value, 10))}
                disabled={!selectedFilename}
              />
              <div className="hue-marks">
                <span>0°</span>
                <span>90°</span>
                <span>180°</span>
                <span>270°</span>
                <span>360°</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="spritesheet-picker-footer">
          <button className="btn-secondary" onClick={handleDiscard}>
            <i className="fa-solid fa-xmark"></i>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
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
