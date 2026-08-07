"use client";

import { useState } from "react";
import { useUi } from "@/components/providers/ui-provider";
import { FocusTopicsPicker } from "@/components/reports/focus-topics-picker";
import type { FocusTopicId } from "@/lib/focus-topics";

type Props = {
  value: FocusTopicId[];
  onChange: (next: FocusTopicId[]) => void;
  compact?: boolean;
};

/** Checkbox gate: topics only apply (and reach the prompt) when enabled. */
export function OptionalFocusTopics({ value, onChange, compact = false }: Props) {
  const { t } = useUi();
  const [enabled, setEnabled] = useState(value.length > 0);

  function setChecked(checked: boolean) {
    setEnabled(checked);
    if (!checked) onChange([]);
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-2.5"}>
      <label
        className={`flex cursor-pointer items-start gap-2 text-ink ${
          compact
            ? "min-h-0 py-0.5 text-xs leading-snug sm:text-sm"
            : "min-h-11 items-center gap-3 text-sm"
        }`}
      >
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setChecked(e.target.checked)}
          className={`mt-0.5 shrink-0 accent-[var(--accent)] ${
            compact ? "h-4 w-4" : "h-4 w-4 md:h-5 md:w-5"
          }`}
        />
        <span>
          {t("additionalConfiguration")}{" "}
          <span className="font-normal text-muted">({t("optional")})</span>
        </span>
      </label>
      {enabled ? (
        <FocusTopicsPicker value={value} onChange={onChange} compact={compact} nested />
      ) : null}
    </div>
  );
}
