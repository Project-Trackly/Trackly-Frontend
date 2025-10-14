/**
 * General Task Type Definitions
 * 
 * Type definitions for task management (non-3D)
 */

export interface Task {
  id: number | string;
  title: string;
  description?: string;
  priority: number; // 0-100
  status: TaskStatus;
  dueDate?: string; // ISO 8601 date string
  assignee?: string;
  assigneeId?: string;
  labels?: string[];
  createdAt?: string;
  updatedAt?: string;
  projectId?: string | number;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: number;
  dueDate?: string;
  assignee?: string;
  labels?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: number;
  status?: TaskStatus;
  dueDate?: string;
  assignee?: string;
  labels?: string[];
}

export interface TasksResponse {
  tasks: Task[];
  totalCount: number;
  page: number;
  pageSize: number;
}
