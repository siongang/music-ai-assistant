/**
 * useWaveformData Hook
 * 
 * React hook for fetching waveform visualization data.
 */

"use client";

import { useEffect, useState } from 'react';

export interface WaveformData {
  audioId: string;
  level: number;
  duration: number;
  channels: number;
  peaks: Array<{ min: number; max: number }>;
}

export interface UseWaveformDataResult {
  /** Waveform peak data */
  data: WaveformData | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
}

/**
 * Hook for fetching waveform data
 * 
 * Fetches waveform visualization data from the backend.
 * Caches results in component state.
 * 
 * @param projectId - Project ID
 * @param audioId - Audio ID
 * @param level - Zoom level (samples per second)
 * @returns Waveform data and loading state
 */
export function useWaveformData(
  projectId: string,
  audioId: string,
  level: number = 512
): UseWaveformDataResult {
  const [data, setData] = useState<WaveformData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!projectId || !audioId) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Fetch waveform data
    fetch(`/api/projects/${projectId}/audio/${audioId}/waveform?level=${level}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch waveform: ${res.statusText}`);
        }
        return res.json();
      })
      .then((waveformData: WaveformData) => {
        setData(waveformData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch waveform data:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [projectId, audioId, level]);
  
  return { data, loading, error };
}
