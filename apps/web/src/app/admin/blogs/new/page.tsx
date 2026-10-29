"use client";

import { CONTENT_ADMIN_ROLES, useAdminAccess } from "@/components/admin/use-admin-access";
import { BlogEditorForm } from "@/components/admin/blog-editor-form";

export default function NewBlogPage() {
  const { token, loading, denied, allowed } = useAdminAccess({ roles: CONTENT_ADMIN_ROLES });

  if (loading) return <p className="text-muted p-4">Checking access…</p>;
  if (denied) return <p className="text-sm text-[var(--danger)] p-4">{denied}</p>;
  if (!allowed || !token) return null;

  return <BlogEditorForm token={token} isEdit={false} />;
}
