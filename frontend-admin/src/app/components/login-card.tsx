"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginCard() {
  const { login, state } = useAdminAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(state.status === "unauthenticated" ? state.error ?? null : null);

  useEffect(() => {
    if (state.status === "unauthenticated" && state.error) {
      setError(state.error);
    }
  }, [state]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(identifier, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full items-center justify-center px-6 py-8">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.65)]">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-500/20 via-blue-500/10 to-transparent" aria-hidden />
        <div className="space-y-6">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-sky-300/90">Trackly</p>
            <h1 className="text-2xl font-semibold text-white">관리자 로그인</h1>
            <p className="text-xs text-slate-200/70">
              관리자 권한이 부여된 계정으로 로그인해주세요. 접근은 모든 활동을 기록하며 보안 정책을 따릅니다.
            </p>
          </header>

          {error ? (
            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-100">{error}</div>
          ) : null}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-200/80">이메일 혹은 닉네임</label>
              <Input
                required
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="admin@trackly.io"
                className="h-12 rounded-xl border-white/20 bg-white/10 text-white placeholder:text-slate-300/70"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-200/80">비밀번호</label>
              <Input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="h-12 rounded-xl border-white/20 bg-white/10 text-white placeholder:text-slate-300/70"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl border-white/20 bg-white/10 text-xs uppercase tracking-wide text-white hover:border-white/40 hover:bg-white/20"
            >
              {submitting ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          <p className="text-center text-[11px] leading-relaxed text-slate-400/80">
            계정이 없거나 권한이 필요한 경우, 시스템 관리자에게 문의하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
