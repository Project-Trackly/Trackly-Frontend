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
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefreshProfile = async () => {
    if (!tokenStorage.getAccessToken()) {
      setProfileFetchError("로그인이 필요합니다.");
      return;
    }
    setRefreshing(true);
    try {
      const response = await apiFetch("/api/auth/me");
      const payload = (await response.json()) as ApiResponse<UserProfile | null>;
      if (response.ok && payload.success && payload.data) {
        setUser(payload.data);
        setProfileFetchError(null);
      } else if (response.status === 401) {
        setUser(null);
        setProfileFetchError(null);
      } else {
        setProfileFetchError(payload.message ?? "프로필 정보를 불러오지 못했습니다.");
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-slate-100 text-slate-900 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_70%)] opacity-70 dark:bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.25),_transparent_65%)]" aria-hidden />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-12 sm:py-16 lg:py-20">
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
            <a href="#workspace" className="hidden text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 hover:text-slate-900 dark:hover:text-white sm:inline">
              Workspace
            </a>
            <a href="#analytics" className="hidden text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 hover:text-slate-900 dark:hover:text-white sm:inline">
              Insights
            </a>
            <a href="#story" className="hidden text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 hover:text-slate-900 dark:hover:text-white sm:inline">
              Roadmap
            </a>
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

        <section className="grid-gap-0 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr),320px]">
          <div className="space-y-10">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 shadow-sm backdrop-blur-sm dark:bg-white/5 dark:text-slate-300">
                PROJECT PLANNING · KOREA FIRST · GLOBAL READY
              </span>
              <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl dark:text-white">
                팀의 일정과 실행을 한 화면에서 조율하는 <span className="text-brand">Trackly</span>
              </h1>
              <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300">
                캘린더와 태스크 보드를 넘나드는 하이브리드 워크스페이스로 일정 충돌을 줄이고 팀의 리소스를 선명하게 보여줍니다.
                OAuth2 기반 온보딩으로 누구나 몇 초 만에 합류할 수 있어요.
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
                <Button onClick={handleRefreshProfile} loading={refreshing}>
                  데이터 새로고침
                </Button>
              )}
              <span className="text-xs uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                SOC2 PREP · SSO ROADMAP · MULTILINGUAL
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

          <div className="space-y-6">
            {user ? (
              <ProfileSummary
                user={user}
                onRefresh={handleRefreshProfile}
                refreshing={refreshing}
                onLogout={handleLogout}
              />
            ) : (
              <QuickStartCard />
            )}
            {!loadingProfile && !user && profileFetchError ? (
              <div className="glass border border-coral/30 px-5 py-4 text-sm text-coral">
                {profileFetchError}
              </div>
            ) : null}
          </div>
        </section>

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

        <footer className="flex flex-col items-start gap-3 border-t border-slate-200 pt-8 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Trackly Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-slate-700 dark:hover:text-white">
              로그인
            </Link>
            <Link href="/register" className="hover:text-slate-700 dark:hover:text-white">
              회원가입
            </Link>
            <a href="#analytics" className="hover:text-slate-700 dark:hover:text-white">
              기능 살펴보기
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

type ProfileSummaryProps = {
  user: UserProfile;
  onRefresh: () => void;
  onLogout: () => void;
  refreshing: boolean;
};

function ProfileSummary({ user, onRefresh, onLogout, refreshing }: ProfileSummaryProps) {
  return (
    <Card>
      <CardHeader
        title={`안녕하세요, ${user.nickname || user.name}님`}
        subtitle="Trackly 워크스페이스에 연결되었습니다."
        action={
          <Button variant="outline" onClick={onLogout}>
            로그아웃
          </Button>
        }
      />
      <CardBody className="gap-5">
        <div className="grid gap-4">
          <ProfileField label="이메일" value={user.email} />
          <ProfileField label="생년월일" value={new Date(user.birthday).toLocaleDateString()} />
          <ProfileField label="자기소개" value={user.introduce || "소개를 추가해 보세요."} multiLine />
        </div>
        <Button variant="secondary" onClick={onRefresh} loading={refreshing}>
          프로필 동기화
        </Button>
      </CardBody>
    </Card>
  );
}

type ProfileFieldProps = {
  label: string;
  value: string;
  multiLine?: boolean;
};

function ProfileField({ label, value, multiLine = false }: ProfileFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">{label}</span>
      <span
        className={`rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition-colors duration-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 ${
          multiLine ? "min-h-[72px]" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function QuickStartCard() {
  return (
    <Card>
      <CardHeader
        title="Trackly 시작 가이드"
        subtitle="OAuth 기반 소셜 로그인으로 30초 만에 팀을 초대하세요."
      />
      <CardBody className="gap-5">
        <ol className="flex flex-col gap-4 text-sm text-slate-600 dark:text-slate-300">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
              1
            </span>
            <p>
              Google 또는 Kakao로 로그인하면 토큰이 즉시 발급되고, 리디렉션된 대시보드에서 워크스페이스를 설정합니다.
            </p>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
              2
            </span>
            <p>팀 구성원을 초대하고 역할을 지정해 프로젝트 참여 범위를 제어하세요.</p>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
              3
            </span>
            <p>캘린더와 보드에서 태스크를 드래그&드롭하며 일정 충돌 없이 실행 계획을 세웁니다.</p>
          </li>
        </ol>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-brand text-sm font-semibold text-white shadow-glow transition hover:bg-brand-light"
          >
            소셜 계정으로 로그인
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            온보딩 계속하기
          </Link>
        </div>
      </CardBody>
    </Card>
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
