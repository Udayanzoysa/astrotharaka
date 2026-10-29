import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getApiUrl } from "@/lib/env";
import type { BlogPost } from "@/lib/types";
import { BlogArticleClient } from "./blog-article-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchPost(slug: string): Promise<BlogPost | null> {
  const apiUrl = getApiUrl();
  try {
    const res = await fetch(`${apiUrl}/blogs/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as BlogPost;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);

  if (!post) {
    return {
      title: "Article Not Found | Taraka Astrology",
    };
  }

  const title = post.metaTitleEn || post.titleEn || "Astrology Article";
  const description =
    post.metaDescEn || post.excerptEn || "Read Vedic astrology insights and guidance on Taraka.";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://taraka.lk";
  const articleUrl = `${siteUrl}/blogs/${post.slug}`;

  const images = post.featuredImage
    ? [
        post.featuredImage.startsWith("http")
          ? post.featuredImage
          : `${siteUrl}${post.featuredImage}`,
      ]
    : [`${siteUrl}/brand/taraka-nav-clear.png`];

  return {
    title: `${title} | Taraka Astrology`,
    description,
    keywords: post.keywords ? post.keywords.split(",").map((k) => k.trim()) : undefined,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title,
      description,
      url: articleUrl,
      siteName: "Taraka Astrology",
      type: "article",
      publishedTime: post.publishedAt || post.createdAt,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = await fetchPost(slug);

  if (!post) {
    notFound();
  }

  return <BlogArticleClient initialPost={post} />;
}
