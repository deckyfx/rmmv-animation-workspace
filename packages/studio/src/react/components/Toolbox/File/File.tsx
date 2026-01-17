/**
 * File Toolbox Component
 *
 * File operations section with Save, Export, and Delete buttons
 */

import { useAnimationStore } from '@react/store/useAnimationStore';
import './File.css';

export function File() {
  const {
    isDirty,
    isSaving,
    lastSaved,
    saveCurrentAnimation,
    exportCurrentAnimation,
    importAnimation,
    deleteCurrentAnimation,
    duplicateCurrentAnimation,
  } = useAnimationStore();

  const handleSave = async () => {
    await saveCurrentAnimation();
  };

  const handleExport = async () => {
    await exportCurrentAnimation();
  };

  const handleImport = async () => {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await importAnimation(file);
      }
    };

    input.click();
  };

  const handleDelete = async () => {
    await deleteCurrentAnimation();
  };

  const handleDuplicate = async () => {
    await duplicateCurrentAnimation();
  };

  const formatLastSaved = (date: Date | null) => {
    if (!date) return 'Never';

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="file-toolbox">
      <h3 className="section-title">File Operations</h3>

      <div className="file-actions">
        {/* Save Button */}
        <button
          className="file-btn file-btn-save"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          title="Save current animation to database"
        >
          <i className="fa-solid fa-floppy-disk"></i>
          {isSaving ? 'Saving...' : 'Save Animation'}
        </button>

        <div className="file-status">
          {isDirty && <span className="file-status-dirty">● Unsaved changes</span>}
          {!isDirty && lastSaved && (
            <span className="file-status-saved">
              ✓ Saved {formatLastSaved(lastSaved)}
            </span>
          )}
        </div>

        {/* Export Button */}
        <button
          className="file-btn file-btn-export"
          onClick={handleExport}
          disabled={isSaving}
          title="Export animation as portable JSON"
        >
          <i className="fa-solid fa-file-export"></i>
          Export Animation
        </button>

        <div className="file-help">
          Export as portable JSON for use in other Phaser projects
        </div>

        {/* Import Button */}
        <button
          className="file-btn file-btn-import"
          onClick={handleImport}
          disabled={isSaving}
          title="Import animation from JSON file"
        >
          <i className="fa-solid fa-file-import"></i>
          Import Animation
        </button>

        <div className="file-help">
          Import animation from exported JSON file
        </div>

        {/* Duplicate Button */}
        <button
          className="file-btn file-btn-duplicate"
          onClick={handleDuplicate}
          disabled={isSaving}
          title="Create a copy of current animation"
        >
          <i className="fa-solid fa-copy"></i>
          Duplicate Animation
        </button>

        <div className="file-help">
          Create a copy with a new ID
        </div>

        {/* Delete Button */}
        <button
          className="file-btn file-btn-delete"
          onClick={handleDelete}
          disabled={isSaving}
          title="Delete current animation (cannot be undone)"
        >
          <i className="fa-solid fa-trash"></i>
          Delete Animation
        </button>

        <div className="file-warning">
          ⚠️ Deletion cannot be undone
        </div>
      </div>
    </div>
  );
}
