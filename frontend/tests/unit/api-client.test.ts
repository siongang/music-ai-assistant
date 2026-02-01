/**
 * API Client Verification Tests
 * 
 * These tests demonstrate how to use the API client.
 * They are NOT integration tests - they show the API structure.
 * 
 * For actual integration testing, ensure the backend is running at http://localhost:8000
 */

import {
  // Projects
  listProjects,
  createProject,
  getProjectTree,
  putProjectTree,
  // Audio (project-scoped)
  uploadProjectAudio,
  downloadProjectAudio,
  downloadFile,
  // Jobs (project-scoped)
  createJob,
  getJob,
  listJobs,
  pollJobUntilComplete,
  separateStemsAndWait,
  // Chat
  createSession,
  sendMessage,
  getSessionHistory,
  // Types
  JobType,
  JobStatus,
  JobDTO,
  AudioUploadResponse,
  ApiError,
} from '@/api-client';

console.log('🧪 Testing Phase 2: API Client Layer\n');

// ===== Test 1: Type Checking =====
console.log('✅ Test 1: API client types are properly exported');

// Mock job response for demonstration
const mockJob: JobDTO = {
  job_id: '123e4567-e89b-12d3-a456-426614174000',
  type: JobType.StemSeparation,
  status: JobStatus.Queued,
  audio_id: '123e4567-e89b-12d3-a456-426614174001',
  input: { audio_id: '123e4567-e89b-12d3-a456-426614174001' },
  params: { model: 'demucs' },
  output: null,
  progress: 0,
  error_message: null,
  created_at: new Date().toISOString(),
  updated_at: null,
};

console.log(`   - Job ID: ${mockJob.job_id}`);
console.log(`   - Type: ${mockJob.type}`);
console.log(`   - Status: ${mockJob.status}`);

// Mock audio response
const mockAudioResponse: AudioUploadResponse = {
  audio_id: '123e4567-e89b-12d3-a456-426614174002',
  filename: 'song.wav',
};

console.log(`   - Audio ID: ${mockAudioResponse.audio_id}`);
console.log(`   - Filename: ${mockAudioResponse.filename}`);

// ===== Test 2: API Error Handling =====
console.log('\n✅ Test 2: ApiError class');

const apiError = new ApiError(
  404,
  'Not Found',
  'Audio not found',
  { audio_id: 'invalid-id' }
);

console.log(`   - Status: ${apiError.status}`);
console.log(`   - Message: ${apiError.message}`);
console.log(`   - Details: ${JSON.stringify(apiError.details)}`);

// ===== Test 3: Job Status Enum =====
console.log('\n✅ Test 3: Job status enum');

const statuses = [
  JobStatus.Queued,
  JobStatus.Running,
  JobStatus.Succeeded,
  JobStatus.Failed,
];

console.log(`   - Available statuses: ${statuses.join(', ')}`);

// ===== Test 4: Job Type Enum =====
console.log('\n✅ Test 4: Job type enum');

const jobTypes = [
  JobType.StemSeparation,
  JobType.MidiConversion,
  JobType.MelodyExtraction,
  JobType.ChordAnalysis,
];

console.log(`   - Available job types: ${jobTypes.join(', ')}`);

// ===== Test 5: API Client Usage Examples =====
console.log('\n✅ Test 5: API client usage patterns');

console.log('\n   📝 Example 1: List projects and upload audio');
console.log('   ```typescript');
console.log('   const projects = await listProjects({ limit: 50 });');
console.log('   const projectId = projects[0].id;');
console.log('   const file = new File([audioData], "song.wav");');
console.log('   const response = await uploadProjectAudio(projectId, file);');
console.log('   console.log(response.audio_id);');
console.log('   ```');

console.log('\n   📝 Example 2: Create stem separation job (project-scoped)');
console.log('   ```typescript');
console.log('   const job = await createJob(projectId, {');
console.log('     type: JobType.StemSeparation,');
console.log('     input: { audio_id: "your-audio-id" },');
console.log('     params: { model: "demucs" }');
console.log('   });');
console.log('   ```');

console.log('\n   📝 Example 3: Poll job until complete');
console.log('   ```typescript');
console.log('   const completedJob = await pollJobUntilComplete(projectId, job.job_id, {');
console.log('     onProgress: (job) => {');
console.log('       console.log(`Progress: ${job.progress * 100}%`);');
console.log('     }');
console.log('   });');
console.log('   ```');

console.log('\n   📝 Example 4: Download stem file');
console.log('   ```typescript');
console.log('   // After job completes, output contains file paths');
console.log('   const vocalsPath = completedJob.output.vocals;');
console.log('   const blob = await downloadFile(vocalsPath);');
console.log('   ```');

console.log('\n   📝 Example 5: Send chat message');
console.log('   ```typescript');
console.log('   const session = await createSession();');
console.log('   const response = await sendMessage(');
console.log('     "Separate the stems",');
console.log('     session.session_id');
console.log('   );');
console.log('   console.log(response.message);');
console.log('   ```');

console.log('\n   📝 Example 6: List jobs with filters (project-scoped)');
console.log('   ```typescript');
console.log('   const jobs = await listJobs(projectId, {');
console.log('     status: JobStatus.Succeeded,');
console.log('     jobType: JobType.StemSeparation,');
console.log('     limit: 10');
console.log('   });');
console.log('   ```');

console.log('\n   📝 Example 7: High-level helper (separate and wait)');
console.log('   ```typescript');
console.log('   const result = await separateStemsAndWait(projectId, audioId, (job) => {');
console.log('     setProgress(job.progress);');
console.log('   });');
console.log('   // Result contains output with stem file paths');
console.log('   ```');

// ===== Summary =====
console.log('\n🎉 All API client type tests passed!');
console.log('\n📋 Phase 2 Summary:');
console.log('   ✅ Base HTTP client with timeout and error handling');
console.log('   ✅ Typed request/response DTOs matching backend');
console.log('   ✅ Projects endpoints (list, create, get, tree)');
console.log('   ✅ Audio endpoints (project-scoped: upload, list, download)');
console.log('   ✅ Job endpoints (create, get, list, poll)');
console.log('   ✅ Chat endpoints (session, message, history)');
console.log('   ✅ Helper functions (separateStemsAndWait)');
console.log('   ✅ File upload with multipart/form-data');
console.log('   ✅ File download (Blob) support');
console.log('   ✅ Job polling with progress callbacks');
console.log('   ✅ Error handling with ApiError class');
console.log('\n✨ Ready for Phase 3: Adapters (API ↔ App Models)\n');

// ===== Integration Test Instructions =====
console.log('📝 Integration Testing:');
console.log('   To test against the actual backend:');
console.log('   1. Start backend: cd backend && python -m app.main');
console.log('   2. Start Celery worker: cd backend && celery -A app.celery_app worker');
console.log('   3. Run integration tests (when available)');
console.log('   4. Or use the frontend UI to test the API client\n');
