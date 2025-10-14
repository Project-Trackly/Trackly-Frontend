'use client';

import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface TimelineAxisProps {
  /** Height of the timeline axis in 3D units */
  height?: number;
  /** Number of date markers to display */
  markerCount?: number;
  /** Current date reference point (defaults to now) */
  referenceDate?: Date;
}

/**
 * TimelineAxis Component
 * 
 * Renders a Y-axis timeline with date markers showing past, present, and future.
 * Visualizes temporal progression with gradient color coding.
 * 
 * @component
 * @example
 * ```tsx
 * <TimelineAxis height={20} markerCount={7} />
 * ```
 */
export function TimelineAxis({
  height = 20,
  markerCount = 7,
  referenceDate = new Date(),
}: TimelineAxisProps) {
  // Generate date markers with positions and labels
  const markers = useMemo(() => {
    const markers: Array<{ y: number; label: string; date: Date; color: string }> = [];
    const halfHeight = height / 2;
    
    // Calculate days per unit (1 unit = 0.5 days)
    const daysPerUnit = 0.5;
    const msPerUnit = daysPerUnit * 24 * 60 * 60 * 1000;
    
    // Generate markers evenly distributed along Y-axis
    for (let i = 0; i < markerCount; i++) {
      const t = i / (markerCount - 1); // 0 to 1
      const y = THREE.MathUtils.lerp(-halfHeight, halfHeight, t);
      
      // Calculate date for this position
      const dateMs = referenceDate.getTime() + (y * msPerUnit);
      const date = new Date(dateMs);
      
      // Generate relative time label
      const label = getRelativeTimeLabel(date, referenceDate);
      
      // Color gradient: past (gray) -> present (white) -> future (blue)
      const color = getTimeColor(y, halfHeight);
      
      markers.push({ y, label, date, color });
    }
    
    return markers;
  }, [height, markerCount, referenceDate]);

  // Create axis line geometry
  const linePoints = useMemo(() => {
    const halfHeight = height / 2;
    return [
      new THREE.Vector3(0, -halfHeight, 0),
      new THREE.Vector3(0, halfHeight, 0),
    ];
  }, [height]);

  return (
    <group name="timeline-axis">
      {/* Main Y-axis line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={linePoints.length}
            array={new Float32Array(linePoints.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#4a5568" linewidth={2} />
      </line>

      {/* Date markers */}
      {markers.map((marker, index) => (
        <group key={index} position={[0, marker.y, 0]}>
          {/* Marker tick */}
          <mesh position={[0.5, 0, 0]}>
            <boxGeometry args={[0.3, 0.05, 0.05]} />
            <meshBasicMaterial color={marker.color} />
          </mesh>

          {/* Date label */}
          <Text
            position={[1.5, 0, 0]}
            fontSize={0.3}
            color={marker.color}
            anchorX="left"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {marker.label}
          </Text>
        </group>
      ))}

      {/* "NOW" indicator at Y=0 */}
      <group position={[0, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <Text
          position={[1.5, 0, 0]}
          fontSize={0.4}
          color="#ffffff"
          anchorX="left"
          anchorY="middle"
          fontWeight="bold"
          outlineWidth={0.03}
          outlineColor="#000000"
        >
          오늘
        </Text>
      </group>
    </group>
  );
}

/**
 * Generate relative time label in Korean
 * @param date Target date
 * @param reference Reference date (usually now)
 * @returns Korean relative time string (e.g., "2주 전", "3일 후")
 */
function getRelativeTimeLabel(date: Date, reference: Date): string {
  const diffMs = date.getTime() - reference.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  
  if (diffDays === 0) return '오늘';
  
  const isPast = diffDays < 0;
  const absDays = Math.abs(diffDays);
  
  // Format based on time scale
  if (absDays < 7) {
    return `${absDays}일 ${isPast ? '전' : '후'}`;
  } else if (absDays < 30) {
    const weeks = Math.round(absDays / 7);
    return `${weeks}주 ${isPast ? '전' : '후'}`;
  } else if (absDays < 365) {
    const months = Math.round(absDays / 30);
    return `${months}개월 ${isPast ? '전' : '후'}`;
  } else {
    const years = Math.round(absDays / 365);
    return `${years}년 ${isPast ? '전' : '후'}`;
  }
}

/**
 * Calculate color based on Y position
 * Gradient: past (gray #718096) -> present (white #ffffff) -> future (blue #4299e1)
 * 
 * @param y Y position on axis
 * @param maxY Maximum Y value (half of axis height)
 * @returns Hex color string
 */
function getTimeColor(y: number, maxY: number): string {
  const normalizedY = y / maxY; // -1 to 1
  
  if (normalizedY < 0) {
    // Past: interpolate from gray to white
    const t = (normalizedY + 1); // 0 (far past) to 1 (now)
    return lerpColor('#718096', '#ffffff', t);
  } else {
    // Future: interpolate from white to blue
    const t = normalizedY; // 0 (now) to 1 (far future)
    return lerpColor('#ffffff', '#4299e1', t);
  }
}

/**
 * Linear interpolation between two hex colors
 * @param color1 Start color (hex)
 * @param color2 End color (hex)
 * @param t Interpolation factor (0-1)
 * @returns Interpolated hex color
 */
function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = new THREE.Color(color1);
  const c2 = new THREE.Color(color2);
  const result = c1.lerp(c2, t);
  return `#${result.getHexString()}`;
}
