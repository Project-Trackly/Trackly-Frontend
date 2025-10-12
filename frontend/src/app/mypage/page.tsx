"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Form, TextField } from "@repo/ui";
import { Badge } from "@/components/ui/badge";
import { apiFetch, clearAuthTokens, type ApiResponse } from "@/lib/api-client";
import { tokenStorage } from "@/lib/token-storage";

type ApiUserProfile = {
  id: number;
  email: string;
  name: string | null;
  nickname: string | null;
  gender: string | null;
  birthday: string | null;
  introduce: string | null;
  profileCompleted: boolean;
};

type NormalizedUserProfile = {
  id: number;
  email: string;
  name: string;
  nickname: string;
  gender: string;
  birthday: string;
  introduce: string;
  profileCompleted: boolean;
};

type ProfileFormState = {
  email: string;
  name: string;
  nickname: string;
  gender: string;
  birthday: string;
  introduce: string;
};

const initialState: ProfileFormState = {
  email: "",
  name: "",
  nickname: "",
  gender: "",
  birthday: "",
  introduce: ""
};

export default function MyPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<NormalizedUserProfile | null>(null);
  const [formState, setFormState] = useState<ProfileFormState>(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      if (!tokenStorage.getAccessToken()) {
        router.replace("/login?next=/mypage");
        return;
      }
      try {
        const response = await apiFetch("/api/auth/me", { signal: controller.signal });
        if (response.status === 401) {
          clearAuthTokens();
          router.replace("/login?next=/mypage");
          return;
        }
        const payload = (await response.json()) as ApiResponse<ApiUserProfile | null>;
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.message ?? "프로필 정보를 불러오지 못했습니다.");
        }
        const normalized = normalizeProfile(payload.data);
        setProfile(normalized);
        setFormState(toFormState(normalized));
        setError(null);
      } catch (loadError) {
        if (!(loadError instanceof DOMException && loadError.name === "AbortError")) {
          setError("프로필 정보를 불러오지 못했습니다. 다시 시도해 주세요.");
        }
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();

    return () => controller.abort();
  }, [router]);

  const hasChanges = useMemo(() => {
    if (!profile) {
      return false;
    }
    return (
      (profile.name ?? "") !== formState.name ||
      (profile.nickname ?? "") !== formState.nickname ||
      normalizeDate(profile.birthday) !== formState.birthday ||
      (profile.gender ?? "") !== formState.gender ||
      (profile.introduce ?? "") !== formState.introduce
    );
  }, [profile, formState]);

  const handleInputChange = (key: keyof ProfileFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.value;
    setFormState((prev) => ({ ...prev, [key]: value }));
    setSuccess(null);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) {
      return;
    }
    setSaving(true);
    setSuccess(null);
    setError(null);

    const payload = {
      name: formState.name.trim(),
      nickname: formState.nickname.trim(),
      gender: formState.gender || null,
      birthday: formState.birthday || null,
      introduce: formState.introduce.trim()
    };

    try {
      let response = await apiFetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 404) {
        response = await apiFetch("/api/users/me", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
      }

      if (response.status === 401) {
        clearAuthTokens();
        router.replace("/login?next=/mypage");
        return;
      }

      const result = (await response.json()) as ApiResponse<ApiUserProfile | null>;
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message ?? "프로필 업데이트에 실패했습니다.");
      }

      const normalized = normalizeProfile(result.data);
      setProfile(normalized);
      setFormState(toFormState(normalized));
      setSuccess("프로필이 업데이트되었습니다.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "프로필을 저장할 수 없습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!profile) {
      return;
    }
    setFormState(toFormState(profile));
    setSuccess(null);
    setError(null);
  };

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
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-slate-50 to-sky-50 text-slate-900 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.2),_transparent_60%)]"
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
                MY PAGE
              </span>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
            <Link href="/projects" className="hover:text-slate-900 dark:hover:text-white">
              내 프로젝트 관리
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr),320px]">
          <Card>
            <CardHeader
              title="프로필 정보"
              subtitle="연락처, 기본 정보, 자기소개를 업데이트해 맞춤 추천을 받아 보세요."
              action={
                profile ? (
                  <Badge
                    className={profile.profileCompleted ? "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200" : "bg-amber-500/20 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"}
                  >
                    {profile.profileCompleted ? "완료" : "추가 입력 필요"}
                  </Badge>
                ) : null
              }
            />
            <CardBody className="gap-6">
              {loading ? (
                <div className="rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-6 text-sm text-slate-400 dark:border-white/10 dark:bg-white/5">
                  프로필 정보를 불러오는 중입니다...
                </div>
              ) : (
                <Form
                  onSubmit={handleSubmit}
                  footer={
                    <div className="flex flex-wrap gap-3">
                      <Button type="submit" loading={saving} disabled={!hasChanges}>
                        변경 사항 저장
                      </Button>
                      <Button type="button" variant="outline" onClick={handleReset} disabled={!hasChanges}>
                        되돌리기
                      </Button>
                    </div>
                  }
                >
                  <TextField label="이메일" name="email" value={formState.email} disabled />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="이름"
                      name="name"
                      value={formState.name}
                      onChange={handleInputChange("name")}
                      required
                    />
                    <TextField
                      label="닉네임"
                      name="nickname"
                      value={formState.nickname}
                      onChange={handleInputChange("nickname")}
                      placeholder="팀원이 쉽게 기억할 별명을 입력하세요."
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="생년월일"
                      name="birthday"
                      type="date"
                      value={formState.birthday}
                      onChange={handleInputChange("birthday")}
                    />
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">성별</label>
                      <select
                        name="gender"
                        value={formState.gender}
                        onChange={handleInputChange("gender")}
                        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 transition-colors duration-200 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                      >
                        <option value="">선택 안 함</option>
                        <option value="MALE">남성</option>
                        <option value="FEMALE">여성</option>
                        <option value="OTHER">기타/직접 입력</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="introduce">
                      자기소개
                    </label>
                    <textarea
                      id="introduce"
                      name="introduce"
                      value={formState.introduce}
                      onChange={handleInputChange("introduce")}
                      rows={5}
                      placeholder="현재 맡고 있는 역할과 협업 선호도를 적어 주세요."
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition-colors duration-200 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                    />
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      자기소개는 팀 대시보드와 온보딩 자동화 추천에 활용됩니다.
                    </p>
                  </div>
                  {error ? (
                    <div className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
                      {error}
                    </div>
                  ) : null}
                  {success ? (
                    <div className="rounded-xl border border-emerald-400/40 bg-emerald-100/60 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                      {success}
                    </div>
                  ) : null}
                </Form>
              )}
            </CardBody>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader
                title="프로필 활용 가이드"
                subtitle="입력한 정보는 개인화 추천과 보드 자동화에만 사용됩니다."
              />
              <CardBody className="gap-4 text-sm text-slate-600 dark:text-slate-300">
                <ul className="flex flex-col gap-3">
                  <li className="rounded-xl border border-slate-200/70 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    이름·닉네임은 워크스페이스 내 멤버 명부와 태스크 카드에 표시됩니다.
                  </li>
                  <li className="rounded-xl border border-slate-200/70 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    생년월일은 법적 식별이 필요한 엔터프라이즈 기능 활성화 시 확인 용도로만 보관됩니다.
                  </li>
                  <li className="rounded-xl border border-slate-200/70 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    자기소개는 워크스페이스 추천과 온보딩 메시지에 활용되어 빠른 팀 매칭을 돕습니다.
                  </li>
                </ul>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="계정 보안"
                subtitle="로그인 이력과 소셜 계정 연결 상태를 점검하세요."
              />
              <CardBody className="gap-4 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">최근 로그인</span>
                  <p className="rounded-xl border border-slate-200/70 bg-white px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100">
                    {profile ? formatAuditTimestamp(profile.id) : "정보 없음"}
                  </p>
                </div>
                <Button variant="secondary" asChild>
                  <Link href="/auth/security">보안 설정 (준비 중)</Link>
                </Button>
              </CardBody>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

function normalizeProfile(profile: ApiUserProfile): NormalizedUserProfile {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name ?? "",
    nickname: profile.nickname ?? "",
    gender: profile.gender ?? "",
    birthday: normalizeDate(profile.birthday),
    introduce: profile.introduce ?? "",
    profileCompleted: profile.profileCompleted
  };
}

function toFormState(profile: NormalizedUserProfile): ProfileFormState {
  return {
    email: profile.email,
    name: profile.name ?? "",
    nickname: profile.nickname ?? "",
    gender: profile.gender ?? "",
    birthday: normalizeDate(profile.birthday),
    introduce: profile.introduce ?? ""
  };
}

function normalizeDate(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().split("T")[0];
}

function formatAuditTimestamp(userId: number) {
  return `#${userId.toString().padStart(4, "0")} · 최근 로그인 기록은 보안 로그에서 확인 예정입니다.`;
}
