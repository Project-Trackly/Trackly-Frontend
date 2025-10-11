"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Form, TextField } from "@repo/ui";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

type RegisterFormState = {
  email: string;
  name: string;
  nickname: string;
  password: string;
  confirmPassword: string;
  gender: string;
  birthday: string;
  introduce: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<RegisterFormState>({
    email: "",
    name: "",
    nickname: "",
    password: "",
    confirmPassword: "",
    gender: "",
    birthday: "",
    introduce: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (formState.password !== formState.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formState.email,
          name: formState.name,
          nickname: formState.nickname,
          password: formState.password,
          gender: formState.gender,
          birthday: formState.birthday,
          introduce: formState.introduce
        })
      });

      const payload = (await response.json()) as ApiResponse<number | null>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "회원가입에 실패했습니다.");
      }

      router.push("/login");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-slate-100 text-slate-900 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[300px] bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.25),_transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.2),_transparent_60%)]" />
      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[minmax(0,1fr),480px] lg:py-20">
        <section className="space-y-10 text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm backdrop-blur-sm dark:bg-white/5 dark:text-slate-400">
            TASKSCAPE SIGN-UP
          </span>
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 dark:text-white">
              팀과 프로젝트를 위한 Trackly 계정을 생성하세요
            </h1>
            <p className="max-w-xl text-base">
              캘린더와 보드를 한 화면에서 관리하고, 역할 기반 권한으로 보안을 유지하세요. Trackly는 한국 사용자 경험을 우선으로 하면서 글로벌 확장을 준비한 워크스페이스입니다.
            </p>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5">
              <p className="font-semibold text-slate-900 dark:text-white">실행 중심의 보드</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">캘린더와 카드를 동기화해 일정 충돌을 줄입니다.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5">
              <p className="font-semibold text-slate-900 dark:text-white">엔터프라이즈 보안</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">SSO/SAML 로드맵과 감사 로그로 감사 대응을 준비하세요.</p>
            </div>
          </div>
        </section>

        <Card className="self-start">
          <CardHeader
            title="Trackly 계정 만들기"
            subtitle="필수 정보를 입력하면 곧바로 워크스페이스를 구성할 수 있습니다."
          />
          <CardBody>
            <Form onSubmit={handleSubmit}>
              <div className="grid gap-5 lg:grid-cols-2">
                <TextField
                  label="이메일"
                  name="email"
                  type="email"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, email: event.target.value.trim() }))
                  }
                  required
                />
                <TextField
                  label="닉네임"
                  name="nickname"
                  value={formState.nickname}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, nickname: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <TextField
                  label="이름"
                  name="name"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="gender">
                    성별
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-white/10 dark:bg-white/10 dark:text-slate-100"
                    value={formState.gender}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, gender: event.target.value }))
                    }
                    required
                  >
                    <option value="" disabled>
                      선택해 주세요
                    </option>
                    <option value="MALE">남성</option>
                    <option value="FEMALE">여성</option>
                    <option value="OTHER">기타</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <TextField
                  label="비밀번호"
                  name="password"
                  type="password"
                  value={formState.password}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, password: event.target.value }))
                  }
                  required
                />
                <TextField
                  label="비밀번호 확인"
                  name="confirmPassword"
                  type="password"
                  value={formState.confirmPassword}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, confirmPassword: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <TextField
                  label="생년월일"
                  name="birthday"
                  type="date"
                  value={formState.birthday}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, birthday: event.target.value }))
                  }
                  required
                />
                <div className="flex flex-col gap-1 lg:col-span-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="introduce">
                    자기소개
                  </label>
                  <textarea
                    id="introduce"
                    name="introduce"
                    className="min-h-[140px] rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-white/10 dark:bg-white/10 dark:text-slate-100"
                    value={formState.introduce}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, introduce: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              {error ? (
                <p className="rounded-lg border border-coral/40 bg-coral/10 px-4 py-2 text-sm text-coral">{error}</p>
              ) : null}
              <div className="flex flex-col gap-3 pt-2">
                <Button type="submit" loading={submitting}>
                  Trackly 가입하기
                </Button>
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  이미 계정이 있으신가요?
                </button>
              </div>
            </Form>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
