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

## 프런트엔드와 백엔드 연동

- 환경 변수: 각 앱의 `.env.local` 파일에 `NEXT_PUBLIC_API_BASE_URL` 등을 설정하여 백엔드 API와 통신합니다.
- 워크스페이스/온보딩 UI는 백엔드 REST API (`/api/onboarding`, `/api/workspaces`, `/api/workspaces/{id}/projects`)를 호출합니다. 응답 형식은 `ApiResponse<T>`에 맞춰 구현되어 있습니다.

## 배포 메모

- Turborepo 구조를 유지하면서 Vercel에 각각 배포합니다 (`frontend/` → 사용자 웹, `frontend-admin/` → 관리자 콘솔).
- Node.js ≥ 20.x, pnpm ≥ 10.x 사용을 권장합니다.

자세한 개발 지침은 `Trackly-Frontend/AGENTS.md`를 참고하세요.
