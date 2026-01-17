/**
 * SEAndFlashTiming Component
 *
 * Section for managing sound effects and flash timing
 * Opens dialog to add/edit/delete timing configurations
 */

import { useState } from 'react';
import { Dialog } from '@react/components/common/Dialog/Dialog';
import { TimingListDialog } from './TimingListDialog';
import type { RMMVAnimation } from '@decky.fx/rmmv-animation-player';
import './SEAndFlashTiming.css';

interface SEAndFlashTimingProps {
  animation: RMMVAnimation;
}

export function SEAndFlashTiming({ animation }: SEAndFlashTimingProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Count timing events
  const timingCount = animation.timings.length;

  return (
    <div className="se-flash-timing-toolbox">
      <h3 className="section-title">SE & Flash Timing</h3>

      <button
        className="timing-manage-btn"
        onClick={() => setIsDialogOpen(true)}
        title="Manage timing configurations for this animation"
      >
        <i className="fa-solid fa-clock"></i>
        <div className="timing-btn-content">
          <span className="timing-btn-title">Manage Timing</span>
          <span className="timing-btn-count">
            {timingCount} event{timingCount !== 1 ? 's' : ''}
          </span>
        </div>
        <i className="fa-solid fa-chevron-right"></i>
      </button>

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="SE & Flash Timing"
        size="large"
      >
        <TimingListDialog
          animation={animation}
          onClose={() => setIsDialogOpen(false)}
        />
      </Dialog>
    </div>
  );
}
