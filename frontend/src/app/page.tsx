"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader } from "@repo/ui";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { apiFetch, clearAuthTokens, type ApiResponse } from "@/lib/api-client";
import { tokenStorage } from "@/lib/token-storage";

type DashboardMetric = {
  label: string;
  value: string;
  delta: string;
  tone: string;
};

type DashboardSchedule = {
  time: string;
  title: string;
  context: string;
  theme: string;
};

type DashboardTask = {
  title: string;
  assignee?: string | null;
  due?: string | null;
  tag?: string | null;
};

type DashboardBoardColumn = {
  title: string;
  badge: string;
  tasks: DashboardTask[];
};

type DashboardHighlight = {
  title: string;
  description: string;
};

type DashboardData = {
  metrics: DashboardMetric[];
  schedule: DashboardSchedule[];
  board: DashboardBoardColumn[];
  highlights: DashboardHighlight[];
};

const DEFAULT_DASHBOARD: DashboardData = {
  metrics: [
    { label: "이번 주 완료 태스크", value: "18", delta: "+12% vs. 지난주", tone: "text-brand" },
    { label: "예정된 미팅", value: "6", delta: "오늘 3건", tone: "text-slate-600 dark:text-slate-300" },
    { label: "워크스페이스 건강 지수", value: "92", delta: "상위 10%", tone: "text-emerald-600 dark:text-emerald-300" }
  ],
  schedule: [
    { time: "09:30", title: "데일리 스탠드업", context: "Trackly Squad", theme: "FOCUS" },
    { time: "11:00", title: "고객 인터뷰 (Beta 기업)", context: "Product Discovery", theme: "CUSTOMER" },
    { time: "15:00", title: "보드 자동화 워크숍", context: "Ops 팀", theme: "WORKSHOP" }
  ],
  board: [
    {
      title: "오늘 집중",
      badge: "3 Tasks",
      tasks: [
        { title: "MVP 온보딩 플로우 QA", assignee: "민지", due: "2시간 내", tag: "Launch" },
        { title: "엔터프라이즈 플랜 가격 문서 업데이트", assignee: "지훈", due: "오늘 마감", tag: "Pricing" },
        { title: "슬랙 Webhook 스펙 정리", assignee: "소라", due: "오늘 오후", tag: "Automation" }
      ]
    },
    {
      title: "진행 중",
      badge: "5 Tasks",
      tasks: [
        { title: "워크스페이스 권한 매트릭스 설계", assignee: "Alex", due: "D-2", tag: "Security" },
        { title: "월간 OKR 리포트 초안", assignee: "민수", due: "D-3", tag: "Insight" },
        { title: "다국어 지원 UX 리뷰", assignee: "Yuki", due: "D-4", tag: "Global" }
      ]
    },
    {
      title: "완료됨",
      badge: "18 This Week",
      tasks: [
        { title: "캘린더-보드 동기화", assignee: "팀", due: "완료", tag: "Release" },
        { title: "SAML PoC" },
        { title: "디자인 시스템 토큰 도입" }
      ]
    }
  ],
  highlights: [
    { title: "하이브리드 뷰", description: "캘린더와 보드를 실시간으로 연결해 일정 충돌을 줄입니다." },
    { title: "OAuth & SSO 준비", description: "소셜 로그인으로 온보딩하고, 엔터프라이즈 SSO를 손쉽게 확장하세요." },
    { title: "워크스페이스 권한", description: "역할 기반 접근 제어와 감사 로그로 보안 요구를 충족합니다." }
  ]
};

type HomePageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

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

