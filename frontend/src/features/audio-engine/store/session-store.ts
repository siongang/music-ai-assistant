/**
 * Audio Session Store
 * 
 * Zustand store for audio timeline session state.
 */

"use client";

import { create } from 'zustand';
import type { Session, Track, Clip } from '@/features/audio-engine/core';

export interface SessionStore {
  /** Current session */
  currentSession: Session | null;
  
  /** Load a session */
  loadSession: (session: Session) => void;
  
  /** Add a track */
  addTrack: (track: Track) => void;
  
  /** Update a track */
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  
  /** Remove a track */
  removeTrack: (trackId: string) => void;
  
  /** Add a clip to a track */
  addClip: (trackId: string, clip: Clip) => void;
  
  /** Remove a clip from a track */
  removeClip: (trackId: string, clipId: string) => void;
  
  /** Set master gain */
  setMasterGain: (gain: number) => void;
  
  /** Save session to backend */
  saveToBackend: (projectId: string) => Promise<void>;
  
  /** Load session from backend */
  loadFromBackend: (projectId: string, sessionId: string) => Promise<void>;
}

/**
 * Audio session store
 * 
 * Manages audio timeline session state with Zustand.
 */
export const useSessionStore = create<SessionStore>((set, get) => ({
  currentSession: null,
  
  loadSession: (session) => {
    set({ currentSession: session });
  },
  
  addTrack: (track) => {
    const { currentSession } = get();
    if (!currentSession) return;
    
    set({
      currentSession: {
        ...currentSession,
        tracks: [...currentSession.tracks, track],
      },
    });
  },
  
  updateTrack: (trackId, updates) => {
    const { currentSession } = get();
    if (!currentSession) return;
    
    set({
      currentSession: {
        ...currentSession,
        tracks: currentSession.tracks.map((track) =>
          track.id === trackId ? { ...track, ...updates } : track
        ),
      },
    });
  },
  
  removeTrack: (trackId) => {
    const { currentSession } = get();
    if (!currentSession) return;
    
    set({
      currentSession: {
        ...currentSession,
        tracks: currentSession.tracks.filter((track) => track.id !== trackId),
      },
    });
  },
  
  addClip: (trackId, clip) => {
    const { currentSession } = get();
    if (!currentSession) return;
    
    set({
      currentSession: {
        ...currentSession,
        tracks: currentSession.tracks.map((track) =>
          track.id === trackId
            ? { ...track, clips: [...track.clips, clip] }
            : track
        ),
      },
    });
  },
  
  removeClip: (trackId, clipId) => {
    const { currentSession } = get();
    if (!currentSession) return;
    
    set({
      currentSession: {
        ...currentSession,
        tracks: currentSession.tracks.map((track) =>
          track.id === trackId
            ? { ...track, clips: track.clips.filter((clip) => clip.id !== clipId) }
            : track
        ),
      },
    });
  },
  
  setMasterGain: (gain) => {
    const { currentSession } = get();
    if (!currentSession) return;
    
    set({
      currentSession: {
        ...currentSession,
        masterGain: gain,
      },
    });
  },
  
  saveToBackend: async (projectId) => {
    const { currentSession } = get();
    if (!currentSession) {
      throw new Error('No session to save');
    }
    
    // Convert session to API format
    const sessionData = {
      name: 'Untitled Session',
      tracks: currentSession.tracks.map((track) => ({
        id: track.id,
        name: track.name || 'Untitled Track',
        audioObjectId: null,
        gain: track.gain,
        pan: track.pan,
        mute: track.mute,
        solo: track.solo,
        clips: track.clips.map((clip) => ({
          id: clip.id,
          assetId: clip.assetId,
          start: clip.start,
          in: clip.in,
          duration: clip.duration,
          playbackRate: clip.playbackRate || 1.0,
        })),
      })),
      master_gain: currentSession.masterGain,
    };
    
    const response = await fetch(`/api/projects/${projectId}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save session');
    }
    
    const savedSession = await response.json();
    console.log('Session saved:', savedSession);
  },
  
  loadFromBackend: async (projectId, sessionId) => {
    const response = await fetch(`/api/projects/${projectId}/sessions/${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to load session');
    }
    
    const sessionData = await response.json();
    
    // Convert from API format to engine format
    const session: Session = {
      tracks: sessionData.tracks.map((track: any) => ({
        id: track.id,
        name: track.name,
        clips: track.clips.map((clip: any) => ({
          id: clip.id,
          assetId: clip.assetId,
          start: clip.start,
          in: clip.in,
          duration: clip.duration,
          playbackRate: clip.playbackRate,
        })),
        gain: track.gain,
        pan: track.pan,
        mute: track.mute,
        solo: track.solo,
      })),
      masterGain: sessionData.master_gain,
    };
    
    set({ currentSession: session });
    console.log('Session loaded:', session);
  },
}));
