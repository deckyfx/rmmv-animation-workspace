/**
 * Spritesheets Component
 *
 * Section for managing animation sprite sheets
 * Opens dialog to add/edit/delete sprite sheets
 */

import { useState } from 'react';
import { Dialog } from '@react/components/common/Dialog/Dialog';
import { SpritesheetsDialog } from './SpritesheetsDialog';
import type { RMMVAnimation } from '@decky.fx/rmmv-animation-player';
import './Spritesheets.css';

interface SpritesheetsProps {
  animation: RMMVAnimation;
}

export function Spritesheets({ animation }: SpritesheetsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Count active sprite sheets
  const activeSheets = [
    animation.animation1Name,
    animation.animation2Name,
  ].filter((name) => name && name.trim() !== '').length;

  return (
    <div className="spritesheets-toolbox">
      <h3 className="section-title">Spritesheets</h3>

      <button
        className="spritesheets-manage-btn"
        onClick={() => setIsDialogOpen(true)}
        title="Manage sprite sheets for this animation"
      >
        <i className="fa-solid fa-image"></i>
        <div className="spritesheets-btn-content">
          <span className="spritesheets-btn-title">Manage Spritesheets</span>
          <span className="spritesheets-btn-count">
            {activeSheets} sheet{activeSheets !== 1 ? 's' : ''} active
          </span>
        </div>
        <i className="fa-solid fa-chevron-right"></i>
      </button>

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Manage Spritesheets"
        size="large"
      >
        <SpritesheetsDialog
          animation={animation}
          onClose={() => setIsDialogOpen(false)}
        />
      </Dialog>
    </div>
  );
}
