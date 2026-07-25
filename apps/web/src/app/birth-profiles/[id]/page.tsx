"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import type { BirthProfile } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { BirthProfileForm } from "@/components/birth-profiles/birth-profile-form";

export default function EditBirthProfilePage() {
  const params = useParams<{ id: string }>();
  const { token, user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<BirthProfile | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token || !params.id) return;
    void (async () => {
      const data = await apiRequest<BirthProfile>(`/birth-profiles/${params.id}`, { token });
      setProfile(data);
    })();
  }, [token, params.id]);

  if (!profile) {
    return <div className="mx-auto max-w-lg px-4 py-16 text-muted">Loading…</div>;
  }

  return <BirthProfileForm mode="edit" initial={profile} />;
}
