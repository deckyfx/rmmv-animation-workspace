/**
 * Timing List Dialog Component
 *
 * Dialog 1: Shows list of timing configurations
 * Displays table with columns: No, Frame, Duration, SE, Flash
 */

import { useState } from 'react';
import type { RMMVAnimation, RMMVAnimationTiming } from '@decky.fx/rmmv-animation-player';
import { useAnimationStore } from '@react/store/useAnimationStore';
import { TimingEditDialog } from './TimingEditDialog';
import './TimingListDialog.css';

interface TimingListDialogProps {
  animation: RMMVAnimation;
  onClose: () => void;
}

const FLASH_SCOPE_NAMES = ['None', 'Target', 'Screen', 'Hide Target'];

export function TimingListDialog({ animation, onClose }: TimingListDialogProps) {
  const updateSelectedAnimation = useAnimationStore((state) => state.updateSelectedAnimation);
  const markDirty = useAnimationStore((state) => state.markDirty);

  const [timings, setTimings] = useState<RMMVAnimationTiming[]>([...animation.timings]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAdd = () => {
    setEditingIndex(null);
    setIsEditDialogOpen(true);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    const newTimings = timings.filter((_, i) => i !== index);
    setTimings(newTimings);
  };

  const handleEditSave = (timing: RMMVAnimationTiming) => {
    let newTimings: RMMVAnimationTiming[];

    if (editingIndex !== null) {
      // Update existing
      newTimings = [...timings];
      newTimings[editingIndex] = timing;
    } else {
      // Add new
      newTimings = [...timings, timing];
    }

    // Sort by frame number
    newTimings.sort((a, b) => a.frame - b.frame);
    setTimings(newTimings);
    setIsEditDialogOpen(false);
    setEditingIndex(null);
  };

  const handleSave = () => {
    updateSelectedAnimation({
      ...animation,
      timings,
    });
    markDirty('timings');
    onClose();
  };

  const handleDiscard = () => {
    onClose();
  };

  const formatSE = (se: RMMVAnimationTiming['se']) => {
    if (!se || !se.name) return '-';
    return `${se.name} [${se.volume}, ${se.pitch}, ${se.pan}]`;
  };

  const formatFlash = (timing: RMMVAnimationTiming) => {
    if (timing.flashScope === 0 || timing.flashDuration === 0) return '-';
    const [r, g, b, intensity] = timing.flashColor;
    const type = FLASH_SCOPE_NAMES[timing.flashScope] || 'Unknown';
    return `${type} (${r}, ${g}, ${b}, ${intensity})`;
  };

  return (
    <div className="timing-list-dialog">
      <div className="timing-table-container">
        {timings.length === 0 ? (
          <div className="timing-table-empty">
            <i className="fa-solid fa-clock"></i>
            <p>No timing events configured</p>
            <p className="timing-empty-hint">
              Click "Add Timing Event" below to get started
            </p>
          </div>
        ) : (
          <table className="timing-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Frame</th>
                <th>Duration</th>
                <th>SE</th>
                <th>Flash</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {timings.map((timing, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{timing.frame + 1}</td>
                  <td>{timing.flashDuration}</td>
                  <td className="timing-se-cell">{formatSE(timing.se)}</td>
                  <td className="timing-flash-cell">{formatFlash(timing)}</td>
                  <td className="timing-actions-cell">
                    <button
                      className="timing-btn-edit"
                      onClick={() => handleEdit(index)}
                      title="Edit timing"
                    >
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    <button
                      className="timing-btn-delete"
                      onClick={() => handleDelete(index)}
                      title="Delete timing"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button className="timing-add-btn" onClick={handleAdd}>
        <i className="fa-solid fa-plus"></i>
        Add Timing Event
      </button>

      <div className="timing-list-footer">
        <button className="btn-secondary" onClick={handleDiscard}>
          <i className="fa-solid fa-xmark"></i>
          Discard
        </button>
        <button className="btn-primary" onClick={handleSave}>
          <i className="fa-solid fa-check"></i>
          Save
        </button>
      </div>

      <TimingEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingIndex(null);
        }}
        onSave={handleEditSave}
        initialTiming={editingIndex !== null ? timings[editingIndex] : undefined}
        maxFrame={animation.frames.length}
      />
    </div>
  );
}
