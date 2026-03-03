/**
 * Playhead Component
 * 
 * Visual indicator for current playback position.
 * Spans full height of track area, offset by track header width.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { TRACK_HEADER_WIDTH } from './constants';

export interface PlayheadProps {
  /** Current time in seconds */
  currentTime: number;
  /** Pixels per second (zoom level) */
  pixelsPerSecond: number;
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
export function Playhead({ currentTime, pixelsPerSecond, onSeek }: PlayheadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const leftPosition = TRACK_HEADER_WIDTH + (currentTime * pixelsPerSecond);
  
  // Handle playhead drag
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current || !onSeek) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = Math.max(0, x / pixelsPerSecond);
      onSeek(time);
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
  }, [isDragging, pixelsPerSecond, onSeek]);
  
  return (
    <div
      ref={containerRef}
      className="pointer-events-auto absolute top-0 z-30 h-full cursor-ew-resize"
      style={{ left: `${leftPosition}px`, width: '20px', marginLeft: '-10px' }}
      onMouseDown={handleMouseDown}
    >
      {/* SVG Playhead - circle at top, line extends down */}
      <svg
        className="h-full w-full pointer-events-none"
        style={{ overflow: 'visible' }}
      >
        {/* Vertical line - starts from bottom of circle */}
        <line
          x1="10"
          y1="8"
          x2="10"
          y2="100%"
          stroke="#22d3ee"
          strokeWidth="2"
          className="drop-shadow-[0_0_4px_rgba(34,211,238,0.3)]"
        />
        
        {/* Circle handle at top - perfectly centered on line */}
        <circle
          cx="10"
          cy="8"
          r="7"
          fill="#22d3ee"
          className="drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
        />
        
        {/* Inner circle for depth */}
        <circle
          cx="10"
          cy="8"
          r="4"
          fill="#06b6d4"
        />
        
        {/* Center dot */}
        <circle
          cx="10"
          cy="8"
          r="1.5"
          fill="#0891b2"
        />
      </svg>
    </div>
  );
}
