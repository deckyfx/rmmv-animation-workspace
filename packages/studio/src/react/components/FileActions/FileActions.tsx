/**
 * FileActions Component
 *
 * Top ribbon file action buttons: Save, Export, Duplicate, Delete
 */

import { useAnimationStore } from '@react/store/useAnimationStore';
import './FileActions.css';

export function FileActions() {
  const selectedAnimation = useAnimationStore((state) => state.selectedAnimation);
  const {
    isDirty,
    isSaving,
    saveCurrentAnimation,
    exportCurrentAnimation,
    deleteCurrentAnimation,
    duplicateCurrentAnimation,
  } = useAnimationStore();

  const handleSave = async () => {
    await saveCurrentAnimation();
  };

  const handleExport = async () => {
    await exportCurrentAnimation();
  };

  const handleDelete = async () => {
    await deleteCurrentAnimation();
  };

  const handleDuplicate = async () => {
    await duplicateCurrentAnimation();
  };

  // Disable all buttons if no animation is selected
  const disabled = !selectedAnimation || isSaving;

  return (
    <div className="file-actions">
      {/* Save Button */}
      <button
        className="file-action-btn file-action-save"
        onClick={handleSave}
        disabled={!isDirty || disabled}
        title="Save current animation to database"
      >
        <i className="fa-solid fa-floppy-disk"></i>
        {isSaving ? 'Saving...' : 'Save'}
      </button>

      {/* Export Button */}
      <button
        className="file-action-btn file-action-export"
        onClick={handleExport}
        disabled={disabled}
        title="Export animation as portable JSON"
      >
        <i className="fa-solid fa-file-export"></i>
        Export
      </button>

      {/* Duplicate Button */}
      <button
        className="file-action-btn file-action-duplicate"
        onClick={handleDuplicate}
        disabled={disabled}
        title="Create a copy of current animation"
      >
        <i className="fa-solid fa-copy"></i>
        Duplicate
      </button>

      {/* Delete Button */}
      <button
        className="file-action-btn file-action-delete"
        onClick={handleDelete}
        disabled={disabled}
        title="Delete current animation (cannot be undone)"
      >
        <i className="fa-solid fa-trash"></i>
        Delete
      </button>

      {/* Save Status Indicator */}
      {selectedAnimation && (
        <div className="file-action-status">
          {isDirty && <span className="status-dirty" title="Unsaved changes">●</span>}
          {!isDirty && <span className="status-saved" title="All changes saved">✓</span>}
        </div>
      )}
    </div>
  );
}
