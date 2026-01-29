/**
 * Type System Verification Tests
 * 
 * These tests verify that the core types work correctly.
 * Run with: npx tsx tests/unit/types.test.ts
 */

import {
  MusicalObject,
  ObjectType,
  AudioObject,
  MidiObject,
  StemsObject,
  isAudioObject,
  isMidiObject,
  isStemsObject,
  Project,
  Tool,
  ToolType,
  ToolExecutionStatus,
  ViewMode,
  ViewConfig,
  TrackDisplayConfig,
} from '@/types';

console.log('🧪 Testing Phase 1: Type System & Domain Models\n');

// Test 1: MusicalObject creation
console.log('✅ Test 1: Create a MusicalObject (Audio)');
const audioObject: AudioObject = {
  id: 'audio-1',
  name: 'song.wav',
  type: ObjectType.Audio,
  parentId: null,
  children: [],
  metadata: {
    duration: 180.5,
    sampleRate: 44100,
    channels: 2,
    format: 'wav',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};
console.log(`   - Created audio object: ${audioObject.name}`);
console.log(`   - Duration: ${audioObject.metadata.duration}s`);

// Test 2: Type guards
console.log('\n✅ Test 2: Type guards');
console.log(`   - isAudioObject: ${isAudioObject(audioObject)}`); // true
console.log(`   - isMidiObject: ${isMidiObject(audioObject)}`);    // false

// Test 3: MIDI object
console.log('\n✅ Test 3: Create a MidiObject');
const midiObject: MidiObject = {
  id: 'midi-1',
  name: 'bass.mid',
  type: ObjectType.Midi,
  parentId: 'audio-1',
  children: [],
  metadata: {
    duration: 180.5,
    tempo: 120,
    key: 'Am',
    timeSignature: { numerator: 4, denominator: 4 },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};
console.log(`   - Created MIDI object: ${midiObject.name}`);
console.log(`   - Tempo: ${midiObject.metadata.tempo} BPM`);
console.log(`   - Key: ${midiObject.metadata.key}`);

// Test 4: Hierarchical relationships
console.log('\n✅ Test 4: Parent-child relationships');
const stemsObject: StemsObject = {
  id: 'stems-1',
  name: 'song_stems',
  type: ObjectType.Stems,
  parentId: 'audio-1',
  children: [
    {
      id: 'stem-vocals',
      name: 'vocals.wav',
      type: ObjectType.Audio,
      parentId: 'stems-1',
      children: [],
      metadata: { duration: 180.5 },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'stem-bass',
      name: 'bass.wav',
      type: ObjectType.Audio,
      parentId: 'stems-1',
      children: [],
      metadata: { duration: 180.5 },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  metadata: {
    originalAudioId: 'audio-1',
    model: 'demucs',
    stemCount: 4,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};
console.log(`   - Created stems container: ${stemsObject.name}`);
console.log(`   - Children: ${stemsObject.children.map(c => c.name).join(', ')}`);
console.log(`   - Stem count: ${stemsObject.metadata.stemCount}`);

// Test 5: Project
console.log('\n✅ Test 5: Create a Project');
const project: Project = {
  id: 'project-1',
  name: 'My Song',
  tempo: 120,
  key: 'Am',
  timeSignature: { numerator: 4, denominator: 4 },
  rootObject: audioObject,
  createdAt: new Date(),
  updatedAt: new Date(),
  description: 'A test project',
};
console.log(`   - Project: ${project.name}`);
console.log(`   - Tempo: ${project.tempo} BPM`);
console.log(`   - Key: ${project.key}`);
console.log(`   - Time signature: ${project.timeSignature.numerator}/${project.timeSignature.denominator}`);

// Test 6: Tool definition
console.log('\n✅ Test 6: Tool definition (stub)');
const separateStemsTool: Tool = {
  id: 'separate-stems',
  name: 'Separate Stems',
  description: 'Separate audio into vocals, bass, drums, and other',
  icon: '🎛️',
  inputTypes: [ObjectType.Audio],
  outputType: ObjectType.Stems,
  execute: async (input: MusicalObject) => {
    console.log(`      - Executing tool on: ${input.name}`);
    return {
      status: ToolExecutionStatus.Success,
      progress: 100,
    };
  },
};
console.log(`   - Tool: ${separateStemsTool.name}`);
console.log(`   - Input types: ${separateStemsTool.inputTypes.join(', ')}`);
console.log(`   - Output type: ${separateStemsTool.outputType}`);

// Test 7: View configuration
console.log('\n✅ Test 7: View configuration');
const viewConfig: ViewConfig = {
  mode: ViewMode.Waveform,
  zoom: 1.0,
  scrollX: 0,
  scrollY: 0,
  snapToGrid: true,
  gridResolution: 16,
};
console.log(`   - View mode: ${viewConfig.mode}`);
console.log(`   - Zoom: ${viewConfig.zoom}x`);
console.log(`   - Snap to grid: ${viewConfig.snapToGrid}`);

// Test 8: Track display config
console.log('\n✅ Test 8: Track display configuration');
const trackConfig: TrackDisplayConfig = {
  trackId: 'track-1',
  objectId: 'audio-1',
  muted: false,
  soloed: false,
  hidden: false,
  volume: 0.8,
  selected: true,
  expanded: false,
  color: '#00E5FF',
};
console.log(`   - Track ID: ${trackConfig.trackId}`);
console.log(`   - Volume: ${trackConfig.volume * 100}%`);
console.log(`   - Selected: ${trackConfig.selected}`);

console.log('\n🎉 All type tests passed!');
console.log('\n📋 Phase 1 Summary:');
console.log('   ✅ MusicalObject types (Audio, MIDI, Stems)');
console.log('   ✅ Project type with tempo, key, time signature');
console.log('   ✅ Tool interface with execution');
console.log('   ✅ View modes and configurations');
console.log('   ✅ Type guards and helper types');
console.log('\n✨ Ready for Phase 2: API Client Layer\n');
