/**
 * 3D Performance Utilities
 * 
 * This file contains utilities for optimizing 3D rendering performance.
 * Includes LOD (Level of Detail), frustum culling helpers, and FPS monitoring.
 */

import type { WebGLCapability } from '@/types/3d';

/**
 * Detect WebGL capabilities
 * 
 * @returns WebGLCapability object with detected features
 */
export function detectWebGLCapability(): WebGLCapability {
  const canvas = document.createElement('canvas');
  
  // Try WebGL 2.0 first
  const gl2 = canvas.getContext('webgl2');
  if (gl2) {
    const debugInfo = gl2.getExtension('WEBGL_debug_renderer_info');
    return {
      hasWebGL: true,
      hasWebGL2: true,
      renderer: debugInfo ? gl2.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : undefined,
      version: gl2.getParameter(gl2.VERSION),
    };
  }
  
  // Fallback to WebGL 1.0
  const gl = canvas.getContext('webgl') as (WebGLRenderingContext | null);
  if (gl) {
    // Note: 'getExtension' and 'getParameter' only exist on WebGLRenderingContext, not others.
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      ? gl.getExtension('WEBGL_debug_renderer_info')
      : undefined;

    return {
      hasWebGL: true,
      hasWebGL2: false,
      renderer:
        debugInfo && gl.getParameter
          ? gl.getParameter((debugInfo as any).UNMASKED_RENDERER_WEBGL)
          : undefined,
      version: gl.getParameter ? gl.getParameter(gl.VERSION) : undefined,
    };
  }
  
  // No WebGL support
  return {
    hasWebGL: false,
    hasWebGL2: false,
  };
}

/**
 * LOD (Level of Detail) distance thresholds
 * Based on research.md recommendations
 */
export const LOD_DISTANCES = {
  HIGH: 10,    // < 10 units: full detail
  MEDIUM: 30,  // 10-30 units: medium detail
  LOW: 100,    // > 30 units: low detail
} as const;

/**
 * Calculate appropriate LOD level based on distance from camera
 * 
 * @param distance - Distance from camera to object
 * @returns LOD level index (0 = high, 1 = medium, 2 = low)
 */
export function calculateLODLevel(distance: number): 0 | 1 | 2 {
  if (distance < LOD_DISTANCES.HIGH) return 0;
  if (distance < LOD_DISTANCES.MEDIUM) return 1;
  return 2;
}

/**
 * FPS Monitor class
 * Tracks frames per second for performance monitoring
 */
export class FPSMonitor {
  private frames: number = 0;
  private lastTime: number = performance.now();
  private fps: number = 60;
  private callbacks: Array<(fps: number) => void> = [];
  private isRunning: boolean = false;
  
  /**
   * Start monitoring FPS
   */
  start(): void {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.frames = 0;
  }
  
  /**
   * Stop monitoring FPS
   */
  stop(): void {
    this.isRunning = false;
  }
  
  /**
   * Update FPS counter (call this every frame)
   */
  update(): void {
    if (!this.isRunning) return;
    
    this.frames++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.lastTime;
    
    // Update FPS every second
    if (elapsed >= 1000) {
      this.fps = Math.round((this.frames * 1000) / elapsed);
      this.lastTime = currentTime;
      this.frames = 0;
      
      // Notify callbacks
      this.callbacks.forEach((cb) => cb(this.fps));
    }
  }
  
  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }
  
  /**
   * Subscribe to FPS updates
   * 
   * @param callback - Function called when FPS updates
   * @returns Unsubscribe function
   */
  subscribe(callback: (fps: number) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }
}

/**
 * Throttle function execution
 * Useful for limiting state updates during drag operations
 * 
 * @param func - Function to throttle
 * @param limit - Minimum time between executions (ms)
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;
  
  return function (this: any, ...args: Parameters<T>): void {
    if (!inThrottle) {
      lastResult = func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce function execution
 * Useful for deferring expensive operations until user stops interacting
 * 
 * @param func - Function to debounce
 * @param delay - Delay before execution (ms)
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return function (this: any, ...args: Parameters<T>): void {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Check if performance is acceptable
 * Used to trigger fallback to 2D view if 3D performance is poor
 * 
 * @param fps - Current FPS
 * @param threshold - Minimum acceptable FPS (default: 30)
 * @returns True if performance is acceptable
 */
export function isPerformanceAcceptable(fps: number, threshold: number = 30): boolean {
  return fps >= threshold;
}

/**
 * Create a simple performance budget checker
 */
export class PerformanceBudget {
  private samples: number[] = [];
  private maxSamples: number = 60; // 1 second at 60fps
  
  /**
   * Add FPS sample
   */
  addSample(fps: number): void {
    this.samples.push(fps);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }
  
  /**
   * Get average FPS over sample period
   */
  getAverage(): number {
    if (this.samples.length === 0) return 60;
    return this.samples.reduce((sum, fps) => sum + fps, 0) / this.samples.length;
  }
  
  /**
   * Check if performance is consistently below threshold
   */
  isBelowThreshold(threshold: number): boolean {
    if (this.samples.length < this.maxSamples / 2) {
      return false; // Not enough samples yet
    }
    return this.getAverage() < threshold;
  }
  
  /**
   * Reset samples
   */
  reset(): void {
    this.samples = [];
  }
}
