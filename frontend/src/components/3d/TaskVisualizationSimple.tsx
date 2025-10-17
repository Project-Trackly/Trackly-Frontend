/**
 * TaskVisualizationSimple Component
 * 
 * 단순화된 버전의 3D 태스크 시각화 컴포넌트
 * 기본 기능만 포함하여 디버깅용으로 사용
 */

'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

interface TaskVisualizationSimpleProps {
  projectId: string;
}

// 임시 태스크 데이터
const mockTasks = [
  { id: 1, title: 'Task 1', priority: 80, position: [0, 0, 0] as [number, number, number] },
  { id: 2, title: 'Task 2', priority: 60, position: [2, 1, 0] as [number, number, number] },
  { id: 3, title: 'Task 3', priority: 40, position: [-2, -1, 0] as [number, number, number] },
];

function TaskBox({ task, position }: { task: any; position: [number, number, number] }) {
  const getPriorityColor = (priority: number) => {
    if (priority >= 70) return '#EF4444'; // Red
    if (priority >= 50) return '#F59E0B'; // Amber
    return '#10B981'; // Green
  };

  return (
    <mesh position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={getPriorityColor(task.priority)} />
    </mesh>
  );
}

export function TaskVisualizationSimple({ projectId }: TaskVisualizationSimpleProps) {
  return (
    <div className="h-[600px] bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg overflow-hidden shadow-2xl">
      <Canvas>
        {/* 카메라 */}
        <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={75} />
        
        {/* 카메라 컨트롤 */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={50}
        />

        {/* 조명 */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
        />

        {/* 그리드 */}
        <gridHelper args={[20, 20, '#444444', '#222222']} position={[0, -2, 0]} />

        {/* 태스크 박스들 */}
        {mockTasks.map((task) => (
          <TaskBox key={task.id} task={task} position={task.position} />
        ))}
      </Canvas>
      
      <div className="p-4 text-white">
        <h3 className="text-lg font-semibold mb-2">
          Project {projectId} - 3D Task View (Simplified)
        </h3>
        <p className="text-sm text-gray-300">
          ✅ 기본 3D 렌더링 성공! {mockTasks.length}개의 태스크를 표시하고 있습니다.
        </p>
      </div>
    </div>
  );
}
