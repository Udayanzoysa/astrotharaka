import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://astrotharaka.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = [
    "",
    "/shop",
    "/subscription",
    "/login",
    "/register",
    "/contact",
    "/terms",
    "/privacy",
    "/refund",
  ];

  return paths.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
