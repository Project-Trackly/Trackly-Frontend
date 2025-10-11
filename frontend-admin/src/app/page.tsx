"use client";

import { MetricsOverview } from "./components/metrics-overview";
import { UsersTable } from "./components/users-table";
import { WorkspacesOverview } from "./components/workspaces-overview";
import { useAdminDashboard } from "./use-admin-dashboard";
import { useAdminAuth } from "@/lib/auth";
import { LoginCard } from "./components/login-card";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const { state, logout } = useAdminAuth();
  const authenticated = state.status === "authenticated";
  const { data, loading, error, refresh } = useAdminDashboard(authenticated);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-200/70">세션 확인 중...</div>
    );
  }

  if (!authenticated) {
    return <LoginCard />;
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-200/80">Realtime insight</p>
          <h2 className="text-3xl font-semibold text-white">서비스 핵심 지표 모니터링</h2>
          <p className="text-sm text-slate-200/70">
            가입자 활동, 워크스페이스 생성 현황, 자동화 사용량 등을 한눈에 확인하고 필요한 조치를 빠르게 취하세요.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={refresh}
            disabled={loading}
            variant="secondary"
            className="border-white/20 bg-white/10 text-xs uppercase tracking-wide text-slate-100 hover:border-white/40 hover:bg-white/20"
          >
            {loading ? "업데이트 중" : "데이터 새로고침"}
          </Button>
          <Button
            type="button"
            onClick={logout}
            variant="outline"
            className="border-white/20 bg-transparent text-xs uppercase tracking-wide text-slate-200 hover:border-white/40 hover:bg-white/10"
          >
            로그아웃
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-400/40 bg-rose-500/10 px-6 py-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {loading && !data ? (
        <div className="space-y-6 text-sm text-slate-200/70">
          <div className="h-44 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
          <div className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
          <div className="h-96 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
        </div>
      ) : null}

      {data ? (
        <>
          <MetricsOverview metrics={data.metrics} />
          <UsersTable users={data.recentUsers} />
          <WorkspacesOverview workspaces={data.recentWorkspaces} />
        </>
      ) : null}
    </div>
  );
}
