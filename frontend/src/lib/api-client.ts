import { tokenStorage } from "./token-storage";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

async function refreshTokens(): Promise<boolean> {
  if (!API_BASE_URL) {
    tokenStorage.clearTokens();
    return false;
  }

  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    tokenStorage.clearTokens();
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      tokenStorage.clearTokens();
      return false;
    }

    const payload = (await response.json()) as ApiResponse<TokenResponse>;
    if (!payload.success || !payload.data) {
      tokenStorage.clearTokens();
      return false;
    }

    tokenStorage.setTokens(payload.data.accessToken, payload.data.refreshToken);
    return true;
  } catch (error) {
    tokenStorage.clearTokens();
    return false;
  }
}

export async function apiFetch(input: string, init?: RequestInit, retry = true): Promise<Response> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }

  const headers = new Headers(init?.headers ?? {});
  const accessToken = tokenStorage.getAccessToken();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${input}`, {
    ...init,
    headers
  });

  if (response.status === 401 && retry && tokenStorage.getRefreshToken()) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return apiFetch(input, init, false);
    }
  }

  return response;
}

export function clearAuthTokens() {
  tokenStorage.clearTokens();
}

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};
