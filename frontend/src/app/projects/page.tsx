"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader } from "@repo/ui";
import { Badge } from "@/components/ui/badge";
import { apiFetch, clearAuthTokens, type ApiResponse } from "@/lib/api-client";
import { tokenStorage } from "@/lib/token-storage";

type UserProfile = {
  id: number;
  email: string;
  name: string;
  nickname: string;
  gender: string;
  birthday: string;
  introduce: string;
  profileCompleted: boolean;
};

type Workspace = {
  id: number | string;
  name: string;
  slug: string;
  plan: string;
  members: number;
  status: string;
  lastActive?: string | null;
  description?: string | null;
  createdAt?: string | null;
};

const FALLBACK_WORKSPACES: Workspace[] = [
  {
    id: "beta-01",
    name: "Product HQ",
    slug: "product-hq",
    plan: "PRO",
    members: 12,
    status: "ACTIVE",
    lastActive: new Date().toISOString(),
    description: "제품 스쿼드가 스프린트와 릴리스를 관리하는 메인 워크스페이스"
  },
  {
    id: "beta-02",
    name: "Client Success",
    slug: "client-success",
    plan: "PRO",
    members: 8,
    status: "ACTIVE",
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    description: "고객사 온보딩과 이슈 대응을 추적하는 운영 워크스페이스"
  },
  {
    id: "beta-03",
    name: "Global Expansion",
    slug: "global-expansion",
    plan: "PRO",
    members: 5,
    status: "PLANNING",
    lastActive: null,
    description: "해외 론칭 준비를 위한 R&D 태스크 보드"
  }
];

