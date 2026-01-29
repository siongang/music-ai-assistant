# API Client Design Patterns

**Version**: 1.0  
**Last Updated**: 2026-01-29

## Overview

This document defines the design patterns and best practices for the API client layer. Following these patterns ensures consistent error handling, proper timeout management, and maintainable code.

---

## Core Principles

### 1. **Single Responsibility**
- The `ApiClient` class handles ALL HTTP communication
- Endpoint modules provide typed wrappers, NOT raw fetch calls
- Never bypass the ApiClient - always use its methods

### 2. **Modular Design**
- Separate concerns: transport layer (ApiClient) vs. endpoint logic (endpoint modules)
- Each endpoint module focuses on request/response shaping for specific API routes
- Reusable functionality lives in the base client

### 3. **Defensive Programming**
- Always handle empty responses
- Check content types before parsing
- Merge abort signals properly
- Validate inputs before making requests

---

## Pattern: Signal Merging for Timeouts

### ❌ INCORRECT: Signal Replacement

```typescript
// BAD: When caller passes signal, timeout is ignored
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeout);
const requestSignal = signal || controller.signal; // Timeout won't work if signal exists!
```

**Problem**: If the caller provides their own `AbortSignal`, the timeout controller's signal is never used, so timeouts never trigger.

### ✅ CORRECT: Signal Merging

```typescript
// GOOD: Merge timeout signal with caller's signal
function mergeAbortSignals(...signals: (AbortSignal | undefined)[]): AbortSignal {
  const controller = new AbortController();
  
  for (const signal of signals) {
    if (signal) {
      if (signal.aborted) {
        controller.abort(signal.reason);
        break;
      }
      signal.addEventListener('abort', () => {
        controller.abort(signal.reason);
      }, { once: true });
    }
  }
  
  return controller.signal;
}

// Use it
const timeoutController = new AbortController();
const timeoutId = setTimeout(() => timeoutController.abort(), timeout);
const requestSignal = mergeAbortSignals(signal, timeoutController.signal);
```

**Why**: The merged signal aborts when EITHER the timeout fires OR the caller's signal aborts.

---

## Pattern: Safe Response Parsing

### ❌ INCORRECT: Blind JSON Parsing

```typescript
// BAD: Assumes all responses are JSON
const data = await response.json(); // Throws on 204 or empty body!
return data as T;
```

**Problems**:
- 204 No Content has no body → `.json()` throws
- Some endpoints return text, not JSON
- Empty responses cause unhandled errors

### ✅ CORRECT: Content-Aware Parsing

```typescript
// GOOD: Check status and content type before parsing
private async parseResponse<T>(response: Response): Promise<T> {
  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  // Check content type
  const contentType = response.headers.get('content-type');
  
  // Handle JSON responses
  if (contentType?.includes('application/json')) {
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

  // Try to parse as JSON (backend might not set content-type)
  try {
    return JSON.parse(text) as T;
  } catch {
    // Return text wrapped in object for non-JSON content
    return { data: text } as T;
  }
}
```

**Why**: Handles all response types gracefully without throwing unexpected errors.

---

## Pattern: Endpoint Module Structure

### ❌ INCORRECT: Direct Fetch in Endpoints

```typescript
// BAD: Bypasses ApiClient, no error handling or timeout
export async function sendMessageWithUpload(
  message: string,
  file: File,
  sessionId?: string
): Promise<ChatMessageResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('message', message);
  
  // WRONG: Direct fetch bypasses all ApiClient features
  const response = await fetch(`${apiClient['baseUrl']}/chat/message-with-upload`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
  
  return response.json();
}
```

**Problems**:
- Accesses private property via bracket notation
- No timeout handling
- Basic error handling (no ApiError)
- No abort signal support
- Fragile and hard to test

### ✅ CORRECT: Use ApiClient Methods

