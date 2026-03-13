/**
 * Pan Knob Component
 * 
 * Circular pan control with L/R labels.
 * Spans multiple rows vertically - designed for grid layout.
 */

"use client";

import { useEffect, useRef, useState } from 'react';

export interface PanKnobProps {
  /** Pan value (-1.0 to 1.0) */
  value: number;
  /** Value change handler */
  onChange?: (value: number) => void;
  /** Knob size in pixels (default: 28) */
  size?: number;
}

/**
 * Pan knob control with vertical drag
 */
export function PanKnob({
  value,
  onChange,
  size = 28,
}: PanKnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ y: 0, value: 0 });
  
  // Format pan for display
  const panDisplay = value === 0 ? 'C' : value < 0 ? `L${Math.abs(Math.round(value * 100))}` : `R${Math.round(value * 100)}`;
  
  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { y: e.clientY, value };
  };
  
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = dragStartRef.current.y - e.clientY; // Up = right, Down = left
      const sensitivity = 0.01; // 100px = full range
      let newPan = Math.max(-1, Math.min(1, dragStartRef.current.value + deltaY * sensitivity));
      
      // Magnetic snap to center
      const snapThreshold = 0.1;
      if (Math.abs(newPan) < snapThreshold) {
        newPan = 0;
      }
      
      onChange?.(newPan);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ns-resize';
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [isDragging, onChange]);
  
  return (
    <div className="flex flex-col items-center justify-center gap-1 h-full">
      {/* L label */}
      <div className="text-[9px] font-mono text-zinc-600 select-none">
        L
      </div>
      
      {/* Knob */}
      <div 
        className="relative cursor-ns-resize select-none shrink-0"
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
        role="slider"
        aria-label="Pan"
        aria-valuemin={-1}
        aria-valuemax={1}
        aria-valuenow={value}
        title={`Pan: ${panDisplay}`}
      >
        {/* Knob background */}
        <div className="absolute inset-0 rounded-full bg-zinc-800/50 border border-zinc-800/30" />
        
        {/* Center dot */}
        <div className="absolute left-1/2 top-1/2 h-0.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-700" />
        
        {/* Indicator line */}
        <div 
          className="absolute left-1/2 top-1/2 w-[1.5px] origin-bottom bg-cyan-500/70 rounded-full transition-transform"
          style={{ 
            height: size * 0.4,
            transform: `translate(-50%, -100%) rotate(${value * 135}deg)`,
          }}
        />
      </div>
      
      {/* R label */}
      <div className="text-[9px] font-mono text-zinc-600 select-none">
        R
      </div>
    </div>
  );
}
