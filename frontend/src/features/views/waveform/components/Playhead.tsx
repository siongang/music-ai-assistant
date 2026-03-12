/**
 * Playhead Component
 * 
 * Visual indicator for current playback position.
 * Spans full height of track area, offset by track header width.
 */

'use client';

import { RefObject, useCallback, useEffect, useState } from 'react';

export interface PlayheadProps {
  /** Scroll container ref (the overflow-auto div) */
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  /** Current time in seconds */
  currentTime: number;
  /** Pixels per second (zoom level) */
  pixelsPerSecond: number;
  /** Height of the ruler area */
  rulerHeight?: number;
  /** On seek callback */
  onSeek?: (time: number) => void;
}

/**
 * Playhead that spans full height of tracks
 * 
 * Shows current playback position with an SVG line and circle handle.
 * The circle is perfectly centered on the vertical line.
 * Positioned relative to track content area (offset by header width).
 */
export function Playhead({
  scrollContainerRef,
  currentTime,
  pixelsPerSecond,
  rulerHeight = 32,
  onSeek,
}: PlayheadProps) {
  const [isDragging, setIsDragging] = useState(false);
  // No TRACK_HEADER_WIDTH offset — playhead is inside the right panel, left=0 is the waveform start
  const leftPosition = currentTime * pixelsPerSecond;

  const getTimeFromClientX = useCallback(
    (clientX: number): number | null => {
      if (!scrollContainerRef.current) return null;

      const rect = scrollContainerRef.current.getBoundingClientRect();
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const x = clientX - rect.left + scrollLeft;
      return Math.max(0, x / pixelsPerSecond);
    },
    [scrollContainerRef, pixelsPerSecond]
  );
  
  // Handle playhead drag
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const time = getTimeFromClientX(e.clientX);
    if (time !== null) {
      onSeek?.(time);
    }
    setIsDragging(true);
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !onSeek) return;

      const time = getTimeFromClientX(e.clientX);
      if (time !== null) {
        onSeek(time);
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
      };
    }
  }, [getTimeFromClientX, isDragging, onSeek]);
  
  // Circle sits at the bottom of the ruler area; its bottom edge meets the line start
  const circleR = 7;
  const circleCy = rulerHeight - circleR;

  return (
    <div
      className="pointer-events-auto absolute z-30 cursor-ew-resize"
      style={{ left: `${leftPosition}px`, top: 0, bottom: 0, width: '20px', marginLeft: '-10px' }}
      onMouseDown={handleMouseDown}
    >
      {/* SVG Playhead - circle at bottom of ruler, line extends through tracks */}
      <svg
        className="h-full w-full pointer-events-none"
        style={{ overflow: 'visible' }}
      >
        {/* Vertical line - starts from bottom of circle, extends to bottom */}
        <line
          x1="10"
          y1={circleCy + circleR}
          x2="10"
          y2="100%"
          strokeWidth="2"
          className="stroke-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.3)]"
        />
        
        {/* Circle handle - sits at bottom of ruler, touching the line */}
        <circle
          cx="10"
          cy={circleCy}
          r={circleR}
          className="fill-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
        />
        
        {/* Inner circle for depth */}
        <circle
          cx="10"
          cy={circleCy}
          r="4"
          className="fill-cyan-500"
        />
        
        {/* Center dot */}
        <circle
          cx="10"
          cy={circleCy}
          r="1.5"
          className="fill-cyan-600"
        />
      </svg>
    </div>
  );
}
