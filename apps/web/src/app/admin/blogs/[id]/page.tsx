"use client";

import { use, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { BlogPost } from "@/lib/types";
import { CONTENT_ADMIN_ROLES, useAdminAccess } from "@/components/admin/use-admin-access";
import { BlogEditorForm } from "@/components/admin/blog-editor-form";

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token, loading: accessLoading, denied, allowed } = useAdminAccess({ roles: CONTENT_ADMIN_ROLES });
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!allowed || !token || !id) return;
    void (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await apiRequest<BlogPost>(`/admin/blogs/${id}`, { token });
        setBlog(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load blog post");
      } finally {
        setLoading(false);
      }
    })();
  }, [allowed, token, id]);

  if (accessLoading || loading) return <p className="text-muted p-4">Loading article…</p>;
  if (denied) return <p className="text-sm text-[var(--danger)] p-4">{denied}</p>;
  if (error) return <p className="text-sm text-[var(--danger)] p-4">{error}</p>;
  if (!allowed || !token || !blog) return null;

  return <BlogEditorForm initialData={blog} token={token} isEdit={true} />;
}
