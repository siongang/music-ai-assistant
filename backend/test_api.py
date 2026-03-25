"""
Simple API test script for the artifact-first backend.

Usage:
    python test_api.py <audio_file_path>

Example:
    python test_api.py test_audio.mp3
"""
__test__ = False

import requests
import time
import sys
from pathlib import Path
from typing import Optional, Tuple

API_BASE = "http://localhost:8000/api"


def create_project() -> Optional[str]:
    """Create a disposable test project."""
    print("\nCreating project...")
    try:
        response = requests.post(
            f"{API_BASE}/projects",
            json={"name": f"API Test {int(time.time())}"},
            timeout=10,
        )
        if response.status_code == 201:
            project_id = response.json()["id"]
            print(f"✓ Project created: {project_id}")
            return project_id
        print(f"✗ Project creation failed: {response.status_code}")
        print(f"  Response: {response.text}")
        return None
    except Exception as e:
        print(f"✗ Project creation failed: {e}")
        return None


def upload_source_audio(project_id: str, audio_file_path: str) -> Optional[str]:
    """Upload source audio and return the source artifact id."""
    print(f"\nUploading source audio: {audio_file_path}")

    if not Path(audio_file_path).exists():
        print(f"✗ File not found: {audio_file_path}")
        return None

    try:
        with open(audio_file_path, "rb") as f:
            files = {"file": (Path(audio_file_path).name, f, "audio/mpeg")}
            response = requests.post(
                f"{API_BASE}/projects/{project_id}/artifacts/source-audio",
                files=files,
                timeout=30,
            )

        if response.status_code == 201:
            artifact_id = response.json()["artifact_id"]
            print(f"✓ Source artifact created: {artifact_id}")
            return artifact_id
        print(f"✗ Source upload failed: {response.status_code}")
        print(f"  Response: {response.text}")
        return None
    except Exception as e:
        print(f"✗ Source upload failed: {e}")
        return None


def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        print("✓ Health check passed")
        return True
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        print("  Make sure the API server is running: uvicorn app.main:app --reload")
        return False


def test_create_job(project_id: str, source_artifact_id: str) -> Optional[str]:
    """Create a stem separation job from a source artifact."""
    print(f"\nCreating stem separation job from artifact: {source_artifact_id}")

    try:
        response = requests.post(
            f"{API_BASE}/projects/{project_id}/jobs",
            json={
                "capability": "stem_separation",
                "input": {"input_artifact_id": source_artifact_id},
                "params": {},
            },
            timeout=30,
        )

        if response.status_code == 201:
            job = response.json()
            job_id = job["job_id"]
            print(f"✓ Job created: {job_id}")
            print(f"  Status: {job['status']}")
            return job_id
        print(f"✗ Job creation failed: {response.status_code}")
        print(f"  Response: {response.text}")
        return None
    except Exception as e:
        print(f"✗ Job creation failed: {e}")
        return None


def test_get_job(project_id: str, job_id: str) -> Tuple[Optional[str], Optional[dict]]:
    """Test getting job status"""
    try:
        response = requests.get(f"{API_BASE}/projects/{project_id}/jobs/{job_id}", timeout=5)
        if response.status_code == 200:
            job = response.json()
            return job["status"], job
        else:
            print(f"✗ Failed to get job: {response.status_code}")
            return None, None
    except Exception as e:
        print(f"✗ Error getting job: {e}")
        return None, None


def wait_for_completion(project_id: str, job_id: str, max_wait=300):
    """Wait for job to complete"""
    print(f"\nWaiting for job to complete (max {max_wait}s)...")
    print("  (This may take a while depending on audio file size)")
    start_time = time.time()
    last_status = None
    
    while time.time() - start_time < max_wait:
        status, job = test_get_job(project_id, job_id)
        
        if status is None:
            return False
        
        # Only print when status changes
        if status != last_status:
            print(f"  Status: {status}")
            last_status = status
        
        if status == "succeeded":
            print("✓ Job completed successfully!")
            if job and job.get("output", {}).get("artifact_ids"):
                print(f"  Output artifacts: {job['output']['artifact_ids']}")
            return True
        elif status == "failed":
            print("✗ Job failed!")
            if job and job.get("error_message"):
                print(f"  Error: {job['error_message']}")
            return False
        
        time.sleep(2)
    
    print(f"✗ Job timed out after {max_wait}s")
    return False


def main():
    if len(sys.argv) < 2:
        print("Usage: python test_api.py <audio_file_path>")
        print("\nExample:")
        print("  python test_api.py test_audio.mp3")
        sys.exit(1)
    
    audio_file = sys.argv[1]
    
    print("=" * 60)
    print("Music Assistant API Test")
    print("=" * 60)
    
    # Test health
    if not test_health():
        print("\n⚠️  API server is not running or not accessible")
        print("   Start it with: uvicorn app.main:app --reload")
        sys.exit(1)
    
    project_id = create_project()
    if not project_id:
        sys.exit(1)

    source_artifact_id = upload_source_audio(project_id, audio_file)
    if not source_artifact_id:
        sys.exit(1)

    # Create job
    job_id = test_create_job(project_id, source_artifact_id)
    if not job_id:
        sys.exit(1)
    
    # Wait for completion
    success = wait_for_completion(project_id, job_id)
    
    if success:
        print("\n" + "=" * 60)
        print("✓ All tests passed!")
        print(f"  Project ID: {project_id}")
        print(f"  Source artifact ID: {source_artifact_id}")
        print("=" * 60)
        sys.exit(0)
    else:
        print("\n" + "=" * 60)
        print("✗ Test failed")
        print("=" * 60)
        sys.exit(1)


if __name__ == "__main__":
    main()
