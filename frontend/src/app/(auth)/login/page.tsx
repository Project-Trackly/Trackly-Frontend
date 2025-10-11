"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Form, TextField } from "@repo/ui";
import { tokenStorage } from "@/lib/token-storage";
import type { ApiResponse, TokenResponse } from "@/lib/api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const hasApiBaseUrl = API_BASE_URL.trim().length > 0;
const socialRouteBase = hasApiBaseUrl ? API_BASE_URL : "";

const socialProviders = [
  {
    name: "Google",
    description: "Google Workspace 계정",
    route: "/oauth2/authorization/google"
  },
  {
    name: "Kakao",
    description: "Kakao Work 계정",
    route: "/oauth2/authorization/kakao"
  }
];

type LoginFormState = {
  identifier: string;
  password: string;
};

type AuthResponse = ApiResponse<TokenResponse>;

export default function LoginPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<LoginFormState>({ identifier: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitting(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formState)
        });

        const payload = (await response.json()) as AuthResponse;
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.message ?? "로그인에 실패했습니다. 다시 시도해 주세요.");
        }

        tokenStorage.setTokens(payload.data.accessToken, payload.data.refreshToken);
        router.push("/");
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "알 수 없는 오류입니다.");
      } finally {
        setSubmitting(false);
      }
    },
    [formState, router]
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-slate-100 text-slate-900 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[300px] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.2),_transparent_60%)]" />
      <div className="relative mx-auto grid w-full max-w-5xl gap-12 px-6 py-16 lg:grid-cols-[minmax(0,1fr),420px] lg:py-20">
        <section className="space-y-10 text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm backdrop-blur-sm dark:bg-white/5 dark:text-slate-400">
            TASKSCAPE ACCESS
          </span>
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 dark:text-white">
              소셜 로그인으로 30초 만에 Trackly 워크스페이스에 합류하세요
            </h1>
            <p className="max-w-lg text-base">
              OAuth2 인증으로 복잡한 가입 절차 없이 팀에 참여할 수 있습니다. 로그인 이후에는 역할 기반 권한과 하이브리드 보드로 업무를 바로 시작하세요.
            </p>
          </div>
          <ul className="flex flex-col gap-3 text-sm">
            <li className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5">
              SSO 로드맵과 감사 로그 준비로 엔터프라이즈 보안 요구를 충족합니다.
            </li>
            <li className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5">
              캘린더·보드 통합으로 일정과 태스크를 한 화면에서 관리하세요.
            </li>
            <li className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5">
              다국어 인터페이스와 시간대 지원으로 글로벌 팀 협업을 대비합니다.
            </li>
          </ul>
        </section>

        <Card className="self-start">
          <CardHeader
            title="Trackly 로그인"
            subtitle="소셜 계정 또는 자격 증명으로 빠르게 로그인하세요."
          />
          <CardBody className="gap-10">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">소셜 로그인</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                연결된 OAuth 공급자를 선택하면 토큰을 발급 받은 뒤 자동으로 대시보드로 이동합니다.
              </p>
              {socialError ? (
                <p className="rounded-lg border border-coral/40 bg-coral/10 px-4 py-2 text-xs text-coral">
                  {socialError}
                </p>
              ) : null}
              <div className="flex flex-col gap-3">
                {socialProviders.map((provider) => (
                  <Button
                    key={provider.name}
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (!hasApiBaseUrl) {
                        setSocialError("NEXT_PUBLIC_API_BASE_URL을 설정해 백엔드 주소를 알려주세요.");
                        return;
                      }
                      setSocialError(null);
                      router.push(`${socialRouteBase}${provider.route}`);
                    }}
                    className="justify-start"
                    disabled={!hasApiBaseUrl}
                  >
                    <span className="font-semibold text-slate-900 dark:text-white">{provider.name}</span>
                    <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">{provider.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-white/10" />

            <Form
              title="이메일 또는 닉네임으로 로그인"
              description="등록한 자격 증명을 입력해 주세요."
              onSubmit={handleSubmit}
              footer={
                <div className="flex flex-col gap-3">
                  <Button type="submit" loading={submitting}>
                    로그인
                  </Button>
                  <button
                    type="button"
                    onClick={() => router.push("/register")}
                    className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                  >
                    아직 계정이 없나요?
                  </button>
                </div>
              }
            >
              <TextField
                label="이메일 또는 닉네임"
                name="identifier"
                value={formState.identifier}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, identifier: event.target.value.trimStart() }))
                }
                required
              />
              <TextField
                label="비밀번호"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formState.password}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, password: event.target.value }))
                }
                required
              />
              {error ? (
                <p className="rounded-lg border border-coral/40 bg-coral/10 px-4 py-2 text-sm text-coral">
                  {error}
                </p>
              ) : null}
            </Form>
          </CardBody>
        </Card>

        {!hasApiBaseUrl ? (
          <div className="lg:col-span-2">
            <p className="rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-xs text-coral">
              NEXT_PUBLIC_API_BASE_URL 환경 변수가 비어 있어 소셜 로그인이 정상 작동하지 않을 수 있습니다.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
