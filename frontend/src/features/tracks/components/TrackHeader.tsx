/**
 * Track Header Component
 * 
 * Moises-style layout:
 * - Left column: Two stacked rows (header + controls)
 * - Right column: Pan knob spanning both rows
 * 
 * Clean, compact, DAW-grade track controls.
 */

"use client";

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TRACK_HEADER_WIDTH, DEFAULT_TRACK_HEIGHT, TRACK_HEADER_ROW_HEIGHT } from './constants';
import { HorizontalSlider } from './controls/HorizontalSlider';
import { PanKnob } from './controls/PanKnob';

export interface TrackHeaderProps {
  /** Track name */
  name: string;
  /** Mute state */
  mute: boolean;
  /** Solo state */
  solo: boolean;
  /** Gain value (0.0 to 2.0) */
  gain: number;
  /** Pan value (-1.0 to 1.0) */
  pan: number;
  /** On mute toggle */
  onMuteToggle?: () => void;
  /** On solo toggle */
  onSoloToggle?: () => void;
  /** On gain change */
  onGainChange?: (gain: number) => void;
  /** On pan change */
  onPanChange?: (pan: number) => void;
  /** On delete track */
  onDelete?: () => void;
}

function formatGain(g: number): string {
  if (g === 0 || g < 0.001) return '-∞ dB';
  return `${(20 * Math.log10(g)).toFixed(1)} dB`;
}

/**
 * Track header with Moises-style layout
 */
export function TrackHeader({
  name,
  mute,
  solo,
  gain,
  pan,
  onMuteToggle,
  onSoloToggle,
  onGainChange,
  onPanChange,
  onDelete,
}: TrackHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);


  const handleMenuToggle = () => {
    if (!menuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Position menu so it starts at the button's top-left, extending to the right
      setMenuPos({ top: rect.top, left: rect.left });
    }
    setMenuOpen((open) => !open);
  };

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && !buttonRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [menuOpen]);
  
  return (
    <div 
      className={`group border-r border-zinc-800/20 bg-zinc-950 transition-opacity flex-shrink-0 overflow-hidden ${
        mute ? 'opacity-40' : 'opacity-100'
      }`}
      style={{ 
        width: `${TRACK_HEADER_WIDTH}px`,
        maxWidth: `${TRACK_HEADER_WIDTH}px`,
        display: 'grid',
        gridTemplateColumns: '1fr 40px',
        gridTemplateRows: `${TRACK_HEADER_ROW_HEIGHT}px ${TRACK_HEADER_ROW_HEIGHT}px`,
        height: `${DEFAULT_TRACK_HEIGHT}px`,
      }}
    >
      {/* COLUMN 1, ROW 1 — Header (explicit placement so pan stays right) */}
      <div 
        className="flex items-center gap-2 px-2.5 min-w-0"
        style={{ gridColumn: 1, gridRow: 1 }}
      >
        {/* M/S buttons */}
        <div className="flex gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onMuteToggle}
            className={`h-5 w-5 rounded text-[9px] font-semibold transition-colors ${
              mute
                ? 'bg-red-600/90 text-white'
                : 'bg-zinc-800/50 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-500'
            }`}
            aria-label="Mute"
            title="Mute track"
          >
            M
          </button>
          
          <button
            type="button"
            onClick={onSoloToggle}
            className={`h-5 w-5 rounded text-[9px] font-semibold transition-colors ${
              solo
                ? 'bg-yellow-500/90 text-black'
                : 'bg-zinc-800/50 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-500'
            }`}
            aria-label="Solo"
            title="Solo track"
          >
            S
          </button>
        </div>
        
        {/* Track name */}
        <div className="flex-1 truncate text-[13px] font-medium text-zinc-400 min-w-0">
          {name}
        </div>
        
        {/* Options button */}
        {onDelete && (
          <div className="shrink-0">
            <button
              ref={buttonRef}
              type="button"
              onClick={handleMenuToggle}
              className="flex h-5 w-5 items-center justify-center rounded text-zinc-700 opacity-0 transition-opacity hover:bg-zinc-800/50 hover:text-zinc-500 group-hover:opacity-100"
              aria-label="Options"
              title="Track options"
            >
              ⋮
            </button>

            {menuOpen && menuPos && createPortal(
              <div
                ref={menuRef}
                className="min-w-36 rounded-md border border-zinc-800 bg-zinc-950 p-1 shadow-2xl"
                style={{
                  position: 'fixed',
                  top: menuPos.top,
                  left: menuPos.left,
                  zIndex: 9999,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="flex w-full items-center rounded px-2 py-1.5 text-left text-xs text-red-400 transition-colors hover:bg-zinc-900"
                >
                  Delete track
                </button>
              </div>,
              document.body
            )}
          </div>
        )}
      </div>
      
      {/* COLUMN 1, ROW 2 — Controls (Volume slider) */}
      <div 
        className="flex items-center px-2.5"
        style={{ gridColumn: 1, gridRow: 2 }}
      >
        <HorizontalSlider
          value={gain}
          max={2.0}
          onChange={onGainChange}
          formatValue={formatGain}
          ariaLabel="Volume"
        />
      </div>
      
      {/* COLUMN 2, ROWS 1-2 — Pan knob on the RIGHT, spans both rows */}
      <div 
        className="border-l border-zinc-800/20 flex items-center justify-center"
        style={{ gridColumn: 2, gridRow: '1 / 3' }}
      >
        <PanKnob
          value={pan}
          onChange={onPanChange}
          size={28}
        />
      </div>
    </div>
  );
}
