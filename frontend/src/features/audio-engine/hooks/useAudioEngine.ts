/**
 * useAudioEngine Hook
 * 
 * React hook for managing audio engine lifecycle and state.
 */

"use client";

import { useEffect, useRef, useState } from 'react';
import { AudioEngine, EngineEvent, TransportState } from '@/audio_engine';

export interface UseAudioEngineResult {
  /** Audio engine instance */
  engine: AudioEngine | null;
  /** Current transport state */
  transportState: TransportState;
  /** Is engine initialized */
  isInitialized: boolean;
  /** Initialization error */
  error: string | null;
}

/**
 * Hook for audio engine management
 * 
 * Creates and initializes the audio engine, manages lifecycle,
 * and provides transport state updates.
 * 
 * @param projectId - Project ID (used for caching)
 * @returns Audio engine instance and state
 */
export function useAudioEngine(projectId: string): UseAudioEngineResult {
  const engineRef = useRef<AudioEngine | null>(null);
  const [transportState, setTransportState] = useState<TransportState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Create engine
    const engine = new AudioEngine();
    engineRef.current = engine;
    
    // Subscribe to events
    engine.on(EngineEvent.Time, (payload: any) => {
      setTransportState((prev) => ({
        ...prev,
        currentTime: payload.currentTime,
      }));
    });
    
    engine.on(EngineEvent.State, (payload: any) => {
      setTransportState((prev) => ({
        ...prev,
        isPlaying: payload.isPlaying,
      }));
    });
    
    engine.on(EngineEvent.Error, (payload: any) => {
      console.error('Audio engine error:', payload.message, payload.error);
      setError(payload.message);
    });
    
    // Initialize engine
    engine
      .init()
      .then(() => {
        setIsInitialized(true);
        console.log('Audio engine initialized');
      })
      .catch((err) => {
        console.error('Failed to initialize audio engine:', err);
        setError('Failed to initialize audio engine');
      });
    
    // Cleanup
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [projectId]);
  
  return {
    engine: engineRef.current,
    transportState,
    isInitialized,
    error,
  };
}
