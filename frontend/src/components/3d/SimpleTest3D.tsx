/**
 * Simple 3D Test Component
 * 
 * 기본적인 Three.js 기능을 테스트하기 위한 간단한 컴포넌트
 */

'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Mesh } from 'three';

function RotatingBox() {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}

export function SimpleTest3D() {
  return (
    <div className="w-full h-[400px] bg-gray-900 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        {/* 조명 */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* 회전하는 박스 */}
        <RotatingBox />
        
        {/* 카메라 컨트롤 */}
        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>
      
      <div className="p-4 text-white">
        <p className="text-sm">
          ✅ Three.js 기본 테스트: 회전하는 박스가 보이면 성공!
        </p>
      </div>
    </div>
  );
}
