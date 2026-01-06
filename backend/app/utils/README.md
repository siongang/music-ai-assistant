# Utility Functions

## Purpose

Helper functions and utilities used throughout the application. This package contains reusable code that doesn't fit into other layers.

## Key Components

- **`midi_utils.py`**: MIDI file handling utilities (save, load, convert)
- **`security.py`**: Security utilities (password hashing, token generation, validation)

## Current Utilities

### MIDI Utils

Provides helper functions for MIDI operations:
- Save MIDI objects to files
- Load MIDI files
- Convert between MIDI formats
- Extract note events from MIDI data

**Usage:**
```python
from app.utils.midi_utils import save_midi, extract_note_events

# Save MIDI object
save_midi(midi_obj, output_path)

# Extract note events for CSV export
notes = extract_note_events(midi_obj)
```

### Security Utils

Security-related utilities:
- Password hashing (bcrypt/scrypt)
- Token generation (JWT, API keys)
- Input validation and sanitization
- File path validation

**Usage:**
```python
from app.utils.security import hash_password, verify_password

# Hash a password
hashed = hash_password("user_password")

# Verify password
is_valid = verify_password("user_password", hashed)
```

## Important Notes

1. **Stateless**: Utility functions should be stateless and pure where possible
2. **No Business Logic**: Utils should not contain business logic (use services for that)
3. **Reusability**: Write functions to be reusable across different contexts
4. **Error Handling**: Handle errors gracefully with proper exceptions
5. **Type Hints**: Always include type hints for better IDE support
6. **Documentation**: Add docstrings to all public functions

## Future Improvements

- [ ] Add audio format conversion utilities
- [ ] Add file validation utilities (size, format, magic bytes)
- [ ] Add path sanitization utilities
- [ ] Add logging utilities (structured logging, log formatting)
- [ ] Add date/time utilities (timezone handling, formatting)
- [ ] Add string utilities (slug generation, sanitization)
- [ ] Add encryption utilities (file encryption, data encryption)
- [ ] Add compression utilities (file compression, decompression)
- [ ] Add validation utilities (email, URL, UUID)
- [ ] Add testing utilities (fixtures, mocks, helpers)
- [ ] Add performance monitoring utilities
- [ ] Add caching utilities

## Dependencies

- `pathlib.Path`: File path handling
- `bcrypt` or `passlib`: Password hashing (for security utils)
- `pretty_midi`: MIDI handling (for MIDI utils)
- `uuid`: UUID generation


