/**
 * Audio Engine Demo Component
 *
 * Demonstrates audio engine functionality with uploaded audio files.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  AudioEngine,
  Session,
  Track,
  EngineEvent,
  AudioAsset,
  type ErrorEventPayload,
  type StateEventPayload,
  type TimeEventPayload,
} from "@/features/audio-engine/core";
import { useObjectTreeStore } from "@/features/object-tree/store/object-tree-store";
import { isAudioObject, type AudioObject } from "@/types";
import {
  type AudioSessionListItem,
  type AudioSessionResponse,
} from "@/api-client/types";
import { AudioViewer } from "@/features/tracks/components/AudioViewer";
import { AudioEngineProvider } from "@/features/audio-engine/context/AudioEngineContext";

function getAudioDuration(audioObject: AudioObject): number | null {
  const duration = audioObject.metadata.duration;
  return typeof duration === "number" && Number.isFinite(duration) && duration > 0
    ? duration
    : null;
}

function buildTrackFromAudioObject(audioObject: AudioObject, existingTrack?: Track): Track {
  const clip = existingTrack?.clips[0];
  const duration = getAudioDuration(audioObject) ?? clip?.duration ?? 1;

  return {
    id: audioObject.id,
    name: audioObject.name,
    clips: [
      {
        id: clip?.id ?? `clip-${audioObject.id}`,
        assetId: audioObject.id,
        start: clip?.start ?? 0,
        in: clip?.in ?? 0,
        duration,
        playbackRate: clip?.playbackRate ?? 1.0,
      },
    ],
    gain: existingTrack?.gain ?? 1.0,
    pan: existingTrack?.pan ?? 0.0,
    mute: existingTrack?.mute ?? false,
    solo: existingTrack?.solo ?? false,
  };
}

function syncSessionWithAudioObjects(previousSession: Session, audioObjects: AudioObject[]): Session {
  const existingTrackMap = new Map(previousSession.tracks.map((track) => [track.id, track]));
  const nextTracks = audioObjects.map((audioObject) =>
    buildTrackFromAudioObject(audioObject, existingTrackMap.get(audioObject.id))
  );

  const sessionChanged =
    nextTracks.length !== previousSession.tracks.length ||
    nextTracks.some((track, index) => {
      const prev = previousSession.tracks[index];
      if (!prev) return true;
      return (
        prev.id !== track.id ||
        prev.name !== track.name ||
        prev.clips[0]?.duration !== track.clips[0]?.duration
      );
    });

  if (!sessionChanged) {
    return previousSession;
  }

  return {
    ...previousSession,
    tracks: nextTracks,
  };
}

function getTrackStructureKey(session: Session): string {
  return session.tracks
    .map((track) => {
      const clip = track.clips[0];
      return `${track.id}:${clip?.assetId ?? ""}:${clip?.duration ?? 0}`;
    })
    .join("|");
}

export function AudioEngineDemo() {
  const params = useParams();
  const projectId = typeof params?.id === "string" ? params.id : null;

  const { objects, removeObject } = useObjectTreeStore();
  const audioObjects = Object.values(objects)
    .filter((object): object is AudioObject => object.parentId === null && isAudioObject(object))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

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
  const loadedAssetIdsRef = useRef<Set<string>>(new Set());
  const trackStructureKeyRef = useRef("");

  useEffect(() => {
    if (!projectId) return;

    const loadSession = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/sessions?limit=1`);
        if (!response.ok) {
          throw new Error("Failed to load sessions");
        }

        const sessions = (await response.json()) as AudioSessionListItem[];
        if (sessions.length === 0) {
          return;
        }

        const latestSession = sessions[0];
        const sessionResponse = await fetch(`/api/projects/${projectId}/sessions/${latestSession.id}`);
        if (!sessionResponse.ok) {
          throw new Error("Failed to load session details");
        }

        const sessionData = (await sessionResponse.json()) as AudioSessionResponse;
        const loadedSession: Session = {
          tracks: sessionData.tracks.map((track) => ({
            id: track.id,
            name: track.name,
            clips: track.clips.map((clip) => ({
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
      } catch (loadError) {
        console.error("Failed to load session:", loadError);
      } finally {
        setLoadingSession(false);
      }
    };

    loadSession();
  }, [projectId]);

  useEffect(() => {
    const audioEngine = new AudioEngine();

    audioEngine.on(EngineEvent.Time, (payload: TimeEventPayload) => {
      setCurrentTime(payload.currentTime);
    });

    audioEngine.on(EngineEvent.State, (payload: StateEventPayload) => {
      setIsPlaying(payload.isPlaying);
    });

    audioEngine.on(EngineEvent.Error, (payload: ErrorEventPayload) => {
      setError(payload.message);
    });

    setEngine(audioEngine);

    return () => {
      audioEngine.dispose();
    };
  }, []);

  useEffect(() => {
    if (loadingSession) return;

    setSession((previousSession) => syncSessionWithAudioObjects(previousSession, audioObjects));
  }, [audioObjects, loadingSession]);

  const initializeAudioContext = useCallback(async (): Promise<boolean> => {
    if (!engine) return false;
    if (isInitialized) return true;

    try {
      await engine.init();
      if (session.tracks.length > 0) {
        trackStructureKeyRef.current = getTrackStructureKey(session);
        engine.loadSession(session);
      }
      setIsInitialized(true);
      setError(null);
      return true;
    } catch (initError) {
      setError("Failed to initialize audio engine");
      console.error(initError);
      return false;
    }
  }, [engine, isInitialized, session]);

  const saveSessionToBackend = useCallback(
    async (sessionToSave: Session, existingSessionId: string | null) => {
      if (!projectId) return;

      try {
        const sessionData = {
          name: "Audio Session",
          tracks: sessionToSave.tracks.map((track) => ({
            id: track.id,
            name: track.name || "Untitled Track",
            audioObjectId: track.id,
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
          const response = await fetch(`/api/projects/${projectId}/sessions/${existingSessionId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sessionData),
          });

          if (!response.ok) {
            throw new Error("Failed to update session");
          }

          return;
        }

        const response = await fetch(`/api/projects/${projectId}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sessionData),
        });

        if (!response.ok) {
          throw new Error("Failed to create session");
        }

        const savedSession = await response.json();
        setSessionId(savedSession.id);
      } catch (saveError) {
        console.error("Failed to save session:", saveError);
      }
    },
    [projectId]
  );

  useEffect(() => {
    if (loadingSession || session.tracks.length === 0) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveSessionToBackend(session, sessionId);
    }, 400);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [session, sessionId, loadingSession, saveSessionToBackend]);

  useEffect(() => {
    if (!engine || !isInitialized) return;

    const structureKey = getTrackStructureKey(session);
    if (structureKey === trackStructureKeyRef.current) {
      return;
    }

    trackStructureKeyRef.current = structureKey;
    engine.loadSession(session);
  }, [engine, isInitialized, session]);

  const ensureSessionAssetsLoaded = useCallback(async (): Promise<boolean> => {
    if (!engine || !isInitialized || !projectId || session.tracks.length === 0) {
      return true;
    }

    setLoadingAssets(true);
    try {
      for (const track of session.tracks) {
        for (const clip of track.clips) {
          if (loadedAssetIdsRef.current.has(clip.assetId)) {
            continue;
          }

          const asset: AudioAsset = {
            id: clip.assetId,
            url: `/api/projects/${projectId}/audio/${clip.assetId}/download`,
          };

          engine.addAsset(asset);
          const duration = await engine.preloadAsset(clip.assetId);
          loadedAssetIdsRef.current.add(clip.assetId);

          setSession((previousSession) => {
            let changed = false;
            const tracks = previousSession.tracks.map((existingTrack) => {
              if (existingTrack.id !== track.id) {
                return existingTrack;
              }

              const clips = existingTrack.clips.map((existingClip) => {
                if (existingClip.assetId !== clip.assetId) {
                  return existingClip;
                }

                if (Math.abs(existingClip.duration - duration) < 0.01) {
                  return existingClip;
                }

                changed = true;
                return {
                  ...existingClip,
                  duration,
                };
              });

              return changed
                ? {
                    ...existingTrack,
                    clips,
                  }
                : existingTrack;
            });

            return changed
              ? {
                  ...previousSession,
                  tracks,
                }
              : previousSession;
          });
        }
      }

      setError(null);
      return true;
    } catch (loadError) {
      setError("Failed to load audio files");
      console.error("Failed to load assets:", loadError);
      return false;
    } finally {
      setLoadingAssets(false);
    }
  }, [engine, isInitialized, projectId, session.tracks]);

  useEffect(() => {
    if (!engine || !isInitialized || session.tracks.length === 0) return;

    void ensureSessionAssetsLoaded();
  }, [engine, isInitialized, session.tracks, ensureSessionAssetsLoaded]);

  const handlePlay = useCallback(async () => {
    if (!engine) return;

    const ready = await initializeAudioContext();
    if (!ready) return;

    const assetsLoaded = await ensureSessionAssetsLoaded();
    if (!assetsLoaded) return;

    try {
      engine.play();
      setError(null);
    } catch (playError) {
      setError("Playback failed to start");
      console.error(playError);
    }
  }, [engine, ensureSessionAssetsLoaded, initializeAudioContext]);

  const handlePause = useCallback(() => {
    if (!engine) return;
    engine.pause();
  }, [engine]);

  const handleStop = useCallback(() => {
    if (!engine) return;
    engine.stop();
  }, [engine]);

  const handleSeek = useCallback(
    async (time: number) => {
      if (!engine) return;

      const ready = await initializeAudioContext();
      if (!ready) return;

      engine.seek(time);
    },
    [engine, initializeAudioContext]
  );

  const handleTrackDelete = useCallback(
    (trackId: string) => {
      removeObject(trackId);
      loadedAssetIdsRef.current.delete(trackId);
      setSession((previousSession) => ({
        ...previousSession,
        tracks: previousSession.tracks.filter((track) => track.id !== trackId),
      }));
    },
    [removeObject]
  );

  const handleTrackUpdate = useCallback(
    (trackId: string, updates: Partial<Track>) => {
      if (!engine) return;

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

      setSession((previousSession) => ({
        ...previousSession,
        tracks: previousSession.tracks.map((track) =>
          track.id === trackId ? { ...track, ...updates } : track
        ),
      }));
    },
    [engine, isInitialized]
  );

  // Must be defined before any early returns to satisfy Rules of Hooks
  const handleSeekVoid = useCallback(
    (time: number) => { void handleSeek(time); },
    [handleSeek]
  );

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

  return (
    <AudioEngineProvider
      engine={engine}
      isInitialized={isInitialized}
      isPlaying={isPlaying}
      currentTime={currentTime}
      onPlay={handlePlay}
      onPause={handlePause}
      onStop={handleStop}
      onSeek={handleSeekVoid}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black">
        {error && (
          <div className="border-b border-red-900 bg-red-950/20 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <AudioViewer
          projectId={projectId}
          session={session}
          currentTime={currentTime}
          onTrackUpdate={handleTrackUpdate}
          onSeek={handleSeekVoid}
          onTrackDelete={handleTrackDelete}
        />
      </div>
    </AudioEngineProvider>
  );
}
