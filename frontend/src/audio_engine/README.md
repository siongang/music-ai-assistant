# Audio Engine

Professional browser-based audio playback engine built with Web Audio API.

## Overview

This is a **playback-only** audio engine designed for multi-track audio playback with precise synchronization. It's built with pure TypeScript and has **zero React dependencies**, making it framework-agnostic and easily testable.

## Architecture

The engine follows a clean separation of concerns:

### Core Components

1. **AudioEngine** (`engine.ts`)
   - Main API for UI consumption
   - Orchestrates all other components
   - Manages state and assets

2. **Clock** (`clock.ts`)
   - Maps AudioContext time to timeline time
   - Provides accurate playback position

3. **AudioGraph** (`graph.ts`)
   - Manages Web Audio nodes
   - Creates and connects sources, gains, pans
   - Handles node topology

4. **Scheduler** (`scheduler.ts`)
   - Lookahead scheduling (200ms window, 25ms ticks)
   - Prevents drift and gaps
   - Schedules clips ahead of time

5. **EventEmitter** (`events.ts`)
   - Event system for UI updates
   - Emits time, state, asset loaded, and error events

6. **Types** (`types.ts`)
   - Pure, serializable data structures
   - No runtime dependencies

7. **Utils** (`utils.ts`)
   - Helper functions for timeline calculations
   - Solo/mute logic
   - Clip scheduling math

## Node Topology

```
AudioBufferSourceNode 
  → TrackGainNode (track volume)
  → TrackPanNode (track pan)
  → MasterGainNode (master volume)
  → destination (speakers)
```

## Key Features

- ✅ Multi-track playback
- ✅ Precise synchronization
- ✅ Solo/mute controls
- ✅ Gain and pan per track
- ✅ Master gain control
- ✅ Seek to any position
- ✅ Play/pause/stop transport
- ✅ Asset preloading
- ✅ Event-driven UI updates

## Usage

```typescript
import { AudioEngine, EngineEvent } from '@/audio_engine';

// Create engine
const engine = new AudioEngine();

// Initialize (must be from user gesture)
await engine.init();

// Add assets
engine.addAsset({
  id: 'audio-1',
  url: '/api/audio/download/audio-1',
});

// Preload audio
await engine.preloadAsset('audio-1');

// Load session
engine.loadSession({
  tracks: [
    {
      id: 'track-1',
      name: 'Vocals',
      clips: [
        {
          id: 'clip-1',
          assetId: 'audio-1',
          start: 0,
          in: 0,
          duration: 10,
        },
      ],
      gain: 1.0,
      pan: 0.0,
      mute: false,
      solo: false,
    },
  ],
  masterGain: 1.0,
});

// Subscribe to events
engine.on(EngineEvent.Time, (payload) => {
  console.log('Current time:', payload.currentTime);
});

engine.on(EngineEvent.State, (payload) => {
  console.log('Is playing:', payload.isPlaying);
});

// Start playback
engine.play();

// Pause
engine.pause();

// Seek
engine.seek(5.0);

// Stop
engine.stop();

// Cleanup
engine.dispose();
```

## Solo/Mute Logic

- **Mute always wins**: Muted tracks never play
- **Solo logic**: If any track is solo, only solo tracks play
- **Default**: All non-muted tracks play

## Scheduling Algorithm

The scheduler uses a lookahead window to prevent drift:

1. Every 25ms, check current time
2. Calculate timeline time from clock
3. Schedule clips between `currentTime` and `currentTime + 200ms`
4. Track scheduled clips to avoid double-scheduling
5. Create new `AudioBufferSourceNode` for each clip
6. Apply gain/pan per clip → track → master chain

## Future Enhancements

The architecture is designed to support:

- **Time-stretch**: Pitch-preserving playback rate changes
- **Looping**: Loop region playback
- **Effects**: Insert effects between nodes
- **Automation**: Time-based parameter changes
- **Recording**: Capture output to buffer

All timeline-to-source mapping goes through `timelineToSourceTime()` in `utils.ts`, making it easy to add time-stretch without refactoring.

## File Structure

```
audio_engine/
├── engine.ts       # Main AudioEngine class
├── clock.ts        # Timeline clock
├── graph.ts        # Web Audio node management
├── scheduler.ts    # Lookahead scheduler
├── events.ts       # Event emitter
├── types.ts        # Type definitions
├── utils.ts        # Helper functions
├── index.ts        # Public exports
└── README.md       # This file
```

## Design Principles

1. **Pure engine, React UI**: Zero React dependencies in engine
2. **Event-driven**: UI subscribes to engine events
3. **Immutable data**: Session data is serializable and immutable
4. **Lookahead scheduling**: Prevents drift and gaps
5. **One-shot sources**: AudioBufferSourceNode recreated on play/seek
6. **Future-proof**: Architecture supports advanced features without refactor

## Testing

```typescript
import { AudioEngine } from '@/audio_engine';

describe('AudioEngine', () => {
  it('should initialize', async () => {
    const engine = new AudioEngine();
    await engine.init();
    expect(engine).toBeDefined();
    engine.dispose();
  });
  
  it('should load session', async () => {
    const engine = new AudioEngine();
    await engine.init();
    
    engine.loadSession({
      tracks: [],
      masterGain: 1.0,
    });
    
    const session = engine.getSession();
    expect(session.tracks).toHaveLength(0);
    
    engine.dispose();
  });
});
```

## Browser Compatibility

- Chrome: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (requires user gesture for AudioContext)
- Edge: ✅ Full support

## Performance

- **Memory**: Buffers are cached in memory (Map)
- **CPU**: Lookahead scheduling is lightweight (~1% CPU)
- **Latency**: 200ms lookahead provides smooth playback

## License

Part of the Music Assistant project.
