# Utility Functions

## Purpose

Helper functions and utilities used throughout the application. Reusable code that doesn't fit into other layers.

## Key Components

- **`midi_utils.py`**: MIDI file handling (save, load, convert, extract note events)
- **`security.py`**: Security utilities (password hashing, token generation, validation)

## Current Utilities

- **MIDI Utils**: Save/load MIDI files, extract note events
- **Security Utils**: Password hashing, token generation, input validation

## Important Notes

1. **Stateless**: Functions should be stateless and pure where possible
2. **No Business Logic**: Utils don't contain business logic (use services)
3. **Reusability**: Functions should be reusable across contexts
4. **Type Hints**: Always include type hints
5. **Documentation**: Docstrings required for all public functions

## Future Improvements

- [ ] Audio format conversion utilities
- [ ] File validation utilities
- [ ] Path sanitization utilities
- [ ] Logging utilities
- [ ] Date/time utilities


