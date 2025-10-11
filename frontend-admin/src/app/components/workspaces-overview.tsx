import type { WorkspaceSummary } from "../types";

const DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

export function WorkspacesOverview({ workspaces }: { workspaces: WorkspaceSummary[] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 shadow-[0_20px_50px_rgba(15,23,42,0.65)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-200/70">Workspaces</p>
          <h3 className="text-lg font-semibold text-white">워크스페이스 현황</h3>
          <p className="mt-1 text-xs text-slate-200/70">최근 생성된 워크스페이스 20개를 보여줍니다.</p>
        </div>
        <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-200">
          Total {workspaces.length.toString().padStart(2, "0")}
        </span>
      </header>
      <ul className="divide-y divide-white/10">
        {workspaces.length === 0 ? (
          <li className="px-6 py-10 text-center text-sm text-slate-200/70">
            표시할 워크스페이스가 없습니다.
          </li>
        ) : (
          workspaces.map((workspace) => (
            <li
              key={workspace.id}
              className="flex flex-col gap-3 px-6 py-6 transition-colors hover:bg-white/8"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-white">{workspace.name}</p>
                  <p className="text-xs text-slate-200/60">/{workspace.slug}</p>
                </div>
                <div className="text-right text-xs text-slate-200/60">
                  생성일 {DATE_FORMATTER.format(new Date(workspace.createdAt))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200/80">
                <span className="rounded-full bg-white/10 px-3 py-1">
                  소유자 {workspace.ownerName ?? "-"} ({workspace.ownerEmail ?? "-"})
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1">팀원 {workspace.memberCount}명</span>
                <span
                  className={
                    workspace.automationEnabled
                      ? "rounded-full bg-emerald-400/20 px-3 py-1 text-emerald-200"
                      : "rounded-full bg-white/10 px-3 py-1 text-slate-200/60"
                  }
                >
                  자동화 {workspace.automationEnabled ? "ON" : "OFF"}
                </span>
                <span
                  className={
                    workspace.digestEnabled
                      ? "rounded-full bg-sky-400/20 px-3 py-1 text-sky-200"
                      : "rounded-full bg-white/10 px-3 py-1 text-slate-200/60"
                  }
                >
                  다이제스트 {workspace.digestEnabled ? "ON" : "OFF"}
                </span>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
