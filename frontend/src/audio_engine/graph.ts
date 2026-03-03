/**
 * Audio Graph Manager
 * 
 * Manages Web Audio API nodes and connections.
 * Creates and maintains the audio processing graph.
 */

import type { Clip } from './types';
import { clamp } from './utils';

/**
 * Track-level audio nodes
 */
export interface TrackNodes {
  gain: GainNode;
  pan: StereoPannerNode;
}

/**
 * Active audio source with metadata
 */
export interface ActiveSource {
  source: AudioBufferSourceNode;
  clipId: string;
  startTime: number; // AudioContext time when source started
}

/**
 * Audio graph manager
 * 
 * Creates and manages Web Audio nodes for tracks and clips.
 * Handles node topology and connections.
 * 
 * Node topology:
 * AudioBufferSourceNode → TrackGainNode → TrackPanNode → MasterGainNode → destination
 */
export class AudioGraph {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private trackNodes: Map<string, TrackNodes>;
  private activeSources: Map<string, ActiveSource[]>;
  
  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.trackNodes = new Map();
    this.activeSources = new Map();
    
    // Create master gain node
    this.masterGain = ctx.createGain();
    this.masterGain.connect(ctx.destination);
    this.masterGain.gain.value = 1.0;
  }
  
  /**
   * Create track nodes
   * @param trackId - Track ID
   * @returns Track nodes
   */
  createTrack(trackId: string): TrackNodes {
    // Remove existing track if present
    this.removeTrack(trackId);
    
    // Create gain and pan nodes
    const gain = this.ctx.createGain();
    const pan = this.ctx.createStereoPanner();
    
    // Connect: gain → pan → master
    gain.connect(pan);
    pan.connect(this.masterGain);
    
    // Set default values
    gain.gain.value = 1.0;
    pan.pan.value = 0.0;
    
    const nodes = { gain, pan };
    this.trackNodes.set(trackId, nodes);
    this.activeSources.set(trackId, []);
    
    return nodes;
  }
  
  /**
   * Remove track and disconnect all nodes
   * @param trackId - Track ID
   */
  removeTrack(trackId: string): void {
    const nodes = this.trackNodes.get(trackId);
    if (nodes) {
      // Stop all sources for this track
      this.stopTrackSources(trackId);
      
      // Disconnect nodes
      nodes.gain.disconnect();
      nodes.pan.disconnect();
      
      this.trackNodes.delete(trackId);
      this.activeSources.delete(trackId);
    }
  }
  
  /**
   * Create and connect an audio source for a clip
   * 
   * @param clip - Clip configuration
   * @param buffer - Audio buffer to play
   * @param trackId - Track ID
   * @param when - When to start (AudioContext time), 0 = now
   * @param offset - Buffer offset in seconds
   * @param duration - Duration to play in seconds
   * @returns Created source node
   */
  createClipSource(
    clip: Clip,
    buffer: AudioBuffer,
    trackId: string,
    when: number = 0,
    offset: number = 0,
    duration?: number
  ): AudioBufferSourceNode {
    const nodes = this.trackNodes.get(trackId);
    if (!nodes) {
      throw new Error(`Track ${trackId} not found`);
    }
    
    // Create source
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    
    // FUTURE: Apply playbackRate for time-stretch
    // source.playbackRate.value = clip.playbackRate ?? 1.0;
    
    // Connect to track gain
    source.connect(nodes.gain);
    
    // Start playback
    const startTime = when || this.ctx.currentTime;
    if (duration !== undefined) {
      source.start(startTime, offset, duration);
    } else {
      source.start(startTime, offset);
    }
    
    // Track active source
    const activeSource: ActiveSource = {
      source,
      clipId: clip.id,
      startTime,
    };
    
    const sources = this.activeSources.get(trackId);
    if (sources) {
      sources.push(activeSource);
    }
    
    // Remove from active sources when it ends
    source.onended = () => {
      const sources = this.activeSources.get(trackId);
      if (sources) {
        const index = sources.findIndex((s) => s.source === source);
        if (index !== -1) {
          sources.splice(index, 1);
        }
      }
    };
    
    return source;
  }
  
  /**
   * Stop all sources for a track
   * @param trackId - Track ID
   */
  stopTrackSources(trackId: string): void {
    const sources = this.activeSources.get(trackId);
    if (sources) {
      sources.forEach((activeSource) => {
        try {
          activeSource.source.stop();
        } catch (e) {
          // Source may have already stopped
        }
      });
      sources.length = 0;
    }
  }
  
  /**
   * Stop all active sources
   */
  stopAllSources(): void {
    this.activeSources.forEach((sources) => {
      sources.forEach((activeSource) => {
        try {
          activeSource.source.stop();
        } catch (e) {
          // Source may have already stopped
        }
      });
      sources.length = 0;
    });
  }
  
  /**
   * Set track gain
   * @param trackId - Track ID
   * @param gain - Gain value (0.0 to 2.0)
   */
  setTrackGain(trackId: string, gain: number): void {
    const nodes = this.trackNodes.get(trackId);
    if (nodes) {
      nodes.gain.gain.value = clamp(gain, 0, 2);
    }
  }
  
  /**
   * Set track pan
   * @param trackId - Track ID
   * @param pan - Pan value (-1.0 to 1.0)
   */
  setTrackPan(trackId: string, pan: number): void {
    const nodes = this.trackNodes.get(trackId);
    if (nodes) {
      nodes.pan.pan.value = clamp(pan, -1, 1);
    }
  }
  
  /**
   * Set master gain
   * @param gain - Gain value (0.0 to 2.0)
   */
  setMasterGain(gain: number): void {
    this.masterGain.gain.value = clamp(gain, 0, 2);
  }
  
  /**
   * Get track nodes
   * @param trackId - Track ID
   * @returns Track nodes or undefined
   */
  getTrackNodes(trackId: string): TrackNodes | undefined {
    return this.trackNodes.get(trackId);
  }
  
  /**
   * Get number of active sources for a track
   * @param trackId - Track ID
   * @returns Number of active sources
   */
  getActiveSourceCount(trackId: string): number {
    return this.activeSources.get(trackId)?.length ?? 0;
  }
  
  /**
   * Dispose of all nodes and connections
   */
  dispose(): void {
    this.stopAllSources();
    
    this.trackNodes.forEach((nodes) => {
      nodes.gain.disconnect();
      nodes.pan.disconnect();
    });
    
    this.masterGain.disconnect();
    
    this.trackNodes.clear();
    this.activeSources.clear();
  }
}
