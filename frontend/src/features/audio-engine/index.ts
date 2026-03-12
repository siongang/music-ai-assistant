/**
 * Audio Engine Feature
 * 
 * Export all audio engine related components and hooks.
 */

export { AudioEngineDemo } from './components/AudioEngineDemo';

export {
  AudioEngineProvider,
  useAudioEngine as useAudioEngineContext,
} from './context/AudioEngineContext';
export type {
  AudioEngineContextValue,
  AudioEngineProviderProps,
} from './context/AudioEngineContext';

export * from './core';

export { useAudioEngine } from './hooks/useAudioEngine';
export type { UseAudioEngineResult } from './hooks/useAudioEngine';

export { useWaveformData } from './hooks/useWaveformData';
export type { UseWaveformDataResult, WaveformData } from './hooks/useWaveformData';

export { useSessionStore } from './store/session-store';
export type { SessionStore } from './store/session-store';
