/**
 * 3D Components
 * 
 * This directory contains all 3D visualization components for task management.
 * Components are built using React Three Fiber and @react-three/drei.
 */

// WebGL detection and fallback (T017)
export { WebGLDetector, useWebGLCapability } from './WebGLDetector';
export { FallbackView2D } from './FallbackView2D';

// Main 3D visualization (T018-T024 - Phase 3 MVP)
export { TaskVisualization3D } from './TaskVisualization3D';
export { TaskCard3D } from './TaskCard3D';
export { CameraControls } from './CameraControls';
export { ViewModeToggle } from './ViewModeToggle';

// Cluster components (Phase 4)
export { default as ClusterGroup } from './ClusterGroup';

// Timeline components (Phase 5)
export { TimelineAxis } from './TimelineAxis';
export { TimeSlider } from './TimeSlider';

