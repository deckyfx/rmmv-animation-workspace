/**
 * Animation Store - EventBus for React ↔ Phaser Communication
 *
 * Central Zustand store managing application state and communication
 * between React UI and Phaser scene.
 */

import { create } from 'zustand';
import type { RMMVAnimation, RMMVAnimationsData, RMMVCellData } from '@decky.fx/rmmv-animation-player';

/**
 * Asset loading state tracking
 */
export interface LoadedAsset {
  /** Asset key/name */
  key: string;
  /** Sprite sheet filename */
  filename: string;
  /** Timestamp when loaded */
  loadedAt: number;
  /** Whether asset is currently in use */
  inUse: boolean;
}

/**
 * Animation playback state
 */
export interface PlaybackState {
  /** Whether animation is currently playing */
  isPlaying: boolean;
  /** Current frame index (internal use only) */
  currentFrame: number;
  /** Playback speed multiplier (1.0 = normal) */
  speed: number;
}

/**
 * Application state interface
 */
export interface AnimationStoreState {
  /* ========== Data State ========== */
  /** All loaded animations from Animations.json */
  animations: RMMVAnimationsData;
  /** Currently selected animation ID */
  selectedAnimationId: number | null;
  /** Currently selected animation object */
  selectedAnimation: RMMVAnimation | null;
  /** Original animation state (for dirty tracking) */
  originalAnimation: RMMVAnimation | null;

  /* ========== Dirty State Tracking ========== */
  /** Whether current animation has unsaved changes */
  isDirty: boolean;
  /** Track which fields have changed */
  dirtyFields: Set<string>;

  /* ========== Save State ========== */
  /** Whether save operation is in progress */
  isSaving: boolean;
  /** Timestamp of last successful save */
  lastSaved: Date | null;

  /* ========== Asset Management ========== */
  /** Registry of loaded sprite sheet assets */
  loadedAssets: LoadedAsset[];
  /** Maximum number of assets to keep in LRU cache */
  maxCachedAssets: number;

  /* ========== Playback State ========== */
  /** Current playback state */
  playback: PlaybackState;

  /* ========== UI State ========== */
  /** Whether assets are currently loading */
  isLoading: boolean;
  /** Current loading progress (0-1) */
  loadingProgress: number;
  /** Error message if any */
  error: string | null;

  /* ========== Frame Editing State ========== */
  /** Currently active frame index for editing (null = no frame selected) */
  activeFrameIndex: number | null;

  /* ========== Cell Editing State ========== */
  /** Cell dialog state for add/edit cell operations */
  cellDialog: {
    isOpen: boolean;
    mode: 'add' | 'edit';
    cellIndex: number | null; // Index within frame's cell array (for edit mode)
    cellData: RMMVCellData | null; // Cell data for edit mode
    clickPosition: { x: number; y: number } | null; // Canvas click position for add mode
  };

  /* ========== Actions ========== */
  /** Load animations data from API */
  loadAnimationsData: (data: RMMVAnimationsData) => void;

  /** Select an animation by ID (triggers Phaser recreation) */
  selectAnimation: (id: number) => Promise<void>;

  /** Update selected animation (for editing) */
  updateSelectedAnimation: (animation: RMMVAnimation) => void;

  /** Register a loaded asset */
  registerAsset: (asset: LoadedAsset) => void;

  /** Unload an asset by key */
  unloadAsset: (key: string) => void;

  /** Mark asset as in use */
  markAssetInUse: (key: string, inUse: boolean) => void;

  /** Clean up unused assets based on LRU */
  cleanupUnusedAssets: () => string[];

  /** Set playback state */
  setPlayback: (playback: Partial<PlaybackState>) => void;

  /** Play animation */
  play: () => void;

  /** Pause animation */
  pause: () => void;

  /** Stop animation and reset */
  stop: () => void;

  /** Set current frame */
  setFrame: (frame: number) => void;

  /** Set loading state */
  setLoading: (isLoading: boolean, progress?: number) => void;

  /** Set error state */
  setError: (error: string | null) => void;

  /* ========== Dirty Tracking Actions ========== */
  /** Mark animation as dirty (has unsaved changes) */
  markDirty: (field?: string) => void;

  /** Clear dirty state */
  clearDirty: () => void;

  /** Revert changes to original state */
  revertChanges: () => void;

  /* ========== CRUD Actions ========== */
  /** Save current animation to database */
  saveCurrentAnimation: () => Promise<void>;

  /** Export current animation as JSON */
  exportCurrentAnimation: () => Promise<void>;

  /** Import animation from JSON file */
  importAnimation: (file: File) => Promise<void>;

  /** Create new blank animation */
  createNewAnimation: () => Promise<void>;

  /** Delete current animation */
  deleteCurrentAnimation: () => Promise<void>;

