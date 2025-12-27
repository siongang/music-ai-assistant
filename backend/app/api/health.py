"""
Health check endpoint.

Provides a simple endpoint to check if the API is running.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health():
    """
    Health check endpoint.
    
    Returns:
        dict: Status indicator showing the API is running
    """
    return {"status": "ok"}
