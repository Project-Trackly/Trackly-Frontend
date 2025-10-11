export const ACCESS_TOKEN_KEY = "oauth-module.accessToken";
export const REFRESH_TOKEN_KEY = "oauth-module.refreshToken";

export const tokenStorage = {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setTokens(accessToken: string, refreshToken: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clearTokens() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};
