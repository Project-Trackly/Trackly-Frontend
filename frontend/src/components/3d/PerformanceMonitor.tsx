/**
 * PerformanceMonitor Component
 * 
 * T041: FPS monitoring and performance alerts
 * Warns users if performance is poor and suggests fallback
 */

'use client';

import { useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { FPSMonitor, PerformanceBudget } from '@/lib/3d/performance';

interface PerformanceMonitorProps {
  onPoorPerformance?: () => void;
}

/**
 * PerformanceMonitor Component
 * 
 * Monitors FPS and shows warning if performance is consistently poor.
 * Rendered inside Canvas (has access to useFrame).
 */
export function PerformanceMonitor({ onPoorPerformance }: PerformanceMonitorProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [fps, setFps] = useState(60);
  
  useEffect(() => {
    const monitor = new FPSMonitor();
    const budget = new PerformanceBudget();
    
    monitor.start();
    
    const unsubscribe = monitor.subscribe((currentFps) => {
      setFps(currentFps);
      budget.addSample(currentFps);
      
      // Check if performance is consistently below threshold
      if (budget.isBelowThreshold(30)) {
        setShowWarning(true);
        onPoorPerformance?.();
      }
    });
    
    return () => {
      monitor.stop();
      unsubscribe();
    };
  }, [onPoorPerformance]);

  // Update FPS every frame (for internal monitoring)
  useFrame(() => {
    // Frame updates handled by FPSMonitor
  });

  return null; // Rendering handled by parent
}

/**
 * PerformanceWarning Component
 * 
 * Visual warning when FPS is consistently low
 */
export function PerformanceWarning({ onSwitch2D }: { onSwitch2D: () => void }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100 p-4 rounded-lg shadow-xl border border-orange-300 dark:border-orange-700 z-50">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1">
          <h4 className="font-semibold mb-1">Performance Warning</h4>
          <p className="text-sm mb-3">
            3D view is running slowly on your device. Consider switching to 2D view for better performance.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onSwitch2D}
              className="px-3 py-1 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700 transition-colors"
            >
              Switch to 2D
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-1 bg-white dark:bg-gray-800 text-orange-900 dark:text-orange-100 rounded text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Continue 3D
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * FPSCounter Component
 * 
 * Simple FPS display for development
 */
export function FPSCounter() {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    const monitor = new FPSMonitor();
    monitor.start();
    
    const unsubscribe = monitor.subscribe(setFps);
    
    return () => {
      monitor.stop();
      unsubscribe();
    };
  }, []);

  return (
    <div className="fixed top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg font-mono text-sm z-50">
      <div className="flex items-center gap-2">
        <span className={fps < 30 ? 'text-red-400' : fps < 50 ? 'text-yellow-400' : 'text-green-400'}>
          ●
        </span>
        <span>{fps} FPS</span>
      </div>
    </div>
  );
}
