"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Form, TextField } from "@repo/ui";
import { apiFetch, type ApiResponse } from "@/lib/api-client";

const steps = [
  {
    id: "workspace",
    title: "워크스페이스 설정",
    description: "팀이 사용할 기본 정보를 입력하세요.",
    fields: [
      { name: "workspaceName", label: "워크스페이스 이름", placeholder: "예) Trackly Product" },
      { name: "workspaceSlug", label: "URL 식별자", hint: "소문자, 숫자, 하이픈만 사용 가능합니다." }
    ]
  },
  {
    id: "team",
    title: "팀 구성",
    description: "초대할 핵심 멤버와 역할을 정의하세요.",
    fields: [
      { name: "teamMembers", label: "팀원 이메일(쉼표 또는 줄바꿈으로 구분)", placeholder: "alice@company.com, bob@company.com" },
      { name: "primaryUse", label: "주요 활용 목적", placeholder: "예) 스프린트 관리, OKR 추적" }
    ]
  },
  {
    id: "preferences",
    title: "환경 최적화",
    description: "통합 옵션과 알림을 선택하세요.",
    fields: [
      { name: "timezone", label: "기본 시간대", placeholder: "Asia/Seoul" },
      { name: "preferredView", label: "기본 보기", placeholder: "캘린더, 보드, 리스트 등" }
    ]
  }
] as const;

type Step = (typeof steps)[number];

type OnboardingState = {
  workspaceName: string;
  workspaceSlug: string;
  teamMembers: string;
  primaryUse: string;
  timezone: string;
  preferredView: string;
  enableAutomation: boolean;
  enableDigest: boolean;
};

type OnboardingResponse = {
  workspaceId: number | null;
  workspaceName: string;
  workspaceSlug: string;
  teamMembers: string[];
  primaryUse: string;
  timezone: string;
  preferredView: string;
  enableAutomation: boolean;
  enableDigest: boolean;
  completed: boolean;
};

const initialState: OnboardingState = {
  workspaceName: "",
  workspaceSlug: "",
  teamMembers: "",
  primaryUse: "",
  timezone: "Asia/Seoul",
  preferredView: "캘린더",
  enableAutomation: true,
  enableDigest: false
};

