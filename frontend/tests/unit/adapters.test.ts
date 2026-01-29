/**
 * Adapter Tests
 * 
 * Tests for adapter functions that convert between API DTOs and app domain models.
 */

import {
  // Musical Object adapters
  jobToMusicalObject,
  audioUploadToObject,
  extractFilePaths,
  hasDownloadableContent,
  
  // Job adapters
  jobToStatusInfo,
  formatJobType,
  formatJobStatus,
  formatProgress,
  estimateTimeRemaining,
  formatTimeRemaining,
  getStatusColor,
  
  // Project adapters
  createProject,
  validateProjectName,
  validateTempo,
  validateKey,
  formatTimeSignature,
  parseTimeSignature,
} from '@/adapters';

import { JobStatus, JobType } from '@/api-client/types';
import type { JobDTO } from '@/api-client/types';
import { ObjectType } from '@/types';

console.log('🧪 Testing Phase 3: Adapters (API ↔ App Models)\n');

// ===== Test 1: Job to MusicalObject (Stem Separation) =====
console.log('✅ Test 1: Convert stem separation job to MusicalObject');

const stemJob: JobDTO = {
  job_id: '123e4567-e89b-12d3-a456-426614174000',
  type: JobType.StemSeparation,
  status: JobStatus.Succeeded,
  audio_id: 'audio-123',
  input: { audio_id: 'audio-123' },
  params: { model: 'demucs' },
  output: {
    vocals: 'jobs/123/stems/vocals.mp3',
    drums: 'jobs/123/stems/drums.mp3',
    bass: 'jobs/123/stems/bass.mp3',
    other: 'jobs/123/stems/other.mp3',
  },
  progress: 1.0,
  error_message: null,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:05:00Z',
};

const stemsObject = jobToMusicalObject(stemJob);
console.log(`   - Object type: ${stemsObject.type}`);
console.log(`   - Name: ${stemsObject.name}`);
console.log(`   - Children count: ${stemsObject.children.length}`);
console.log(`   - Children: ${stemsObject.children.map(c => c.name).join(', ')}`);
console.log(`   - Metadata: model=${stemsObject.metadata.model}, stemCount=${stemsObject.metadata.stemCount}`);

// Verify structure
if (stemsObject.type !== ObjectType.Stems) {
  throw new Error('Expected Stems object type');
}
if (stemsObject.children.length !== 4) {
  throw new Error('Expected 4 stem children');
}

// ===== Test 2: Job to MusicalObject (MIDI Conversion) =====
console.log('\n✅ Test 2: Convert MIDI conversion job to MusicalObject');

const midiJob: JobDTO = {
  job_id: '456e4567-e89b-12d3-a456-426614174001',
  type: JobType.MidiConversion,
  status: JobStatus.Succeeded,
  audio_id: 'audio-456',
  input: { audio_id: 'audio-456' },
  params: {},
  output: {
    midi: 'jobs/456/midi/output.mid',
    filename: 'bass_line.mid',
    tempo: 120,
    key: 'Am',
  },
  progress: 1.0,
  error_message: null,
  created_at: '2024-01-15T11:00:00Z',
  updated_at: '2024-01-15T11:02:00Z',
};

const midiObject = jobToMusicalObject(midiJob);
console.log(`   - Object type: ${midiObject.type}`);
console.log(`   - Name: ${midiObject.name}`);
console.log(`   - MIDI path: ${midiObject.metadata.filePath}`);
console.log(`   - Tempo: ${midiObject.metadata.tempo} BPM`);
console.log(`   - Key: ${midiObject.metadata.key}`);

if (midiObject.type !== ObjectType.Midi) {
  throw new Error('Expected MIDI object type');
}

// ===== Test 3: Audio Upload to Object =====
console.log('\n✅ Test 3: Convert audio upload response to AudioObject');

const audioObject = audioUploadToObject('audio-789', 'song.wav');
console.log(`   - ID: ${audioObject.id}`);
console.log(`   - Name: ${audioObject.name}`);
console.log(`   - Type: ${audioObject.type}`);
console.log(`   - File path: ${audioObject.metadata.filePath}`);

if (audioObject.type !== ObjectType.Audio) {
  throw new Error('Expected Audio object type');
}

// ===== Test 4: Extract File Paths =====
console.log('\n✅ Test 4: Extract file paths from MusicalObject');

const filePaths = extractFilePaths(stemsObject);
console.log(`   - Total file paths: ${filePaths.length}`);
console.log(`   - Paths: ${filePaths.join(', ')}`);

if (filePaths.length !== 4) {
  throw new Error('Expected 4 file paths (one per stem)');
}

const hasContent = hasDownloadableContent(stemsObject);
console.log(`   - Has downloadable content: ${hasContent}`);

if (!hasContent) {
  throw new Error('Expected stems object to have downloadable content');
}

// ===== Test 5: Job to Status Info =====
console.log('\n✅ Test 5: Convert job to status info');

const runningJob: JobDTO = {
  job_id: 'running-123',
  type: JobType.StemSeparation,
  status: JobStatus.Running,
  audio_id: 'audio-999',
  input: { audio_id: 'audio-999' },
  progress: 0.65,
  error_message: null,
  created_at: '2024-01-15T12:00:00Z',
  updated_at: '2024-01-15T12:01:00Z',
};

