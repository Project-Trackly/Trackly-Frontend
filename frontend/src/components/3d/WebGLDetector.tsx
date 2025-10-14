/**
 * WebGL Detector Component
 * 
 * Detects WebGL capability and provides fallback UI for unsupported browsers.
 * T017: WebGL detection and fallback implementation
 */

'use client';

import { useEffect, useState } from 'react';
import { detectWebGLCapability } from '@/lib/3d/performance';
import type { WebGLCapability } from '@/types/3d';

interface WebGLDetectorProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onCapabilityDetected?: (capability: WebGLCapability) => void;
}

/**
 * WebGLDetector Component
 * 
 * Wraps 3D content and automatically shows fallback for browsers without WebGL.
 * 
 * @example
 * ```tsx
 * <WebGLDetector fallback={<FallbackView2D />}>
 *   <Canvas>
 *     <TaskVisualization3D />
 *   </Canvas>
 * </WebGLDetector>
 * ```
 */
export function WebGLDetector({
  children,
  fallback,
  onCapabilityDetected,
}: WebGLDetectorProps) {
  const [capability, setCapability] = useState<WebGLCapability | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Run detection on client side only
    const detected = detectWebGLCapability();
    setCapability(detected);
    setIsChecking(false);
    
    if (onCapabilityDetected) {
      onCapabilityDetected(detected);
    }
  }, [onCapabilityDetected]);

  // Show loading during detection
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Checking 3D capabilities...
          </p>
        </div>
      </div>
    );
  }

  // Show fallback if WebGL not supported
  if (!capability?.hasWebGL) {
    return (
      <>
        {fallback || (
          <div className="flex items-center justify-center min-h-[400px] p-8">
            <div className="max-w-md text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold mb-2">
                3D View Not Supported
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your browser does not support WebGL, which is required for 3D visualization.
                Please use a modern browser like Chrome, Firefox, Safari, or Edge.
              </p>
              <p className="text-sm text-gray-500">
                Detected: {capability?.renderer || 'Unknown'}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  // WebGL 2.0 warning (but still show 3D view)
  if (!capability.hasWebGL2) {
    console.warn('WebGL 2.0 not available, falling back to WebGL 1.0');
  }

  // Render 3D content
  return <>{children}</>;
}

/**
 * Hook to check WebGL capability
 * Returns null during SSR, capability object on client
 */
export function useWebGLCapability(): WebGLCapability | null {
  const [capability, setCapability] = useState<WebGLCapability | null>(null);

  useEffect(() => {
    setCapability(detectWebGLCapability());
  }, []);

  return capability;
}
