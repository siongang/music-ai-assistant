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
  const requestKey = projectId && audioId ? `${projectId}:${audioId}:${level}` : null;
  const [result, setResult] = useState<{
    key: string | null;
    data: WaveformData | null;
    error: string | null;
  }>({
    key: null,
    data: null,
    error: null,
  });
  
  useEffect(() => {
    if (!requestKey) {
      return;
    }

    const controller = new AbortController();

    // Fetch waveform data
    fetch(`/api/projects/${projectId}/audio/${audioId}/waveform?level=${level}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch waveform: ${res.statusText}`);
        }
        return res.json();
      })
      .then((waveformData: WaveformData) => {
        setResult({
          key: requestKey,
          data: waveformData,
          error: null,
        });
      })
      .catch((err) => {
        if (controller.signal.aborted) {
          return;
        }
        console.error('Failed to fetch waveform data:', err);
        setResult({
          key: requestKey,
          data: null,
          error: err instanceof Error ? err.message : String(err),
        });
      });

    return () => {
      controller.abort();
    };
  }, [projectId, audioId, level, requestKey]);

  if (!requestKey) {
    return { data: null, loading: false, error: null };
  }

  const isCurrentResult = result.key === requestKey;
  
  return {
    data: isCurrentResult ? result.data : null,
    loading: !isCurrentResult,
    error: isCurrentResult ? result.error : null,
  };
}
