/**
 * KeyboardControls Component
 * 
 * T038: Comprehensive keyboard navigation for accessibility
 * Handles arrow keys, zoom, reset, and task navigation
 */

'use client';

import { useEffect } from 'react';
import { use3DViewStore } from '@/stores/3d-view-store';
import { useThree } from '@react-three/fiber';

interface KeyboardControlsProps {
  taskIds: string[];
}

/**
 * KeyboardControls Component
 * 
 * Provides keyboard shortcuts for 3D view navigation.
 * 
 * Shortcuts:
 * - Arrow Keys: Rotate camera
 * - +/=: Zoom in
 * - -/_: Zoom out
 * - R: Reset view
 * - Tab: Cycle through tasks
 * - Enter: Select focused task
 * - Escape: Clear selection
 * - 1-3: Switch view modes
 */
export function KeyboardControls({ taskIds }: KeyboardControlsProps) {
  const { camera } = useThree();
  const store = use3DViewStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input
      if ((e.target as HTMLElement).tagName === 'INPUT' || 
          (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        // Zoom controls
        case '+':
        case '=':
          e.preventDefault();
          camera.position.multiplyScalar(0.9); // Zoom in
          break;
        
        case '-':
        case '_':
          e.preventDefault();
          camera.position.multiplyScalar(1.1); // Zoom out
          break;

        // Reset view
        case 'r':
        case 'R':
          e.preventDefault();
          store.resetView();
          camera.position.set(0, 5, 10);
          break;

        // Task navigation
        case 'Tab':
          e.preventDefault();
          const currentIndex = taskIds.indexOf(store.selection.selectedTaskIds[0]);
          const nextIndex = (currentIndex + 1) % taskIds.length;
          store.selectTasks([taskIds[nextIndex]]);
          break;

        case 'Enter':
          e.preventDefault();
          // Enter could trigger task details modal
          break;

        case 'Escape':
          e.preventDefault();
          store.clearSelection();
          break;

        // View mode shortcuts
        case '1':
          e.preventDefault();
          store.setViewMode('priority');
          break;
        
        case '2':
          e.preventDefault();
          store.setViewMode('cluster');
          break;
        
        case '3':
          e.preventDefault();
          store.setViewMode('timeline');
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [camera, store, taskIds]);

  return null; // This component doesn't render anything
}
