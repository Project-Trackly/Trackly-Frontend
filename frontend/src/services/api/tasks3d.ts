/**
 * 3D Tasks API Service
 * 
 * TanStack Query hooks for fetching and mutating 3D task data.
 * Provides optimistic updates, caching, and real-time polling.
 * 
 * T015: Full implementation with API integration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tokenStorage } from '@/lib/token-storage';
import type {
  Task3D,
  Tasks3DResponse,
  Cluster3D,
  UpdateTaskPriorityRequest,
  ClusterBy,
} from '@/types/3d';

/**
 * API base URL from environment
 * Falls back to localhost for development
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

/**
 * Get authorization headers with access token
 */
function getAuthHeaders(): HeadersInit {
  const token = tokenStorage.getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

/**
 * Fetch tasks for 3D visualization
 * 
 * T015: Complete implementation with actual API endpoint
 * 
 * @param projectId - Project ID to fetch tasks for
 * @param enabled - Whether to enable the query (default: true)
 * @param page - Page number (default: 0)
 * @param size - Page size (default: 100)
 */
export function useTasks3D(
  projectId: string,
  enabled: boolean = true,
  page: number = 0,
  size: number = 100
) {
  return useQuery<Tasks3DResponse>({
    queryKey: ['tasks3d', projectId, page, size],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${projectId}/tasks/3d?page=${page}&size=${size}`,
        {
          headers: getAuthHeaders(),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch 3D tasks: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // API returns ApiResponse<Tasks3DResponse>
      // Extract the actual data from the wrapper
      if (data.success && data.data) {
        return data.data;
      }
      
      throw new Error(data.message || 'Failed to fetch 3D tasks');
    },
    enabled,
    staleTime: 30_000, // 30 seconds
    refetchInterval: enabled ? 500 : false, // Poll every 500ms when enabled
    refetchIntervalInBackground: false,
  });
}

/**
 * Update task priority with optimistic updates
 * 
 * T015: Complete implementation with rollback on error
 * 
 * @returns Mutation for updating task priority
 */
export function useUpdateTaskPriority(projectId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, priority }: UpdateTaskPriorityRequest) => {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${projectId}/tasks/${taskId}/priority`,
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ priority }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to update task priority: ${response.statusText}`);
      }
      
      return response.json();
    },
    
    // Optimistic update - update UI immediately before API call
    onMutate: async ({ taskId, priority }) => {
      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['tasks3d', projectId] });
      
      // Snapshot previous value for rollback
      const previousData = queryClient.getQueryData(['tasks3d', projectId]);
      
      // Optimistically update all matching queries
      queryClient.setQueriesData(
        { queryKey: ['tasks3d', projectId] },
        (old: Tasks3DResponse | undefined) => {
          if (!old) return old;
          
          return {
            ...old,
            tasks: old.tasks.map((task) =>
              task.id === taskId ? { ...task, priority } : task
            ),
          };
        }
      );
      
      return { previousData };
    },
    
    // Rollback on error
    onError: (err, variables, context) => {
      console.error('Failed to update task priority:', err);
      
      if (context?.previousData) {
        queryClient.setQueryData(['tasks3d', projectId], context.previousData);
      }
    },
    
    // Refetch after success to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks3d', projectId] });
    },
  });
}

/**
 * Fetch task clusters
 * 
 * T015: Complete implementation
 * 
 * @param projectId - Project ID
 * @param clusterBy - Clustering key (label, assignee, status)
 * @param enabled - Whether to enable the query
 */
export function useTaskClusters(
  projectId: string,
  clusterBy: ClusterBy,
  enabled: boolean = true
) {
  return useQuery<Cluster3D[]>({
    queryKey: ['clusters', projectId, clusterBy],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${projectId}/tasks/clusters?by=${clusterBy}`,
        {
          headers: getAuthHeaders(),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch clusters: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract data from ApiResponse wrapper
      if (data.success && data.data) {
        return data.data;
      }
      
      throw new Error(data.message || 'Failed to fetch clusters');
    },
    enabled,
    staleTime: 60_000, // 1 minute
  });
}

/**
 * Prefetch tasks for better UX
 * Call this when user is about to enter 3D view
 * 
 * T015: Prefetching support
 */
export function usePrefetchTasks3D(projectId: string) {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: ['tasks3d', projectId, 0, 100],
      queryFn: async () => {
        const response = await fetch(
          `${API_BASE_URL}/api/projects/${projectId}/tasks/3d?page=0&size=100`,
          {
            headers: getAuthHeaders(),
          }
        );
        
        const data = await response.json();
        return data.success && data.data ? data.data : null;
      },
    });
  };
}

/**
 * Invalidate all 3D task queries for a project
 * Useful after bulk operations or when data needs refresh
 */
export function useInvalidateTasks3D() {
  const queryClient = useQueryClient();
  
  return (projectId: string) => {
    queryClient.invalidateQueries({ queryKey: ['tasks3d', projectId] });
    queryClient.invalidateQueries({ queryKey: ['clusters', projectId] });
  };
}

