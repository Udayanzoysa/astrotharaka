"use client";

import { useUi } from "@/components/providers/ui-provider";
import {
  FOCUS_TOPIC_IDS,
  FOCUS_TOPIC_MAX,
  type FocusTopicId,
} from "@/lib/focus-topics";

const TOPIC_I18N_KEYS: Record<FocusTopicId, string> = {
  marriage: "focusTopicMarriage",
  education: "focusTopicEducation",
  children: "focusTopicChildren",
  next_10_years: "focusTopicNext10Years",
  health: "focusTopicHealth",
  wealth: "focusTopicWealth",
  remedies: "focusTopicRemedies",
};

type Props = {
  value: FocusTopicId[];
  onChange: (next: FocusTopicId[]) => void;
  compact?: boolean;
  /** When shown under “additional configuration”, drop redundant optional chrome. */
  nested?: boolean;
};

export function FocusTopicsPicker({
  value,
  onChange,
  compact = false,
  nested = false,
}: Props) {
  const { t } = useUi();

  function toggle(id: FocusTopicId) {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
      return;
    }
    if (value.length >= FOCUS_TOPIC_MAX) return;
    onChange([...value, id]);
  }

  return (
    <fieldset
      className={`rounded-xl border border-line/80 bg-[color-mix(in_srgb,var(--input-bg)_55%,transparent)] ${
        compact ? "space-y-1.5 p-2.5 sm:p-3" : "space-y-2 p-3"
      }`}
    >
      {!nested ? (
        <legend className={`px-1 text-muted ${compact ? "text-xs sm:text-sm" : "text-sm"}`}>
          {t("focusTopicsLabel")}{" "}
          <span className="font-normal text-muted/80">({t("optional")})</span>
        </legend>
      ) : (
        <legend className={`px-1 text-muted ${compact ? "text-xs sm:text-sm" : "text-sm"}`}>
          {t("focusTopicsLabel")}
        </legend>
      )}
      <p className={`text-muted ${compact ? "text-[11px] leading-snug" : "text-xs"}`}>
        {t("focusTopicsHint").replace("{max}", String(FOCUS_TOPIC_MAX))}
      </p>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {FOCUS_TOPIC_IDS.map((id) => {
          const checked = value.includes(id);
          const disabled = !checked && value.length >= FOCUS_TOPIC_MAX;
          return (
            <label
              key={id}
              className={`flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition sm:text-sm ${
                checked
                  ? "border-[color-mix(in_srgb,var(--accent)_55%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-ink"
                  : "border-line/70 bg-[var(--input-bg)] text-muted hover:border-accent/40"
              } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(id)}
              />
              <span className="leading-snug">{t(TOPIC_I18N_KEYS[id])}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
