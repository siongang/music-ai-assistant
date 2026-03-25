"""
Test script for LLM chat functionality.

This script tests the chat endpoints and helps diagnose issues with LLM integration.

Usage:
    python test_chat.py

Make sure the API server is running:
    uvicorn app.main:app --reload
"""
__test__ = False

import requests
import sys
import json
from typing import Optional, Dict, Any

API_BASE = "http://localhost:8000/api"


def print_section(title: str):
    """Print a formatted section header."""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_result(success: bool, message: str, details: Optional[str] = None):
    """Print a formatted test result."""
    status = "✓" if success else "✗"
    print(f"{status} {message}")
    if details:
        print(f"   {details}")


def test_health() -> bool:
    """Test health endpoint."""
    print_section("Health Check")
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        if response.status_code == 200:
            print_result(True, "API server is running")
            return True
        else:
            print_result(False, f"Health check returned {response.status_code}")
            return False
    except Exception as e:
        print_result(False, "API server is not accessible", str(e))
        print("\n  Make sure the server is running:")
        print("    cd backend && uvicorn app.main:app --reload")
        return False


def test_create_session() -> Optional[str]:
    """Test creating a new session."""
    print_section("Create Session")
    try:
        response = requests.post(f"{API_BASE}/chat/sessions", timeout=5)
        if response.status_code == 200:
            data = response.json()
            session_id = data["session_id"]
            print_result(True, f"Session created: {session_id}")
            return session_id
        else:
            print_result(False, f"Failed to create session: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print_result(False, "Failed to create session", str(e))
        return None


def test_send_message(session_id: Optional[str], message: str) -> Dict[str, Any]:
    """Test sending a message to the chat endpoint."""
    print_section(f"Send Message: '{message}'")
    
    payload = {"message": message}
    if session_id:
        payload["session_id"] = session_id
    
    try:
        print(f"  Request payload: {json.dumps(payload, indent=2)}")
        response = requests.post(
            f"{API_BASE}/chat/message",
            json=payload,
            timeout=30  # LLM calls can take time
        )
        
        print(f"  Status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Message sent successfully")
            print(f"\n  Response:")
            print(f"    Session ID: {data.get('session_id')}")
            print(f"    Message: {data.get('message', '')[:200]}...")
            if data.get('metadata'):
                print(f"    Metadata: {json.dumps(data['metadata'], indent=6)}")
            return {"success": True, "data": data}
        else:
            print_result(False, f"Request failed: {response.status_code}")
            print(f"  Response body: {response.text}")
            try:
                error_data = response.json()
                print(f"  Error details: {json.dumps(error_data, indent=2)}")
            except:
                pass
            return {"success": False, "status_code": response.status_code, "error": response.text}
    
    except requests.exceptions.Timeout:
        print_result(False, "Request timed out", "LLM call took too long (>30s)")
        return {"success": False, "error": "timeout"}
    except Exception as e:
        print_result(False, "Request failed", str(e))
        return {"success": False, "error": str(e)}


def test_get_history(session_id: str):
    """Test getting session history."""
    print_section("Get Session History")
    try:
        response = requests.get(
            f"{API_BASE}/chat/sessions/{session_id}/history",
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            history = data.get("history", [])
            print_result(True, f"Retrieved {len(history)} history items")
            
            if history:
                print("\n  Recent history:")
                for item in history[-3:]:  # Show last 3 items
                    step_type = item.get("step_type", "unknown")
                    print(f"    - {step_type}: {str(item.get('content', ''))[:100]}...")
            
            return True
        else:
            print_result(False, f"Failed to get history: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print_result(False, "Failed to get history", str(e))
        return False


def check_environment():
    """Check environment setup."""
    print_section("Environment Check")
    
    import os
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        masked_key = api_key[:8] + "..." + api_key[-4:] if len(api_key) > 12 else "***"
        print_result(True, f"OPENAI_API_KEY is set ({masked_key})")
    else:
        print_result(False, "OPENAI_API_KEY is not set")
        print("   Set it in your .env file or environment:")
        print("   export OPENAI_API_KEY=sk-...")
        return False
    
    return True


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("  LLM Chat Testing Script")
    print("=" * 60)
    
    # Check environment
    env_ok = check_environment()
    
    # Test health
    if not test_health():
        sys.exit(1)
    
    # Create session
    session_id = test_create_session()
    if not session_id:
        print("\n⚠️  Cannot continue without a session")
        sys.exit(1)
    
    # Test 1: Simple greeting (should work without tools)
    result1 = test_send_message(session_id, "Hello, what can you do?")
    
    if not result1.get("success"):
        print("\n" + "=" * 60)
        print("  DIAGNOSIS")
        print("=" * 60)
        print("\nThe chat endpoint is failing. Common issues:")
        print("\n1. Model name issue:")
        print("   - Current model: 'gpt-5' (may not exist)")
        print("   - Try changing to: 'gpt-4o', 'gpt-4-turbo', or 'gpt-4'")
        print("   - Location: backend/app/api/endpoints/chat.py line 72")
        print("\n2. OpenAI API key:")
        print("   - Check OPENAI_API_KEY is set correctly")
        print("   - Verify it's valid and has credits")
        print("\n3. Responses API availability:")
        print("   - The code uses OpenAI's Responses API")
        print("   - Check if your OpenAI account has access")
        print("   - Check server logs for detailed error messages")
        print("\n4. Check server logs:")
        print("   - Look at the terminal running uvicorn")
        print("   - Check for Python exceptions or API errors")
        
        if "timeout" in str(result1.get("error", "")):
            print("\n5. Timeout issue:")
            print("   - LLM calls are taking too long")
            print("   - This might indicate the API is not responding")
        
        sys.exit(1)
    
    # Test 2: Check history
    test_get_history(session_id)
    
    # Test 3: Another message to test conversation flow
    print("\n")
    result2 = test_send_message(session_id, "Can you explain your capabilities?")
    
    # Final summary
    print("\n" + "=" * 60)
    print("  Test Summary")
    print("=" * 60)
    
    if result1.get("success") and result2.get("success"):
        print("\n✓ All basic chat tests passed!")
        print("\nNext steps:")
        print("  1. Test with audio upload: /chat/message-with-upload")
        print("  2. Test tool calling (requires audio file)")
        print("  3. Check session history for detailed logs")
    else:
        print("\n✗ Some tests failed")
        print("  Review the errors above and check server logs")
    
    print(f"\nSession ID for reference: {session_id}")
    print("=" * 60)


if __name__ == "__main__":
    main()