const dateFormatter = new Intl.DateTimeFormat("ko", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

export default function ProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      if (!tokenStorage.getAccessToken()) {
        router.replace("/login?next=/projects");
        return;
      }

      try {
        const profileResponse = await apiFetch("/api/auth/me", { signal: controller.signal });

        if (profileResponse.status === 401) {
          clearAuthTokens();
          router.replace("/login?next=/projects");
          return;
        }

        const profilePayload = (await profileResponse.json()) as ApiResponse<UserProfile | null>;
        if (profileResponse.ok && profilePayload.success && profilePayload.data) {
          setUser(profilePayload.data);
        }

        const workspaceResponse = await apiFetch("/api/workspaces", { signal: controller.signal });

        if (workspaceResponse.status === 401) {
          clearAuthTokens();
          router.replace("/login?next=/projects");
          return;
        }

        if (workspaceResponse.status === 404) {
          setWorkspaces([]);
          setUsingFallback(false);
          setError(null);
          return;
        }

        const workspacePayload = (await workspaceResponse.json()) as ApiResponse<unknown>;

        if (workspaceResponse.ok && workspacePayload.success && Array.isArray(workspacePayload.data)) {
          setWorkspaces(workspacePayload.data.map((item, index) => normalizeWorkspace(item, index)));
          setUsingFallback(false);
          setError(null);
        } else if (workspaceResponse.ok && workspacePayload.success && workspacePayload.data === null) {
          setWorkspaces([]);
          setUsingFallback(false);
          setError(null);
        } else {
          setWorkspaces(FALLBACK_WORKSPACES);
          setUsingFallback(true);
          setError(workspacePayload.message ?? "워크스페이스 정보를 불러오지 못해 샘플 데이터를 표시하고 있습니다.");
        }
      } catch (loadError) {
        if (!(loadError instanceof DOMException && loadError.name === "AbortError")) {
          setWorkspaces(FALLBACK_WORKSPACES);
          setUsingFallback(true);
          setError("워크스페이스 정보를 불러오지 못했습니다. 샘플 데이터를 표시합니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    void load();

    return () => controller.abort();
  }, [router]);

  const greetingName = useMemo(() => {
    if (!user) {
      return "";
    }
    return user.nickname || user.name || user.email;
  }, [user]);

  const handleLogout = async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      clearAuthTokens();
      router.push("/");
      return;
    }

    try {
      await apiFetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refreshToken })
      });
    } finally {
      clearAuthTokens();
      router.push("/");
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50 text-slate-900 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.28),_transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.25),_transparent_60%)]"
        aria-hidden
      />
      <div className="relative mx-auto flex w-full max-w-[1280px] flex-col gap-12 px-4 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-base font-semibold text-brand">
              TS
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Trackly</span>
              <span className="text-xs uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                WORKSPACE PORTAL
              </span>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
              홈
            </Link>
            <Link href="/mypage" className="hover:text-slate-900 dark:hover:text-white">
              마이페이지
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </header>

        <section className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">내 프로젝트 관리</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {greetingName
                  ? `${greetingName}님이 접근 가능한 워크스페이스 목록입니다. 필요한 프로젝트로 바로 이동하거나 새 워크스페이스를 만들어 보세요.`
                  : "워크스페이스 목록을 확인하고 필요한 프로젝트로 이동하세요."}
              </p>
              {usingFallback ? (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  API 응답을 가져오지 못해 샘플 데이터를 표시하고 있습니다.
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/onboarding">새 워크스페이스 만들기</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/#story">로드맵 보기</Link>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader
              title="모든 워크스페이스에서 PRO 기능 제공"
              subtitle="베타 기간 동안 생성한 워크스페이스는 멤버 수와 상관없이 PRO 플랜으로 동작합니다."
            />
            <CardBody className="gap-4 text-sm text-slate-600 dark:text-slate-300">
              <p>
                프로젝트별로 워크스페이스를 나누고, 자동화 레시피와 고급 권한 매트릭스를 활용해 멤버 전환 없이도 운영 지표를
                확인할 수 있습니다. Slack이나 외부 칼렌더 연동도 PRO 권한에 포함되어 있으니 베타 기간을 적극 활용해 보세요.
              </p>
              <div className="grid gap-3 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-3">
                <span className="rounded-xl border border-slate-200/70 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  자동화 레시피·Webhook 등 PRO 기능 무제한
                </span>
                <span className="rounded-xl border border-slate-200/70 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  역할 기반 권한과 감사 로그 미리 체험
                </span>
                <span className="rounded-xl border border-slate-200/70 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  정식 출시 시 사전 알림 및 혜택 제공
                </span>
              </div>
            </CardBody>
          </Card>

          {error ? (
            <div className="rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-xs text-coral">{error}</div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            {loading && workspaces.length === 0 ? (
              <LoadingWorkspacePlaceholder />
            ) : null}
            {workspaces.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </div>

          {!loading && workspaces.length === 0 ? <WorkspaceEmptyState /> : null}
        </section>
      </div>
    </main>
  );
}

type WorkspaceCardProps = {
  workspace: Workspace;
};

function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const formattedLastActive = workspace.lastActive ? formatDateString(workspace.lastActive) : "최근 활동 기록 없음";

  return (
    <Card className="border-slate-200/80 bg-white/90 backdrop-blur-sm transition-colors duration-300 dark:border-white/10 dark:bg-white/5">
      <CardHeader
        title={workspace.name}
        subtitle={workspace.description ?? `워크스페이스 주소: ${workspace.slug}`}
        action={
          <Badge className="bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-light">
            {workspace.plan.toUpperCase()}
          </Badge>
        }
      />
      <CardBody className="gap-4 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
          <span>{workspace.slug}</span>
          <span>·</span>
          <span>{workspace.members}명 참여</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <Badge variant="outline" className="border-slate-300 text-xs text-slate-500 dark:border-white/10 dark:text-slate-300">
            {formatStatus(workspace.status)}
          </Badge>
          <span>최근 활동 {formattedLastActive}</span>
          {workspace.createdAt ? <span>생성 {formatDateString(workspace.createdAt)}</span> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/projects/${workspace.id}/3d`}>3D 뷰</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/onboarding">워크스페이스 설정</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/mypage">멤버 권한 관리</Link>
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function LoadingWorkspacePlaceholder() {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 text-sm text-slate-400 shadow-inner backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
      워크스페이스 정보를 불러오는 중입니다...
    </div>
  );
}

function WorkspaceEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
      아직 워크스페이스가 없습니다. <Link href="/onboarding" className="font-semibold text-brand">온보딩</Link>을 진행해 첫
      번째 프로젝트 공간을 만들어 보세요.
    </div>
  );
}

function normalizeWorkspace(item: unknown, index: number): Workspace {
  if (typeof item !== "object" || item === null) {
    return FALLBACK_WORKSPACES[index % FALLBACK_WORKSPACES.length];
  }

  const record = item as Record<string, unknown>;

  const id = record.id ?? record.workspaceId ?? `workspace-${index + 1}`;
  const name =
    typeof record.name === "string"
      ? record.name
      : typeof record.workspaceName === "string"
      ? record.workspaceName
      : `워크스페이스 ${index + 1}`;
  const slug =
    typeof record.slug === "string"
      ? record.slug
      : typeof record.workspaceSlug === "string"
      ? record.workspaceSlug
      : `workspace-${index + 1}`;
  const plan =
    typeof record.plan === "string"
      ? record.plan
      : typeof record.planType === "string"
      ? record.planType
      : typeof record.subscription === "string"
      ? record.subscription
      : "PRO";
  const members =
    typeof record.members === "number"
      ? record.members
      : typeof record.memberCount === "number"
      ? record.memberCount
      : typeof record.membersCount === "number"
      ? record.membersCount
      : FALLBACK_WORKSPACES[index % FALLBACK_WORKSPACES.length].members;
  const status =
    typeof record.status === "string"
      ? record.status
      : typeof record.state === "string"
      ? record.state
      : FALLBACK_WORKSPACES[index % FALLBACK_WORKSPACES.length].status;
  const lastActive =
    typeof record.lastActive === "string"
      ? record.lastActive
      : typeof record.lastActiveAt === "string"
      ? record.lastActiveAt
      : typeof record.updatedAt === "string"
      ? record.updatedAt
      : null;
  const description =
    typeof record.description === "string"
      ? record.description
      : typeof record.summary === "string"
      ? record.summary
      : null;
  const createdAt = typeof record.createdAt === "string" ? record.createdAt : null;

  return {
    id: typeof id === "string" || typeof id === "number" ? id : `workspace-${index + 1}`,
    name,
    slug,
    plan: plan.toString().toUpperCase(),
    members,
    status,
    lastActive,
    description,
    createdAt
  };
}

function formatStatus(status: string) {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return "사용 중";
    case "PLANNING":
      return "준비 중";
    case "ARCHIVED":
      return "보관됨";
    case "PAUSED":
      return "일시 중지";
    default:
      return status || "상태 미확인";
  }
}

function formatDateString(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "기록 없음";
  }
  return dateFormatter.format(date);
}
