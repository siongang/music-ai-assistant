/**
 * Waveform Renderer Component
 * 
 * Renders audio waveform visualization using Canvas API.
 * Fetches waveform data from backend at appropriate zoom level.
 */

"use client";

import { useEffect, useRef } from 'react';

export interface WaveformRendererProps {
  /** Audio ID */
  audioId: string;
  /** Waveform peak data */
  peaks: Array<{ min: number; max: number }> | null;
  /** Loading state */
  loading?: boolean;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Current playhead position in seconds (optional) */
  currentTime?: number;
  /** Clip start time on timeline (optional) */
  startTime?: number;
  /** Clip duration (optional) */
  duration?: number;
  /** Pixels per second (zoom level) */
  pixelsPerSecond?: number;
}

/**
 * Waveform renderer using Canvas API
 * 
 * Features:
 * - Cyan waveform color (matches design system)
 * - Playhead cursor overlay
 * - Smooth rendering with Canvas
 * - Responsive to zoom level
 */
export function WaveformRenderer({
  audioId,
  peaks,
  loading = false,
  width,
  height,
  currentTime,
  startTime = 0,
  duration,
  pixelsPerSecond = 50,
}: WaveformRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas (slightly lighter black for contrast)
    ctx.fillStyle = '#09090b'; // zinc-950
    ctx.fillRect(0, 0, width, height);
    
    // Show loading state
    if (loading) {
      ctx.fillStyle = '#52525b'; // zinc-600
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Loading...', width / 2, height / 2);
      return;
    }
    
    // Show message if no peaks
    if (!peaks || peaks.length === 0) {
      ctx.fillStyle = '#52525b'; // zinc-600
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No waveform', width / 2, height / 2);
      return;
    }
    
    // Draw waveform
    const centerY = height / 2;
    const maxAmplitude = height / 2 - 6; // Leave padding
    
    // Calculate how many pixels per peak
    const pixelsPerPeak = width / peaks.length;
    
    // Draw waveform bars with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#22d3ee'); // cyan-400
    gradient.addColorStop(0.5, '#06b6d4'); // cyan-500
    gradient.addColorStop(1, '#0891b2'); // cyan-600
    ctx.fillStyle = gradient;
    
    peaks.forEach((peak, index) => {
      const x = index * pixelsPerPeak;
      const minY = centerY + (peak.min * maxAmplitude);
      const maxY = centerY + (peak.max * maxAmplitude);
      const barHeight = maxY - minY;
      
      // Draw vertical bar for this peak
      ctx.fillRect(x, minY, Math.max(pixelsPerPeak, 1), barHeight);
    });
    
    // Draw subtle center line
    ctx.strokeStyle = '#27272a'; // zinc-800
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }, [peaks, loading, width, height, currentTime, startTime, duration, pixelsPerSecond]);
  
  return (
    <canvas
      ref={canvasRef}
      className="block"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}
