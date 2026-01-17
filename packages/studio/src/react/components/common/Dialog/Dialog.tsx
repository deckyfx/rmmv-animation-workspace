/**
 * Dialog Component
 *
 * Reusable modal dialog with backdrop, animations, and drag functionality
 */

import { useEffect, useRef, useState } from 'react';
import './Dialog.css';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

export function Dialog({ isOpen, onClose, title, children, size = 'medium' }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasBeenDragged, setHasBeenDragged] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset position and drag state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
      setHasBeenDragged(false);
    }
  }, [isOpen]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Only allow dragging if clicking directly on the header or title
    // Don't drag if clicking on buttons, inputs, or other interactive elements
    const isDraggable =
      target.classList.contains('dialog-header') ||
      target.classList.contains('dialog-title');

    if (!isDraggable) {
      return;
    }

    // Prevent text selection while dragging
    e.preventDefault();

    setIsDragging(true);
    setHasBeenDragged(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    let hasMoved = false;

    const handleMouseMove = (e: MouseEvent) => {
      hasMoved = true;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);

      // If the dialog was dragged, prevent backdrop click for a short time
      if (hasMoved) {
        setTimeout(() => {
          dialogRef.current?.setAttribute('data-just-dragged', 'false');
        }, 100);
        dialogRef.current?.setAttribute('data-just-dragged', 'true');
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Don't close if clicking on the dialog itself
    if (e.target !== e.currentTarget) return;

    // Don't close if dialog was just dragged
    if (dialogRef.current?.getAttribute('data-just-dragged') === 'true') {
      return;
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" onClick={handleBackdropClick}>
      <div
        ref={dialogRef}
        className={`dialog dialog-${size} ${hasBeenDragged ? 'dialog-no-animation' : ''} ${isDragging ? 'dialog-dragging' : ''}`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header" onMouseDown={handleMouseDown}>
          <h2 className="dialog-title">{title}</h2>
          <button
            className="dialog-close"
            onClick={onClose}
            title="Close (ESC)"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="dialog-content">
          {children}
        </div>
      </div>
    </div>
  );
}
