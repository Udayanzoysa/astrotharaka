"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { apiRequest } from "@/lib/api";
import type { BlogPost, BlogStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "./rich-text-editor";

interface BlogEditorFormProps {
  initialData?: BlogPost;
  token: string;
  isEdit?: boolean;
}

type LangTab = "en" | "si" | "ta";

export function BlogEditorForm({ initialData, token, isEdit }: BlogEditorFormProps) {
  const router = useRouter();

  // Active language tab
  const [activeLang, setActiveLang] = useState<LangTab>("en");

  // Basic info & Content
  const [titleEn, setTitleEn] = useState(initialData?.titleEn || "");
  const [titleSi, setTitleSi] = useState(initialData?.titleSi || "");
  const [titleTa, setTitleTa] = useState(initialData?.titleTa || "");

  const [excerptEn, setExcerptEn] = useState(initialData?.excerptEn || "");
  const [excerptSi, setExcerptSi] = useState(initialData?.excerptSi || "");
  const [excerptTa, setExcerptTa] = useState(initialData?.excerptTa || "");

  const [contentEn, setContentEn] = useState(initialData?.contentEn || "");
  const [contentSi, setContentSi] = useState(initialData?.contentSi || "");
  const [contentTa, setContentTa] = useState(initialData?.contentTa || "");

  // Featured Image
  const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage || "");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // SEO & URL
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [customSlug, setCustomSlug] = useState(!!initialData?.slug);
  const [keywords, setKeywords] = useState(initialData?.keywords || "");

  const [metaTitleEn, setMetaTitleEn] = useState(initialData?.metaTitleEn || "");
  const [metaTitleSi, setMetaTitleSi] = useState(initialData?.metaTitleSi || "");
  const [metaTitleTa, setMetaTitleTa] = useState(initialData?.metaTitleTa || "");

  const [metaDescEn, setMetaDescEn] = useState(initialData?.metaDescEn || "");
  const [metaDescSi, setMetaDescSi] = useState(initialData?.metaDescSi || "");
  const [metaDescTa, setMetaDescTa] = useState(initialData?.metaDescTa || "");

  // Metadata & Status
  const [status, setStatus] = useState<BlogStatus>(initialData?.status || "DRAFT");
  const [category, setCategory] = useState(initialData?.category || "Astrology");
  const [tags, setTags] = useState(initialData?.tags || "");
  const [authorName, setAuthorName] = useState(initialData?.authorName || "Taraka Team");
  const [readingTime, setReadingTime] = useState(initialData?.readingTime || 3);

  // UI state
  const [showSeoSettings, setShowSeoSettings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Comments (for editing mode)
  const [comments, setComments] = useState(initialData?.comments || []);

  // Helper to upload image via API
  const handleUploadImageFile = async (file: File): Promise<string> => {
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await apiRequest<{ url: string; filename: string }>("/admin/blogs/upload-image", {
      method: "POST",
      token,
      body: {
        imageBase64: base64,
        fileName: file.name,
      },
    });

    // Make URL absolute if needed or return relative API path
    return res.url;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingCover(true);
      setError("");
      const url = await handleUploadImageFile(file);
      setFeaturedImage(url);
    } catch (err: unknown) {
      setError(`Cover image upload failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const primaryTitle = titleEn.trim() || titleSi.trim() || titleTa.trim();
    const primaryContent = contentEn.trim() || contentSi.trim() || contentTa.trim();

    if (!primaryTitle) {
      setError("Please provide a Title in at least one language.");
      return;
    }
    if (!primaryContent) {
      setError("Please provide Article Content in at least one language.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setSuccess("");

      const payload = {
        titleEn: titleEn.trim() || primaryTitle,
        titleSi: titleSi.trim() || undefined,
        titleTa: titleTa.trim() || undefined,
        slug: slug.trim() || undefined,
        status,
        featuredImage: featuredImage.trim() || undefined,
        excerptEn: excerptEn.trim() || excerptSi.trim() || excerptTa.trim() || undefined,
        excerptSi: excerptSi.trim() || undefined,
        excerptTa: excerptTa.trim() || undefined,
        contentEn: contentEn.trim() || primaryContent,
        contentSi: contentSi.trim() || undefined,
        contentTa: contentTa.trim() || undefined,
        metaTitleEn: metaTitleEn.trim() || undefined,
        metaTitleSi: metaTitleSi.trim() || undefined,
        metaTitleTa: metaTitleTa.trim() || undefined,
        metaDescEn: metaDescEn.trim() || undefined,
        metaDescSi: metaDescSi.trim() || undefined,
        metaDescTa: metaDescTa.trim() || undefined,
        keywords: keywords.trim() || undefined,
        category: category.trim() || "Astrology",
        tags: tags.trim() || undefined,
        authorName: authorName.trim() || "Taraka Team",
        readingTime: Number(readingTime) || 3,
      };

      if (isEdit && initialData) {
        await apiRequest(`/admin/blogs/${initialData.id}`, {
          method: "PATCH",
          token,
          body: payload,
        });
        setSuccess("Article updated successfully!");
      } else {
        const created = await apiRequest<BlogPost>("/admin/blogs", {
          method: "POST",
          token,
          body: payload,
        });
        setSuccess("Article created successfully!");
        setTimeout(() => {
          router.push(`/admin/blogs/${created.id}`);
        }, 800);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save article.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle comment approval
  const handleToggleComment = async (commentId: string) => {
    try {
      await apiRequest(`/admin/blogs/comments/${commentId}/toggle`, {
        method: "PATCH",
        token,
      });
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, isApproved: !c.isApproved } : c)),
      );
    } catch (err: unknown) {
      alert(`Could not toggle comment: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment permanently?")) return;
    try {
      await apiRequest(`/admin/blogs/comments/${commentId}`, {
        method: "DELETE",
        token,
      });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: unknown) {
      alert(`Could not delete comment: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-4">
        <div>
          <Link href="/admin/blogs" className="text-xs text-muted hover:text-accent transition flex items-center gap-1 mb-1">
            ← Back to Articles List
          </Link>
          <h1 className="font-heading text-xl font-bold text-accent">
            {isEdit ? "Edit Blog Article" : "Create New Blog Article"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Status selector */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-line text-xs">
            <span className="text-muted px-2">Status:</span>
            {(["DRAFT", "PUBLISHED", "ARCHIVED"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  status === s
                    ? s === "PUBLISHED"
                      ? "bg-emerald-500/20 text-emerald-400 font-bold"
                      : s === "DRAFT"
                      ? "bg-amber-500/20 text-amber-400 font-bold"
                      : "bg-zinc-700 text-white font-bold"
                    : "text-muted hover:text-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-accent text-black font-semibold hover:bg-accent/90 shadow-sm"
          >
            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Post"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3.5 text-xs text-red-400">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs text-emerald-400">
          {success}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Language Tabs & Article Content (2 Cols) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Language Selector Bar */}
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Language:
              </span>
              <div className="flex rounded-lg border border-line bg-black/40 p-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveLang("en")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 transition ${
                    activeLang === "en"
                      ? "bg-accent/20 text-accent font-bold"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  <span>🇬🇧 English</span>
                  {titleEn.trim() ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> : null}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLang("si")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 transition ${
                    activeLang === "si"
                      ? "bg-accent/20 text-accent font-bold"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  <span>🇱🇰 සිංහල</span>
                  {titleSi.trim() ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> : null}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLang("ta")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 transition ${
                    activeLang === "ta"
                      ? "bg-accent/20 text-accent font-bold"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  <span>🇮🇳 தமிழ்</span>
                  {titleTa.trim() ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> : null}
                </button>
              </div>
            </div>

            <span className="text-[11px] text-muted hidden sm:inline">
              Switch languages to provide trilingual content
            </span>
          </div>

          {/* Active Language Editor Panel */}
          {activeLang === "en" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Article Title (English) <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={titleEn}
                  onChange={(e) => {
                    setTitleEn(e.target.value);
                    if (!customSlug && !isEdit) {
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .trim()
                          .replace(/[\s\W-]+/g, "-")
                          .replace(/^-+|-+$/g, ""),
                      );
                    }
                  }}
                  placeholder="e.g. Navigating Saturn's Transit in 2026: Spiritual and Astrological Insights"
                  className="w-full rounded-xl border border-line bg-black/30 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Short Excerpt / Summary (English)
                </label>
                <textarea
                  rows={2}
                  value={excerptEn}
                  onChange={(e) => setExcerptEn(e.target.value)}
                  placeholder="A concise 1-2 sentence overview shown in article previews and cards..."
                  className="w-full rounded-xl border border-line bg-black/30 px-3.5 py-2 text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Article Content (English) <span className="text-accent">*</span>
                </label>
                <RichTextEditor
                  value={contentEn}
                  onChange={setContentEn}
                  onUploadImage={handleUploadImageFile}
                  placeholder="Compose your English article here. Use the toolbar to insert headings, lists, quotes, and images..."
                />
              </div>
            </div>
          )}

          {activeLang === "si" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  ලිපියේ මාතෘකාව (සිංහල)
                </label>
                <input
                  type="text"
                  value={titleSi}
                  onChange={(e) => setTitleSi(e.target.value)}
                  placeholder="උදා: 2026 සෙනසුරු මාරුව සහ ඔබගේ ලග්නයට බලපාන ආකාරය"
                  className="w-full rounded-xl border border-line bg-black/30 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none font-sinhala"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  කෙටි හැඳින්වීම / සාරාංශය (සිංහල)
                </label>
                <textarea
                  rows={2}
                  value={excerptSi}
                  onChange={(e) => setExcerptSi(e.target.value)}
                  placeholder="ලිපි කාඩ්පත් සහ පෙරදසුන් සඳහා කෙටි විස්තරයක්..."
                  className="w-full rounded-xl border border-line bg-black/30 px-3.5 py-2 text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none font-sinhala"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  ලිපියේ සම්පූර්ණ අන්තර්ගතය (සිංහල)
                </label>
                <RichTextEditor
                  value={contentSi}
                  onChange={setContentSi}
                  onUploadImage={handleUploadImageFile}
                  placeholder="සිංහල ලිපිය මෙහි ලියන්න. ශීර්ෂ පාඨ, පින්තූර සහ ලැයිස්තු ඇතුළත් කළ හැකිය..."
                />
              </div>
            </div>
          )}

          {activeLang === "ta" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  கட்டுரை தலைப்பு (தமிழ்)
                </label>
                <input
                  type="text"
                  value={titleTa}
                  onChange={(e) => setTitleTa(e.target.value)}
                  placeholder="உதாரணம்: 2026 சனிப் பெயர்ச்சியும் உங்கள் ராசிக்கான பலன்களும்"
                  className="w-full rounded-xl border border-line bg-black/30 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none font-tamil"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  சுருக்கமான விளக்கம் (தமிழ்)
                </label>
                <textarea
                  rows={2}
                  value={excerptTa}
                  onChange={(e) => setExcerptTa(e.target.value)}
                  placeholder="கட்டுரை முன்னோட்டம் மற்றும் அட்டைக்கான சுருக்கமான விளக்கம்..."
                  className="w-full rounded-xl border border-line bg-black/30 px-3.5 py-2 text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none font-tamil"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  முழு கட்டுரை உள்ளடக்கம் (தமிழ்)
                </label>
                <RichTextEditor
                  value={contentTa}
                  onChange={setContentTa}
                  onUploadImage={handleUploadImageFile}
                  placeholder="உங்கள் தமிழ் கட்டுரையை இங்கே எழுதவும்..."
                />
              </div>
            </div>
          )}

          {/* SEO Metadata Accordion */}
          <div className="rounded-xl border border-line bg-[color-mix(in_srgb,var(--bg-card)_50%,black)] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSeoSettings(!showSeoSettings)}
              className="flex w-full items-center justify-between p-3.5 text-left text-xs font-semibold text-accent hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-2">
                <span>🔍 SEO & Search Engine Optimization</span>
                <span className="text-[11px] font-normal text-muted">
                  (Custom Meta Titles, Descriptions & Keywords)
                </span>
              </div>
              <span>{showSeoSettings ? "▲" : "▼"}</span>
            </button>

            {showSeoSettings && (
              <div className="space-y-4 border-t border-line/60 p-4 bg-black/20 text-xs">
                {/* Meta Titles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-muted mb-1">Meta Title (EN)</label>
                    <input
                      type="text"
                      value={metaTitleEn}
                      onChange={(e) => setMetaTitleEn(e.target.value)}
                      placeholder={titleEn || "SEO Meta Title (EN)"}
                      className="w-full rounded-lg border border-line bg-black/40 px-3 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-muted mb-1">Meta Title (SI)</label>
                    <input
                      type="text"
                      value={metaTitleSi}
                      onChange={(e) => setMetaTitleSi(e.target.value)}
                      placeholder={titleSi || "SEO Meta Title (SI)"}
                      className="w-full rounded-lg border border-line bg-black/40 px-3 py-1.5 text-xs text-ink focus:border-accent focus:outline-none font-sinhala"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-muted mb-1">Meta Title (TA)</label>
                    <input
                      type="text"
                      value={metaTitleTa}
                      onChange={(e) => setMetaTitleTa(e.target.value)}
                      placeholder={titleTa || "SEO Meta Title (TA)"}
                      className="w-full rounded-lg border border-line bg-black/40 px-3 py-1.5 text-xs text-ink focus:border-accent focus:outline-none font-tamil"
                    />
                  </div>
                </div>

                {/* Meta Descriptions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-muted mb-1">Meta Description (EN)</label>
                    <textarea
                      rows={2}
                      value={metaDescEn}
                      onChange={(e) => setMetaDescEn(e.target.value)}
                      placeholder={excerptEn || "Search snippet description in English"}
                      className="w-full rounded-lg border border-line bg-black/40 px-3 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-muted mb-1">Meta Description (SI)</label>
                    <textarea
                      rows={2}
                      value={metaDescSi}
                      onChange={(e) => setMetaDescSi(e.target.value)}
                      placeholder={excerptSi || "Search snippet description in Sinhala"}
                      className="w-full rounded-lg border border-line bg-black/40 px-3 py-1.5 text-xs text-ink focus:border-accent focus:outline-none font-sinhala"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-muted mb-1">Meta Description (TA)</label>
                    <textarea
                      rows={2}
                      value={metaDescTa}
                      onChange={(e) => setMetaDescTa(e.target.value)}
                      placeholder={excerptTa || "Search snippet description in Tamil"}
                      className="w-full rounded-lg border border-line bg-black/40 px-3 py-1.5 text-xs text-ink focus:border-accent focus:outline-none font-tamil"
                    />
                  </div>
                </div>

                {/* Keywords */}
                <div>
                  <label className="block font-medium text-muted mb-1">Keywords (Comma separated)</label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g. vedic astrology, horoscope 2026, shani transit, porondam"
                    className="w-full rounded-lg border border-line bg-black/40 px-3 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* User Comments Management (Edit Mode) */}
          {isEdit && (
            <div className="rounded-xl border border-line bg-[color-mix(in_srgb,var(--bg-card)_50%,black)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-accent">Customer Comments ({comments.length})</h3>
                <span className="text-[11px] text-muted">Manage customer feedback on this article</span>
              </div>

              {comments.length === 0 ? (
                <p className="text-xs text-muted py-2">No comments posted yet.</p>
              ) : (
                <div className="space-y-2">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-line/60 bg-black/30 p-2.5 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink">{comment.userName}</span>
                          {comment.userEmail ? (
                            <span className="text-[11px] text-muted font-mono">{comment.userEmail}</span>
                          ) : null}
                          <span
                            className={`rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                              comment.isApproved ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {comment.isApproved ? "Approved" : "Hidden"}
                          </span>
                        </div>
                        <p className="text-zinc-300 leading-relaxed">{comment.content}</p>
                        <p className="text-[10px] text-muted">{new Date(comment.createdAt).toLocaleString()}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleComment(comment.id)}
                          className="rounded px-2 py-1 text-[11px] font-medium border border-line text-muted hover:text-ink hover:border-accent transition"
                        >
                          {comment.isApproved ? "Hide" : "Approve"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="rounded px-2 py-1 text-[11px] font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Publishing Sidebar & Featured Image (1 Col) */}
        <div className="space-y-5">
          {/* Featured / Cover Image Card */}
          <div className="rounded-xl border border-line bg-[color-mix(in_srgb,var(--bg-card)_60%,black)] p-4 space-y-3">
            <label className="block text-xs font-semibold text-ink">
              Featured / Cover Image
            </label>

            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />

            {featuredImage ? (
              <div className="space-y-2">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-line/70 bg-black/40">
                  <Image
                    src={featuredImage}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isUploadingCover}
                    className="text-accent hover:underline"
                  >
                    Change Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeaturedImage("")}
                    className="text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => coverInputRef.current?.click()}
                className="flex flex-col items-center justify-center aspect-video w-full cursor-pointer rounded-lg border-2 border-dashed border-line/80 bg-black/20 p-4 text-center transition hover:border-accent hover:bg-black/30"
              >
                <span className="text-2xl mb-1">🖼</span>
                <p className="text-xs font-medium text-ink">
                  {isUploadingCover ? "Uploading image..." : "Click to upload Cover Image"}
                </p>
                <p className="text-[10px] text-muted mt-0.5">PNG, JPG, WebP up to 10MB</p>
              </div>
            )}

            {/* Direct URL input option */}
            <div className="pt-1">
              <input
                type="text"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="Or paste external image URL..."
                className="w-full rounded-lg border border-line bg-black/40 px-3 py-1.5 text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* URL Slug Setting */}
          <div className="rounded-xl border border-line bg-[color-mix(in_srgb,var(--bg-card)_60%,black)] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink">URL Slug</label>
              <button
                type="button"
                onClick={() => setCustomSlug(!customSlug)}
                className="text-[11px] text-accent hover:underline"
              >
                {customSlug ? "Auto-generate" : "Custom"}
              </button>
            </div>
            <div className="flex items-center rounded-lg border border-line bg-black/40 px-3 py-2 text-xs">
              <span className="text-muted shrink-0">/blogs/</span>
              <input
                type="text"
                value={slug}
                readOnly={!customSlug && !isEdit}
                onChange={(e) => {
                  setCustomSlug(true);
                  setSlug(e.target.value);
                }}
                placeholder="url-friendly-slug"
                className="w-full bg-transparent pl-1 text-ink focus:outline-none font-mono"
              />
            </div>
            <p className="text-[10px] text-muted">
              Used in public URL and SEO: <code>taraka.lk/blogs/{slug || "example-post"}</code>
            </p>
          </div>

          {/* Post Attributes Card */}
          <div className="rounded-xl border border-line bg-[color-mix(in_srgb,var(--bg-card)_60%,black)] p-4 space-y-3.5 text-xs">
            <h3 className="font-semibold text-ink">Article Attributes</h3>

            <div>
              <label className="block text-muted mb-1 font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none"
              >
                <option value="Astrology">Astrology (ජ්‍යෝතිෂ්‍ය)</option>
                <option value="Planetary Transits">Planetary Transits (ග්‍රහ මාරු)</option>
                <option value="Horoscope & Lagna">Horoscope & Lagna (ලග්න පලාපල)</option>
                <option value="Porondam & Marriage">Porondam & Marriage (පොරොන්දම්)</option>
                <option value="Baby Names & Nakshatra">Baby Names & Nakshatra (නැකත් සහ නම්)</option>
                <option value="Vastu & Spiritual">Vastu & Spiritual (වාස්තු සහ ශාන්තිකර්ම)</option>
              </select>
            </div>

            <div>
              <label className="block text-muted mb-1 font-medium">Tags (Comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="saturn, horoscope, 2026, lagna"
                className="w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-muted mb-1 font-medium">Author Name</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Taraka Team"
                className="w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-muted mb-1 font-medium">Reading Time (Minutes)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={readingTime}
                onChange={(e) => setReadingTime(Number(e.target.value))}
                className="w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
