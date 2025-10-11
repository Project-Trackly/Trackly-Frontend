"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { apiFetch, clearTokens, type ApiResponse, type TokenResponse } from "@/lib/api-client";
import { tokenStorage } from "@/lib/token-storage";

type MeResponse = {
  id: number;
  email: string;
  name: string;
  nickname: string;
  gender: string;
  birthday: string;
  introduce: string;
  profileCompleted: boolean;
  role: string;
};

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: MeResponse }
  | { status: "unauthenticated"; error?: string };

type AdminAuthContextValue = {
  state: AuthState;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const verify = useCallback(async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setState({ status: "unauthenticated" });
      return;
    }

    try {
      const response = await apiFetch("/api/auth/me");
      if (!response.ok) {
        clearTokens();
        setState({ status: "unauthenticated" });
        return;
      }
      const payload = (await response.json()) as ApiResponse<MeResponse>;
      if (!payload.success || !payload.data) {
        clearTokens();
        setState({ status: "unauthenticated", error: payload.message });
        return;
      }
      if (payload.data.role !== "ROLE_ADMIN") {
        clearTokens();
        setState({
          status: "unauthenticated",
          error: "관리자 권한이 없는 계정입니다."
        });
        return;
      }
      setState({ status: "authenticated", user: payload.data });
    } catch (error) {
      clearTokens();
      setState({ status: "unauthenticated", error: "세션을 확인할 수 없습니다." });
    }
  }, []);

  useEffect(() => {
    verify();
  }, [verify]);

  const login = useCallback(async (identifier: string, password: string) => {
    if (!API_BASE_URL) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL가 설정되지 않았습니다.");
    }
    try {
      setState({ status: "loading" });
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ identifier, password })
      });

      if (!response.ok) {
        const message = await extractErrorMessage(response);
        throw new Error(message ?? "로그인에 실패했습니다.");
      }

      const payload = (await response.json()) as ApiResponse<TokenResponse>;
      if (!payload.success || !payload.data) {
        throw new Error(payload.message ?? "로그인에 실패했습니다.");
      }

      tokenStorage.setTokens(payload.data.accessToken, payload.data.refreshToken);
      await verify();
    } catch (error) {
      clearTokens();
      setState({
        status: "unauthenticated",
        error: error instanceof Error ? error.message : "로그인에 실패했습니다."
      });
      throw error;
    }
  }, [verify]);

  const logout = useCallback(() => {
    clearTokens();
    setState({ status: "unauthenticated" });
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({ state, login, logout, refresh: verify }),
    [state, login, logout, verify]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth는 AdminAuthProvider 내에서만 사용할 수 있습니다.");
  }
  return context;
}

async function extractErrorMessage(response: Response) {
  try {
    const parsed = (await response.json()) as { message?: string };
    return parsed.message;
  } catch (error) {
    return null;
  }
}
