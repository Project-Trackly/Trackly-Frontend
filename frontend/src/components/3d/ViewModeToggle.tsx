'use client';

import { useState } from 'react';
import { use3DViewStore } from '@/stores/3d-view-store';
import type { ViewMode3D, ClusterBy } from '@/types/3d';

/**
 * ViewModeToggle Component
 * 
 * Provides buttons to switch between different 3D view modes.
 * T029: Added cluster mode with clustering key selection
 */
export function ViewModeToggle() {
  const { viewMode, setViewMode } = use3DViewStore((state) => ({
    viewMode: state.viewMode,
    setViewMode: state.setViewMode,
  }));

  const [showClusterOptions, setShowClusterOptions] = useState(false);
  const [clusterBy, setClusterBy] = useState<ClusterBy>('label');

  const modes: { value: ViewMode3D; label: string; icon: string; description: string }[] = [
    {
      value: 'priority',
      label: 'Priority',
      icon: '📊',
      description: 'Tasks ordered by priority (Z-axis)',
    },
    {
      value: 'cluster',
      label: 'Cluster',
      icon: '🗂️',
      description: 'Tasks grouped by labels/assignee/status',
    },
    {
      value: 'timeline',
      label: 'Timeline',
      icon: '📅',
      description: 'Tasks arranged by deadline (Y-axis time)',
    },
  ];

  const handleModeChange = (mode: ViewMode3D) => {
    if (mode === 'cluster') {
      setShowClusterOptions(true);
    } else {
      setShowClusterOptions(false);
    }
    setViewMode(mode);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 border border-gray-200 dark:border-gray-700">
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
        View Mode
      </div>
      <div className="flex flex-col gap-1">
        {modes.map((mode) => {
          const isActive = viewMode === mode.value;

          return (
            <button
              key={mode.value}
              onClick={() => handleModeChange(mode.value)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
                ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }
              `}
              title={mode.description}
            >
              <span className="text-lg">{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Cluster Options */}
      {showClusterOptions && viewMode === 'cluster' && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
            Group By
          </div>
          <select
            value={clusterBy}
            onChange={(e) => {
              setClusterBy(e.target.value as ClusterBy);
              // Store cluster by preference (could add to store if needed)
            }}
            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="label">Label</option>
            <option value="assignee">Assignee</option>
            <option value="status">Status</option>
            <option value="milestone" disabled>Milestone (Soon)</option>
          </select>
        </div>
      )}

      {/* Reset View Button */}
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => use3DViewStore.getState().resetView()}
          className="w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          🔄 Reset View
        </button>
      </div>

      {/* Preferences Toggle */}
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <PreferencesPanel />
      </div>
    </div>
  );
}

/**
 * PreferencesPanel Component
 * 
 * Quick settings for 3D view preferences
 */
function PreferencesPanel() {
  const { preferences, updatePreferences } = use3DViewStore((state) => ({
    preferences: state.preferences,
    updatePreferences: state.updatePreferences,
  }));

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2">
        Settings
      </div>
      
      <label className="flex items-center justify-between px-2 cursor-pointer">
        <span className="text-sm text-gray-700 dark:text-gray-300">Labels</span>
        <input
          type="checkbox"
          checked={preferences.showLabels}
          onChange={(e) => updatePreferences({ showLabels: e.target.checked })}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </label>

      <label className="flex items-center justify-between px-2 cursor-pointer">
        <span className="text-sm text-gray-700 dark:text-gray-300">Shadows</span>
        <input
          type="checkbox"
          checked={preferences.enableShadows}
          onChange={(e) => updatePreferences({ enableShadows: e.target.checked })}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </label>

      <div className="px-2">
        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
          Animation Speed
        </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.5"
          value={preferences.animationSpeed}
          onChange={(e) => updatePreferences({ animationSpeed: parseFloat(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Slow</span>
          <span>Fast</span>
        </div>
      </div>
    </div>
  );
}
