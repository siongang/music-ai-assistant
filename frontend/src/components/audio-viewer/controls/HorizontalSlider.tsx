/**
 * Horizontal Slider Component
 * 
 * Clean, minimal slider - just a line and a solid circle thumb.
 * Moises-style design.
 */

"use client";

import { useEffect, useRef, useState } from 'react';

export interface HorizontalSliderProps {
  /** Current value (0.0 to max) */
  value: number;
  /** Maximum value */
  max: number;
  /** Value change handler */
  onChange?: (value: number) => void;
  /** Format value for display */
  formatValue?: (value: number) => string;
  /** Color of the active fill (default: cyan) */
  fillColor?: string;
  /** ARIA label */
  ariaLabel?: string;
}

/**
 * Horizontal slider with minimal design
 */
export function HorizontalSlider({
  value,
  max,
  onChange,
  formatValue,
  fillColor = 'bg-cyan-500/60',
  ariaLabel = 'Slider',
}: HorizontalSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const dragStartRef = useRef({ x: 0, value: 0 });
  
  // Calculate percentage
  const percentage = Math.min((value / max) * 100, 100);
  
  // Format display value
  const displayValue = formatValue?.(value) ?? value.toFixed(2);
  
  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, value };
  };
  
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.x;
      const sensitivity = 0.005; // 200px = full range
      const newValue = Math.max(0, Math.min(max, dragStartRef.current.value + deltaX * sensitivity));
      onChange?.(newValue);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ew-resize';
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [isDragging, max, onChange]);
  
  return (
    <div className="relative flex-1 min-w-0">
      <div 
        className="relative h-0.5 w-full cursor-ew-resize select-none"
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        role="slider"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        {/* Track background - thin line */}
        <div className="absolute inset-0 bg-zinc-800/40 rounded-full" />
        
        {/* Active fill - thin line */}
        <div 
          className={`absolute left-0 h-full rounded-full ${fillColor}`}
          style={{ width: `${percentage}%` }}
        />
        
        {/* Thumb - solid circle only */}
        <div 
          className="pointer-events-none absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white shadow-sm"
          style={{ left: `calc(${percentage}% - 5px)` }}
        />
      </div>
      
      {/* Value tooltip */}
      {(isHovering || isDragging) && (
        <div 
          className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-zinc-900/95 border border-zinc-800/50 rounded text-[10px] font-mono text-zinc-400 whitespace-nowrap pointer-events-none z-10"
        >
          {displayValue}
        </div>
      )}
    </div>
  );
}
