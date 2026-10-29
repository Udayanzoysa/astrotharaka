"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { apiRequest } from "@/lib/api";
import type { BlogPost, BlogListResponse, BlogStatus } from "@/lib/types";
import { CONTENT_ADMIN_ROLES, useAdminAccess } from "@/components/admin/use-admin-access";
import { Button } from "@/components/ui/button";

export default function AdminBlogsPage() {
  const { token, loading, denied, allowed } = useAdminAccess({ roles: CONTENT_ADMIN_ROLES });
  const [items, setItems] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBlogs = useCallback(async () => {
    if (!allowed || !token) return;
    try {
      setIsLoading(true);
      setError("");
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "15");
      if (search.trim()) params.set("q", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await apiRequest<BlogListResponse>(`/admin/blogs?${params.toString()}`, {
        token,
      });
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      setError(err?.message || "Failed to load blogs");
    } finally {
      setIsLoading(false);
    }
  }, [allowed, token, page, search, statusFilter]);

  useEffect(() => {
    void loadBlogs();
  }, [loadBlogs]);

  const handleToggleStatus = async (blog: BlogPost) => {
    if (!token) return;
    const nextStatus: BlogStatus = blog.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      await apiRequest(`/admin/blogs/${blog.id}`, {
        method: "PATCH",
        token,
        body: { status: nextStatus },
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === blog.id
            ? {
                ...item,
                status: nextStatus,
                publishedAt: nextStatus === "PUBLISHED" ? new Date().toISOString() : item.publishedAt,
              }
            : item,
        ),
      );
    } catch (err: any) {
      alert(`Could not update status: ${err?.message}`);
    }
  };

  const handleDelete = async (blog: BlogPost) => {
    if (!confirm(`Are you sure you want to delete "${blog.titleEn}"? This cannot be undone.`)) {
      return;
    }
    if (!token) return;
    try {
      await apiRequest(`/admin/blogs/${blog.id}`, {
        method: "DELETE",
        token,
      });
      setItems((prev) => prev.filter((item) => item.id !== blog.id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err: any) {
      alert(`Failed to delete post: ${err?.message}`);
    }
  };

  if (loading) return <p className="text-muted p-4">Checking access…</p>;
  if (denied) return <p className="text-sm text-[var(--danger)] p-4">{denied}</p>;
  if (!allowed) return null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-bold text-accent">Blog Articles & Insights</h1>
          <p className="text-xs text-muted mt-1">
            Publish SEO-friendly astrology articles in 3 languages (English, Sinhala, Tamil).
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/blogs" target="_blank" className="text-xs text-muted hover:text-accent underline flex items-center gap-1">
            View Public Blogs ↗
          </Link>
          <Link href="/admin/blogs/new">
            <Button className="bg-accent text-black font-semibold hover:bg-accent/90 shadow-sm">
              + New Article
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 rounded-xl border border-line bg-[color-mix(in_srgb,var(--bg-card)_60%,black)] p-3">
        <div className="flex-1 w-full relative">
          <input
            type="search"
            placeholder="Search articles by title, slug, or keywords..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-line/70 bg-black/30 px-3.5 py-2 text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-line/50 text-xs shrink-0">
          {(["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-md font-medium transition ${
                statusFilter === s
                  ? "bg-accent/20 text-accent font-semibold shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-400">
          {error}
        </div>
      ) : null}

      {/* Articles Listing */}
      {isLoading ? (
        <p className="text-xs text-muted py-8 text-center">Loading articles…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-line/60 bg-[color-mix(in_srgb,var(--bg-card)_40%,black)] py-12 text-center">
          <p className="text-base font-semibold text-accent">No articles found</p>
          <p className="text-xs text-muted mt-1">
            {search ? "Try adjusting your search terms or filters." : "Create your first trilingual blog post now!"}
          </p>
          <Link href="/admin/blogs/new" className="inline-block mt-4">
            <Button>+ Create New Post</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((blog) => {
            const hasEn = !!blog.titleEn?.trim();
            const hasSi = !!blog.titleSi?.trim();
            const hasTa = !!blog.titleTa?.trim();

            return (
              <div
                key={blog.id}
                className="group relative rounded-xl border border-line bg-[color-mix(in_srgb,var(--bg-card)_80%,#0e172a)] p-4 transition hover:border-accent/40 hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Thumbnail */}
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-line/60 bg-black/40">
                      {blog.featuredImage ? (
                        <Image
                          src={blog.featuredImage}
                          alt={blog.titleEn}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                          No Cover
                        </div>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/blogs/${blog.id}`}
                          className="font-heading text-sm font-semibold text-accent hover:underline truncate"
                        >
                          {blog.titleEn}
                        </Link>

                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            blog.status === "PUBLISHED"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : blog.status === "DRAFT"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : "bg-zinc-500/15 text-zinc-400 border border-zinc-500/30"
                          }`}
                        >
                          {blog.status}
                        </span>

                        {/* Language availability indicators */}
                        <div className="flex items-center gap-1 text-[10px] font-mono">
                          <span
                            className={`rounded px-1.5 py-0.5 ${
                              hasEn ? "bg-sky-500/20 text-sky-300 font-bold" : "bg-zinc-800 text-zinc-600"
                            }`}
                            title="English"
                          >
                            EN
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 ${
                              hasSi ? "bg-emerald-500/20 text-emerald-300 font-bold" : "bg-zinc-800 text-zinc-600"
                            }`}
                            title="Sinhala"
                          >
                            SI
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 ${
                              hasTa ? "bg-purple-500/20 text-purple-300 font-bold" : "bg-zinc-800 text-zinc-600"
                            }`}
                            title="Tamil"
                          >
                            TA
                          </span>
                        </div>
                      </div>

                      {/* Sub-titles or Sinhala Title */}
                      {blog.titleSi ? (
                        <p className="truncate text-xs text-muted font-sinhala">
                          {blog.titleSi}
                        </p>
                      ) : null}

                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
                        <span>Slug: <code className="text-zinc-400">/{blog.slug}</code></span>
                        <span>•</span>
                        <span>👁 {blog.views} views</span>
                        <span>•</span>
                        <span>⏱ {blog.readingTime || 3} min read</span>
                        <span>•</span>
                        <span>
                          {blog.publishedAt
                            ? `Published ${new Date(blog.publishedAt).toLocaleDateString()}`
                            : `Created ${new Date(blog.createdAt).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Quick Publish / Unpublish */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(blog)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition ${
                        blog.status === "PUBLISHED"
                          ? "border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                          : "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                      }`}
                    >
                      {blog.status === "PUBLISHED" ? "Unpublish to Draft" : "Publish Live"}
                    </button>

                    {/* View Live Article (if published) */}
                    {blog.status === "PUBLISHED" ? (
                      <Link
                        href={`/blogs/${blog.slug}`}
                        target="_blank"
                        className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted hover:text-accent hover:border-accent transition"
                        title="View published article"
                      >
                        ↗ View
                      </Link>
                    ) : null}

                    {/* Edit */}
                    <Link
                      href={`/admin/blogs/${blog.id}`}
                      className="rounded-lg bg-accent/15 border border-accent/40 px-3 py-1 text-xs font-semibold text-accent hover:bg-accent/25 transition"
                    >
                      Edit
                    </Link>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(blog)}
                      className="rounded-lg border border-red-500/30 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10 transition"
                      title="Delete post"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
