"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useUi } from "@/components/providers/ui-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { apiRequest } from "@/lib/api";
import { getApiUrl } from "@/lib/env";
import type { BlogPost, BlogComment, Language } from "@/lib/types";
import { Button } from "@/components/ui/button";

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

export function BlogArticleClient({ initialPost }: { initialPost: BlogPost }) {
  const { language } = useUi();
  const { user } = useAuth();

  // Active reading language driven directly by top navigation language switcher
  const readLang = language || "si";

  // Comments state
  const [comments, setComments] = useState<BlogComment[]>(initialPost.comments || []);
  const [commentName, setCommentName] = useState(user?.profile?.fullName || "");
  const [commentEmail, setCommentEmail] = useState(user?.email || "");
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState("");
  const [commentError, setCommentError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Pick localized title
  const currentTitle =
    (readLang === "si" && initialPost.titleSi) ||
    (readLang === "ta" && initialPost.titleTa) ||
    initialPost.titleEn;

  // Pick localized excerpt
  const currentExcerpt =
    (readLang === "si" && initialPost.excerptSi) ||
    (readLang === "ta" && initialPost.excerptTa) ||
    initialPost.excerptEn ||
    "";

  // Pick localized content
  const currentContent =
    (readLang === "si" && initialPost.contentSi) ||
    (readLang === "ta" && initialPost.contentTa) ||
    initialPost.contentEn;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    if (typeof window !== "undefined") {
      const text = encodeURIComponent(`${currentTitle}\n${window.location.href}`);
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    }
  };

  const handleShareFacebook = () => {
    if (typeof window !== "undefined") {
      const url = encodeURIComponent(window.location.href);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim()) {
      setCommentError("Please enter your name and comment.");
      return;
    }

    try {
      setIsSubmittingComment(true);
      setCommentError("");
      setCommentSuccess("");

      const newComment = await apiRequest<BlogComment>(`/blogs/${initialPost.slug}/comments`, {
        method: "POST",
        body: {
          userName: commentName.trim(),
          userEmail: commentEmail.trim() || undefined,
          content: commentText.trim(),
        },
      });

      setComments((prev) => [newComment, ...prev]);
      setCommentText("");
      setCommentSuccess("Your comment has been posted! Thank you for sharing your thoughts.");
    } catch (err: any) {
      setCommentError(err?.message || "Could not submit your comment. Please try again.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <article className="relative min-h-screen bg-[var(--bg)] text-ink pb-20">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-indigo-950/20 to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto max-w-4xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-muted">
          <Link href="/" className="hover:text-accent transition">
            Home
          </Link>
          <span>/</span>
          <Link href="/blogs" className="hover:text-accent transition">
            Blogs
          </Link>
          <span>/</span>
          <span className="truncate max-w-[240px] text-zinc-400">{currentTitle}</span>
        </nav>

        {/* Top Header Card */}
        <header className="space-y-4 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-accent/15 border border-accent/40 px-3 py-1 text-xs font-semibold text-accent">
              {initialPost.category || "Astrology"}
            </span>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink leading-tight">
            {currentTitle}
          </h1>

          {currentExcerpt ? (
            <p className="text-sm sm:text-base text-muted leading-relaxed italic border-l-2 border-accent/50 pl-3.5">
              {currentExcerpt}
            </p>
          ) : null}

          {/* Meta Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-line/60 py-3 text-xs text-muted">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                  ✦
                </span>
                <span className="font-medium text-ink">
                  {initialPost.authorName || "Taraka Team"}
                </span>
              </div>
              <span>•</span>
              <span>
                {initialPost.publishedAt
                  ? new Date(initialPost.publishedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : ""}
              </span>
              <span>•</span>
              <span>⏱ {initialPost.readingTime || 3} min read</span>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="rounded-lg bg-emerald-600/20 border border-emerald-500/40 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-600/30 transition flex items-center gap-1"
                title="Share on WhatsApp"
              >
                💬 WhatsApp
              </button>
              <button
                type="button"
                onClick={handleShareFacebook}
                className="rounded-lg bg-blue-600/20 border border-blue-500/40 px-2.5 py-1 text-xs font-medium text-blue-400 hover:bg-blue-600/30 transition flex items-center gap-1"
                title="Share on Facebook"
              >
                📘 Share
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted hover:text-ink hover:border-accent transition"
                title="Copy Link"
              >
                {copiedLink ? "✓ Copied!" : "🔗 Copy"}
              </button>
            </div>
          </div>
        </header>

        {/* Featured Cover Image */}
        {initialPost.featuredImage ? (
          <div className="relative mb-10 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-line/80 bg-black/40 shadow-xl">
            <Image
              src={resolveImageUrl(initialPost.featuredImage)}
              alt={currentTitle}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
        ) : null}

        {/* Main Article Content Body */}
        <section
          className="blog-prose prose-invert min-h-[300px] text-base leading-relaxed text-ink/90 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-accent [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-ink [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:my-4 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_li]:my-1.5 [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-6 [&_blockquote]:text-muted [&_img]:rounded-2xl [&_img]:my-6 [&_img]:border [&_img]:border-line/70 [&_img]:shadow-md [&_img]:max-w-full [&_img]:h-auto [&_a]:text-accent [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: currentContent }}
        />

        {/* Tags */}
        {initialPost.tags ? (
          <div className="mt-10 pt-6 border-t border-line/60 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted font-medium">Tags:</span>
            {initialPost.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
              .map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-line bg-black/30 px-2.5 py-1 text-muted"
                >
                  #{tag}
                </span>
              ))}
          </div>
        ) : null}

        {/* Customer Call to Action Banner */}
        <div className="my-12 rounded-2xl border border-accent/40 bg-gradient-to-r from-amber-500/10 via-indigo-950/40 to-black/60 p-6 sm:p-8 text-center space-y-3 shadow-lg">
          <span className="text-3xl">🔮</span>
          <h3 className="font-heading text-xl sm:text-2xl font-bold text-accent">
            {readLang === "si"
              ? "ඔබගේ කේන්ද්‍රයේ ග්‍රහ පිහිටීම් දැනගන්න කැමතිද?"
              : "Want to Discover Your Personal Birth Horoscope?"}
          </h3>
          <p className="text-xs sm:text-sm text-muted max-w-xl mx-auto">
            {readLang === "si"
              ? "තාරකා වෙතින් නොමිලේ කේන්ද්‍ර සටහන හෝ සම්පූර්ණ ජීවිත පලාපල වාර්තාව ක්ෂණිකව ලබා ගන්න."
              : "Generate your free Vedic birth chart preview or order a personalized full life prediction report prepared with precision."}
          </p>
          <div className="pt-2">
            <Link href="/#home-report">
              <Button className="bg-accent text-black font-semibold hover:bg-accent/90 shadow-md">
                {readLang === "si" ? "නොමිලේ කේන්ද්‍රය බලන්න ✨" : "Get Free Horoscope Preview ✨"}
              </Button>
            </Link>
          </div>
        </div>

        {/* Customer Comments & Discussion Section */}
        <section className="mt-14 space-y-6">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="font-heading text-lg font-bold text-accent flex items-center gap-2">
              <span>💬</span>
              <span>Comments & Discussion ({comments.length})</span>
            </h3>
            <span className="text-xs text-muted">Join the cosmic conversation</span>
          </div>

          {/* Comment Submission Form */}
          <form
            onSubmit={handleSubmitComment}
            className="rounded-xl border border-line bg-[color-mix(in_srgb,var(--bg-card)_60%,black)] p-4 sm:p-5 space-y-3.5"
          >
            <h4 className="text-xs font-semibold text-ink">
              Leave your thoughts or ask a question:
            </h4>

            {commentError ? (
              <p className="rounded-lg bg-red-950/20 border border-red-500/30 p-2.5 text-xs text-red-400">
                {commentError}
              </p>
            ) : null}

            {commentSuccess ? (
              <p className="rounded-lg bg-emerald-950/20 border border-emerald-500/30 p-2.5 text-xs text-emerald-400">
                {commentSuccess}
              </p>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-muted mb-1 font-medium">Your Name *</label>
                <input
                  type="text"
                  required
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  placeholder="e.g. Kasun Perera"
                  className="w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-muted mb-1 font-medium">Email (Optional, kept private)</label>
                <input
                  type="email"
                  value={commentEmail}
                  onChange={(e) => setCommentEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-muted mb-1 text-xs font-medium">Your Comment *</label>
              <textarea
                required
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your experience, thoughts, or feedback about this article..."
                className="w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmittingComment}
                className="bg-accent text-black font-semibold hover:bg-accent/90 text-xs px-4 py-1.5"
              >
                {isSubmittingComment ? "Submitting..." : "Post Comment"}
              </Button>
            </div>
          </form>

          {/* List of comments */}
          {comments.length === 0 ? (
            <p className="text-xs text-muted text-center py-6">
              Be the first to leave a comment on this article!
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-xl border border-line/70 bg-[color-mix(in_srgb,var(--bg-card)_40%,black)] p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center font-bold text-[11px] text-accent">
                        {comment.userName.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-semibold text-ink">{comment.userName}</span>
                    </div>
                    <span className="text-[10px] text-muted">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed pl-8">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Back Link */}
        <div className="mt-14 text-center">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-black/40 px-5 py-2 text-xs font-medium text-muted hover:text-accent hover:border-accent transition"
          >
            ← Back to all Astrology Articles
          </Link>
        </div>
      </div>
    </article>
  );
}
