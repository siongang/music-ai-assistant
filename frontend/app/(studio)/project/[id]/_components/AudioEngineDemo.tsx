/**
 * Audio Engine Demo Component
 * 
 * Demonstrates audio engine functionality with uploaded audio files.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { AudioEngine, Session, Track, Clip, EngineEvent, AudioAsset } from '@/audio_engine';
import { useObjectTreeStore } from '@/features/object-tree/store/object-tree-store';
import { isAudioObject } from '@/types';
import { AudioViewer } from './AudioViewer';
import { AudioEngineProvider } from '@/contexts/AudioEngineContext';

/**
 * Demo component for audio engine
 * 
 * Features:
 * - Loads audio from object tree
 * - Creates demo session with tracks and clips
 * - Demonstrates playback, mute/solo, volume/pan
 */
export function AudioEngineDemo() {
  const params = useParams();
  const projectId = typeof params?.id === 'string' ? params.id : null;
  
  const { getRootObjects } = useObjectTreeStore();
  const [engine, setEngine] = useState<AudioEngine | null>(null);
  const [session, setSession] = useState<Session>({ tracks: [], masterGain: 1.0 });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load session from backend on mount
  useEffect(() => {
    if (!projectId) return;
    
    const loadSession = async () => {
      try {
        console.log('Loading sessions from backend...');
        const response = await fetch(`/api/projects/${projectId}/sessions?limit=1`);
        
        if (!response.ok) {
          throw new Error('Failed to load sessions');
        }
        
        const sessions = await response.json();
        
        if (sessions.length > 0) {
          // Load the most recent session
          const latestSession = sessions[0];
          console.log('Loading session:', latestSession.id);
          
          const sessionResponse = await fetch(`/api/projects/${projectId}/sessions/${latestSession.id}`);
          if (!sessionResponse.ok) {
            throw new Error('Failed to load session details');
          }
          
          const sessionData = await sessionResponse.json();
          console.log('Session loaded:', sessionData);
          
          // Convert from API format to engine format
          const loadedSession: Session = {
            tracks: sessionData.tracks.map((track: any) => ({
              id: track.id,
              name: track.name,
              clips: track.clips.map((clip: any) => ({
                id: clip.id,
                assetId: clip.assetId,
                start: clip.start,
                in: clip.in,
                duration: clip.duration,
                playbackRate: clip.playbackRate || 1.0,
              })),
              gain: track.gain,
              pan: track.pan,
              mute: track.mute,
              solo: track.solo,
            })),
            masterGain: sessionData.master_gain,
          };
          
          setSession(loadedSession);
          setSessionId(latestSession.id);
        } else {
          console.log('No existing sessions found');
        }
      } catch (err) {
        console.error('Failed to load session:', err);
        // Don't show error, just start with empty session
      } finally {
        setLoadingSession(false);
      }
    };
    
    loadSession();
  }, [projectId]);
  
  // Initialize engine (without AudioContext - that requires user gesture)
  useEffect(() => {
    const audioEngine = new AudioEngine();
    
    // Subscribe to events
    audioEngine.on(EngineEvent.Time, (payload: any) => {
      setCurrentTime(payload.currentTime);
    });
    
    audioEngine.on(EngineEvent.State, (payload: any) => {
      setIsPlaying(payload.isPlaying);
    });
    
    audioEngine.on(EngineEvent.Error, (payload: any) => {
      setError(payload.message);
    });
    
    // Store engine instance (but don't initialize yet - needs user gesture)
    setEngine(audioEngine);
    
    return () => {
      audioEngine.dispose();
    };
  }, []);
  
  // Initialize AudioContext on first user interaction
  const initializeAudioContext = async () => {
    if (!engine || isInitialized) return;
    
    try {
      await engine.init();
      setIsInitialized(true);
      setError(null);
      
      // Load current session if it exists
      if (session.tracks.length > 0) {
        engine.loadSession(session);
      }
    } catch (err) {
      setError('Failed to initialize audio engine');
      console.error(err);
    }
  };
  
  // Debounced save to backend
  const saveSessionToBackend = useCallback(async (sessionToSave: Session, existingSessionId: string | null) => {
    if (!projectId) return;
    
    try {
      // Convert session to API format
      const sessionData = {
        name: 'Audio Session',
        tracks: sessionToSave.tracks.map((track) => ({
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
        master_gain: sessionToSave.masterGain,
      };
      
      if (existingSessionId) {
        // Update existing session
        console.log('Updating session:', existingSessionId);
        const response = await fetch(`/api/projects/${projectId}/sessions/${existingSessionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sessionData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update session');
        }
        
        console.log('Session updated successfully');
      } else {
        // Create new session
        console.log('Creating new session');
        const response = await fetch(`/api/projects/${projectId}/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sessionData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create session');
        }
        
        const savedSession = await response.json();
        setSessionId(savedSession.id);
        console.log('Session created successfully:', savedSession.id);
      }
    } catch (err) {
      console.error('Failed to save session:', err);
      // Don't show error to user, just log it
    }
  }, [projectId]);
  
  // Auto-save session to backend (debounced)
  useEffect(() => {
    // Don't save if session is still loading or empty
    if (loadingSession || session.tracks.length === 0) {
      return;
    }
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for debounced save (2 seconds after last change)
    saveTimeoutRef.current = setTimeout(() => {
      console.log('Auto-saving session...');
      saveSessionToBackend(session, sessionId);
    }, 2000);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [session, sessionId, loadingSession, saveSessionToBackend]);
  
  // Load audio from object tree
  // Create tracks BEFORE engine is initialized so user can see/drag to them
  // Audio loading happens when engine is initialized
  // Architecture: 1 Track = 1 Audio Object (1:1 mapping)
  useEffect(() => {
    if (!engine || !projectId || loadingSession) return;
    
    // Only auto-create tracks if session is empty and audio files exist
    if (session.tracks.length === 0) {
      const rootObjects = getRootObjects();
      const audioObjects = rootObjects.filter(isAudioObject);
      
      if (audioObjects.length === 0) {
        return; // Don't show error yet, user might upload later
      }
      
      console.log(`Auto-creating ${audioObjects.length} tracks from audio objects (1:1 mapping)...`);
      
      // Create tracks immediately (even if engine not initialized)
      // Each track represents ONE audio object (1:1 relationship)
      const tracks: Track[] = audioObjects.map((obj, i) => {
        const audioId = obj.id;
        
        // Each track has exactly ONE clip representing the full audio object
        return {
          id: audioId, // Use audio object ID as track ID for 1:1 mapping
          name: obj.name,
          clips: [
            {
              id: `clip-${audioId}`,
              assetId: audioId,
              start: 0, // Audio starts at time 0
              in: 0,    // Play from beginning of audio
              duration: Number(obj.metadata.duration) || 30,
            },
          ],
          gain: 1.0,
          pan: 0.0,
          mute: false,
          solo: false,
        };
      });
      
      const newSession: Session = { tracks, masterGain: 1.0 };
      setSession(newSession);
    }
    
    // Load assets when engine is initialized
    if (isInitialized && session.tracks.length > 0) {
      // Get all unique asset IDs from session
      const assetIds = new Set<string>();
      session.tracks.forEach(track => {
        track.clips.forEach(clip => {
          assetIds.add(clip.assetId);
        });
      });
      
      if (assetIds.size === 0) return;
      
      setLoadingAssets(true);
      
      const loadAssets = async () => {
        console.log(`Loading ${assetIds.size} audio assets...`);
        
        for (const assetId of assetIds) {
          // Create asset
          const asset: AudioAsset = {
            id: assetId,
            url: `/api/projects/${projectId}/audio/${assetId}/download`,
          };
          
          engine.addAsset(asset);
          
          try {
            console.log(`Preloading asset ${assetId}...`);
            await engine.preloadAsset(assetId);
            console.log(`Asset ${assetId} loaded successfully`);
          } catch (err) {
            console.error(`Failed to load asset ${assetId}:`, err);
            setError(`Failed to load audio asset`);
          }
        }
        
        console.log('Loading session into engine...');
        engine.loadSession(session);
        console.log('Session loaded successfully');
        
        setLoadingAssets(false);
        setError(null);
      };
      
      loadAssets().catch(err => {
        console.error('Failed to load assets:', err);
        setError('Failed to load audio files');
        setLoadingAssets(false);
      });
    }
  }, [engine, isInitialized, projectId, session, getRootObjects, loadingSession]);
  
  // Transport controls
  const handlePlay = async () => {
    if (!engine) return;
    
    // Initialize audio context on first play if not already initialized
    if (!isInitialized) {
      await initializeAudioContext();
    }
    
    if (isInitialized) {
      engine.play();
    }
  };
  
  const handlePause = () => {
    if (!engine) return;
    console.log('Pausing playback...');
    engine.pause();
  };
  
  const handleStop = () => {
    if (!engine) return;
    console.log('Stopping playback...');
    engine.stop();
  };
  
  const handleTrackDelete = (trackId: string) => {
    console.log(`Deleting track ${trackId}`);
    
    setSession((prev) => {
      const newSession = {
        ...prev,
        tracks: prev.tracks.filter((track) => track.id !== trackId),
      };
      
      // Reload session in engine if initialized
      if (isInitialized && engine) {
        engine.loadSession(newSession);
      }
      
      return newSession;
    });
  };
  
  // Tracks are auto-created from audio objects (1:1 mapping)
  // No manual track creation needed
  
  const handleSeek = (time: number) => {
    if (!engine) return;
    engine.seek(time);
  };
  
  // No clip adding needed - tracks are 1:1 with audio objects
  // Each track already represents its full audio object
  
  const handleTrackUpdate = (trackId: string, updates: Partial<Track>) => {
    if (!engine) return;
    
    // Only apply updates to engine if it's initialized
    // Otherwise just update the session state
    if (isInitialized) {
      if (updates.gain !== undefined) {
        engine.setTrackGain(trackId, updates.gain);
      }
      if (updates.pan !== undefined) {
        engine.setTrackPan(trackId, updates.pan);
      }
      if (updates.mute !== undefined) {
        engine.setTrackMute(trackId, updates.mute);
      }
      if (updates.solo !== undefined) {
        engine.setTrackSolo(trackId, updates.solo);
      }
    }
    
    // Update session state (always update UI)
    setSession((prev) => ({
      ...prev,
      tracks: prev.tracks.map((track) =>
        track.id === trackId ? { ...track, ...updates } : track
      ),
    }));
  };
  
  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center bg-black text-zinc-500">
        Invalid project
      </div>
    );
  }
  
  if (!engine) {
    return (
      <div className="flex h-full items-center justify-center bg-black text-zinc-500">
        Initializing audio engine...
      </div>
    );
  }
  
  if (loadingSession) {
    return (
      <div className="flex h-full items-center justify-center bg-black text-zinc-500">
        Loading session...
      </div>
    );
  }
  
  if (loadingAssets) {
    return (
      <div className="flex h-full items-center justify-center bg-black text-zinc-500">
        Loading audio files...
      </div>
    );
  }
  
  // Show welcome message if no audio uploaded yet
  const rootObjects = getRootObjects();
  const audioObjects = rootObjects.filter(isAudioObject);
  
  if (audioObjects.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-black text-zinc-400">
        <p className="text-lg">No audio files found</p>
        <p className="text-sm text-zinc-600">
          Upload audio files from the object panel to get started
        </p>
      </div>
    );
  }
  
  if (error && session.tracks.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-black text-zinc-400">
        <p>{error}</p>
        <p className="text-sm text-zinc-600">
          Upload audio files from the object panel to get started
        </p>
      </div>
    );
  }
  
  return (
    <AudioEngineProvider
      engine={engine}
      isInitialized={isInitialized}
      isPlaying={isPlaying}
      currentTime={currentTime}
      onPlay={handlePlay}
      onPause={handlePause}
      onStop={handleStop}
      onSeek={handleSeek}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black">
        {error && (
          <div className="border-b border-red-900 bg-red-950/20 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}
        
        {/* Audio Viewer */}
        <AudioViewer
          projectId={projectId}
          session={session}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onTrackUpdate={handleTrackUpdate}
          onSeek={handleSeek}
          onTrackDelete={handleTrackDelete}
        />
      </div>
    </AudioEngineProvider>
  );
}
