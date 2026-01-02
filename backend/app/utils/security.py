"""
Security utilities for file handling and validation.
"""
import re
from pathlib import Path
from typing import Optional


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename to prevent path traversal and other security issues.
    
    Removes or replaces dangerous characters and path components:
    - Removes path separators (/, \)
    - Removes null bytes
    - Removes leading/trailing dots and spaces
    - Replaces spaces with underscores
    - Limits length to 255 characters
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename safe for filesystem use
        
    Examples:
        >>> sanitize_filename("../../../etc/passwd")
        'etc_passwd'
        >>> sanitize_filename("my song.mp3")
        'my_song.mp3'
        >>> sanitize_filename("file\x00name.txt")
        'filename.txt'
    """
    if not filename:
        return "unnamed_file"
    
    # Remove path separators and null bytes
    filename = filename.replace("/", "_").replace("\\", "_")
    filename = filename.replace("\x00", "")
    
    # Remove leading/trailing dots, spaces, and other problematic characters
    filename = filename.strip(". ")
    
    # Replace spaces with underscores
    filename = filename.replace(" ", "_")
    
    # Remove any remaining problematic characters (keep alphanumeric, dots, hyphens, underscores)
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    
    # Remove multiple consecutive underscores
    filename = re.sub(r'_+', '_', filename)
    
    # Limit length (255 is common filesystem limit)
    if len(filename) > 255:
        # Preserve extension if present
        path_obj = Path(filename)
        if path_obj.suffix:
            max_name_len = 255 - len(path_obj.suffix)
            filename = path_obj.stem[:max_name_len] + path_obj.suffix
        else:
            filename = filename[:255]
    
    # Ensure filename is not empty after sanitization
    if not filename or filename in (".", ".."):
        filename = "unnamed_file"
    
    return filename


def validate_file_size(file_size: int, max_size: Optional[int] = None) -> bool:
    """
    Validate that a file size is within acceptable limits.
    
    Args:
        file_size: File size in bytes
        max_size: Maximum allowed size in bytes (defaults to MAX_FILE_SIZE_BYTES)
        
    Returns:
        True if file size is acceptable, False otherwise
    """
    from app.core.constants import MAX_FILE_SIZE_BYTES
    
    if max_size is None:
        max_size = MAX_FILE_SIZE_BYTES
    
    return file_size > 0 and file_size <= max_size

