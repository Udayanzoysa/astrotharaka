"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { useUi } from "@/components/providers/ui-provider";

type FaqItem = { question: string; answer: string };

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const { language } = useUi();
  const isSi = language === "si";
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex((current) => (current === index ? null : index));
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle(index);
    }
  }

  return (
    <div className="faq-list space-y-3">
      {items.map((item, index) => {
        const open = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <article
            key={item.question}
            className="faq-item overflow-hidden rounded-xl border border-line/80 bg-[color-mix(in_srgb,var(--bg)_55%,transparent)]"
          >
            <h3 className="m-0">
              <button
                id={buttonId}
                type="button"
                className="faq-trigger flex w-full items-start justify-between gap-4 px-4 py-4 text-left sm:px-5"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                <span
                  className={`text-[15px] leading-snug text-ink sm:text-base ${
                    isSi ? "font-sinhala-luxury" : "font-heading"
                  }`}
                >
                  {item.question}
                </span>
                <span
                  className={`faq-chevron mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,#e8c96a_40%,transparent)] text-accent transition-transform duration-300 ${
                    open ? "rotate-45" : ""
                  }`}
                  aria-hidden="true"
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`faq-panel grid transition-[grid-template-rows] duration-300 ease-out ${
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <p className="border-t border-line/60 px-4 pb-4 pt-3 text-sm leading-relaxed text-muted sm:px-5 sm:pb-5 sm:text-[15px]">
                  {item.answer}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
