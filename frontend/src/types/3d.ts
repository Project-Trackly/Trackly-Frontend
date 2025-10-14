/**
 * 3D Task Visualization Type Definitions
 * 
 * This file contains TypeScript interfaces and types for the 3D task visualization feature.
 */

import { Vector3 } from 'three';

/**
 * Task representation for 3D visualization
 */
export interface Task3D {
  id: string;
  title: string;
  description?: string;
  priority: number;  // Higher number = higher priority
  status: TaskStatus;
  labels: string[];
  deadline?: string; // ISO 8601 datetime string
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Task status enum
 */
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

/**
 * Cluster representation for grouping tasks
 */
export interface Cluster3D {
  id: string;
  name: string;
  color: string;
  taskIds: string[];
  count: number;
}

/**
 * 3D Camera state
 */
export interface Camera3DState {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
}

/**
 * View mode for 3D visualization
 */
export type ViewMode3D = 'priority' | 'cluster' | 'timeline';

/**
 * Selection state in 3D view
 */
export interface Selection3DState {
  selectedTaskIds: string[];
  focusedClusterId: string | null;
}

/**
 * User preferences for 3D view
 */
export interface ViewPreferences3D {
  showLabels: boolean;
  animationSpeed: number; // 0.5 = slow, 1 = normal, 2 = fast
  enableShadows: boolean;
  enableAntialiasing: boolean;
}

/**
 * Time range for timeline view
 */
export interface TimeRange3D {
  start: Date;
  end: Date;
}

/**
 * 3D View Store state (Zustand)
 */
export interface View3DStore {
  // State
  camera: Camera3DState;
  selection: Selection3DState;
  viewMode: ViewMode3D;
  preferences: ViewPreferences3D;
  selectedTimeRange: TimeRange3D | null;
  
  // Actions
  setCameraPosition: (position: [number, number, number]) => void;
  setCameraTarget: (target: [number, number, number]) => void;
  setZoom: (zoom: number) => void;
  selectTasks: (taskIds: string[]) => void;
  toggleTaskSelection: (taskId: string) => void;
  clearSelection: () => void;
  focusCluster: (clusterId: string | null) => void;
  unfocusCluster: () => void;
  setViewMode: (mode: ViewMode3D) => void;
  updatePreferences: (preferences: Partial<ViewPreferences3D>) => void;
  setSelectedTimeRange: (range: TimeRange3D | null) => void;
  resetView: () => void;
}

/**
 * Layout algorithm function type
 */
export type LayoutAlgorithm = (tasks: Task3D[]) => Vector3[];

/**
 * Cluster layout result
 */
export interface ClusterLayout {
  clusterName: string;
  positions: Vector3[];
  tasks: Task3D[];
}

/**
 * API response for tasks 3D endpoint
 */
export interface Tasks3DResponse {
  tasks: Task3D[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * API request for updating task priority
 */
export interface UpdateTaskPriorityRequest {
  taskId: string;
  priority: number;
}

/**
 * Cluster options for API request
 */
export type ClusterBy = 'label' | 'milestone' | 'assignee' | 'status';

/**
 * WebGL capability detection result
 */
export interface WebGLCapability {
  hasWebGL: boolean;
  hasWebGL2: boolean;
  renderer?: string;
  version?: string;
}
