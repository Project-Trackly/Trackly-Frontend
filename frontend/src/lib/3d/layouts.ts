/**
 * 3D Layout Algorithms
 * 
 * This file contains layout algorithms for positioning tasks in 3D space.
 * Each algorithm corresponds to a different view mode (priority, cluster, timeline).
 * 
 * T016: Complete implementation with research-based algorithms
 */

import { Vector3 } from 'three';
import type { Task3D, ClusterBy, ClusterLayout } from '@/types/3d';

/**
 * Priority Layout Algorithm
 * 
 * Positions tasks along the Z-axis based on priority.
 * Higher priority tasks are positioned closer to the camera (negative Z).
 * Tasks are arranged in a grid pattern on the X-Y plane.
 * 
 * @param tasks - Array of tasks to layout
 * @returns Array of Vector3 positions corresponding to each task
 */
export function priorityLayout(tasks: Task3D[]): Vector3[] {
  // Sort by priority (descending)
  const sorted = [...tasks].sort((a, b) => b.priority - a.priority);
  
  const positions: Vector3[] = [];
  const gridWidth = 10; // Number of tasks per row
  const spacingX = 3; // Horizontal spacing between tasks
  const spacingY = 2; // Vertical spacing between rows
  const spacingZ = 2; // Depth spacing for priority
  
  sorted.forEach((task, index) => {
    const row = Math.floor(index / gridWidth);
    const col = index % gridWidth;
    
    const x = (col - gridWidth / 2) * spacingX;
    const y = -row * spacingY; // Lower rows go down
    const z = -index * spacingZ; // Higher priority closer (more negative Z)
    
    positions.push(new Vector3(x, y, z));
  });
  
  return positions;
}

/**
 * Cluster Layout Algorithm
 * 
 * Groups tasks spatially based on a clustering key (label, milestone, assignee).
 * Each cluster is positioned in a separate region of 3D space.
 * Tasks within a cluster are arranged in a grid.
 * 
 * @param tasks - Array of tasks to layout
 * @param clusterBy - Key to cluster by ('label' | 'milestone' | 'assignee' | 'status')
 * @returns Map of cluster names to ClusterLayout objects
 */
export function clusterLayout(
  tasks: Task3D[],
  clusterBy: ClusterBy
): Map<string, ClusterLayout> {
  // Group tasks by clustering key
  const clusters = new Map<string, Task3D[]>();
  
  tasks.forEach((task) => {
    let key: string;
    
    switch (clusterBy) {
      case 'label':
        // Use first label or 'uncategorized'
        key = task.labels.length > 0 ? task.labels[0] : 'uncategorized';
        break;
      case 'assignee':
        key = task.assignee?.name || 'unassigned';
        break;
      case 'status':
        key = task.status;
        break;
      case 'milestone':
        // TODO: Add milestone field to Task3D when backend supports it
        key = 'default';
        break;
      default:
        key = 'uncategorized';
    }
    
    if (!clusters.has(key)) {
      clusters.set(key, []);
    }
    clusters.get(key)!.push(task);
  });
  
  // Layout each cluster in 3D space
  const layouts = new Map<string, ClusterLayout>();
  let clusterX = 0;
  const clusterSpacing = 12; // Spacing between clusters
  const taskSpacing = 2; // Spacing between tasks within cluster
  const gridWidth = 5; // Tasks per row within cluster
  
  clusters.forEach((clusterTasks, clusterName) => {
    const positions: Vector3[] = [];
    
    clusterTasks.forEach((task, index) => {
      const row = Math.floor(index / gridWidth);
      const col = index % gridWidth;
      
      const x = clusterX + (col - gridWidth / 2) * taskSpacing;
      const y = -row * taskSpacing;
      const z = 0; // All clusters on same Z plane
      
      positions.push(new Vector3(x, y, z));
    });
    
    layouts.set(clusterName, {
      clusterName,
      positions,
      tasks: clusterTasks,
    });
    
    clusterX += clusterSpacing; // Move to next cluster position
  });
  
  return layouts;
}

/**
 * Timeline Layout Algorithm
 * 
 * Positions tasks along the Y-axis based on deadline (time).
 * Past tasks are below, future tasks are above, current tasks in the middle.
 * Priority still affects Z-axis depth.
 * 
 * @param tasks - Array of tasks to layout
 * @returns Array of Vector3 positions corresponding to each task
 */
export function timelineLayout(tasks: Task3D[]): Vector3[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const positions: Vector3[] = [];
  
  tasks.forEach((task) => {
    // Calculate Y position based on deadline
    let y = 0;
    if (task.deadline) {
      const deadlineMs = new Date(task.deadline).getTime();
      const daysFromNow = (deadlineMs - now) / dayMs;
      y = daysFromNow * 2; // 1 unit = 0.5 days
    }
    
    // X position with slight random variation for visual clarity
    const x = (Math.random() - 0.5) * 10;
    
    // Z position based on priority
    const z = -task.priority * 0.5;
    
    positions.push(new Vector3(x, y, z));
  });
  
  return positions;
}

/**
 * Calculate bounding box for a set of positions
 * Useful for camera positioning and frustum culling
 */
export function calculateBounds(positions: Vector3[]): {
  min: Vector3;
  max: Vector3;
  center: Vector3;
  size: Vector3;
} {
  if (positions.length === 0) {
    const zero = new Vector3(0, 0, 0);
    return { min: zero, max: zero, center: zero, size: zero };
  }
  
  const min = new Vector3(Infinity, Infinity, Infinity);
  const max = new Vector3(-Infinity, -Infinity, -Infinity);
  
  positions.forEach((pos) => {
    min.x = Math.min(min.x, pos.x);
    min.y = Math.min(min.y, pos.y);
    min.z = Math.min(min.z, pos.z);
    
    max.x = Math.max(max.x, pos.x);
    max.y = Math.max(max.y, pos.y);
    max.z = Math.max(max.z, pos.z);
  });
  
  const center = new Vector3(
    (min.x + max.x) / 2,
    (min.y + max.y) / 2,
    (min.z + max.z) / 2
  );
  
  const size = new Vector3(
    max.x - min.x,
    max.y - min.y,
    max.z - min.z
  );
  
  return { min, max, center, size };
}