```typescript
// GOOD: Uses ApiClient's uploadFile method
export async function sendMessageWithUpload(
  message: string,
  file: File,
  sessionId?: string
): Promise<ChatMessageResponse> {
  const additionalFields: Record<string, string> = {
    message,
  };
  
  if (sessionId) {
    additionalFields.session_id = sessionId;
  }
  
  // Use ApiClient for proper error handling and timeout support
  return apiClient.uploadFile<ChatMessageResponse>(
    '/chat/message-with-upload',
    file,
    additionalFields
  );
}
```

**Why**: Leverages all ApiClient features: timeouts, error mapping, signal merging, response parsing.

---

## Pattern: Consistent Error Handling

### ApiError Structure

All API errors should be thrown as `ApiError` instances:

```typescript
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public statusText: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

### Error Handling in Callers

```typescript
try {
  const result = await apiClient.post('/endpoint', data);
  // Success path
} catch (error) {
  if (error instanceof ApiError) {
    // Handle API errors
    if (error.statusCode === 404) {
      // Not found
    } else if (error.statusCode === 408) {
      // Timeout
    }
  } else {
    // Handle unexpected errors
  }
}
```

---

## Pattern: Configuration Management

### ✅ CORRECT: Centralized Configuration

```typescript
// config.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const DEFAULT_TIMEOUT = 30000; // 30 seconds

// client.ts
import { API_BASE_URL, DEFAULT_TIMEOUT } from './config';

export class ApiClient {
  constructor(private baseUrl: string = API_BASE_URL) {}
}

export const apiClient = new ApiClient();
```

### ❌ INCORRECT: Hardcoded URLs

```typescript
// BAD: Hardcoded URL
const response = await fetch('http://localhost:8000/endpoint');
```

**Why**: Centralized configuration makes it easy to change settings and manage environments.

---

## Testing Patterns

### Mock ApiClient for Tests

```typescript
// test-utils.ts
export function createMockApiClient(): ApiClient {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    uploadFile: jest.fn(),
    downloadFile: jest.fn(),
  } as unknown as ApiClient;
}

// endpoint.test.ts
import { createMockApiClient } from './test-utils';

it('should call API correctly', async () => {
  const mockClient = createMockApiClient();
  (mockClient.post as jest.Mock).mockResolvedValue({ success: true });
  
  // Test endpoint function
});
```

---

## Checklist for New Endpoints

When adding a new endpoint function:

- [ ] Uses `apiClient` methods (get, post, put, delete, uploadFile, downloadFile)
- [ ] Returns properly typed response (TypeScript generic)
- [ ] Has JSDoc documentation with example
- [ ] Doesn't bypass ApiClient with raw `fetch`
- [ ] Lets ApiClient handle errors, timeouts, and signals
- [ ] Has corresponding test coverage

---

## Common Mistakes to Avoid

1. **Accessing Private Properties**: Never use `apiClient['baseUrl']` - export constants instead
2. **Signal Replacement**: Always merge signals, don't replace them
3. **Blind JSON Parsing**: Check content type and handle empty responses
4. **Direct Fetch Calls**: Always use ApiClient methods
5. **Inconsistent Errors**: Always throw `ApiError` for API failures
6. **Missing Timeouts**: All requests should support timeout (via ApiClient)
7. **Hardcoded URLs**: Use configuration constants

---

## Migration Guide

If you find code that violates these patterns:

1. **Identify the anti-pattern** (see examples above)
2. **Refactor to use ApiClient** methods
3. **Update tests** to use mock ApiClient
4. **Verify error handling** works correctly
5. **Test timeout behavior** with abort signals

---

## Related Documentation

- [API Integration Guide](./API_INTEGRATION.md) - How to integrate with backend APIs
- [Architecture Overview](./ARCHITECTURE.md) - Overall system architecture
- [Testing Guide](../tests/README.md) - Testing patterns and utilities

---

## Questions?

If you're unsure about a pattern or encounter an edge case not covered here:

1. Check existing endpoints for examples
2. Review the ApiClient implementation
3. Consult the team lead or senior engineer
4. Update this document with new patterns

**Remember**: Consistency > Cleverness. Follow these patterns even if you think you have a "better" way.
