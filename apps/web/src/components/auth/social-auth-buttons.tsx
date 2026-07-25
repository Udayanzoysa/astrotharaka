"use client";

import type { ReactNode } from "react";
import { useUi } from "@/components/providers/ui-provider";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

function SocialButton({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-[color:var(--accent-hover)] px-5 py-2.5 text-sm font-semibold text-ink transition duration-200 hover:bg-[color-mix(in_srgb,var(--accent-hover)_12%,transparent)] font-heading"
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z"
      />
    </svg>
  );
}

export function SocialAuthButtons() {
  const { t } = useUi();

  return (
    <div className="mt-6 space-y-3">
      <SocialButton href={`${API_URL}/auth/google`} label={t("continueGoogle")} icon={<GoogleIcon />} />
      <SocialButton
        href={`${API_URL}/auth/facebook`}
        label={t("continueFacebook")}
        icon={<FacebookIcon />}
      />
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-[color-mix(in_srgb,var(--muted)_35%,transparent)]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wide">
          <span className="bg-[var(--bg-card)] px-3 text-muted">{t("orContinueWith")}</span>
        </div>
      </div>
    </div>
  );
}
