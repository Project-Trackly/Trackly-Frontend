# Trackly Frontend Monorepo

Next.js 기반 사용자 웹앱(`frontend`)과 관리자 콘솔(`frontend-admin`)을 포함한 프론트엔드 전용 저장소입니다. 기존 플랫폼 모노레포에서 프론트엔드 관련 코드만 분리했습니다.

## 구성

```
.
├── frontend/            # 메인 사용자 웹앱 (Next.js App Router)
├── frontend-admin/      # 관리자 콘솔 (Next.js + Chakra UI + shadcn/ui)
├── packages/ui/         # 공유 UI 컴포넌트 패키지 (shadcn/ui 패턴)
├── package.json         # Turborepo 루트 스크립트
├── pnpm-workspace.yaml  # 워크스페이스 정의
└── turbo.json           # 파이프라인 설정
```

## 필수 도구

- Node.js 20.x
- pnpm 10.x (`corepack enable` 후 `corepack prepare pnpm@10.12.4 --activate` 권장)

## 명령어

```bash
pnpm install            # 워크스페이스 의존성 설치
pnpm dev                # 모든 앱 개발 서버 실행
pnpm dev:web            # 사용자 웹앱만 실행 (기본 포트 3000)
pnpm dev:admin          # 관리자 콘솔만 실행 (기본 포트 3101)
pnpm build              # 전체 빌드
pnpm build:web          # 사용자 웹앱 빌드
pnpm build:admin        # 관리자 콘솔 빌드
pnpm lint               # 린트 전체 실행
```

## 환경 변수

각 앱은 `.env.local` 등에 다음 주요 값을 필요로 합니다.

- `NEXT_PUBLIC_API_BASE_URL`: 백엔드 API 엔드포인트
- (관리자 콘솔) 필요한 경우 `ADMIN_BASE_URL` 값을 백엔드에 전달해 CORS 허용을 설정하세요.

## Vercel 배포

이 모노레포는 두 개의 독립적인 앱을 포함하므로, **각각 별도의 Vercel 프로젝트**로 배포해야 합니다.

### 방법 1: Vercel 대시보드에서 배포

#### 사용자 웹앱 (frontend) 배포
1. Vercel에서 새 프로젝트 생성
2. 이 저장소 연결
3. **Root Directory**: 비워두기 (또는 `./`)
4. **Build Command**: `pnpm run build:web`
5. **Output Directory**: `frontend/.next`
6. **Install Command**: `pnpm install`

#### 관리자 콘솔 (frontend-admin) 배포
1. Vercel에서 **또 다른 새 프로젝트** 생성 (같은 저장소, 다른 프로젝트)
2. 이 저장소 연결
3. **Root Directory**: 비워두기 (또는 `./`)
4. **Build Command**: `pnpm run build:admin`
5. **Output Directory**: `frontend-admin/.next`
6. **Install Command**: `pnpm install`

### 방법 2: Vercel CLI로 배포

```bash
# 사용자 웹앱 배포
vercel --prod --name trackly-web

# 관리자 콘솔 배포 (vercel.admin.json 사용)
vercel --prod --name trackly-admin -A vercel.admin.json
```

### 파일 설명
- `vercel.json`: 사용자 웹앱용 설정
- `vercel.admin.json`: 관리자 콘솔용 설정

## 구조 변경 메모

- `frontend-admin`은 shadcn/ui + Chakra UI 조합으로 새 디자인 시스템을 사용합니다.
- `packages/ui`는 공용 컴포넌트 패키지로, 앱에서 `@repo/ui` 네임스페이스로 사용할 수 있습니다.
- 백엔드 코드는 별도 저장소([Project-Trackly/Trackly-Backend](https://github.com/Project-Trackly/Trackly-Backend))로 이전되었습니다.
