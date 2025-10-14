/**
 * 3D View Store (Zustand)
 * 
 * Global state management for 3D task visualization.
 * Manages camera position, view mode, selections, and user preferences.
 * Uses Zustand with persist middleware for localStorage persistence.
 * 
 * T014: Full implementation complete
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { View3DStore, Camera3DState, ViewMode3D } from '@/types/3d';

// Default camera position (looking at origin from distance)
const DEFAULT_CAMERA: Camera3DState = {
  position: [0, 5, 10],
  target: [0, 0, 0],
  zoom: 1,
};

/**
 * 3D View Store
 * 
 * Complete implementation with all actions and persistence.
 * Persists camera, viewMode, and preferences to localStorage.
 * Selection state is transient (not persisted).
 */
export const use3DViewStore = create<View3DStore>()(
  persist(
    (set) => ({
      // Initial state
      camera: DEFAULT_CAMERA,
      selection: {
        selectedTaskIds: [],
        focusedClusterId: null,
      },
      viewMode: 'priority' as ViewMode3D,
      preferences: {
        showLabels: true,
        animationSpeed: 1,
        enableShadows: true,
        enableAntialiasing: true,
      },
      selectedTimeRange: null,
      
      // Actions - Scaffold implementations
      setCameraPosition: (position) =>
        set((state) => ({
          camera: { ...state.camera, position },
        })),
      
      setCameraTarget: (target) =>
        set((state) => ({
          camera: { ...state.camera, target },
        })),
      
      setZoom: (zoom) =>
        set((state) => ({
          camera: { ...state.camera, zoom },
        })),
      
      selectTasks: (taskIds) =>
        set({
          selection: { selectedTaskIds: taskIds, focusedClusterId: null },
        }),
      
      toggleTaskSelection: (taskId) =>
        set((state) => {
          const { selectedTaskIds } = state.selection;
          const isSelected = selectedTaskIds.includes(taskId);
          return {
            selection: {
              selectedTaskIds: isSelected
                ? selectedTaskIds.filter((id) => id !== taskId)
                : [...selectedTaskIds, taskId],
              focusedClusterId: null,
            },
          };
        }),
      
      clearSelection: () =>
        set({
          selection: { selectedTaskIds: [], focusedClusterId: null },
        }),
      
      focusCluster: (clusterId) =>
        set((state) => ({
          selection: { ...state.selection, focusedClusterId: clusterId },
        })),
      
      unfocusCluster: () =>
        set((state) => ({
          selection: { ...state.selection, focusedClusterId: null },
        })),
      
      setViewMode: (mode) => set({ viewMode: mode }),
      
      setSelectedTimeRange: (range) => set({ selectedTimeRange: range }),
      
      updatePreferences: (preferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        })),
      
      resetView: () =>
        set({
          camera: DEFAULT_CAMERA,
          selection: { selectedTaskIds: [], focusedClusterId: null },
        }),
    }),
    {
      name: 'trackly-3d-view', // localStorage key
      partialize: (state) => ({
        // Only persist camera and preferences, not selections
        camera: state.camera,
        viewMode: state.viewMode,
        preferences: state.preferences,
      }),
    }
  )
);

/**
 * Selector hooks for performance optimization
 * Use these instead of accessing the entire store
 */
export const useCameraPosition = () => use3DViewStore((state) => state.camera.position);
export const useCameraTarget = () => use3DViewStore((state) => state.camera.target);
export const useViewMode = () => use3DViewStore((state) => state.viewMode);
export const useSelection = () => use3DViewStore((state) => state.selection);
export const usePreferences = () => use3DViewStore((state) => state.preferences);
