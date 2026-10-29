"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useUi } from "@/components/providers/ui-provider";
import { apiRequest } from "@/lib/api";
import { getApiUrl } from "@/lib/env";
import type { BlogPost, BlogListResponse, Language } from "@/lib/types";

function resolveImageUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const apiUrl = getApiUrl();
  const root = apiUrl.replace(/\/api\/v1$/, "");
  if (url.startsWith("/")) return `${root}${url}`;
  return `${apiUrl}/${url}`;
}

const CATEGORIES = [
  { id: "ALL", labelEn: "All Topics", labelSi: "සියලු ලිපි", labelTa: "அனைத்தும்" },
  { id: "Astrology", labelEn: "Astrology", labelSi: "ජ්‍යෝතිෂ්‍ය මඟපෙන්වීම්", labelTa: "ஜோதிடம்" },
  { id: "Planetary Transits", labelEn: "Planetary Transits", labelSi: "ග්‍රහ මාරු සහ අපල", labelTa: "கிரகப் பெயர்ச்சி" },
  { id: "Horoscope & Lagna", labelEn: "Horoscope & Lagna", labelSi: "ලග්න සහ පලාපල", labelTa: "ராசி பலன்கள்" },
  { id: "Porondam & Marriage", labelEn: "Porondam & Marriage", labelSi: "පොරොන්දම් සහ විවාහය", labelTa: "பொருத்தம்" },
  { id: "Baby Names & Nakshatra", labelEn: "Baby Names & Nakshatra", labelSi: "නම් තැබීම සහ නැකත්", labelTa: "பெயரிடல்" },
];

