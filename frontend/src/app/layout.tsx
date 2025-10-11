import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: {
    default: "Trackly",
    template: "%s | Trackly"
  },
  description: "Trackly – 프로젝트 플래너 SaaS를 위한 통합 워크스페이스."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <>
            {children}
            <ThemeToggle />
          </>
        </ThemeProvider>
      </body>
    </html>
  );
}
