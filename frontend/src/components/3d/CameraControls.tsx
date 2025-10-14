/**
 * CameraControls Component
 * 
 * T022: Camera controls wrapper with Zustand integration
 * T034: Added timeline mode camera navigation
 * Wraps @react-three/drei OrbitControls and syncs with store
 */

'use client';

import { useEffect, useRef } from 'react';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { use3DViewStore } from '@/stores/3d-view-store';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';

/**
 * CameraControls Component
 * 
 * Provides orbit controls for the 3D camera with state persistence.
 * Syncs camera position with Zustand store for persistence across sessions.
 * Animates camera to time range position in timeline mode.
 */
export function CameraControls() {
  const controlsRef = useRef<OrbitControlsType>(null);
  const { camera } = useThree();
  const { 
    setCameraPosition, 
    setCameraTarget, 
    viewMode, 
    selectedTimeRange 
  } = use3DViewStore();

  // Animation state for smooth transitions
  const animationRef = useRef<{
    active: boolean;
    startPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endPos: THREE.Vector3;
    endTarget: THREE.Vector3;
    progress: number;
  } | null>(null);

  // Effect: Animate camera when time range changes in timeline mode
  useEffect(() => {
    if (viewMode !== 'timeline' || !selectedTimeRange || !controlsRef.current) {
      return;
    }

    // Calculate target Y position from time range
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const midTime = (selectedTimeRange.start.getTime() + selectedTimeRange.end.getTime()) / 2;
    const daysFromNow = (midTime - now) / dayMs;
    const targetY = daysFromNow * 2; // 1 unit = 0.5 days

    // Setup animation
    const startPos = camera.position.clone();
    const startTarget = controlsRef.current.target.clone();
    const endPos = new THREE.Vector3(0, targetY, 10); // Keep X and Z constant
    const endTarget = new THREE.Vector3(0, targetY, 0);

    animationRef.current = {
      active: true,
      startPos,
      startTarget,
      endPos,
      endTarget,
      progress: 0,
    };
  }, [viewMode, selectedTimeRange, camera]);

  // Sync camera position to store (throttled)
  let lastUpdate = 0;
  useFrame((_, delta) => {
    // Handle animation
    if (animationRef.current?.active) {
      const anim = animationRef.current;
      anim.progress += delta; // Increase by frame time

      const t = Math.min(anim.progress, 1); // Clamp to [0, 1]
      const easedT = easeInOutCubic(t); // Smooth easing

      // Interpolate camera position and target
      camera.position.lerpVectors(anim.startPos, anim.endPos, easedT);
      
      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(
          anim.startTarget,
          anim.endTarget,
          easedT
        );
        controlsRef.current.update();
      }

      // Complete animation
      if (t >= 1) {
        animationRef.current.active = false;
      }
    }

    // Store sync (every second)
    const now = Date.now();
    if (now - lastUpdate < 1000) return;
    lastUpdate = now;

    if (controlsRef.current) {
      const pos = camera.position;
      const target = controlsRef.current.target;
      
      setCameraPosition([pos.x, pos.y, pos.z]);
      setCameraTarget([target.x, target.y, target.z]);
    }
  });

  return (
    <DreiOrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={5}
      maxDistance={50}
      maxPolarAngle={Math.PI / 2} // Prevent going below ground
      target={[0, 0, 0]}
      // Keyboard controls
      keys={{
        LEFT: 'ArrowLeft',
        UP: 'ArrowUp',
        RIGHT: 'ArrowRight',
        BOTTOM: 'ArrowDown',
      }}
      keyPanSpeed={10}
    />
  );
}

/**
 * Easing function for smooth animation
 * @param t Progress [0, 1]
 * @returns Eased value [0, 1]
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
