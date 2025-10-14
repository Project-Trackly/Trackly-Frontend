# Trackly Frontend

Next.js 기반 사용자/관리자 웹 애플리케이션을 Turborepo 형태로 관리합니다. `platform` 상위 프로젝트에서 프론트엔드 서브모듈로 포함하여 사용합니다.

## 모듈 구성

```
Trackly-Frontend/
├── frontend/            # 사용자 웹앱 (Next.js 14 App Router)
├── frontend-admin/      # 관리자 콘솔 (Next.js + Chakra UI)
├── packages/ui/         # 공유 UI 패키지 (@repo/ui)
└── ...
```

## 공통 명령

```bash
pnpm install
pnpm dev                # 모든 앱 개발 서버 실행
pnpm dev:web            # 사용자 웹앱만 실행 (포트 3000)
pnpm dev:admin          # 관리자 콘솔만 실행 (포트 3101)
pnpm build              # 전체 빌드
pnpm lint               # 린트 실행
```

## 3D Task Visualization (T043)

3D 태스크 시각화 기능이 추가되었습니다. React Three Fiber와 @react-three/drei를 사용하여 WebGL 기반 3D 뷰를 제공합니다.

### 기술 스택
- **3D 렌더링**: React Three Fiber ^8.15.0, @react-three/drei ^9.92.0, Three.js ^0.160.0
- **상태 관리**: Zustand ^4.4.7 (클라이언트 상태), TanStack Query v5 (서버 상태)
- **애니메이션**: Framer Motion ^11.2.10
- **타입**: TypeScript strict mode, @types/three

### 3D 개발 환경 설정

```bash
# 1. 의존성 확인 (이미 설치됨)
cd frontend
pnpm list @react-three/fiber @react-three/drei zustand @tanstack/react-query

# 2. 개발 서버 실행
pnpm dev:web

# 3. 3D 뷰 접속
# http://localhost:3000/projects/[projectId]/3d
```

### 주요 컴포넌트

```typescript
// 3D 컴포넌트 import
import {
  TaskVisualization3D,  // 메인 3D 컨테이너
  TaskCard3D,           // 개별 태스크 카드
  WebGLDetector,        // WebGL 감지 + Fallback
  FallbackView2D,       // 2D 테이블 뷰
} from '@/components/3d';

// State Management
import { use3DViewStore } from '@/stores/3d-view-store';

// API Hooks
import { useTasks3D, useUpdateTaskPriority } from '@/services/api/tasks3d';

// Layout Algorithms
import { priorityLayout, clusterLayout, timelineLayout } from '@/lib/3d/layouts';
```

### 개발 가이드

**3D 컴포넌트 추가하기**:
```typescript
// src/components/3d/MyCustom3D.tsx
'use client';
import { useFrame } from '@react-three/fiber';

export function MyCustom3D() {
  useFrame(() => {
    // 60 FPS 렌더링 루프
  });
  
  return (
    <mesh>
      <boxGeometry />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}
```

**성능 최적화 팁**:
- `next/dynamic`으로 3D 컴포넌트 동적 로딩 (SSR 비활성화)
- `frameloop="demand"` 사용 (인터랙션 시에만 렌더)
- InstancedMesh 활용 (동일 geometry 재사용)
- LOD (Level of Detail) 적용
- Throttle 함수로 API 호출 제한

**WebGL 요구사항**:
- WebGL 2.0 권장 (WebGL 1.0 fallback 지원)
- 최소 브라우저: Chrome 56+, Firefox 51+, Safari 15+, Edge 79+
- WebGL 미지원 시 자동으로 2D 테이블 뷰로 전환

### 트러블슈팅

**문제: "Module not found: three"**
```bash
pnpm add three @types/three
```

**문제: "Canvas is not defined (SSR error)"**
```typescript
// next/dynamic으로 import
const TaskVisualization3D = dynamic(
  () => import('@/components/3d/TaskVisualization3D'),
  { ssr: false }
);
```

**문제: 낮은 FPS (< 30)**
- `frameloop="demand"` 추가
- Shadow map 크기 줄이기 (2048 → 1024)
- 태스크 개수 제한 (100개 이하 권장)
- 개발 모드 Stats로 병목 확인

## 프런트엔드와 백엔드 연동

- 환경 변수: 각 앱의 `.env.local` 파일에 `NEXT_PUBLIC_API_BASE_URL` 등을 설정하여 백엔드 API와 통신합니다.
- 워크스페이스/온보딩 UI는 백엔드 REST API (`/api/onboarding`, `/api/workspaces`, `/api/workspaces/{id}/projects`)를 호출합니다. 응답 형식은 `ApiResponse<T>`에 맞춰 구현되어 있습니다.
- **3D API**: `/api/projects/{id}/tasks/3d` (태스크 조회), `/api/projects/{id}/tasks/{taskId}/priority` (우선순위 업데이트), `/api/projects/{id}/tasks/clusters` (클러스터링)

## 배포 메모

- Turborepo 구조를 유지하면서 Vercel에 각각 배포합니다 (`frontend/` → 사용자 웹, `frontend-admin/` → 관리자 콘솔).
- Node.js ≥ 20.x, pnpm ≥ 10.x 사용을 권장합니다.
- **Bundle Size**: 3D 라이브러리 포함 시 약 168KB gzipped (200KB 예산의 84%)

자세한 개발 지침은 `Trackly-Frontend/AGENTS.md`를 참고하세요.
