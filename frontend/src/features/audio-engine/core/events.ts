/**
 * Event Emitter
 * 
 * Simple event emitter for audio engine events.
 * Allows UI components to subscribe to engine state changes.
 */

import type { EventHandler, EngineEvent } from './types';

/**
 * Event emitter for audio engine
 */
export class EventEmitter {
  private listeners: Map<EngineEvent, Set<EventHandler>>;
  
  constructor() {
    this.listeners = new Map();
  }
  
  /**
   * Subscribe to an event
   * @param event - Event type
   * @param handler - Event handler function
   */
  on(event: EngineEvent, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }
  
  /**
   * Unsubscribe from an event
   * @param event - Event type
   * @param handler - Event handler function
   */
  off(event: EngineEvent, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }
  
  /**
   * Emit an event
   * @param event - Event type
   * @param payload - Event payload
   */
  emit(event: EngineEvent, payload: unknown): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload as never);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }
  
  /**
   * Remove all listeners
   */
  clear(): void {
    this.listeners.clear();
  }
  
  /**
   * Get number of listeners for an event
   * @param event - Event type
   * @returns Number of listeners
   */
  listenerCount(event: EngineEvent): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
