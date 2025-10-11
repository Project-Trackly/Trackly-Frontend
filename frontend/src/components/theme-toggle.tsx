"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@repo/ui";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const label = theme === "dark" ? "라이트 모드" : "다크 모드";
  const iconClass = "h-5 w-5";

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50">
      <Button
        type="button"
        variant="outline"
        onClick={() => toggleTheme()}
        className="pointer-events-auto h-12 w-12 rounded-full p-0 shadow-lg backdrop-blur"
        aria-label={label}
      >
        <span className="sr-only">{label}</span>
        {mounted ? (
          theme === "dark" ? (
            <svg
              className={`${iconClass} text-amber-300`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 3v1.5M12 19.5V21M4.219 4.219l1.06 1.06M18.72 18.72l1.06 1.06M3 12h1.5M19.5 12H21M4.219 19.781l1.06-1.06M18.72 5.28l1.06-1.06" />
              <circle cx="12" cy="12" r="4.5" />
            </svg>
          ) : (
            <svg
              className={`${iconClass} text-slate-700`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M21 12.79A9 9 0 0 1 12.21 3 6.75 6.75 0 1 0 21 12.79z" />
            </svg>
          )
        ) : (
          <span className={`${iconClass} animate-pulse rounded-full border border-slate-300 dark:border-slate-600`} aria-hidden />
        )}
      </Button>
    </div>
  );
}
