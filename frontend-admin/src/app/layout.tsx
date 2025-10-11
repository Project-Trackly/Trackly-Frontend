import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import "./admin.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Trackly Operations Hub",
    template: "%s | Trackly Ops"
  },
  description: "Trackly 운영팀을 위한 전용 관리자 대시보드"
};

const NAV_ITEMS = [
  { label: "Overview", description: "서비스 KPI를 모니터링합니다." },
  { label: "Users", description: "가입자 현황과 활동" },
  { label: "Workspaces", description: "생성된 프로젝트와 팀 구성" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <div className="admin-root relative min-h-screen overflow-hidden text-slate-100">
            <div className="admin-shell relative flex min-h-screen">
              <aside className="admin-sidebar hidden w-72 flex-col justify-between border-r border-white/10 p-6 lg:flex">
                <div className="space-y-8">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-300/90">Trackly</p>
                    <h1 className="text-2xl font-semibold text-white">Operations Hub</h1>
                    <p className="text-xs text-slate-300/80">
                      서비스 전반의 핵심 지표를 실시간으로 관측하고 대응하세요.
                    </p>
                  </div>

                  <nav className="space-y-5">
                    {NAV_ITEMS.map((item) => (
                      <div
                        key={item.label}
                        className="group rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-white/30 hover:bg-white/10"
                      >
                        <p className="text-sm font-semibold text-white/90 group-hover:text-white">{item.label}</p>
                        <p className="mt-1 text-xs text-slate-300/80">{item.description}</p>
                      </div>
                    ))}
                  </nav>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300/80">
                  <p className="font-semibold text-slate-100">보안 안내</p>
                  <p className="mt-1 leading-relaxed">
                    관리자 권한은 2단계 인증과 주기적인 자격 증명 검토를 통해 운영됩니다.
                    의심스러운 활동이 감지되면 즉시 `admins@trackly.io`로 알려주세요.
                  </p>
                </div>
              </aside>

              <div className="admin-content relative flex-1">
                <header className="relative border-b border-white/10 bg-white/5/60 backdrop-blur-xl">
                  <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">Admin Console</p>
                      <h2 className="text-xl font-semibold text-white">실시간 운영 현황</h2>
                    </div>
                    <Link
                      href="https://app.trackly.io"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition-colors hover:border-white/30 hover:bg-white/20"
                    >
                      사용자 페이지 이동
                    </Link>
                  </div>
                </header>

                <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">{children}</main>
              </div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