export default function HomePage({ searchParams }: HomePageProps) {
  const profileParam = searchParams?.profile;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profileFetchError, setProfileFetchError] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [dashboard, setDashboard] = useState<DashboardData>(DEFAULT_DASHBOARD);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProfile = async () => {
      const accessToken = tokenStorage.getAccessToken();
      if (!accessToken) {
        setLoadingProfile(false);
        setUser(null);
        return;
      }

      try {
        const response = await apiFetch("/api/auth/me", { signal: controller.signal });
        const payload = (await response.json()) as ApiResponse<UserProfile | null>;

        if (response.ok && payload.success && payload.data) {
          setUser(payload.data);
          setProfileFetchError(null);
        } else if (response.status === 401) {
          setUser(null);
          setProfileFetchError(null);
        } else {
          setUser(null);
          setProfileFetchError(payload.message ?? "프로필 정보를 불러오지 못했습니다.");
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setProfileFetchError("프로필 정보를 불러오지 못했습니다.");
        }
        setUser(null);
      } finally {
        setLoadingProfile(false);
      }
    };

    void fetchProfile();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchDashboard = async () => {
      try {
        const response = await apiFetch("/api/dashboard/preview", { signal: controller.signal });
        const payload = (await response.json()) as ApiResponse<DashboardData | null>;

        if (response.ok && payload.success && payload.data) {
          setDashboard(payload.data);
          setDashboardError(null);
        } else if (!response.ok) {
          setDashboardError(payload.message ?? "대시보드 데이터를 불러오지 못했습니다.");
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setDashboardError("대시보드 데이터를 불러오지 못했습니다.");
        }
      } finally {
        setLoadingDashboard(false);
      }
    };

    void fetchDashboard();

    return () => controller.abort();
  }, []);

  const needsProfileFromQuery = useMemo(() => {
    if (Array.isArray(profileParam)) {
      return profileParam.includes("needs");
    }
    return profileParam === "needs";
  }, [profileParam]);

  const needsProfileBanner = needsProfileFromQuery || (!!user && !user.profileCompleted);
  const unauthenticated = !user;

  const handleLogout = async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      tokenStorage.clearTokens();
      setUser(null);
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
      setUser(null);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-slate-100 text-slate-900 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_70%)] opacity-70 dark:bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.25),_transparent_65%)]" aria-hidden />
      <div className="relative mx-auto flex w-full max-w-[1280px] flex-col gap-16 px-4 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
        <nav className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-base font-semibold text-brand">
              TS
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Trackly</span>
              <span className="text-xs uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                PLAN · SYNC · SCALE
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#workspace"
              className="hidden text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 hover:text-slate-900 dark:hover:text-white sm:inline"
            >
              Workspace
            </a>
            <a
              href="#analytics"
              className="hidden text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 hover:text-slate-900 dark:hover:text-white sm:inline"
            >
              Insights
            </a>
            <a
              href="#story"
              className="hidden text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 hover:text-slate-900 dark:hover:text-white sm:inline"
            >
              Roadmap
            </a>
            {user ? (
              <>
                <Link
                  href="/projects"
                  className="hidden text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 hover:text-slate-900 dark:hover:text-white sm:inline"
                >
                  내 프로젝트 관리
                </Link>
                <Link
                  href="/mypage"
                  className="hidden text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 hover:text-slate-900 dark:hover:text-white sm:inline"
                >
                  마이페이지
                </Link>
              </>
            ) : null}
            {unauthenticated ? (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center rounded-full bg-brand text-xs font-semibold uppercase tracking-[0.28em] text-white shadow-glow transition hover:bg-brand-light"
                >
                  무료 시작
                </Link>
              </div>
            ) : (
              <Button variant="outline" onClick={handleLogout}>
                로그아웃
              </Button>
            )}
          </div>
        </nav>

        {needsProfileBanner ? (
          <div className="glass border border-sky-200/80 px-5 py-3 text-sm text-slate-700 transition-colors duration-300 dark:border-sky-500/30 dark:text-sky-100">
            <p className="font-semibold">프로필을 완성해 Trackly 경험을 개인화하세요.</p>
            <p className="text-xs text-slate-500 dark:text-slate-300">필수 정보만 추가하면 자동화 추천과 맞춤형 보드를 제공해 드립니다.</p>
          </div>
        ) : null}

        <section className="grid-gap-0 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr),360px] lg:gap-16">
          <div className="space-y-10">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 shadow-sm backdrop-blur-sm dark:bg-white/5 dark:text-slate-300">
                PROJECT PLANNING · KOREA FIRST · GLOBAL READY
              </span>
              <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl dark:text-white">
                팀의 일정과 실행을 한 화면에서 조율하는 <span className="text-brand">Trackly</span>
              </h1>
              <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300">
                Trackly는 스프린트, 클라이언트 프로젝트, 크로스펑셔널 협업을 한 워크스페이스에서 운영하려는 팀에게 최적화된
                하이브리드 플래너입니다. 캘린더와 태스크 보드를 동기화해 일정 충돌을 줄이고, OAuth 온보딩과 자동 권한 설정으로
                새 팀원이 들어와도 바로 실행할 수 있어요. 지금은 베타 단계라 모든 계정이 PRO 모델 기능을 제한 없이 체험할 수 있습니다.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {unauthenticated ? (
                <>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-full bg-brand text-sm font-semibold text-white shadow-glow transition hover:bg-brand-light"
                  >
                    워크스페이스 만들기
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    기존 계정 로그인
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/projects"
                    className="inline-flex items-center gap-2 rounded-full bg-brand text-sm font-semibold text-white shadow-glow transition hover:bg-brand-light"
                  >
                    내 프로젝트 관리
                  </Link>
                  <Link
                    href="/mypage"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    마이페이지
                  </Link>
                </>
              )}
              <span className="text-xs uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                BETA ACCESS · FULL PRO FEATURES · TEAM-FIRST
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {dashboard.metrics.map((metric) => (
                <Card
                  key={metric.label}
                  muted
                  className="border-border/70 bg-gradient-to-br from-white via-white/80 to-transparent p-5 shadow-soft dark:from-white/10 dark:via-white/5 dark:to-transparent"
                >
                  <span className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{metric.label}</span>
                  <p className={`mt-2 text-2xl font-semibold ${metric.tone}`}>{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.delta}</p>
                </Card>
              ))}
            </div>
            {dashboardError ? (
              <p className="text-xs text-coral">{dashboardError}</p>
            ) : null}
          </div>

          <div className="space-y-6 lg:w-[360px] lg:justify-self-end lg:pl-2 xl:pl-6">
            {user ? <WorkspaceAccessCard user={user} /> : <BetaAccessCard />}
            {!loadingProfile && !user && profileFetchError ? (
              <div className="glass border border-coral/30 px-5 py-4 text-sm text-coral">
                {profileFetchError}
              </div>
            ) : null}
          </div>
        </section>

        <GettingStartedSection unauthenticated={unauthenticated} />

        <UseCaseSection />

        <PricingOverviewSection />

        <section id="workspace" className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">하이브리드 워크스페이스 미리보기</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">캘린더와 보드를 오가는 전문 프로젝트 팀의 한 화면</p>
            </div>
            <Link
              href="/login"
              className="text-xs font-semibold uppercase tracking-[0.28em] text-brand hover:text-brand-light"
            >
              라이브 데모 보기
            </Link>
          </div>
          <WorkspacePreview columns={dashboard.board} schedule={dashboard.schedule} loading={loadingDashboard} />
        </section>

        <section id="analytics" className="grid gap-8 lg:grid-cols-[minmax(0,1fr),320px]">
          <Card className="overflow-hidden">
            <CardHeader
              title="실시간 인사이트"
              subtitle="버든 차트, 워크로드 히트맵, SLA 추이를 한 번에 확인하세요."
            />
            <CardBody className="bg-gradient-to-br from-sky-50 via-white to-transparent p-6 dark:from-white/5 dark:via-white/5 dark:to-transparent">
              <AnalyticsPreview />
            </CardBody>
          </Card>
          <Card>
            <CardHeader
              title="전문가에게 사랑받는 이유"
              subtitle="프로덕트 조직과 PMO가 선택한 필수 기능"
            />
            <CardBody>
              <ul className="flex flex-col gap-4 text-sm text-slate-600 dark:text-slate-300">
                {dashboard.highlights.map((item) => (
                  <li
                    key={item.title}
                    className="rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </section>

        <section id="story" className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">2024 로드맵</h2>
          <div className="grid gap-4 lg:grid-cols-4">
            <RoadmapCard
              quarter="Q1"
              headline="온보딩 런칭"
              bullets={["캘린더-보드 동기화", "OAuth 로그인", "국문 온보딩"]}
            />
            <RoadmapCard
              quarter="Q2"
              headline="워크스페이스 확장"
              bullets={["역할 기반 권한", "다국어 지원", "Slack 통합 베타"]}
            />
            <RoadmapCard
              quarter="Q3"
              headline="자동화 & 리포트"
              bullets={["외부 캘린더 연동", "웹훅 자동화", "고급 지표"]}
            />
            <RoadmapCard
              quarter="Q4"
              headline="엔터프라이즈 준비"
              bullets={["SAML SSO", "감사 로그", "리전 확장"]}
            />
          </div>
        </section>

        <footer className="border-t border-slate-200 pt-10 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,1fr))]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-base font-semibold text-brand">
                  TS
                </span>
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">Trackly Platform</span>
                  <span className="text-xs uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                    PLAN · SYNC · SCALE
                  </span>
                </div>
              </div>
              <p className="max-w-md text-xs text-slate-500 dark:text-slate-400">
                Trackly는 프로젝트 일정과 실행을 하나의 하이브리드 워크스페이스에서 운영하도록 설계된 SaaS입니다. 캘린더-보드
                동기화, 자동화 레시피, 고급 권한 매트릭스로 글로벌 팀 협업을 지원합니다.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                주요 기능
              </p>
              <ul className="mt-4 flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400">
                <li>
                  <a href="#workspace" className="hover:text-slate-800 dark:hover:text-white">
                    하이브리드 캘린더 & 보드
                  </a>
                </li>
                <li>
                  <a href="#analytics" className="hover:text-slate-800 dark:hover:text-white">
                    실시간 인사이트 & 리포트
                  </a>
                </li>
                <li>
                  <a href="#guide" className="hover:text-slate-800 dark:hover:text-white">
                    자동화 온보딩 플로우
                  </a>
                </li>
                <li>
                  <a href="#use-cases" className="hover:text-slate-800 dark:hover:text-white">
                    산업별 운영 시나리오
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                Sitemap
              </p>
              <ul className="mt-4 flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400">
                <li>
                  <Link href="/" className="hover:text-slate-800 dark:hover:text-white">
                    홈
                  </Link>
                </li>
                <li>
                  <Link href="/projects" className="hover:text-slate-800 dark:hover:text-white">
                    내 프로젝트 관리
                  </Link>
                </li>
                <li>
                  <Link href="/mypage" className="hover:text-slate-800 dark:hover:text-white">
                    마이페이지
                  </Link>
                </li>
                <li>
                  <Link href="/onboarding" className="hover:text-slate-800 dark:hover:text-white">
                    온보딩
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-slate-800 dark:hover:text-white">
                    로그인
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-slate-800 dark:hover:text-white">
                    회원가입
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Trackly Inc. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4">
              <a href="#pricing" className="hover:text-slate-700 dark:hover:text-white">
                요금제
              </a>
              <a href="#guide" className="hover:text-slate-700 dark:hover:text-white">
                시작 가이드
              </a>
              <a href="#story" className="hover:text-slate-700 dark:hover:text-white">
                로드맵
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

type WorkspaceAccessCardProps = {
  user: UserProfile;
};

function WorkspaceAccessCard({ user }: WorkspaceAccessCardProps) {
  return (
    <Card className="lg:w-full">
      <CardHeader
        title={`${user.nickname || user.name}님, 환영합니다`}
        subtitle="워크스페이스를 전환하거나 프로필을 관리해 보세요."
      />
      <CardBody className="gap-5">
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>
            Trackly에서는 여러 워크스페이스를 만들고 프로젝트별로 빠르게 오가며 팀을 운영할 수 있습니다. 계정 정보는
            마이페이지에서 손쉽게 확인하고 업데이트하세요.
          </p>
          <p className="rounded-xl border border-slate-200/70 bg-white px-4 py-3 text-xs leading-relaxed text-slate-500 transition-colors duration-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            베타 기간 동안은 모든 워크스페이스가 PRO 권한으로 제공되어 자동화, 고급 권한 매트릭스, 보드 인사이트 기능을
            제한 없이 사용할 수 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/projects">내 프로젝트 관리</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/mypage">마이페이지</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/onboarding">새 워크스페이스 설정</Link>
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function BetaAccessCard() {
  return (
    <Card className="lg:w-full">
      <CardHeader
        title="베타 액세스 안내"
        subtitle="Trackly의 모든 PRO 기능을 출시 전까지 무료로 체험할 수 있습니다."
      />
      <CardBody className="gap-4 text-sm text-slate-600 dark:text-slate-300">
        <p>
          OAuth 기반 로그인으로 몇 초 만에 워크스페이스를 개설하고, 자동화·고급 권한·리포트 기능까지 즉시 활성화해 팀 협업
          환경을 구축해 보세요.
        </p>
        <ul className="flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400">
          <li>• 워크스페이스 수와 멤버 수 제한 없이 PRO 기능 사용</li>
          <li>• Slack, 캘린더, Webhook 등 외부 통합 사전 체험</li>
          <li>• 정식 출시 알림 및 베타 참여자 전용 혜택 우선 제공</li>
        </ul>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/register">무료로 워크스페이스 만들기</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">이미 계정이 있다면 로그인</Link>
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

const GETTING_STARTED_STEPS = [
  {
    title: "소셜 계정 연결",
    description: "Google·Kakao 계정으로 로그인하면 즉시 토큰이 발급되고, 기본 보안 정책이 적용된 상태로 대시보드에 진입합니다.",
    badge: "Step 1"
  },
  {
    title: "워크스페이스 설계",
    description: "팀 이름, URL 식별자, 핵심 역할을 정의하고 기본 뷰(캘린더/보드)를 선택하면 Trackly가 맞춤 템플릿을 제공합니다.",
    badge: "Step 2"
  },
  {
    title: "자동화 & 권한 구성",
    description: "Webhook, 반복 태스크, 권한 매트릭스를 세팅해 운영 흐름을 고도화하고, 필요 시 Slack/캘린더 통합까지 바로 연결하세요.",
    badge: "Step 3"
  }
] as const;

type GettingStartedSectionProps = {
  unauthenticated: boolean;
};

function GettingStartedSection({ unauthenticated }: GettingStartedSectionProps) {
  return (
    <section id="guide" className="space-y-8">
      <div className="mx-auto max-w-3xl space-y-3 text-center">
        <span className="inline-flex items-center justify-center rounded-full bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-brand dark:bg-brand/15 dark:text-brand-light">
          GUIDED ONBOARDING
        </span>
        <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Trackly 시작 가이드</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          표준화된 3단계 온보딩 플로우로 워크스페이스를 신속하게 구성할 수 있습니다. 각 단계는 프로젝트 운영에 필요한 최소
          정보를 묻고, 입력 즉시 자동화 권장 설정을 제안합니다.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {GETTING_STARTED_STEPS.map((step) => (
          <Card key={step.title} className="border-slate-200/80 bg-white/90 transition-colors duration-300 dark:border-white/10 dark:bg-white/5">
            <CardBody className="gap-4">
              <span className="inline-flex w-fit items-center rounded-full bg-brand/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand dark:bg-brand/15 dark:text-brand-light">
                {step.badge}
              </span>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{step.title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{step.description}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-3 text-sm">
        {unauthenticated ? (
          <>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 font-semibold text-white shadow-glow transition hover:bg-brand-light"
            >
              지금 무료로 시작하기
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2 font-semibold text-slate-700 transition hover:bg-white dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              기존 계정 로그인
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 font-semibold text-white shadow-glow transition hover:bg-brand-light"
            >
              내 워크스페이스 확인
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2 font-semibold text-slate-700 transition hover:bg-white dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              새 워크스페이스 만들기
            </Link>
          </>
        )}
      </div>
      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
        모든 신규 워크스페이스는 베타 기간 동안 PRO 권한으로 제공되며, 설정한 자동화 규칙과 권한은 정식 출시 이후에도
        그대로 유지됩니다.
      </p>
    </section>
  );
}

const USE_CASES = [
  {
    title: "제품 · 엔지니어링 스쿼드",
    description:
      "스프린트·릴리즈 캘린더와 태스크 보드를 연동해 일정 충돌을 최소화하고, QA·배포 체크리스트를 자동 생성합니다."
  },
  {
    title: "클라이언트 프로젝트 팀",
    description:
      "고객사별 워크스페이스를 분리 관리하면서 진행 현황 리포트를 실시간으로 공유하고, SLA 지표를 대시보드로 시각화합니다."
  },
  {
    title: "운영 · CS 조직",
    description:
      "반복 이슈를 자동 티켓화하고, 권한 매트릭스로 외부 파트너 접근을 제어해 확장 가능한 지원 프로세스를 구축합니다."
  }
] as const;

function UseCaseSection() {
  return (
    <section id="use-cases" className="space-y-8">
      <div className="mx-auto max-w-3xl space-y-3 text-center">
        <span className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white dark:bg-white/10 dark:text-white">
          OPERATION PLAYBOOK
        </span>
        <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Trackly 활용 시나리오</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          다양한 조직이 Trackly를 통해 프로젝트, 일정, 커뮤니케이션을 통합 운영합니다. 아래 시나리오는 베타 고객과의 협업을
          통해 검증된 실사용 사례입니다.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {USE_CASES.map((useCase) => (
          <Card
            key={useCase.title}
            className="border-slate-200/80 bg-gradient-to-br from-white via-white/90 to-slate-50/60 transition-colors duration-300 dark:border-white/10 dark:bg-white/5"
          >
            <CardBody className="gap-3">
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{useCase.title}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{useCase.description}</p>
            </CardBody>
          </Card>
        ))}
      </div>
      <div className="mx-auto max-w-4xl rounded-2xl border border-brand/40 bg-brand/10 px-6 py-5 text-center text-sm text-brand dark:border-brand/60 dark:bg-brand/20 dark:text-brand-light">
        베타 기간에는 자동화 레시피, 고급 권한 매트릭스, 실시간 인사이트 모듈을 제한 없이 사용할 수 있으며, 고객 성공팀이
        워크플로우 설계 세션을 무료로 지원합니다.
      </div>
    </section>
  );
}

type PricingPlan = {
  name: string;
  price: string;
  description: string;
  highlight?: boolean;
};

const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Starter (출시 예정)",
    price: "₩0 /멤버·월",
    description: "개인 프로젝트 또는 파일럿 팀에게 적합한 기본 캘린더·보드 기능"
  },
  {
    name: "Pro (출시 예정)",
    price: "₩19,000 /멤버·월",
    description: "자동화, 고급 권한, 인사이트 리포트, 통합 관리 기능을 포함한 핵심 플랜",
    highlight: true
  },
  {
    name: "Enterprise",
    price: "견적 상담",
    description: "SAML SSO, 감사 로그, 데이터 레지던시 등 엔터프라이즈 요구에 맞춘 맞춤형 계약"
  }
];

function PricingOverviewSection() {
  return (
    <section id="pricing" className="space-y-8">
      <div className="mx-auto max-w-3xl space-y-3 text-center">
        <span className="inline-flex items-center justify-center rounded-full bg-emerald-500/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200">
          BETA BENEFIT
        </span>
        <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">요금제 & 베타 혜택</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          출시 후에는 워크스페이스 규모와 보안 요구에 맞춰 요금제를 선택할 수 있습니다. 현재는 모든 계정이 PRO 권한으로
          동작하며, 정식 서비스 전 전환에 대한 안내를 사전에 드립니다.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {PRICING_PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={`border px-5 py-6 transition-colors duration-300 ${
              plan.highlight
                ? "border-brand bg-brand/10 text-brand dark:border-brand/60 dark:bg-brand/15 dark:text-brand-light"
                : "border-slate-200/80 bg-white/90 dark:border-white/10 dark:bg-white/5"
            }`}
          >
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">{plan.price}</p>
              <p className={`text-xl font-semibold ${plan.highlight ? "text-brand dark:text-brand-light" : "text-slate-900 dark:text-white"}`}>
                {plan.name}
              </p>
              <p
                className={`text-sm ${
                  plan.highlight ? "text-brand dark:text-brand-light" : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {plan.description}
              </p>
            </div>
          </Card>
        ))}
      </div>
      <div className="mx-auto max-w-4xl space-y-3 rounded-2xl border border-emerald-400/40 bg-emerald-100/60 px-6 py-5 text-center text-sm text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
        <p>베타 사용자 전환 혜택</p>
        <p className="text-xs">
          베타 기간에 개설한 워크스페이스는 정식 출시 후 90일간 PRO 요금이 자동 연장되며, 아카이브 없이 모든 데이터와 자동화
          설정을 그대로 유지합니다. 엔터프라이즈 기능에 관심 있는 경우 별도 상담을 예약해 주세요.
        </p>
      </div>
    </section>
  );
}

type WorkspacePreviewProps = {
  columns: DashboardBoardColumn[];
  schedule: DashboardSchedule[];
  loading?: boolean;
};

const COLUMN_STYLES = [
  {
    border: "border-sky-200 dark:border-sky-500/30",
    gradient: "from-sky-100 via-white to-white dark:from-sky-500/20 dark:via-slate-900 dark:to-transparent"
  },
  {
    border: "border-indigo-200 dark:border-indigo-500/30",
    gradient: "from-indigo-100 via-white to-white dark:from-indigo-500/20 dark:via-slate-900 dark:to-transparent"
  },
  {
    border: "border-emerald-200 dark:border-emerald-500/30",
    gradient: "from-emerald-100 via-white to-white dark:from-emerald-500/20 dark:via-slate-900 dark:to-transparent"
  }
];

const SCHEDULE_THEME_CLASS: Record<string, string> = {
  FOCUS: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200",
  CUSTOMER: "bg-coral/10 text-coral dark:bg-coral/20 dark:text-coral",
  WORKSHOP: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200"
};

function WorkspacePreview({ columns, schedule, loading = false }: WorkspacePreviewProps) {
  return (
    <div className="glass grid gap-6 border border-slate-200/80 bg-white/80 p-6 transition-colors duration-300 dark:border-white/10 dark:bg-white/5 lg:grid-cols-[240px_minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">팀 일정</h3>
        <TooltipProvider>
          <ul className="flex flex-col gap-3">
            {schedule.map((item) => (
              <li key={item.time} className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs text-slate-400 dark:text-slate-500">{item.time}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.context}</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={`mt-2 inline-flex cursor-help rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        SCHEDULE_THEME_CLASS[item.theme] ?? "bg-slate-200 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300"
                      }`}
                    >
                      {item.theme.toLowerCase()}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs text-muted-foreground">{item.title} · {item.context}</p>
                  </TooltipContent>
                </Tooltip>
              </li>
            ))}
            {schedule.length === 0 && !loading ? (
              <li className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
                예정된 일정이 없습니다.
              </li>
            ) : null}
          </ul>
        </TooltipProvider>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">보드</h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">드래그 & 드롭</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {columns.map((column, index) => {
            const style = COLUMN_STYLES[index % COLUMN_STYLES.length];
            return (
              <div
                key={`${column.title}-${index}`}
                className={`flex flex-col gap-3 rounded-2xl border bg-gradient-to-br p-4 transition-colors duration-300 ${style.border} ${style.gradient}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{column.title}</p>
                  <span className="text-xs text-slate-500 dark:text-slate-300">{column.badge}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {column.tasks.map((task) => (
                    <div key={task.title} className="rounded-xl border border-slate-200 bg-white px-3 py-2 transition-colors duration-300 dark:border-white/10 dark:bg-white/5">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{task.title}</p>
                      {task.assignee ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {task.assignee}
                          {task.due ? ` · ${task.due}` : ""}
                        </p>
                      ) : null}
                      {task.tag ? (
                        <Badge className="mt-2 bg-brand/15 text-[11px] text-brand dark:bg-brand/20">
                          {task.tag}
                        </Badge>
                      ) : null}
                    </div>
                  ))}
                  {column.tasks.length === 0 && !loading ? (
                    <div className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
                      등록된 태스크가 없습니다.
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">워크플로우</h3>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 transition-colors duration-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <p className="font-semibold text-slate-900 dark:text-white">AI Assist</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            자동 분류와 예상 리소스 소모량을 제안해 팀장의 결정을 돕습니다. 회의 없는 프로젝트 조율을 목표로 합니다.
          </p>
          <div className="mt-4 flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>• 일정 충돌 감지 및 대안 추천</span>
            <span>• 워크로드 과부하 알림</span>
            <span>• 문서 생성 템플릿 바로가기</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsPreview() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors duration-300 dark:border-white/10 dark:bg-white/5">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">버든 차트</p>
        <div className="mt-4 h-32 rounded-xl bg-gradient-to-br from-sky-100 via-white to-transparent dark:from-sky-500/20 dark:via-transparent">
          <div className="h-full bg-[linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px)] bg-[length:16px_100%] dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)]" />
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">지난 4주 대비 처리 속도가 18% 향상되었습니다.</p>
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors duration-300 dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">워크로드 히트맵</p>
          <div className="mt-4 grid grid-cols-7 gap-2 text-[10px] text-slate-400 dark:text-slate-500">
            {Array.from({ length: 21 }).map((_, index) => (
              <span
                key={index}
                className="aspect-square rounded-sm bg-gradient-to-br from-sky-200 to-transparent dark:from-sky-500/30"
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">하이라이트된 날짜는 작업 집중도가 높은 구간입니다.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors duration-300 dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">SLA 추이</p>
          <div className="mt-4 h-20 rounded-xl bg-gradient-to-b from-coral/20 to-transparent">
            <div className="h-full bg-[linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[length:12px_100%] dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)]" />
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">고객 커뮤니케이션 SLA 95% 이상 충족.</p>
        </div>
      </div>
    </div>
  );
}

type RoadmapCardProps = {
  quarter: string;
  headline: string;
  bullets: string[];
};

function RoadmapCard({ quarter, headline, bullets }: RoadmapCardProps) {
  return (
    <div className="glass flex flex-col gap-3 border border-slate-200/80 p-5 transition-colors duration-300 dark:border-white/10">
      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">{quarter}</span>
      <p className="text-lg font-semibold text-slate-900 dark:text-white">{headline}</p>
      <ul className="flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400">
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </div>
  );
}
