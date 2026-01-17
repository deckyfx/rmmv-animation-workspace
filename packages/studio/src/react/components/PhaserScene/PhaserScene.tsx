/**
 * PhaserScene Component
 *
 * React wrapper for Phaser game instance
 * Handles Phaser lifecycle and container mounting
 *
 * Destroys and recreates Phaser game when animation changes
 */

import { useEffect, useRef } from 'react';
import { initPhaser } from '@phaser/config';
import { useAnimationStore } from '@react/store/useAnimationStore';
import type Phaser from 'phaser';
import './PhaserScene.css';

export function PhaserScene() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Subscribe to selected animation
  const selectedAnimation = useAnimationStore((state) => state.selectedAnimation);

  useEffect(() => {
    // Destroy existing game if any
    if (gameRef.current) {
      // Stop all sounds before destroying to prevent AudioContext errors
      try {
        gameRef.current.sound.stopAll();
      } catch (e) {
        // Ignore errors if sound system is already destroyed
      }
      gameRef.current.destroy(true, false); // Don't remove canvas
      gameRef.current = null;
    }

    // Create new game if animation is selected
    if (selectedAnimation && containerRef.current) {
      gameRef.current = initPhaser(selectedAnimation, 'phaser-container');
    }

    // Cleanup when component unmounts
    return () => {
      if (gameRef.current) {
        try {
          gameRef.current.sound.stopAll();
        } catch (e) {
          // Ignore errors
        }
        gameRef.current.destroy(true, false);
        gameRef.current = null;
      }
    };
  }, [selectedAnimation]);

  return (
    <div className="phaser-scene-container">
      <div id="phaser-container" ref={containerRef} />
      {!selectedAnimation && (
        <div className="no-animation-message">Select an animation to preview</div>
      )}
    </div>
  );
}
