/**
 * TaskVisualization3D Component
 * 
 * T019: Main 3D visualization container
 * T030: Added cluster mode support
 * T036: Added timeline mode with axis and slider
 * Manages the Three.js Canvas, camera, lighting, and task rendering
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stats } from '@react-three/drei';
import { useTasks3D, useTaskClusters } from '@/services/api/tasks3d';
import { use3DViewStore } from '@/stores/3d-view-store';
import { priorityLayout, clusterLayout, timelineLayout } from '@/lib/3d/layouts';
import { TaskCard3D } from './TaskCard3D';
import { ViewModeToggle } from './ViewModeToggle';
import { TimelineAxis } from './TimelineAxis';
import { TimeSlider } from './TimeSlider';
import ClusterGroup from './ClusterGroup';
import type { Task3D, ClusterBy, ClusterLayout } from '@/types/3d';
import { Vector3 } from 'three';

interface TaskVisualization3DProps {
  projectId: string;
}

/**
 * TaskVisualization3D Component
 * 
 * Main container for 3D task visualization.
 * Handles data fetching, layout calculation, and rendering.
 */
export function TaskVisualization3D({ projectId }: TaskVisualization3DProps) {
  const { data, isLoading, error } = useTasks3D(projectId, true);
  const viewMode = use3DViewStore((state) => state.viewMode);
  const { selection, focusCluster, unfocusCluster } = use3DViewStore((state) => ({
    selection: state.selection,
    focusCluster: state.focusCluster,
    unfocusCluster: state.unfocusCluster,
  }));
  
  const [positions, setPositions] = useState<Vector3[]>([]);
  const [clusterLayouts, setClusterLayouts] = useState<Map<string, ClusterLayout>>(new Map());
  const [clusterBy, setClusterBy] = useState<ClusterBy>('label');

  // Fetch cluster data when in cluster mode
  const { data: clustersData } = useTaskClusters(
    projectId,
    clusterBy,
    viewMode === 'cluster'
  );

  // Calculate task positions based on view mode
  useEffect(() => {
    if (!data?.tasks) return;

    switch (viewMode) {
      case 'priority':
        setPositions(priorityLayout(data.tasks));
        setClusterLayouts(new Map());
        break;
      
      case 'cluster':
        const layouts = clusterLayout(data.tasks, clusterBy);
        setClusterLayouts(layouts);
        setPositions([]); // Clear positions when using clusters
        break;
      
      case 'timeline':
        setPositions(timelineLayout(data.tasks));
        setClusterLayouts(new Map());
        break;
    }
  }, [data?.tasks, viewMode, clusterBy]);

  // Handle ESC key to unfocus cluster
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selection.focusedClusterId) {
        unfocusCluster();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection.focusedClusterId, unfocusCluster]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Failed to Load Tasks
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }

  const tasks = data?.tasks || [];

  return (
    <div className="relative">
      {/* View Mode Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ViewModeToggle />
      </div>

      {/* Timeline Slider (only in timeline mode) */}
      {viewMode === 'timeline' && <TimeSlider minDays={-60} maxDays={60} />}

      {/* Stats Display */}
      <div className="absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div>Tasks: {tasks.length}</div>
          <div>View: {viewMode}</div>
          {viewMode === 'cluster' && (
            <>
              <div>Clusters: {clusterLayouts.size}</div>
              {selection.focusedClusterId && (
                <div className="text-blue-600 font-semibold">
                  Focused: {selection.focusedClusterId}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="h-[600px] bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg overflow-hidden shadow-2xl">
        <Canvas
          shadows
          dpr={[1, 2]} // Pixel ratio for retina displays
          performance={{ min: 0.5 }} // Performance degradation threshold
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance', // T024: Performance optimization
          }}
          frameloop="demand" // T024: Only render when needed (on interaction)
        >
          {/* Camera */}
          <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={75} />
          
          {/* Camera Controls */}
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={5}
            maxDistance={50}
            maxPolarAngle={Math.PI / 2} // Prevent going below ground
            target={[0, 0, 0]}
            makeDefault // T024: Set as default controls
          />

          {/* Lighting - Optimized setup */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={1024} // T024: Reduced from 2048 for performance
            shadow-mapSize-height={1024}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />

          {/* Grid Helper (ground reference) */}
          <gridHelper args={[100, 100, '#444444', '#222222']} position={[0, -0.1, 0]} />

          {/* Timeline Axis (only in timeline mode) */}
          {viewMode === 'timeline' && (
            <TimelineAxis height={20} markerCount={7} referenceDate={new Date()} />
          )}

          {/* Render based on view mode */}
          <Suspense fallback={null}>
            {viewMode === 'cluster' && clusterLayouts.size > 0 ? (
              // Cluster mode: Render ClusterGroups
              Array.from(clusterLayouts.entries()).map(([clusterName, layout]) => {
                const cluster = clustersData?.find((c) => c.name === clusterName);
                if (!cluster) return null;

                return (
                  <ClusterGroup
                    key={clusterName}
                    cluster={cluster}
                    tasks={layout.tasks}
                    focused={
                      !selection.focusedClusterId || 
                      selection.focusedClusterId === clusterName
                    }
                    onFocus={() => focusCluster(clusterName)}
                    onUnfocus={unfocusCluster}
                  />
                );
              })
            ) : (
              // Priority/Timeline mode: Render individual TaskCards
              tasks.map((task, index) => (
                <TaskCard3D
                  key={task.id}
                  task={task}
                  position={positions[index] || new Vector3(0, 0, 0)}
                />
              ))
            )}
          </Suspense>

          {/* Performance Stats (development only) */}
          {process.env.NODE_ENV === 'development' && <Stats />}
        </Canvas>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 How to Navigate
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Rotate:</strong> Left click + drag</li>
          <li>• <strong>Pan:</strong> Right click + drag</li>
          <li>• <strong>Zoom:</strong> Scroll wheel or pinch</li>
          <li>• <strong>Select Task:</strong> Click on a task card</li>
          {viewMode === 'priority' && (
            <li>• <strong>Drag Task:</strong> Click and drag to reorder priority</li>
          )}
          {viewMode === 'cluster' && (
            <>
              <li>• <strong>Focus Cluster:</strong> Click on a cluster boundary</li>
              <li>• <strong>Unfocus:</strong> Press ESC or click focused cluster again</li>
            </>
          )}
          {viewMode === 'timeline' && (
            <>
              <li>• <strong>Navigate Time:</strong> Use slider to focus on time period</li>
              <li>• <strong>Tasks:</strong> Positioned by deadline (Y-axis) and priority (Z-axis)</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