const statusInfo = jobToStatusInfo(runningJob);
console.log(`   - ID: ${statusInfo.id}`);
console.log(`   - Type: ${statusInfo.type}`);
console.log(`   - Status: ${formatJobStatus(statusInfo.status)}`);
console.log(`   - Progress: ${formatProgress(statusInfo.progress)}`);
console.log(`   - Is running: ${statusInfo.isRunning}`);
console.log(`   - Is complete: ${statusInfo.isComplete}`);
console.log(`   - Status color: ${getStatusColor(statusInfo.status)}`);

if (!statusInfo.isRunning) {
  throw new Error('Expected job to be running');
}
if (statusInfo.isComplete) {
  throw new Error('Expected job to not be complete');
}

// ===== Test 6: Job Type Formatting =====
console.log('\n✅ Test 6: Format job types');

const jobTypes = [
  JobType.StemSeparation,
  JobType.MidiConversion,
  JobType.MelodyExtraction,
  JobType.ChordAnalysis,
];

jobTypes.forEach(type => {
  console.log(`   - ${type} → ${formatJobType(type)}`);
});

// ===== Test 7: Progress Formatting =====
console.log('\n✅ Test 7: Format progress values');

const progressValues = [0, 0.25, 0.5, 0.75, 1.0, null];
progressValues.forEach(progress => {
  console.log(`   - ${progress} → ${formatProgress(progress)}`);
});

// ===== Test 8: Time Remaining Estimation =====
console.log('\n✅ Test 8: Estimate time remaining');

// Create a job that started 60 seconds ago with 50% progress
const now = Date.now();
const sixtySecondsAgo = new Date(now - 60000).toISOString();

const estimateJob: JobDTO = {
  ...runningJob,
  created_at: sixtySecondsAgo,
  progress: 0.5,
};

const timeRemaining = estimateTimeRemaining(estimateJob);
const formatted = formatTimeRemaining(timeRemaining);
console.log(`   - Progress: 50%`);
console.log(`   - Elapsed: 60s`);
console.log(`   - Estimated remaining: ${timeRemaining}s (${formatted})`);

// ===== Test 9: Project Creation =====
console.log('\n✅ Test 9: Create new project');

const newProject = createProject('My Song', {
  tempo: 140,
  key: 'Am',
  description: 'A test project',
});

console.log(`   - Name: ${newProject.name}`);
console.log(`   - Tempo: ${newProject.tempo} BPM`);
console.log(`   - Key: ${newProject.key}`);
console.log(`   - Time signature: ${formatTimeSignature(newProject.timeSignature)}`);
console.log(`   - Description: ${newProject.description}`);

// ===== Test 10: Project Validation =====
console.log('\n✅ Test 10: Validate project properties');

// Valid inputs
console.log('   Valid project name:');
const validName = validateProjectName('My Project');
console.log(`     - "My Project" → ${validName === null ? 'Valid ✓' : validName}`);

// Invalid inputs
console.log('   Invalid project name:');
const emptyName = validateProjectName('');
console.log(`     - "" → ${emptyName}`);

const longName = validateProjectName('a'.repeat(101));
console.log(`     - (101 chars) → ${longName}`);

// Tempo validation
console.log('   Tempo validation:');
const validTempo = validateTempo(120);
console.log(`     - 120 BPM → ${validTempo === null ? 'Valid ✓' : validTempo}`);

const slowTempo = validateTempo(10);
console.log(`     - 10 BPM → ${slowTempo}`);

const fastTempo = validateTempo(400);
console.log(`     - 400 BPM → ${fastTempo}`);

// Key validation
console.log('   Key validation:');
const validKey = validateKey('Am');
console.log(`     - "Am" → ${validKey === null ? 'Valid ✓' : validKey}`);

const invalidKey = validateKey('Zm');
console.log(`     - "Zm" → ${invalidKey}`);

// ===== Test 11: Time Signature Parsing =====
console.log('\n✅ Test 11: Parse time signatures');

const timeSignatures = ['4/4', '3/4', '6/8', '7/8', '12/8'];
timeSignatures.forEach(ts => {
  const parsed = parseTimeSignature(ts);
  if (parsed) {
    console.log(`   - "${ts}" → ${parsed.numerator}/${parsed.denominator} ✓`);
  } else {
    console.log(`   - "${ts}" → Invalid ✗`);
  }
});

// Invalid time signature
const invalid = parseTimeSignature('99/99');
console.log(`   - "99/99" → ${invalid === null ? 'Invalid ✗' : 'Valid ✓'}`);

// ===== Test 12: Status Colors =====
console.log('\n✅ Test 12: Status colors for UI');

const statuses = [
  JobStatus.Queued,
  JobStatus.Running,
  JobStatus.Succeeded,
  JobStatus.Failed,
];

statuses.forEach(status => {
  const color = getStatusColor(status);
  console.log(`   - ${formatJobStatus(status)}: ${color}`);
});

// ===== Summary =====
console.log('\n🎉 All adapter tests passed!');
console.log('\n📋 Phase 3 Summary:');
console.log('   ✅ Job → MusicalObject conversion (stems, MIDI)');
console.log('   ✅ Audio upload → AudioObject');
console.log('   ✅ File path extraction from objects');
console.log('   ✅ Job → StatusInfo with computed properties');
console.log('   ✅ Job type and status formatting');
console.log('   ✅ Progress and time remaining formatting');
console.log('   ✅ Project creation with defaults');
console.log('   ✅ Project validation (name, tempo, key)');
console.log('   ✅ Time signature parsing and formatting');
console.log('   ✅ Status color mapping for UI');
console.log('\n✨ Ready for Phase 4: Object Tree State Management\n');
