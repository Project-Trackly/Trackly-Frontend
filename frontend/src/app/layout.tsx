import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const siteUrl = "https://trackly.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Trackly",
    template: "%s | Trackly"
  },
  description:
    "Trackly는 캘린더와 보드를 통합한 하이브리드 워크스페이스로 프로젝트 일정과 실행을 한 화면에서 조율하도록 돕는 SaaS입니다.",
  keywords: [
    "Trackly",
    "프로젝트 관리",
    "워크스페이스",
    "캘린더 보드",
    "프로젝트 플래너",
    "팀 협업",
    "프로젝트 일정 관리",
    "SaaS"
  ],
  alternates: {
    canonical: "/",
    languages: {
      ko: "/",
      en: "/en"
    }
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Trackly – 프로젝트 팀을 위한 하이브리드 워크스페이스",
    siteName: "Trackly",
    description:
      "Trackly는 일정과 태스크를 한 화면에 연결하고 자동화·권한·인사이트 기능을 제공해 프로젝트 팀의 운영을 단순화합니다.",
    images: [
      {
        url: `${siteUrl}/og-trackly.png`,
        width: 1200,
        height: 630,
        alt: "Trackly Workspace Preview"
      }
    ],
    locale: "ko_KR"
  },
  twitter: {
    card: "summary_large_image",
    title: "Trackly – 프로젝트 팀을 위한 하이브리드 워크스페이스",
    description:
      "캘린더와 보드를 동기화하고 자동화·권한 기능으로 프로젝트를 효율적으로 운영하세요.",
    images: [`${siteUrl}/og-trackly.png`]
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }]
  },
  category: "business"
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
