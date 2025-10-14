/**
 * TaskCard3D Component
 * 
 * T020: Individual 3D task card mesh
 * T021: Drag-and-drop priority updates
 * T036: Timeline period highlighting
 */

'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import { useUpdateTaskPriority } from '@/services/api/tasks3d';
import { use3DViewStore } from '@/stores/3d-view-store';
import { throttle } from '@/lib/3d/performance';
import type { Task3D } from '@/types/3d';
import type { Vector3 as Vector3Type } from 'three';
import { Mesh, Vector3 } from 'three';

interface TaskCard3DProps {
  task: Task3D;
  position: Vector3Type;
}

/**
 * Get color based on task priority
 */
function getPriorityColor(priority: number): string {
  if (priority >= 75) return '#EF4444'; // Red (high priority)
  if (priority >= 50) return '#F59E0B'; // Amber (medium)
  return '#10B981'; // Green (low priority)
}

/**
 * Get color based on task status
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'TODO':
      return '#6B7280'; // Gray
    case 'IN_PROGRESS':
      return '#3B82F6'; // Blue
    case 'IN_REVIEW':
      return '#8B5CF6'; // Purple
    case 'DONE':
      return '#10B981'; // Green
    case 'BLOCKED':
      return '#EF4444'; // Red
    default:
      return '#9CA3AF'; // Gray
  }
}

/**
 * TaskCard3D Component
 * 
 * Renders a single task as a 3D card with hover effects and drag-and-drop.
 */
export function TaskCard3D({ task, position }: TaskCard3DProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const { selectedTaskIds, selectTasks, viewMode, selectedTimeRange } = use3DViewStore((state) => ({
    selectedTaskIds: state.selection.selectedTaskIds,
    selectTasks: state.selectTasks,
    viewMode: state.viewMode,
    selectedTimeRange: state.selectedTimeRange,
  }));
  
  const updatePriority = useUpdateTaskPriority(task.id.split('-')[0]); // Extract projectId
  const isSelected = selectedTaskIds.includes(task.id);

  // Timeline mode: Check if task is within selected time range
  const isInTimeRange = useMemo(() => {
    if (viewMode !== 'timeline' || !selectedTimeRange || !task.deadline) {
      return true; // Default to visible if not in timeline mode
    }

    const taskDeadline = new Date(task.deadline).getTime();
    const rangeStart = selectedTimeRange.start.getTime();
    const rangeEnd = selectedTimeRange.end.getTime();

    return taskDeadline >= rangeStart && taskDeadline <= rangeEnd;
  }, [viewMode, selectedTimeRange, task.deadline]);

  // Animate card on hover and time range highlight
  useFrame(() => {
    if (!meshRef.current) return;
    
    if (hovered || isSelected) {
      meshRef.current.scale.lerp(new Vector3(1.1, 1.1, 1.1), 0.1);
    } else {
      meshRef.current.scale.lerp(new Vector3(1, 1, 1), 0.1);
    }
  });

  // Throttled priority update to avoid excessive API calls
  const throttledUpdatePriority = throttle((newPriority: number) => {
    updatePriority.mutate({
      taskId: task.id,
      priority: Math.max(0, Math.min(100, newPriority)),
    });
  }, 500);

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectTasks(isSelected ? [] : [task.id]);
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setIsDragging(true);
    (e.target as any).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging) return;
    e.stopPropagation();

    // Calculate new priority based on Z position
    // Z position ranges from -100 to 0, map to priority 0-100
    const newZ = e.point.z;
    const newPriority = Math.round((Math.abs(newZ) / 100) * 100);
    
    // Update position immediately for visual feedback
    if (meshRef.current) {
      meshRef.current.position.z = newZ;
    }

    // Throttled API call
    throttledUpdatePriority(newPriority);
  };

  const handlePointerUp = (e: any) => {
    if (!isDragging) return;
    e.stopPropagation();
    setIsDragging(false);
    (e.target as any).releasePointerCapture(e.pointerId);
  };

  const color = getPriorityColor(task.priority);
  const statusColor = getStatusColor(task.status);

  // Adjust opacity and brightness based on time range (timeline mode)
  const cardOpacity = isInTimeRange ? 1 : 0.3;
  const cardEmissiveIntensity = isInTimeRange ? 0.2 : 0;

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
      receiveShadow
    >
      {/* Card Base */}
      <boxGeometry args={[2, 1.5, 0.1]} />
      <meshStandardMaterial
        color={isSelected ? '#3B82F6' : color}
        opacity={isDragging ? 0.7 : cardOpacity}
        transparent
        roughness={0.3}
        metalness={0.1}
        emissive={isInTimeRange ? color : '#000000'}
        emissiveIntensity={cardEmissiveIntensity}
      />

      {/* Priority Badge */}
      <mesh position={[0.8, 0.6, 0.06]}>
        <circleGeometry args={[0.15, 16]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>

      {/* Task Title (3D Text) */}
      <Text
        position={[0, 0.3, 0.06]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
        textAlign="center"
      >
        {task.title}
      </Text>

      {/* Priority Number */}
      <Text
        position={[0, -0.1, 0.06]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="bold"
      >
        P{task.priority}
      </Text>

      {/* Labels */}
      {task.labels.length > 0 && (
        <Text
          position={[0, -0.5, 0.06]}
          fontSize={0.1}
          color="#D1D5DB"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.8}
        >
          {task.labels.slice(0, 2).join(', ')}
        </Text>
      )}

      {/* Hover Details (HTML Overlay) */}
      {hovered && (
        <Html
          position={[0, 1, 0]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 min-w-[200px] max-w-[300px] border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm">
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">Priority: {task.priority}</span>
              <span>•</span>
              <span>{task.status}</span>
            </div>
            {task.assignee && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                👤 {task.assignee.name}
              </div>
            )}
            {task.deadline && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                📅 {new Date(task.deadline).toLocaleDateString()}
              </div>
            )}
          </div>
        </Html>
      )}
    </mesh>
  );
}
