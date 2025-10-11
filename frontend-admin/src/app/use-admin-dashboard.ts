"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminDashboardResponse } from "./types";
import { apiFetch, type ApiResponse } from "@/lib/api-client";

export function useAdminDashboard(enabled = true) {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!enabled) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/admin/dashboard");

      if (!response.ok) {
        const message = await extractErrorMessage(response);
        throw new Error(message ?? "관리자 대시보드 데이터를 불러오지 못했습니다.");
      }

      const payload = (await response.json()) as ApiResponse<AdminDashboardResponse>;
      if (!payload.success || !payload.data) {
        throw new Error(payload.message ?? "관리자 대시보드 데이터를 불러오지 못했습니다.");
      }

      setData(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      fetchDashboard();
    } else {
      setLoading(false);
      setData(null);
    }
  }, [enabled, fetchDashboard]);

  return {
    data,
    loading,
    error,
    refresh: fetchDashboard
  } as const;
}

async function extractErrorMessage(response: Response) {
  try {
    const parsed = (await response.json()) as { message?: string };
    return parsed.message;
  } catch (error) {
    return null;
  }
}
