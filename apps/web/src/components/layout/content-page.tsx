"use client";

import type { ReactNode } from "react";
import { useUi } from "@/components/providers/ui-provider";

export function ContentPage({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  const { language } = useUi();
  const isSi = language === "si";

  return (
    <div className="content-page relative min-h-[70vh] border-t border-line/40">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_50%_0%,rgba(232,201,106,0.12),transparent_65%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
        <p className="home-section__eyebrow text-accent">{eyebrow}</p>
        <h1
          className={`mt-3 text-ink ${isSi ? "font-sinhala-luxury" : "font-display"} home-section__title`}
        >
          {title}
        </h1>
        {lead ? (
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{lead}</p>
        ) : null}
        <div className="content-page__body mt-8 space-y-5 text-sm leading-relaxed text-muted sm:text-[15px]">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ContentHeading({ children }: { children: ReactNode }) {
  const { language } = useUi();
  const isSi = language === "si";
  return (
    <h2 className={`pt-2 text-base text-ink sm:text-lg ${isSi ? "font-sinhala-luxury" : "font-heading"}`}>
      {children}
    </h2>
  );
}

export function ContentParagraph({ children }: { children: ReactNode }) {
  return <p className="text-muted">{children}</p>;
}

export function ContentList({ items }: { items: string[] }) {
  return (
    <ul className="list-none space-y-3 pl-0">
      {items.map((item) => (
        <li
          key={item}
          className="border-l-2 border-[color-mix(in_srgb,#e8c96a_50%,transparent)] pl-4 text-muted"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