export default function OnboardingPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<OnboardingState>(initialState);
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentStep = useMemo<Step>(() => steps[stepIndex], [stepIndex]);
  const isLastStep = stepIndex === steps.length - 1;

  useEffect(() => {
    const controller = new AbortController();

    const fetchOnboarding = async () => {
      try {
        const response = await apiFetch("/api/onboarding", { signal: controller.signal });
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        const payload = (await response.json()) as ApiResponse<OnboardingResponse | null>;
        if (response.ok && payload.success && payload.data) {
          const data = payload.data;
          setWorkspaceId(data.workspaceId);
          setCompleted(false);
          setState({
            workspaceName: data.workspaceName ?? "",
            workspaceSlug: data.workspaceSlug ?? "",
            teamMembers: data.teamMembers.join(", "),
            primaryUse: data.primaryUse ?? "",
            timezone: data.timezone ?? "Asia/Seoul",
            preferredView: data.preferredView ?? "캘린더",
            enableAutomation: data.enableAutomation,
            enableDigest: data.enableDigest
          });
        } else if (!response.ok) {
          setError(payload.message ?? "온보딩 정보를 불러오지 못했습니다.");
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError("온보딩 정보를 불러오지 못했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchOnboarding();

    return () => controller.abort();
  }, [router]);

  const handleInputChange = (name: keyof OnboardingState) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const rawValue = event.target.type === "checkbox" ? (event.target as HTMLInputElement).checked : event.target.value;

    let nextValue: typeof rawValue = rawValue;
    if (typeof rawValue === "string") {
      if (name === "workspaceSlug") {
        nextValue = rawValue.replace(/[^a-z0-9-]/g, "").toLowerCase();
      } else if (name === "timezone") {
        nextValue = rawValue.trim();
      }
    }

    setState((prev) => ({ ...prev, [name]: nextValue as never }));
  };

  const handlePrev = () => {
    setError(null);
    setSuccessMessage(null);
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmitStep = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!isLastStep) {
      setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
      return;
    }

    const payload = buildRequest(state);
    setSaving(true);

    try {
      const method = workspaceId ? "PUT" : "POST";
      const response = await apiFetch("/api/onboarding", {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const json = (await response.json()) as ApiResponse<OnboardingResponse | null>;
      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.message ?? "온보딩 저장에 실패했습니다.");
      }

      const data = json.data;
      setWorkspaceId(data.workspaceId);
      setState({
        workspaceName: data.workspaceName,
        workspaceSlug: data.workspaceSlug,
        teamMembers: data.teamMembers.join(", "),
        primaryUse: data.primaryUse,
        timezone: data.timezone,
        preferredView: data.preferredView,
        enableAutomation: data.enableAutomation,
        enableDigest: data.enableDigest
      });
      setCompleted(true);
      setSuccessMessage(json.message ?? "온보딩 정보를 저장했습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "온보딩 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const resetForEdit = () => {
    setCompleted(false);
    setStepIndex(0);
    setSuccessMessage(null);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.28),_transparent_70%)] opacity-80" aria-hidden />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-start lg:gap-12 lg:py-20">
        <aside className="w-full lg:max-w-xs">
          <div className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Onboarding</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Trackly 설정</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                워크스페이스를 맞춤화하면 프로젝트가 더 빠르게 시작됩니다.
              </p>
            </div>
            <ol className="flex flex-col gap-4">
              {steps.map((step, index) => {
                const isActive = index === stepIndex;
                const isDone = index < stepIndex || completed;
                return (
                  <li key={step.id} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isActive
                          ? "bg-brand text-white"
                          : isDone
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-slate-200 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${isActive ? "text-brand" : "text-slate-600 dark:text-slate-300"}`}>{step.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{step.description}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-white">Tip</p>
              <p className="mt-1">
                소셜 로그인 후 `/oauth/callback` 에서 토큰이 저장됩니다. 온보딩은 언제든 다시 수정할 수 있어요.
              </p>
            </div>
          </div>
        </aside>

        <section className="flex w-full flex-col gap-6">
          {loading ? (
            <Card>
              <CardBody className="gap-4">
                <div className="h-4 w-40 animate-pulse rounded bg-slate-200/70 dark:bg-slate-700/70" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-200/50 dark:bg-slate-700/50" />
                <div className="h-32 w-full animate-pulse rounded-2xl bg-slate-200/50 dark:bg-slate-700/40" />
              </CardBody>
            </Card>
          ) : completed ? (
            <Card>
              <CardHeader title="온보딩 완료" subtitle="워크스페이스가 준비되었습니다." />
              <CardBody className="gap-5">
                {successMessage ? (
                  <p className="rounded-lg border border-emerald-300/60 bg-emerald-50 px-4 py-2 text-sm text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                    {successMessage}
                  </p>
                ) : null}
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  지금 바로 대시보드로 이동해 캘린더와 보드를 연결해 보세요. 초대한 팀원에게는 가입 안내 메일이 발송됩니다.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-light"
                  >
                    대시보드로 이동
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    계정 관리
                  </Link>
                  <Button type="button" variant="secondary" onClick={resetForEdit}>
                    다시 수정하기
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardHeader title={currentStep.title} subtitle={currentStep.description} />
              <CardBody className="gap-10">
                {error ? (
                  <p className="rounded-lg border border-coral/40 bg-coral/10 px-4 py-2 text-sm text-coral">{error}</p>
                ) : null}
                <Form onSubmit={handleSubmitStep}
                  footer={
                    <div className="flex flex-wrap justify-between gap-3">
                      <Button type="button" variant="outline" onClick={handlePrev} disabled={stepIndex === 0 || saving}>
                        이전 단계
                      </Button>
                      <Button type="submit" loading={saving}>
                        {isLastStep ? "완료" : "다음 단계"}
                      </Button>
                    </div>
                  }
                >
                  <div className="grid gap-6">
                    {currentStep.fields.map((field) => {
                      if (field.name === "teamMembers") {
                        return (
                          <div key={field.name} className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor={field.name}>
                              {field.label}
                            </label>
                            <textarea
                              id={field.name}
                              name={field.name}
                              className="min-h-[140px] rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-white/10 dark:bg-white/10 dark:text-slate-100"
                              placeholder={field.placeholder}
                              value={state.teamMembers}
                              onChange={handleInputChange("teamMembers")}
                              required
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400">쉼표 또는 줄바꿈으로 여러 명을 입력할 수 있습니다.</p>
                          </div>
                        );
                      }

                      return (
                        <TextField
                          key={field.name}
                          label={field.label}
                          name={field.name}
                          value={state[field.name as keyof OnboardingState] as string}
                          onChange={handleInputChange(field.name as keyof OnboardingState)}
                          placeholder={field.placeholder}
                          hint={field.hint}
                          required
                        />
                      );
                    })}
                  </div>

                  {currentStep.id === "preferences" ? (
                    <div className="mt-4 flex flex-col gap-3">
                      <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition-colors duration-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                        <span>자동화 추천 활성화</span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/40"
                          checked={state.enableAutomation}
                          onChange={handleInputChange("enableAutomation") as (event: ChangeEvent<HTMLInputElement>) => void}
                        />
                      </label>
                      <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition-colors duration-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                        <span>주간 다이제스트 이메일 수신</span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/40"
                          checked={state.enableDigest}
                          onChange={handleInputChange("enableDigest") as (event: ChangeEvent<HTMLInputElement>) => void}
                        />
                      </label>
                    </div>
                  ) : null}
                </Form>
              </CardBody>
            </Card>
          )}

          <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-200">OAuth 온보딩 안내</p>
            <p className="mt-1">
              소셜 로그인 후 `/oauth/callback` 에서 Access/Refresh Token이 저장됩니다. 이 온보딩 화면은 토큰을 가진 사용자에게만 제공되며,
              진행 상황은 `user.profileCompleted` 필드를 통해 관리됩니다.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function buildRequest(state: OnboardingState) {
  const teamMembers = state.teamMembers
    .split(/[\n,]/)
    .map((member) => member.trim())
    .filter((member) => member.length > 0);

  return {
    workspaceName: state.workspaceName.trim(),
    workspaceSlug: state.workspaceSlug.trim().toLowerCase(),
    teamMembers,
    primaryUse: state.primaryUse.trim(),
    timezone: state.timezone.trim(),
    preferredView: state.preferredView.trim(),
    enableAutomation: state.enableAutomation,
    enableDigest: state.enableDigest
  };
}
