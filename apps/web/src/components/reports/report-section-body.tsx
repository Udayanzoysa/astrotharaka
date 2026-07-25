/** Lightweight markdown-ish body for report sections (###, bullets, paragraphs). */
export function ReportSectionBody({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  return (
    <div className="space-y-2.5">
      {blocks.map((block, i) => {
        if (block.type === "h3") {
          return (
            <h3
              key={i}
              className="font-heading text-[12.5px] font-semibold text-[color-mix(in_srgb,#d4af37_85%,var(--ink))] sm:text-[13px]"
            >
              {block.text}
            </h3>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={i} className="list-disc space-y-1 pl-4 text-[12.5px] leading-[1.7] text-ink/90 sm:text-[13px]">
              {block.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p
            key={i}
            className="guest-preview-para whitespace-pre-wrap text-[12.5px] leading-[1.7] text-ink/90 sm:text-[13px] sm:leading-[1.75]"
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

type Block =
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

function parseBlocks(raw: string): Block[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const out: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (!para.length) return;
    out.push({ type: "p", text: para.join("\n").trim() });
    para = [];
  };
  const flushList = () => {
    if (!list.length) return;
    out.push({ type: "ul", items: [...list] });
    list = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const h3 = line.match(/^###\s+(.+)$/);
    const bullet = line.match(/^[-*•]\s+(.+)$/);
    if (h3) {
      flushList();
      flushPara();
      out.push({ type: "h3", text: h3[1].trim() });
      continue;
    }
    if (bullet) {
      flushPara();
      list.push(bullet[1].trim());
      continue;
    }
    if (!line.trim()) {
      flushList();
      flushPara();
      continue;
    }
    flushList();
    para.push(line);
  }
  flushList();
  flushPara();
  return out.length ? out : [{ type: "p", text: raw }];
}
