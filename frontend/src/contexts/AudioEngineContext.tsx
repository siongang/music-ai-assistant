/**
 * Audio Engine Context
 * 
 * Provides audio engine state and controls to components throughout the app.
 * This allows the transport bar to control playback without prop drilling.
 */

'use client';

import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { AudioEngine } from '@/audio_engine';

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

  // Format time as MM:SS.S
  const formattedTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const deciseconds = Math.floor((time % 1) * 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${deciseconds}`;
  }, []);

  const value: AudioEngineContextValue = {
    engine,
    isInitialized,
    isPlaying,
    currentTime,
    formattedTime: formattedTime(currentTime),
    play: onPlay,
    pause: onPause,
    stop: onStop,
    seek: onSeek,
    togglePlayPause,
  };

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
  if (!context) {
    // Return default values if not in context (graceful degradation)
    return {
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
  }
  return context;
}