  /* ========== Frame Editing Actions ========== */
  /** Set active frame for editing */
  setActiveFrame: (index: number | null) => void;

  /** Add new empty frame */
  addFrame: () => void;

  /** Delete a frame */
  deleteFrame: (index: number) => void;

  /* ========== Cell Editing Actions ========== */
  /** Open cell dialog for adding new cell */
  openAddCellDialog: (clickPosition: { x: number; y: number }) => void;

  /** Open cell dialog for editing existing cell */
  openEditCellDialog: (cellIndex: number, cellData: RMMVCellData) => void;

  /** Close cell dialog */
  closeCellDialog: () => void;

  /** Save cell (add or update) */
  saveCell: (cellData: RMMVCellData, cellIndex?: number) => void;

  /** Delete cell from active frame */
  deleteCell: (cellIndex: number) => void;
}

/**
 * Animation Store
 * Central state management for the application
 */
export const useAnimationStore = create<AnimationStoreState>((set, get) => ({
  /* ========== Initial State ========== */
  animations: [],
  selectedAnimationId: null,
  selectedAnimation: null,
  originalAnimation: null,

  isDirty: false,
  dirtyFields: new Set(),

  isSaving: false,
  lastSaved: null,

  loadedAssets: [],
  maxCachedAssets: 10,

  playback: {
    isPlaying: false,
    currentFrame: 0,
    speed: 1.0,
  },

  isLoading: false,
  loadingProgress: 0,
  error: null,

  activeFrameIndex: null,

  cellDialog: {
    isOpen: false,
    mode: 'add',
    cellIndex: null,
    cellData: null,
    clickPosition: null,
  },

  /* ========== Actions ========== */
  loadAnimationsData: (data: RMMVAnimationsData) => {
    // Load animations list without validation (metadata only)
    // Full validation happens when selecting an individual animation
    set({ animations: data, error: null });
  },

  selectAnimation: async (id: number) => {
    const state = get();

    // Check for unsaved changes
    if (state.isDirty) {
      const shouldSwitch = window.confirm(
        'You have unsaved changes. Discard changes and switch animation?'
      );

      if (!shouldSwitch) {
        return; // Cancel switch
      }
    }

    // Fetch animation from API
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/animations/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch animation');
      }

      const { animation } = await response.json();

      // Set selected animation - React component will handle Phaser recreation
      // Reset playback state to beginning and auto-select frame 0 for editing
      set({
        selectedAnimationId: id,
        selectedAnimation: animation,
        originalAnimation: structuredClone(animation), // Deep clone for dirty tracking
        isDirty: false,
        dirtyFields: new Set(),
        isLoading: false,
        error: null,
        playback: {
          isPlaying: false,
          currentFrame: 0,
          speed: state.playback.speed, // Keep speed setting
        },
        activeFrameIndex: 0, // Auto-select frame 0 by default
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  updateSelectedAnimation: (animation: RMMVAnimation) => {
    set((state) => ({
      selectedAnimation: animation,
      animations: state.animations.map((anim) =>
        anim?.id === animation.id ? animation : anim
      ),
      isDirty: true, // Mark as dirty when edited
    }));
  },

  registerAsset: (asset: LoadedAsset) => {
    set((state) => ({
      loadedAssets: [...state.loadedAssets, asset],
    }));
  },

  unloadAsset: (key: string) => {
    set((state) => ({
      loadedAssets: state.loadedAssets.filter((asset) => asset.key !== key),
    }));
  },

  markAssetInUse: (key: string, inUse: boolean) => {
    set((state) => ({
      loadedAssets: state.loadedAssets.map((asset) =>
        asset.key === key ? { ...asset, inUse } : asset
      ),
    }));
  },

  cleanupUnusedAssets: () => {
    const state = get();
    const { loadedAssets, maxCachedAssets } = state;

    // Sort by last used time, keep assets in use
    const sortedAssets = [...loadedAssets].sort(
      (a, b) => b.loadedAt - a.loadedAt
    );

    const unusedAssets = sortedAssets.filter((asset) => !asset.inUse);
    const assetsToUnload = unusedAssets.slice(maxCachedAssets);

    if (assetsToUnload.length > 0) {
      set({
        loadedAssets: loadedAssets.filter(
          (asset) => !assetsToUnload.includes(asset)
        ),
      });
    }

    return assetsToUnload.map((asset) => asset.key);
  },

  setPlayback: (playback: Partial<PlaybackState>) => {
    set((state) => ({
      playback: { ...state.playback, ...playback },
    }));
  },

  play: () => {
    set((state) => ({
      playback: { ...state.playback, isPlaying: true },
    }));
  },

  pause: () => {
    set((state) => ({
      playback: { ...state.playback, isPlaying: false },
    }));
  },

  stop: () => {
    set((state) => ({
      playback: {
        ...state.playback,
        isPlaying: false,
        currentFrame: 0,
      },
    }));
  },

  setFrame: (frame: number) => {
    set((state) => ({
      playback: { ...state.playback, currentFrame: frame },
    }));
  },

  setLoading: (isLoading: boolean, progress = 0) => {
    set({ isLoading, loadingProgress: progress });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  /* ========== Dirty Tracking Actions ========== */
  markDirty: (field?: string) => {
    set((state) => {
      const newDirtyFields = new Set(state.dirtyFields);
      if (field) {
        newDirtyFields.add(field);
      }
      return {
        isDirty: true,
        dirtyFields: newDirtyFields,
      };
    });
  },

  clearDirty: () => {
    set({
      isDirty: false,
      dirtyFields: new Set(),
    });
  },

  revertChanges: () => {
    const state = get();
    if (state.originalAnimation) {
      set({
        selectedAnimation: structuredClone(state.originalAnimation),
        isDirty: false,
        dirtyFields: new Set(),
      });
    }
  },

  /* ========== CRUD Actions ========== */
  saveCurrentAnimation: async () => {
    const state = get();
    if (!state.selectedAnimation) {
      return;
    }

    set({ isSaving: true, error: null });

    try {
      const response = await fetch(`/api/animations/${state.selectedAnimation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.selectedAnimation),
      });

      if (!response.ok) {
        throw new Error('Failed to save animation');
      }

      const { animation: updated } = await response.json();

      set({
        selectedAnimation: updated,
        originalAnimation: structuredClone(updated),
        animations: state.animations.map((anim) =>
          anim?.id === updated.id ? updated : anim
        ),
        isDirty: false,
        dirtyFields: new Set(),
        isSaving: false,
        lastSaved: new Date(),
      });

      console.log('✅ Animation saved successfully');
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to save animation',
      });
      console.error('❌ Save failed:', error);
    }
  },

  exportCurrentAnimation: async () => {
    const state = get();
    if (!state.selectedAnimation) {
      return;
    }

    try {
      const response = await fetch(`/api/animations/${state.selectedAnimation.id}/export`);
      if (!response.ok) {
        throw new Error('Failed to export animation');
      }

      const exportData = await response.json();

      // Trigger download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.selectedAnimation.name.replace(/\s+/g, '_')}_export.json`;
      a.click();
      URL.revokeObjectURL(url);

      console.log('✅ Animation exported successfully');
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to export animation',
      });
      console.error('❌ Export failed:', error);
    }
  },

  importAnimation: async (file: File) => {
    const state = get();
    set({ isSaving: true, error: null });

    try {
      // Read file content
      const content = await file.text();
      const importData = JSON.parse(content);

      // Validate import data
      if (!importData.animation) {
        throw new Error('Invalid import file: missing animation data');
      }

      // POST to import endpoint
      const response = await fetch('/api/animations/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import animation');
      }

      const { animation: imported } = await response.json();

      // Update animations list
      const newAnimations = [...state.animations];
      newAnimations[imported.id] = imported;

      set({
        animations: newAnimations,
        isSaving: false,
      });

      // Select the imported animation
      get().selectAnimation(imported.id);

      console.log('✅ Animation imported successfully:', imported.name);
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to import animation',
      });
      console.error('❌ Import failed:', error);
    }
  },

  createNewAnimation: async () => {
    const state = get();

    // Find next available ID (handle null and undefined entries)
    const validAnimations = state.animations.filter((a) => a != null);
    const maxId = validAnimations.length > 0
      ? Math.max(...validAnimations.map((a) => a.id))
      : 0;
    const newId = maxId + 1;

    // Create blank animation
    const newAnimation: RMMVAnimation = {
      id: newId,
      name: `New Animation ${newId}`,
      position: 1, // Center
      animation1Name: '',
      animation1Hue: 0,
      animation2Name: '',
      animation2Hue: 0,
      frames: [[]],
      timings: [],
    };

    set({ isSaving: true, error: null });

    try {
      const response = await fetch('/api/animations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnimation),
      });

      if (!response.ok) {
        throw new Error('Failed to create animation');
      }

      const { animation: created } = await response.json();

      // Update animations list
      const newAnimations = [...state.animations];
      newAnimations[created.id] = created;

      set({
        animations: newAnimations,
        isSaving: false,
      });

      // Select the new animation
      get().selectAnimation(created.id);

      console.log('✅ Animation created successfully');
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to create animation',
      });
      console.error('❌ Create failed:', error);
    }
  },

  deleteCurrentAnimation: async () => {
    const state = get();
    if (!state.selectedAnimation) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${state.selectedAnimation.name}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    set({ isSaving: true, error: null });

    try {
      const response = await fetch(`/api/animations/${state.selectedAnimation.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete animation');
      }

      // Remove from animations list
      const newAnimations = [...state.animations];
      newAnimations[state.selectedAnimation.id] = null;

      set({
        animations: newAnimations,
        selectedAnimation: null,
        selectedAnimationId: null,
        originalAnimation: null,
        isDirty: false,
        dirtyFields: new Set(),
        isSaving: false,
      });

      console.log('✅ Animation deleted successfully');
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to delete animation',
      });
      console.error('❌ Delete failed:', error);
    }
  },

  /* ========== Frame Editing Actions ========== */
  setActiveFrame: (index: number | null) => {
    set({ activeFrameIndex: index });
  },

  addFrame: () => {
    const state = get();
    if (!state.selectedAnimation) return;

    const newFrames = [...state.selectedAnimation.frames, []];
    state.updateSelectedAnimation({
      ...state.selectedAnimation,
      frames: newFrames,
    });
    state.markDirty('frames');

    // Automatically select the new frame
    set({ activeFrameIndex: newFrames.length - 1 });
  },

  deleteFrame: (index: number) => {
    const state = get();
    if (!state.selectedAnimation) return;

    const newFrames = state.selectedAnimation.frames.filter((_, i) => i !== index);
    state.updateSelectedAnimation({
      ...state.selectedAnimation,
      frames: newFrames,
    });
    state.markDirty('frames');

    // Deselect if deleted frame was active
    if (state.activeFrameIndex === index) {
      set({ activeFrameIndex: null });
    } else if (state.activeFrameIndex !== null && state.activeFrameIndex > index) {
      // Adjust active frame index if it was after the deleted frame
      set({ activeFrameIndex: state.activeFrameIndex - 1 });
    }
  },

  /* ========== Cell Editing Actions ========== */
  openAddCellDialog: (clickPosition: { x: number; y: number }) => {
    set({
      cellDialog: {
        isOpen: true,
        mode: 'add',
        cellIndex: null,
        cellData: null,
        clickPosition,
      },
    });
  },

  openEditCellDialog: (cellIndex: number, cellData: RMMVCellData) => {
    set({
      cellDialog: {
        isOpen: true,
        mode: 'edit',
        cellIndex,
        cellData,
        clickPosition: null,
      },
    });
  },

  closeCellDialog: () => {
    set({
      cellDialog: {
        isOpen: false,
        mode: 'add',
        cellIndex: null,
        cellData: null,
        clickPosition: null,
      },
    });
  },

  saveCell: (cellData: RMMVCellData, cellIndex?: number) => {
    const state = get();
    if (!state.selectedAnimation || state.activeFrameIndex === null) return;

    const newFrames = [...state.selectedAnimation.frames];
    const frame = newFrames[state.activeFrameIndex];
    if (!frame) return;

    const currentFrame = [...frame];

    if (cellIndex !== undefined) {
      // Edit mode: update existing cell
      currentFrame[cellIndex] = cellData;
    } else {
      // Add mode: append new cell
      currentFrame.push(cellData);
    }

    newFrames[state.activeFrameIndex] = currentFrame;

    state.updateSelectedAnimation({
      ...state.selectedAnimation,
      frames: newFrames,
    });
    state.markDirty('frames');
    state.closeCellDialog();
  },

  deleteCell: (cellIndex: number) => {
    const state = get();
    if (!state.selectedAnimation || state.activeFrameIndex === null) return;

    const newFrames = [...state.selectedAnimation.frames];
    const frame = newFrames[state.activeFrameIndex];
    if (!frame) return;

    const currentFrame = [...frame];

    // Remove cell at index
    currentFrame.splice(cellIndex, 1);

    newFrames[state.activeFrameIndex] = currentFrame;

    state.updateSelectedAnimation({
      ...state.selectedAnimation,
      frames: newFrames,
    });
    state.markDirty('frames');
    state.closeCellDialog();
  },
}));

/**
 * Hook for accessing animation store actions only
 * Useful when you don't need to subscribe to state changes
 */
export const useAnimationActions = () => {
  return useAnimationStore((state) => ({
    loadAnimationsData: state.loadAnimationsData,
    selectAnimation: state.selectAnimation,
    updateSelectedAnimation: state.updateSelectedAnimation,
    registerAsset: state.registerAsset,
    unloadAsset: state.unloadAsset,
    markAssetInUse: state.markAssetInUse,
    cleanupUnusedAssets: state.cleanupUnusedAssets,
    setPlayback: state.setPlayback,
    play: state.play,
    pause: state.pause,
    stop: state.stop,
    setFrame: state.setFrame,
    setLoading: state.setLoading,
    setError: state.setError,
  }));
};
