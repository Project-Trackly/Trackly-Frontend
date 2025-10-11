"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { tokenStorage } from "@/lib/token-storage";

function parseHash(hash: string) {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.substring(1) : hash);
  return {
    accessToken: params.get("access_token"),
    refreshToken: params.get("refresh_token")
  };
}

export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const { accessToken, refreshToken } = parseHash(window.location.hash);

    if (accessToken && refreshToken) {
      tokenStorage.setTokens(accessToken, refreshToken);
      router.replace("/?profile=needs");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-slate-100 text-slate-700 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-200">
      <div className="glass border border-slate-200/80 px-6 py-4 text-sm text-slate-600 dark:border-white/10 dark:text-slate-200">
        소셜 로그인 처리 중입니다...
      </div>
    </main>
  );
}
