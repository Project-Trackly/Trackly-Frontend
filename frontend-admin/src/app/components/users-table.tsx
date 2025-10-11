import type { UserSummary } from "../types";

const DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit"
});

export function UsersTable({ users }: { users: UserSummary[] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 shadow-[0_20px_50px_rgba(15,23,42,0.65)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-200/70">Users</p>
          <h3 className="text-lg font-semibold text-white">가입자 현황</h3>
          <p className="mt-1 text-xs text-slate-200/70">최근 가입자 20명을 기준으로 표시합니다.</p>
        </div>
        <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-200">
          Total {users.length.toString().padStart(2, "0")}
        </span>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-200/70">
            <tr>
              <th className="px-6 py-3">이름 / 이메일</th>
              <th className="px-6 py-3">닉네임</th>
              <th className="px-6 py-3">역할</th>
              <th className="px-6 py-3">프로필</th>
              <th className="px-6 py-3">가입일</th>
              <th className="px-6 py-3">워크스페이스</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-200/70">
                  표시할 가입자가 없습니다.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-white/8">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">{user.name}</div>
                    <div className="text-xs text-slate-200/70">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-100/90">{user.nickname}</td>
                  <td className="px-6 py-4 text-slate-100/90">{user.role.replace("ROLE_", "")}</td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        user.profileCompleted
                          ? "rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200"
                          : "rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200"
                      }
                    >
                      {user.profileCompleted ? "완료" : "미완료"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-100/80">
                    {DATE_FORMATTER.format(new Date(user.joinedAt))}
                  </td>
                  <td className="px-6 py-4 text-slate-100/80">
                    {user.workspaceName ? (
                      <div>
                        <div className="font-semibold text-white">{user.workspaceName}</div>
                        <div className="text-xs text-slate-200/60">/{user.workspaceSlug}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-200/60">연결된 워크스페이스 없음</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
