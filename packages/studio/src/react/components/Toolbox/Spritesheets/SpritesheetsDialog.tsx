/**
 * Spritesheets Dialog Component
 *
 * Dialog content for managing animation sprite sheets
 * Shows list of active sheets with add/edit/delete operations
 */

import { useState } from 'react';
import type { RMMVAnimation } from '@decky.fx/rmmv-animation-player';
import { useAnimationStore } from '@react/store/useAnimationStore';
import { SpritesheetPicker } from './SpritesheetPicker';
import './SpritesheetsDialog.css';

interface SpritesheetsDialogProps {
  animation: RMMVAnimation;
  onClose: () => void;
}

interface SpriteSheet {
  slot: 1 | 2;
  name: string;
  hue: number;
}

export function SpritesheetsDialog({ animation, onClose }: SpritesheetsDialogProps) {
  const updateSelectedAnimation = useAnimationStore((state) => state.updateSelectedAnimation);
  const markDirty = useAnimationStore((state) => state.markDirty);

  // Local state for editing (only update store on Save)
  const [sheets, setSheets] = useState<SpriteSheet[]>(() => {
    const result: SpriteSheet[] = [];
    if (animation.animation1Name && animation.animation1Name.trim() !== '') {
      result.push({ slot: 1, name: animation.animation1Name, hue: animation.animation1Hue });
    }
    if (animation.animation2Name && animation.animation2Name.trim() !== '') {
      result.push({ slot: 2, name: animation.animation2Name, hue: animation.animation2Hue });
    }
    return result;
  });

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<1 | 2 | null>(null);

  const handleAdd = () => {
    // Find first available slot
    const usedSlots = new Set(sheets.map((s) => s.slot));
    const availableSlot = usedSlots.has(1) ? 2 : 1;
    setEditingSlot(availableSlot as 1 | 2);
    setIsPickerOpen(true);
  };

  const handleEdit = (slot: 1 | 2) => {
    setEditingSlot(slot);
    setIsPickerOpen(true);
  };

  const handleDelete = (slot: 1 | 2) => {
    setSheets(sheets.filter((s) => s.slot !== slot));
  };

  const handlePickerSelect = (filename: string, hue: number) => {
    if (editingSlot) {
      // Update or add the sheet
      const existingIndex = sheets.findIndex((s) => s.slot === editingSlot);
      if (existingIndex >= 0) {
        // Update existing
        const newSheets = [...sheets];
        newSheets[existingIndex] = { slot: editingSlot, name: filename, hue };
        setSheets(newSheets);
      } else {
        // Add new
        setSheets([...sheets, { slot: editingSlot, name: filename, hue }]);
      }
    }
    setIsPickerOpen(false);
    setEditingSlot(null);
  };

  const handleSave = () => {
    // Apply changes to animation
    const sheet1 = sheets.find((s) => s.slot === 1);
    const sheet2 = sheets.find((s) => s.slot === 2);

    updateSelectedAnimation({
      ...animation,
      animation1Name: sheet1?.name || '',
      animation1Hue: sheet1?.hue || 0,
      animation2Name: sheet2?.name || '',
      animation2Hue: sheet2?.hue || 0,
    });

    markDirty('animation1Name');
    markDirty('animation2Name');
    onClose();
  };

  const handleDiscard = () => {
    onClose();
  };

  const canAddMore = sheets.length < 2;

  return (
    <div className="spritesheets-dialog">
      <div className="spritesheets-list">
        {sheets.length === 0 && (
          <div className="spritesheets-empty">
            <i className="fa-solid fa-image"></i>
            <p>No spritesheets added yet</p>
            <p className="spritesheets-empty-hint">
              Click "Add Spritesheet" below to get started
            </p>
          </div>
        )}

        {sheets.map((sheet) => (
          <div key={sheet.slot} className="spritesheet-item">
            <div className="spritesheet-info">
              <i className="fa-solid fa-image"></i>
              <div className="spritesheet-details">
                <span className="spritesheet-name">{sheet.name}</span>
                <span className="spritesheet-hue">Hue: {sheet.hue}°</span>
              </div>
            </div>

            <div className="spritesheet-actions">
              <button
                className="spritesheet-btn spritesheet-btn-edit"
                onClick={() => handleEdit(sheet.slot)}
                title="Edit spritesheet"
              >
                <i className="fa-solid fa-pen"></i>
              </button>
              <button
                className="spritesheet-btn spritesheet-btn-delete"
                onClick={() => handleDelete(sheet.slot)}
                title="Remove spritesheet"
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        className="spritesheets-add-btn"
        onClick={handleAdd}
        disabled={!canAddMore}
        title={canAddMore ? 'Add new spritesheet' : 'Maximum 2 spritesheets allowed'}
      >
        <i className="fa-solid fa-plus"></i>
        Add Spritesheet
      </button>

      <div className="spritesheets-dialog-footer">
        <button className="btn-secondary" onClick={handleDiscard}>
          <i className="fa-solid fa-xmark"></i>
          Discard
        </button>
        <button className="btn-primary" onClick={handleSave}>
          <i className="fa-solid fa-check"></i>
          Save
        </button>
      </div>

      <SpritesheetPicker
        isOpen={isPickerOpen}
        onClose={() => {
          setIsPickerOpen(false);
          setEditingSlot(null);
        }}
        onSelect={handlePickerSelect}
        initialFilename={
          editingSlot ? sheets.find((s) => s.slot === editingSlot)?.name || '' : ''
        }
        initialHue={
          editingSlot ? sheets.find((s) => s.slot === editingSlot)?.hue || 0 : 0
        }
      />
    </div>
  );
}
