"""
Validation script for Phase 1 (Models) and Phase 2 (Tools).

This script validates:
- Model imports and structure
- Tool imports and structure
- Tool registry functionality
- Tool schema generation
"""
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def test_model_imports():
    """Test that all models can be imported."""
    print("=" * 60)
    print("Testing Model Imports")
    print("=" * 60)
    
    try:
        from app.models import Session, AgentStep, Job, Audio
        print("✓ All models imported successfully")
        print(f"  - Session: {Session}")
        print(f"  - AgentStep: {AgentStep}")
        print(f"  - Job: {Job}")
        print(f"  - Audio: {Audio}")
        
        # Check model attributes
        assert hasattr(Session, '__tablename__'), "Session missing __tablename__"
        assert Session.__tablename__ == "sessions", f"Expected 'sessions', got '{Session.__tablename__}'"
        
        assert hasattr(AgentStep, '__tablename__'), "AgentStep missing __tablename__"
        assert AgentStep.__tablename__ == "agent_steps", f"Expected 'agent_steps', got '{AgentStep.__tablename__}'"
        
        print("✓ Model table names are correct")
        return True
    except Exception as e:
        print(f"✗ Model import failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_model_structure():
    """Test model structure and columns."""
    print("\n" + "=" * 60)
    print("Testing Model Structure")
    print("=" * 60)
    
    try:
        from app.models.session import Session
        from app.models.agent_step import AgentStep
        
        # Check Session model columns
        session_columns = {col.name for col in Session.__table__.columns}
        expected_session_cols = {'id', 'user_id', 'session_metadata', 'created_at', 'last_activity_at'}
        assert expected_session_cols.issubset(session_columns), f"Session missing columns. Expected: {expected_session_cols}, Got: {session_columns}"
        print("✓ Session model has all required columns")
        
        # Check AgentStep model columns
        agent_step_columns = {col.name for col in AgentStep.__table__.columns}
        expected_agent_step_cols = {'id', 'session_id', 'step_number', 'step_type', 'content', 'created_at'}
        assert expected_agent_step_cols.issubset(agent_step_columns), f"AgentStep missing columns. Expected: {expected_agent_step_cols}, Got: {agent_step_columns}"
        print("✓ AgentStep model has all required columns")
        
        return True
    except Exception as e:
        print(f"✗ Model structure test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_tool_imports():
    """Test that all tools can be imported."""
    print("\n" + "=" * 60)
    print("Testing Tool Imports")
    print("=" * 60)
    
    try:
        from app.agent.tools.base import Tool
        from app.agent.tools.separate_stems_tool import SeparateStemsTool
        from app.agent.tools.convert_to_midi_tool import ConvertToMidiTool
        from app.agent.tools.get_job_status_tool import GetJobStatusTool
        
        print("✓ All tools imported successfully")
        print(f"  - Tool (base): {Tool}")
        print(f"  - SeparateStemsTool: {SeparateStemsTool}")
        print(f"  - ConvertToMidiTool: {ConvertToMidiTool}")
        print(f"  - GetJobStatusTool: {GetJobStatusTool}")
        
        # Check tool inheritance
        assert issubclass(SeparateStemsTool, Tool), "SeparateStemsTool should inherit from Tool"
        assert issubclass(ConvertToMidiTool, Tool), "ConvertToMidiTool should inherit from Tool"
        assert issubclass(GetJobStatusTool, Tool), "GetJobStatusTool should inherit from Tool"
        print("✓ All tools inherit from Tool base class")
        
        return True
    except Exception as e:
        print(f"✗ Tool import failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_tool_structure():
    """Test tool structure and required attributes."""
    print("\n" + "=" * 60)
    print("Testing Tool Structure")
    print("=" * 60)
    
    try:
        from app.agent.tools.separate_stems_tool import SeparateStemsTool
        from app.agent.tools.convert_to_midi_tool import ConvertToMidiTool
        from app.agent.tools.get_job_status_tool import GetJobStatusTool
        
        # Check SeparateStemsTool
        assert hasattr(SeparateStemsTool, 'name'), "SeparateStemsTool missing 'name'"
        assert SeparateStemsTool.name == "separate_stems", f"Expected 'separate_stems', got '{SeparateStemsTool.name}'"
        assert hasattr(SeparateStemsTool, 'description'), "SeparateStemsTool missing 'description'"
        assert hasattr(SeparateStemsTool, 'parameters'), "SeparateStemsTool missing 'parameters'"
        assert hasattr(SeparateStemsTool, 'returns'), "SeparateStemsTool missing 'returns'"
        print("✓ SeparateStemsTool has all required attributes")
        
        # Check ConvertToMidiTool
        assert hasattr(ConvertToMidiTool, 'name'), "ConvertToMidiTool missing 'name'"
        assert ConvertToMidiTool.name == "convert_to_midi", f"Expected 'convert_to_midi', got '{ConvertToMidiTool.name}'"
        assert hasattr(ConvertToMidiTool, 'description'), "ConvertToMidiTool missing 'description'"
        assert hasattr(ConvertToMidiTool, 'parameters'), "ConvertToMidiTool missing 'parameters'"
        assert hasattr(ConvertToMidiTool, 'returns'), "ConvertToMidiTool missing 'returns'"
        print("✓ ConvertToMidiTool has all required attributes")
        
        # Check GetJobStatusTool
        assert hasattr(GetJobStatusTool, 'name'), "GetJobStatusTool missing 'name'"
        assert GetJobStatusTool.name == "get_job_status", f"Expected 'get_job_status', got '{GetJobStatusTool.name}'"
        assert hasattr(GetJobStatusTool, 'description'), "GetJobStatusTool missing 'description'"
        assert hasattr(GetJobStatusTool, 'parameters'), "GetJobStatusTool missing 'parameters'"
        assert hasattr(GetJobStatusTool, 'returns'), "GetJobStatusTool missing 'returns'"
        print("✓ GetJobStatusTool has all required attributes")
        
        return True
    except Exception as e:
        print(f"✗ Tool structure test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_tool_registry():
    """Test tool registry functionality."""
    print("\n" + "=" * 60)
    print("Testing Tool Registry")
    print("=" * 60)
    
    try:
        from app.agent.tools.registry import ToolRegistry, create_default_registry
        from app.agent.tools.separate_stems_tool import SeparateStemsTool
        from app.agent.tools.convert_to_midi_tool import ConvertToMidiTool
        from app.agent.tools.get_job_status_tool import GetJobStatusTool
        
        # Test empty registry
        registry = ToolRegistry()
        assert registry.list_tools() == [], "New registry should be empty"
        print("✓ Empty registry created")
        
        # Mock services for tool instantiation
        class MockJobService:
            def create_job(self, *args, **kwargs):
                pass
            def get_job(self, *args, **kwargs):
                return None
        
        class MockAudioService:
            def get_audio_path(self, *args, **kwargs):
                return None
        
        mock_job_service = MockJobService()
        mock_audio_service = MockAudioService()
        
        # Test manual registration
        tool1 = SeparateStemsTool(mock_job_service, mock_audio_service)
        registry.register(tool1)
        assert "separate_stems" in registry.list_tools(), "Tool not registered"
        assert registry.get("separate_stems") == tool1, "Tool retrieval failed"
        print("✓ Manual tool registration works")
        
        # Test get_tool_schemas
        schemas = registry.get_tool_schemas()
        assert len(schemas) == 1, f"Expected 1 schema, got {len(schemas)}"
        assert schemas[0]["type"] == "function", "Schema should have 'type': 'function'"
        assert schemas[0]["function"]["name"] == "separate_stems", "Schema name mismatch"
        print("✓ Tool schema generation works")
        
        # Test create_default_registry
        default_registry = create_default_registry(mock_job_service, mock_audio_service)
        tool_names = default_registry.list_tools()
        expected_tools = {"separate_stems", "convert_to_midi", "get_job_status"}
        assert set(tool_names) == expected_tools, f"Expected {expected_tools}, got {set(tool_names)}"
        print("✓ Default registry creation works")
        print(f"  - Registered tools: {tool_names}")
        
        # Test schema generation for all tools
        all_schemas = default_registry.get_tool_schemas()
        assert len(all_schemas) == 3, f"Expected 3 schemas, got {len(all_schemas)}"
        schema_names = {s["function"]["name"] for s in all_schemas}
        assert schema_names == expected_tools, f"Schema names mismatch: {schema_names}"
        print("✓ All tool schemas generated correctly")
        
        return True
    except Exception as e:
        print(f"✗ Tool registry test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_tool_validation():
    """Test tool input validation."""
    print("\n" + "=" * 60)
    print("Testing Tool Input Validation")
    print("=" * 60)
    
    try:
        from app.agent.tools.get_job_status_tool import GetJobStatusTool
        
        # Mock services
        class MockJobService:
            def get_job(self, job_id):
                return None
        
        tool = GetJobStatusTool(MockJobService())
        
        # Test valid input
        try:
            tool.validate_inputs({"job_id": "123e4567-e89b-12d3-a456-426614174000"})
            print("✓ Valid input passes validation")
        except Exception as e:
            print(f"✗ Valid input failed validation: {e}")
            return False
        
        # Test invalid input (missing required field)
        try:
            tool.validate_inputs({})
            print("✗ Invalid input (missing required) should have failed")
            return False
        except ValueError:
            print("✓ Invalid input (missing required) correctly rejected")
        
        # Test invalid input (wrong type)
        try:
            tool.validate_inputs({"job_id": 123})
            print("✗ Invalid input (wrong type) should have failed")
            return False
        except ValueError:
            print("✓ Invalid input (wrong type) correctly rejected")
        
        return True
    except Exception as e:
        print(f"✗ Tool validation test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all validation tests."""
    print("\n" + "=" * 60)
    print("Phase 1 & Phase 2 Validation")
    print("=" * 60)
    print("\nThis script validates:")
    print("  - Model imports and structure")
    print("  - Tool imports and structure")
    print("  - Tool registry functionality")
    print("  - Tool schema generation")
    print("  - Tool input validation")
    print()
    
    results = []
    
    results.append(("Model Imports", test_model_imports()))
    results.append(("Model Structure", test_model_structure()))
    results.append(("Tool Imports", test_tool_imports()))
    results.append(("Tool Structure", test_tool_structure()))
    results.append(("Tool Registry", test_tool_registry()))
    results.append(("Tool Validation", test_tool_validation()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Validation Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All validations passed! Phase 1 & Phase 2 are ready.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
