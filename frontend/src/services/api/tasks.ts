/**
 * Task API Service
 * 
 * API functions and React Query hooks for task management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest,
  TasksResponse 
} from '@/types/task';

/**
 * Fetch tasks for a project
 */
export function useTasks(projectId: string, page: number = 0, size: number = 50) {
  return useQuery<TasksResponse>({
    queryKey: ['tasks', projectId, page, size],
    queryFn: async () => {
      const response = await apiFetch(
        `/api/projects/${projectId}/tasks?page=${page}&size=${size}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle ApiResponse wrapper
      if (data.success && data.data) {
        return data.data;
      }

      throw new Error(data.message || 'Failed to fetch tasks');
    },
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Create a new task
 */
export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: CreateTaskRequest) => {
      const response = await apiFetch(
        `/api/projects/${projectId}/tasks`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.statusText}`);
      }

      return response.json();
    },

    onSuccess: () => {
      // Invalidate and refetch tasks
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks3d', projectId] });
    },

    onError: (error) => {
      console.error('Failed to create task:', error);
    },
  });
}

/**
 * Update an existing task
 */
export function useUpdateTask(projectId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: UpdateTaskRequest) => {
      const response = await apiFetch(
        `/api/projects/${projectId}/tasks/${taskId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.statusText}`);
      }

      return response.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks3d', projectId] });
    },

    onError: (error) => {
      console.error('Failed to update task:', error);
    },
  });
}

/**
 * Delete a task
 */
export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiFetch(
        `/api/projects/${projectId}/tasks/${taskId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.statusText}`);
      }

      return response.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks3d', projectId] });
    },

    onError: (error) => {
      console.error('Failed to delete task:', error);
    },
  });
}
