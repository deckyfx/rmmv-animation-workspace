/**
 * GeneralSettings Component
 *
 * Section for editing general animation properties
 * - Animation name
 * - Position (Head/Center/Feet/Screen)
 */

import { useAnimationStore } from '@react/store/useAnimationStore';
import type { RMMVAnimation } from '@decky.fx/rmmv-animation-player';
import './GeneralSettings.css';

interface GeneralSettingsProps {
  animation: RMMVAnimation;
}

export function GeneralSettings({ animation }: GeneralSettingsProps) {
  const updateSelectedAnimation = useAnimationStore(
    (state) => state.updateSelectedAnimation
  );
  const markDirty = useAnimationStore((state) => state.markDirty);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSelectedAnimation({
      ...animation,
      name: e.target.value,
    });
    markDirty('name');
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSelectedAnimation({
      ...animation,
      position: parseInt(e.target.value, 10),
    });
    markDirty('position');
  };

  return (
    <div className="general-settings">
      <h3 className="section-title">General</h3>

      <div className="setting-group">
        <label htmlFor="anim-name">Animation Name</label>
        <input
          id="anim-name"
          type="text"
          value={animation.name}
          onChange={handleNameChange}
          className="input"
          placeholder="Enter animation name"
        />
      </div>

      <div className="setting-group">
        <label htmlFor="position">Position</label>
        <select
          id="position"
          value={animation.position}
          onChange={handlePositionChange}
          className="select"
        >
          <option value={0}>Head</option>
          <option value={1}>Center</option>
          <option value={2}>Feet</option>
          <option value={3}>Screen</option>
        </select>
      </div>
    </div>
  );
}
