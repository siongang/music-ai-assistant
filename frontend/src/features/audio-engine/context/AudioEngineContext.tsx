/**
 * Audio Engine Context
 * 
 * Provides audio engine state and controls to components throughout the app.
 * This allows the transport bar to control playback without prop drilling.
 */

'use client';

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from 'react';
import { AudioEngine } from '@/features/audio-engine/core';

export interface AudioEngineContextValue {
  /** Audio engine instance */
  engine: AudioEngine | null;
  /** Is audio engine initialized */
  isInitialized: boolean;
  /** Is currently playing */
  isPlaying: boolean;
  /** Current playback time in seconds */
  currentTime: number;
  /** Formatted current time (MM:SS.S) */
  formattedTime: string;
  /** Play audio */
  play: () => void;
  /** Pause audio */
  pause: () => void;
  /** Stop audio (pause and reset to 0) */
  stop: () => void;
  /** Seek to time */
  seek: (time: number) => void;
  /** Toggle play/pause */
  togglePlayPause: () => void;
}

const AudioEngineContext = createContext<AudioEngineContextValue | null>(null);

const defaultAudioEngineContextValue: AudioEngineContextValue = {
  engine: null,
  isInitialized: false,
  isPlaying: false,
  currentTime: 0,
  formattedTime: '00:00.0',
  play: () => {},
  pause: () => {},
  stop: () => {},
  seek: () => {},
  togglePlayPause: () => {},
};

let audioEngineSnapshot: AudioEngineContextValue = defaultAudioEngineContextValue;
const audioEngineListeners = new Set<() => void>();

function updateAudioEngineSnapshot(value: AudioEngineContextValue) {
  audioEngineSnapshot = value;
  audioEngineListeners.forEach((listener) => listener());
}

function subscribeToAudioEngine(listener: () => void) {
  audioEngineListeners.add(listener);
  return () => {
    audioEngineListeners.delete(listener);
  };
}

function getAudioEngineSnapshot() {
  return audioEngineSnapshot;
}

export interface AudioEngineProviderProps {
  engine: AudioEngine | null;
  isInitialized: boolean;
  isPlaying: boolean;
  currentTime: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  children: React.ReactNode;
}

/**
 * Provider component that wraps the app and provides audio engine state
 */
export function AudioEngineProvider({
  engine,
  isInitialized,
  isPlaying,
  currentTime,
  onPlay,
  onPause,
  onStop,
  onSeek,
  children,
}: AudioEngineProviderProps) {
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  }, [isPlaying, onPlay, onPause]);

  // Format time as MM:SS.S — pure function, no reactive deps needed
  function formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const deciseconds = Math.floor((time % 1) * 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${deciseconds}`;
  }

  const value: AudioEngineContextValue = {
    engine,
    isInitialized,
    isPlaying,
    currentTime,
    formattedTime: formatTime(currentTime),
    play: onPlay,
    pause: onPause,
    stop: onStop,
    seek: onSeek,
    togglePlayPause,
  };

  // Sync the module-level snapshot so components outside the provider tree
  // (e.g. TransportBar in the layout) can subscribe via useSyncExternalStore.
  // Deps are individual primitives so the effect only fires when something
  // actually changes, not on every render because `value` is a new object.
  useEffect(() => {
    updateAudioEngineSnapshot(value);
    return () => {
      updateAudioEngineSnapshot(defaultAudioEngineContextValue);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, isInitialized, isPlaying, currentTime, onPlay, onPause, onStop, onSeek, togglePlayPause]);

  return (
    <AudioEngineContext.Provider value={value}>
      {children}
    </AudioEngineContext.Provider>
  );
}

/**
 * Hook to access audio engine context
 * 
 * @throws Error if used outside of AudioEngineProvider
 */
export function useAudioEngine(): AudioEngineContextValue {
  const context = useContext(AudioEngineContext);
  const snapshot = useSyncExternalStore(
    subscribeToAudioEngine,
    getAudioEngineSnapshot,
    getAudioEngineSnapshot
  );

  return context ?? snapshot;
}
