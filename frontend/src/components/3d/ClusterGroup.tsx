'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Group, Box3, Vector3, Mesh, BoxGeometry, EdgesGeometry } from 'three';
import { TaskCard3D } from './TaskCard3D';
import { use3DViewStore } from '@/stores/3d-view-store';
import type { Task3D, Cluster3D } from '@/types/3d';

interface ClusterGroupProps {
  cluster: Cluster3D;
  tasks: Task3D[];
  focused: boolean;
  onFocus: () => void;
  onUnfocus: () => void;
}

/**
 * ClusterGroup Component
 * 
 * Groups related tasks spatially and renders cluster boundaries.
 * Supports focus mode where clicked cluster zooms in and others fade.
 * 
 * Features:
 * - Bounding box/sphere visualization
 * - Cluster label with color coding
 * - Click to focus interaction
 * - Fade/opacity control for unfocused state
 * 
 * @example
 * <ClusterGroup
 *   cluster={{ name: 'Frontend', color: '#4CAF50', taskIds: [1,2,3], count: 3 }}
 *   tasks={tasksInCluster}
 *   focused={focusedClusterId === 'Frontend'}
 *   onFocus={() => focusCluster('Frontend')}
 *   onUnfocus={unfocusCluster}
 * />
 */
export default function ClusterGroup({
  cluster,
  tasks,
  focused,
  onFocus,
  onUnfocus,
}: ClusterGroupProps) {
  const groupRef = useRef<Group>(null);
  const boundingBoxRef = useRef<Mesh>(null);
  const selection = use3DViewStore((state) => state.selection);

  // Calculate cluster center and bounding box
  const { center, size } = useMemo(() => {
    if (tasks.length === 0) {
      return { center: new Vector3(0, 0, 0), size: new Vector3(2, 2, 2) };
    }

    const box = new Box3();
    tasks.forEach((task) => {
      // Tasks are positioned by layout algorithm
      // For now, use a simple grid within cluster
      const index = tasks.indexOf(task);
      const x = (index % 3) * 3;
      const y = Math.floor(index / 3) * 3;
      box.expandByPoint(new Vector3(x, y, 0));
    });

    const center = new Vector3();
    box.getCenter(center);
    
    const size = new Vector3();
    box.getSize(size);
    
    // Add padding
    size.addScalar(2);

    return { center, size };
  }, [tasks]);

  // Animate opacity based on focus state
  useFrame(() => {
    if (groupRef.current) {
      const targetOpacity = focused ? 1.0 : 0.3;
      groupRef.current.traverse((child) => {
        if (child instanceof Mesh && child.material) {
          const material = Array.isArray(child.material) 
            ? child.material[0] 
            : child.material;
          if (material.opacity !== undefined) {
            material.opacity += (targetOpacity - material.opacity) * 0.1;
          }
        }
      });
    }
  });

  // Handle cluster click
  const handleClusterClick = (event: any) => {
    event.stopPropagation();
    if (focused) {
      onUnfocus();
    } else {
      onFocus();
    }
  };

  // Parse color
  const clusterColor = cluster.color || '#888888';

  return (
    <group ref={groupRef} position={center}>
      {/* Cluster boundary box */}
      <mesh
        ref={boundingBoxRef}
        onClick={handleClusterClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'default';
        }}
      >
        <boxGeometry args={[size.x, size.y, size.z]} />
        <meshStandardMaterial
          color={clusterColor}
          transparent
          opacity={focused ? 0.15 : 0.05}
          wireframe={false}
          depthWrite={false}
        />
      </mesh>

      {/* Cluster boundary wireframe */}
      <lineSegments>
        <edgesGeometry attach="geometry">
          <boxGeometry args={[size.x, size.y, size.z]} />
        </edgesGeometry>
        <lineBasicMaterial
          attach="material"
          color={clusterColor}
          transparent
          opacity={focused ? 0.6 : 0.2}
        />
      </lineSegments>

      {/* Cluster label */}
      <Text
        position={[0, size.y / 2 + 1, 0]}
        fontSize={0.8}
        color={clusterColor}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {cluster.name} ({cluster.count})
      </Text>

      {/* Tasks within cluster */}
      {tasks.map((task, index) => {
        // Simple grid layout within cluster
        const x = (index % 3) * 3 - size.x / 2 + 1.5;
        const y = Math.floor(index / 3) * 3 - size.y / 2 + 1.5;
        const position = new Vector3(x, y, 0);

        return (
          <TaskCard3D
            key={task.id}
            task={task}
            position={position}
          />
        );
      })}
    </group>
  );
}
