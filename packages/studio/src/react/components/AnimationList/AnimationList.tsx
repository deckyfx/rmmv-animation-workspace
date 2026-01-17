/**
 * AnimationList Component
 *
 * Left panel displaying list of all available animations
 */

import { useState } from 'react';
import { useAnimationStore } from '@react/store/useAnimationStore';
import './AnimationList.css';

export function AnimationList() {
  const animations = useAnimationStore((state) => state.animations);
  const selectedAnimationId = useAnimationStore(
    (state) => state.selectedAnimationId
  );
  const selectAnimation = useAnimationStore((state) => state.selectAnimation);
  const createNewAnimation = useAnimationStore((state) => state.createNewAnimation);
  const isSaving = useAnimationStore((state) => state.isSaving);

  const [searchQuery, setSearchQuery] = useState('');

  // Filter out null entries and apply search filter
  const validAnimations = animations
    .filter((anim) => anim !== null)
    .filter((anim) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        anim.name.toLowerCase().includes(query) ||
        anim.id.toString().includes(query)
      );
    });

  const totalCount = animations.filter((anim) => anim !== null).length;

  return (
    <div className="animation-list">
      <div className="animation-list-header">
        <h2>Animations</h2>
        <div className="animation-count">
          {searchQuery
            ? `${validAnimations.length} of ${totalCount}`
            : `${totalCount} animations`}
        </div>
      </div>

      <button
        className="animation-list-new-btn"
        onClick={createNewAnimation}
        disabled={isSaving}
        title="Create new blank animation"
      >
        <i className="fa-solid fa-plus"></i> New Animation
      </button>

      <div className="animation-list-search">
        <input
          type="text"
          placeholder="Search animations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="animation-search-input"
        />
        {searchQuery && (
          <button
            className="animation-search-clear"
            onClick={() => setSearchQuery('')}
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <div className="animation-list-content">
        {validAnimations.length === 0 ? (
          <div className="animation-list-empty">
            <p>No animations loaded</p>
            <p className="hint">Load Animations.json to get started</p>
          </div>
        ) : (
          <ul className="animation-items">
            {validAnimations.map((animation) => {
              if (!animation) return null;

              const isSelected = animation.id === selectedAnimationId;

              return (
                <li
                  key={animation.id}
                  className={`animation-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => selectAnimation(animation.id)}
                >
                  <div className="animation-item-id">{animation.id}</div>
                  <div className="animation-item-content">
                    <div className="animation-item-name">{animation.name}</div>
                    <div className="animation-item-meta">
                      {animation.frames.length} frames
                      {animation.animation1Name && (
                        <span className="animation-sprite">
                          {' · '}
                          {animation.animation1Name}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
