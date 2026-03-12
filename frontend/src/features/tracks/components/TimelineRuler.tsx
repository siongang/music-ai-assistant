/**
 * Timeline Ruler Component
 * 
 * Displays time markers along the top of the track area.
 */

'use client';


export interface TimelineRulerProps {
  /** Total duration in seconds */
  duration: number;
  /** Pixels per second (zoom level) */
  pixelsPerSecond: number;
  /** Height of ruler in pixels */
  height?: number;
  /** On seek callback */
  onSeek?: (time: number) => void;
}

/**
 * Timeline ruler with time markers
 * 
 * Shows time markers every few seconds based on zoom level.
 */
export function TimelineRuler({ 
  duration, 
  pixelsPerSecond,
  height = 32,
  onSeek 
}: TimelineRulerProps) {
  // Calculate marker interval based on zoom
  // Want markers roughly every 80-150 pixels
  const targetPixels = 100;
  
  // Round to nice values: 1, 2, 5, 10, 15, 30, 60, 120, etc.
  const niceIntervals = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
  const interval = niceIntervals.find(i => i * pixelsPerSecond >= targetPixels) || 600;
  
  // Generate markers
  const markers: number[] = [];
  for (let t = 0; t <= duration; t += interval) {
    markers.push(t);
  }
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const timelineWidth = duration * pixelsPerSecond;
  
  // Handle click to seek
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, x / pixelsPerSecond);
    onSeek(time);
  };
  
  return (
    <div 
      className="sticky top-0 z-20 select-none border-b border-zinc-800/30 bg-zinc-950"
      style={{ height: `${height}px` }}
    >
      {/* Timeline markers — fills the full width of the right scroll panel */}
      <div 
        className="relative h-full bg-black cursor-pointer"
        onClick={handleClick}
      >
        <div className="relative h-full" style={{ width: `${Math.max(timelineWidth, 1000)}px` }}>
          {markers.map((time) => {
            const x = time * pixelsPerSecond;
            return (
              <div
                key={time}
                className="absolute top-0 h-full pointer-events-none"
                style={{ left: `${x}px` }}
              >
                {/* Marker line */}
                <div className="h-full w-px bg-zinc-800/50" />
                
                {/* Time label */}
                <div className="absolute top-1 left-1 text-[10px] font-mono text-zinc-500">
                  {formatTime(time)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