export default function BlogsPage() {
  const { language } = useUi();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Preferred language for display from global ui-provider
  const displayLang = language || "si";

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams();
        params.set("limit", "24");
        if (selectedCategory !== "ALL") params.set("category", selectedCategory);
        if (searchQuery.trim()) params.set("q", searchQuery.trim());

        const res = await apiRequest<BlogListResponse>(`/blogs?${params.toString()}`);
        setBlogs(res.items || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load blog posts");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedCategory, searchQuery]);

  // Helper to pick localized title
  const getTitle = (blog: BlogPost) => {
    if (displayLang === "si" && blog.titleSi) return blog.titleSi;
    if (displayLang === "ta" && blog.titleTa) return blog.titleTa;
    return blog.titleEn;
  };

  // Helper to pick localized excerpt
  const getExcerpt = (blog: BlogPost) => {
    if (displayLang === "si" && blog.excerptSi) return blog.excerptSi;
    if (displayLang === "ta" && blog.excerptTa) return blog.excerptTa;
    return blog.excerptEn || "";
  };

  const featuredPost = useMemo(() => {
    return blogs.length > 0 ? blogs[0] : null;
  }, [blogs]);

  const remainingPosts = useMemo(() => {
    return blogs.length > 1 ? blogs.slice(1) : [];
  }, [blogs]);

  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-ink">
      {/* Subtle cosmic background glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-indigo-900/10 to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-3.5 mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1 text-xs font-semibold text-accent backdrop-blur-md">
            <span>✨</span>
            <span>
              {displayLang === "si"
                ? "ජ්‍යෝතිෂ්‍ය දැනුම සහ ලිපි පෙළ"
                : displayLang === "ta"
                ? "ஜோதிடக் கட்டுரைகள் மற்றும் தகவல்கள்"
                : "Vedic Astrology Insights & Guides"}
            </span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-accent">
            {displayLang === "si"
              ? "තාරකා ලිපි සහ විග්‍රහයන්"
              : displayLang === "ta"
              ? "தாரகா வலைப்பதிவு மற்றும் கட்டுரைகள்"
              : "Taraka Astrology Blog"}
          </h1>

          <p className="text-sm sm:text-base text-muted leading-relaxed">
            {displayLang === "si"
              ? "වෛදික ජ්‍යෝතිෂ්‍යයේ ගැඹුරු රහස්, ග්‍රහ මාරු, ලග්න පලාපල සහ ජීවිතයට ආලෝකය දෙන ප්‍රායෝගික ජ්‍යෝතිෂ්‍ය දැනුම මෙතැනින් කියවන්න."
              : displayLang === "ta"
              ? "வேத ஜோதிடத்தின் ஆழமான ரகசியங்கள், கிரகப் பெயர்ச்சிகள் மற்றும் வாழ்க்கைக்கான வழிகாட்டல்களை அறிந்து கொள்ளுங்கள்."
              : "Explore timeless Vedic astrology insights, planetary transits, horoscope guidance, and practical cosmic wisdom curated by our astrologers."}
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="mb-10 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              {CATEGORIES.map((cat) => {
                const label =
                  displayLang === "si"
                    ? cat.labelSi
                    : displayLang === "ta"
                    ? cat.labelTa
                    : cat.labelEn;
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                      isSelected
                        ? "bg-accent text-black font-semibold shadow-sm"
                        : "border border-line/70 bg-[color-mix(in_srgb,var(--bg-card)_70%,black)] text-muted hover:text-ink hover:border-accent/40"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Search Box */}
            <div className="w-full md:w-72 shrink-0">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  displayLang === "si"
                    ? "ලිපි සොයන්න..."
                    : displayLang === "ta"
                    ? "கட்டுரைகளைத் தேடுங்கள்..."
                    : "Search articles..."
                }
                className="w-full rounded-full border border-line bg-black/40 px-4 py-2 text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-center text-xs text-red-400 my-8">
            {error}
          </div>
        ) : null}

        {/* Loading State */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-accent border-r-transparent mb-3" />
            <p className="text-xs text-muted">
              {displayLang === "si" ? "ලිපි ලබා ගනිමින් පවතී..." : "Loading astrology articles..."}
            </p>
          </div>
        ) : blogs.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border border-line/60 bg-[color-mix(in_srgb,var(--bg-card)_50%,black)] py-16 text-center max-w-xl mx-auto px-4">
            <span className="text-4xl">📜</span>
            <h2 className="mt-3 font-heading text-lg font-bold text-accent">
              {displayLang === "si" ? "ලිපි හමු නොවීය" : "No Articles Found"}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {searchQuery
                ? displayLang === "si"
                  ? "ඔබ සෙවූ වචන සඳහා ගැලපෙන ලිපි නොමැත. වෙනත් වචනයක් උත්සාහ කරන්න."
                  : "No posts matched your search criteria. Try a different term or clear the filter."
                : displayLang === "si"
                ? "නව ලිපි ළඟදීම පළ කරනු ඇත. රැඳී සිටින්න!"
                : "New astrology articles will be published soon. Stay tuned!"}
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Featured Hero Article */}
            {featuredPost && (
              <div className="relative group overflow-hidden rounded-2xl border border-line bg-[color-mix(in_srgb,var(--bg-card)_90%,#111c33)] transition hover:border-accent/60 shadow-lg">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  {/* Image */}
                  <div className="relative lg:col-span-7 aspect-[16/9] lg:aspect-auto min-h-[260px] lg:min-h-[360px] overflow-hidden bg-black/50">
                    {featuredPost.featuredImage ? (
                      <Image
                        src={resolveImageUrl(featuredPost.featuredImage)}
                        alt={getTitle(featuredPost)}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-indigo-950/60 to-amber-950/40 text-3xl">
                        ✨ Taraka
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-black uppercase tracking-wider shadow">
                        Featured
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span className="text-accent font-semibold">{featuredPost.category}</span>
                        <span>•</span>
                        <span>⏱ {featuredPost.readingTime || 3} min read</span>
                      </div>

                      <Link href={`/blogs/${featuredPost.slug}`}>
                        <h2 className="font-heading text-xl sm:text-2xl font-bold text-ink group-hover:text-accent transition leading-tight">
                          {getTitle(featuredPost)}
                        </h2>
                      </Link>

                      <p className="text-xs sm:text-sm text-muted line-clamp-3 leading-relaxed">
                        {getExcerpt(featuredPost)}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-line/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span>✍️ {featuredPost.authorName || "Taraka Team"}</span>
                        <span>•</span>
                        <span>
                          {featuredPost.publishedAt
                            ? new Date(featuredPost.publishedAt).toLocaleDateString()
                            : ""}
                        </span>
                      </div>

                      <Link
                        href={`/blogs/${featuredPost.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                      >
                        {displayLang === "si"
                          ? "සම්පූර්ණ ලිපිය කියවන්න →"
                          : displayLang === "ta"
                          ? "முழுமையாகப் படிக்க →"
                          : "Read Full Article →"}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid of Remaining Posts */}
            {remainingPosts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {remainingPosts.map((blog) => (
                  <article
                    key={blog.id}
                    className="group flex flex-col rounded-xl border border-line bg-[color-mix(in_srgb,var(--bg-card)_70%,#0e172a)] overflow-hidden transition hover:border-accent/50 hover:shadow-md"
                  >
                    {/* Thumbnail */}
                    <Link
                      href={`/blogs/${blog.slug}`}
                      className="relative block aspect-[16/10] w-full overflow-hidden bg-black/40"
                    >
                      {blog.featuredImage ? (
                        <Image
                          src={resolveImageUrl(blog.featuredImage)}
                          alt={getTitle(blog)}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-black/60 text-xl text-muted">
                          ✨
                        </div>
                      )}
                      <span className="absolute top-2.5 left-2.5 rounded-md bg-black/70 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-accent">
                        {blog.category}
                      </span>
                    </Link>

                    {/* Content */}
                    <div className="flex flex-1 flex-col justify-between p-5 space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[11px] text-muted">
                          <span>⏱ {blog.readingTime || 3} min</span>
                          <span>•</span>
                          <span>
                            {blog.publishedAt
                              ? new Date(blog.publishedAt).toLocaleDateString()
                              : ""}
                          </span>
                        </div>

                        <Link href={`/blogs/${blog.slug}`}>
                          <h3 className="font-heading text-base font-bold text-ink group-hover:text-accent transition line-clamp-2 leading-snug">
                            {getTitle(blog)}
                          </h3>
                        </Link>

                        <p className="text-xs text-muted line-clamp-3 leading-relaxed">
                          {getExcerpt(blog)}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-line/60 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-muted truncate max-w-[150px]">
                          {blog.authorName || "Taraka Team"}
                        </span>
                        <Link
                          href={`/blogs/${blog.slug}`}
                          className="text-xs font-semibold text-accent hover:underline shrink-0"
                        >
                          {displayLang === "si" ? "කියවන්න →" : "Read →"}
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
