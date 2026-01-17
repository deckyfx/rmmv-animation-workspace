/**
 * Main Application Component
 *
 * Three-panel layout mimicking RPG Maker MV Animation Editor:
 * - Left: Animation List
 * - Middle: Phaser Scene (16:9)
 * - Right: Toolbox
 */

import { useEffect } from 'react';
import { AnimationList } from './components/AnimationList/AnimationList';
import { PhaserScene } from './components/PhaserScene/PhaserScene';
import { PlaybackControls } from './components/PlaybackControls/PlaybackControls';
import { Toolbox } from './components/Toolbox/Toolbox';
import { useAnimationStore } from './store/useAnimationStore';
import './App.css';

export function App() {
  const loadAnimationsData = useAnimationStore(
    (state) => state.loadAnimationsData
  );
  const isLoading = useAnimationStore((state) => state.isLoading);
  const error = useAnimationStore((state) => state.error);
  const isDirty = useAnimationStore((state) => state.isDirty);

  // Load animations list from API on mount
  useEffect(() => {
    const loadAnimations = async () => {
      try {
        useAnimationStore.getState().setLoading(true);

        const response = await fetch('/api/animations');
        if (!response.ok) {
          throw new Error('Failed to fetch animations');
        }

        const { animations } = await response.json();

        // Convert array to RMMVAnimationsData format (sparse array with nulls)
        // This creates an array where index = animation ID
        const animationsData: any[] = [];
        animations.forEach((anim: any) => {
          animationsData[anim.id] = {
            id: anim.id,
            name: anim.name,
            position: anim.position,
            animation1Name: anim.animation1Name,
            animation1Hue: anim.animation1Hue,
            animation2Name: anim.animation2Name,
            animation2Hue: anim.animation2Hue,
            frames: anim.frames, // Array of empty arrays (just for length)
            timings: anim.timings || [],
          };
        });

        loadAnimationsData(animationsData);
        useAnimationStore.getState().setLoading(false);
      } catch (error) {
        console.error('Error loading animations:', error);
        useAnimationStore.getState().setError('Failed to load animations');
        useAnimationStore.getState().setLoading(false);
      }
    };

    loadAnimations();
  }, [loadAnimationsData]);

  // Protect against accidental page unload with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Modern browsers show generic message
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1>RMMV Animation Studio</h1>
        <div className="app-status">
          {isLoading && <span className="status-loading">Loading...</span>}
          {error && <span className="status-error">{error}</span>}
        </div>
      </header>

      {/* Main Content */}
      <div className="app-main">
        {/* Left Panel: Animation List */}
        <aside className="app-sidebar left">
          <AnimationList />
        </aside>

        {/* Middle Panel: Phaser Scene */}
        <main className="app-content">
          <PhaserScene />
          <PlaybackControls />
        </main>

        {/* Right Panel: Toolbox */}
        <aside className="app-sidebar right">
          <Toolbox />
        </aside>
      </div>
    </div>
  );
}
