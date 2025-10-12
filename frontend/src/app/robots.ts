import type { MetadataRoute } from "next";

const siteUrl = "https://trackly.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/onboarding", "/pricing", "/guide", "/use-cases"],
        disallow: ["/api", "/auth", "/oauth", "/projects", "/mypage", "/admin"]
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl
  };
}
