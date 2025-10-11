# Trackly Frontend Agent Notes

Next.js 기반 사용자 웹앱과 관리자 콘솔을 위한 개발 메모입니다. Turborepo 루트의 README는 개요만 다루므로, 세부 개발 지침은 이 문서를 참고하세요.

## 워크스페이스 구조

```
frontend/            # 사용자 웹앱 (Next.js 14 App Router)
frontend-admin/      # 관리자 콘솔 (Next.js + Chakra UI + shadcn/ui)
packages/ui/         # 공유 UI 컴포넌트 패키지 (@repo/ui)
```

## UI 스택

- **shadcn/ui** 패턴 + Tailwind CSS + Radix UI 프리미티브
- **Chakra UI**: 관리자 대시보드 KPI(Stat) 등 일부 구성 요소에서 사용
- **lucide-react** 아이콘, `tailwindcss-animate`, `class-variance-authority`

## 공통 명령

```bash
pnpm install            # 의존성 설치
pnpm dev                # 모든 앱 개발 서버 실행
pnpm dev:web            # 사용자 웹앱만 실행 (기본 3000)
pnpm dev:admin          # 관리자 콘솔만 실행 (기본 3101)
pnpm build              # 전체 빌드
pnpm lint               # 린트 전체 실행
```

각 앱의 `package.json`에도 `dev`, `build`, `lint` 스크립트가 정의되어 있습니다.

## 환경 변수

| 위치 | 주요 변수 |
| ---- | --------- |
| `frontend/.env.local` | `NEXT_PUBLIC_API_BASE_URL` *(백엔드 API 루트)* |
| `frontend-admin/.env.local` | `NEXT_PUBLIC_API_BASE_URL`, 필요시 `ADMIN_BASE_URL` *(백엔드 CORS 허용용)* |

## 개발 메모

- 공용 컴포넌트는 `packages/ui`에서 관리하고, 각 앱에서는 `@repo/ui`로 임포트합니다.
- shadcn 스타일 유틸(`cn`)은 각각 `src/lib/utils.ts`에 위치합니다.
- 관리자 콘솔 로그인은 `/api/auth/login` 호출 후 `ROLE_ADMIN` 인가를 확인하므로, 테스트 시 관리자 권한 계정을 준비하세요.
- 디자인 토큰은 Tailwind `theme.extend`의 CSS 변수(`--primary`, `--accent` 등)로 관리됩니다.

## 배포 참고

- Vercel 배포 시 루트(Trackly-Frontend)를 프로젝트 루트로 설정하고, Install Command `pnpm install`, Build Command `pnpm turbo run build --filter @repo/frontend` (관리자 콘솔도 필요하면 `--filter @repo/frontend-admin` 추가)로 구성합니다.
- Node 20.x / pnpm 10.x 환경을 권장하며, `package.json`의 `engines` 필드를 참고하세요.
