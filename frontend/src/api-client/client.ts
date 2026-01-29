/**
 * Base HTTP Client
 * 
 * Low-level HTTP client for making requests to the FastAPI backend.
 * Provides typed request/response handling with error management.
 */

import { API_BASE_URL, DEFAULT_TIMEOUT } from './config';
import { ApiError, ApiErrorResponse } from './types';

/**
 * Merge multiple AbortSignals into one
 * The returned signal will abort when ANY of the input signals abort
 */
function mergeAbortSignals(...signals: (AbortSignal | undefined)[]): AbortSignal {
  const controller = new AbortController();
  
  for (const signal of signals) {
    if (signal) {
      // If already aborted, abort immediately
      if (signal.aborted) {
        controller.abort(signal.reason);
        break;
      }
      // Listen for abort events
      signal.addEventListener('abort', () => {
        controller.abort(signal.reason);
      }, { once: true });
    }
  }
  
  return controller.signal;
}

/**
 * Request options for HTTP calls
 */
export interface RequestOptions {
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Additional headers */
  headers?: Record<string, string>;
  
  /** AbortController signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Base API Client class
 * Provides methods for making HTTP requests with proper error handling
 */
export class ApiClient {
  constructor(private baseUrl: string = API_BASE_URL) {}

  /**
   * Make a GET request
   */
  async get<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  /**
   * Make a POST request
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>('POST', endpoint, body, options);
  }

  /**
   * Make a PUT request
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  /**
   * Core request method
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const { timeout = DEFAULT_TIMEOUT, headers = {}, signal } = options;

    // Build URL
    const url = `${this.baseUrl}${endpoint}`;

    // Create timeout controller and merge with caller's signal
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeout);
    const requestSignal = mergeAbortSignals(signal, timeoutController.signal);

    try {
      // Prepare headers
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
      };

      // Make request
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: requestSignal,
      });

      // Clear timeout
      clearTimeout(timeoutId);

      // Handle response
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Parse response based on content type and status
      return await this.parseResponse<T>(response);

    } catch (error) {
      // Clear timeout
      clearTimeout(timeoutId);

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(
          408,
          'Request Timeout',
          'Request timed out',
          { timeout }
        );
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new ApiError(
          0,
          'Network Error',
          'Network request failed. Is the backend running?',
          { originalError: error.message }
        );
      }

      // Re-throw ApiError
      if (error instanceof ApiError) {
        throw error;
      }

      // Unknown error
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new ApiError(
        500,
        'Unknown Error',
        errorMessage,
        { originalError: error }
      );
    }
  }

  /**
   * Parse response body based on content type
   * Handles JSON, empty responses, and other content types gracefully
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    // Handle 204 No Content - return empty object
    if (response.status === 204) {
      return {} as T;
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    
    // Handle JSON responses
    if (contentType?.includes('application/json')) {
      // Check if there's actually content
      const text = await response.text();
      if (!text) {
        return {} as T;
      }
      return JSON.parse(text) as T;
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    // For non-JSON content, try to parse as JSON anyway (backend might not set content-type)
    try {
      return JSON.parse(text) as T;
    } catch {
      // If parsing fails, return text wrapped in object
      return { data: text } as T;
    }
  }

  /**
   * Handle error responses from the API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = response.statusText;
    let details: unknown;

    try {
      const errorData: ApiErrorResponse = await response.json();
      errorMessage = errorData.detail || errorMessage;
      details = errorData;
    } catch {
      // If JSON parsing fails, use status text
    }

    throw new ApiError(
      response.status,
      response.statusText,
      errorMessage,
      details
    );
  }

  /**
   * Upload a file with multipart/form-data
   */
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalFields?: Record<string, string>,
    options: RequestOptions = {}
  ): Promise<T> {
    const { timeout = DEFAULT_TIMEOUT, headers = {}, signal } = options;

    // Build URL
    const url = `${this.baseUrl}${endpoint}`;

    // Create timeout controller and merge with caller's signal
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeout);
    const requestSignal = mergeAbortSignals(signal, timeoutController.signal);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Add additional fields
      if (additionalFields) {
        Object.entries(additionalFields).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      // Prepare headers (don't set Content-Type for FormData - browser sets it with boundary)
      const requestHeaders: Record<string, string> = {
        ...headers,
      };

      // Make request
      const response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body: formData,
        signal: requestSignal,
      });

      // Clear timeout
      clearTimeout(timeoutId);

      // Handle response
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Parse response based on content type and status
      return await this.parseResponse<T>(response);

    } catch (error) {
      // Clear timeout
      clearTimeout(timeoutId);

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(
          408,
          'Request Timeout',
          'File upload timed out',
          { timeout }
        );
      }

      // Re-throw ApiError
      if (error instanceof ApiError) {
        throw error;
      }

      // Unknown error
      const errorMessage = error instanceof Error ? error.message : 'File upload failed';
      throw new ApiError(
        500,
        'Upload Error',
        errorMessage,
        { originalError: error }
      );
    }
  }

  /**
   * Download a file (returns Blob)
   */
  async downloadFile(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<Blob> {
    const { timeout = DEFAULT_TIMEOUT, headers = {}, signal } = options;

    // Build URL
    const url = `${this.baseUrl}${endpoint}`;

    // Create timeout controller and merge with caller's signal
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeout);
    const requestSignal = mergeAbortSignals(signal, timeoutController.signal);

    try {
      // Make request
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: requestSignal,
      });

      // Clear timeout
      clearTimeout(timeoutId);

      // Handle response
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Return blob
      return await response.blob();

    } catch (error: unknown) {
      // Clear timeout
      clearTimeout(timeoutId);

      // Re-throw
      throw error;
    }
  }
}

/**
 * Default API client instance
 */
export const apiClient = new ApiClient();
