/**
 * API Client Configuration
 * 
 * Central configuration for API communication with the FastAPI backend.
 */

/**
 * Base URL for the FastAPI backend API
 * Can be overridden via environment variable
 */
export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_BASE_URL || 
  'http://localhost:8000/api';

/**
 * Default request timeout in milliseconds
 */
export const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Default polling interval for job status (milliseconds)
 */
export const DEFAULT_POLL_INTERVAL = 2000; // 2 seconds

/**
 * Maximum number of polling attempts before giving up
 */
export const MAX_POLL_ATTEMPTS = 150; // 5 minutes at 2s intervals
