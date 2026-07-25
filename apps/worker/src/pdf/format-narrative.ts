/**
 * Normalize messy AI / narrative text into clean readable structure,
 * then render to HTML (Chromium PDF) or typed blocks (PDFKit).
 */

export type NarrativeBlock =
  | { type: 'h3'; text: string }
  | { type: 'h4'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] };

function unescapeLiteralNewlines(raw: string): string {
  return raw
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

function stripOuterQuotes(s: string): string {
  const t = s.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1).trim();
  }
  return t;
}

/** Convert common bullet glyphs / compact list styles into markdown `- `. */
function normalizeBulletLine(line: string): string | null {
  const t = line.trim();
  const m = t.match(/^(?:[-*•●○◆▪►▸–—]|·)\s+(.+)$/);
  if (m) return m[1].trim();
  // "•text" without space
  const glued = t.match(/^[•●○◆▪►▸]\s*(.+)$/);
  if (glued) return glued[1].trim();
  return null;
}

function normalizeNumberedLine(line: string): string | null {
  const t = line.trim();
  const m = t.match(/^(?:\(?\d{1,2}\)?[.)]|[①②③④⑤⑥⑦⑧⑨⑩]|[ivx]+\.)\s+(.+)$/i);
  if (m) return m[1].trim();
  return null;
}

function normalizeHeadingLine(line: string): { level: 3 | 4; text: string } | null {
  const t = line.trim();
  const h2 = t.match(/^##\s+(.+)$/);
  if (h2) return { level: 3, text: h2[1].replace(/^#+\s*/, '').trim() };
  const h3 = t.match(/^###\s+(.+)$/);
  if (h3) return { level: 3, text: h3[1].trim() };
  const h4 = t.match(/^####\s+(.+)$/);
  if (h4) return { level: 4, text: h4[1].trim() };

  // Title-only lines: "ශුභ කාල:" or short labelled topic headers
  const plain = t.replace(/^[*_]+|[*_]+$/g, '').trim();
  if (normalizeBulletLine(plain) || normalizeNumberedLine(plain)) return null;
  if (plain.length < 3 || plain.length > 80) return null;

  if (/[:：]$/.test(plain) && plain.length <= 60) {
    return { level: 3, text: plain.replace(/[:：]$/, '').trim() };
  }

  // Explicit topic headers (short, no long sentence commas)
  const topic =
    /^(යෝග|ලග්න යෝග|බුධ|ශත්‍රු|ගෝචර|සූර්ය|බ්‍රහස්පති|සෙනසුරු|මහා දශා|අන්තර් දශා|පිළියම්|උපදෙස්|ශුභ කාල|අවදානම්|රැකියා|ව්‍යාපාර|ධනය|සෞඛ්‍ය|විවාහ|දුර්වලතා)/.test(
      plain,
    ) ||
    /^(Yoga|Budha|Transit|Dasha|Remedy|Advice|Career|Wealth|Health|Marriage|Saturn|Jupiter|Sun)\b/i.test(
      plain,
    );
  if (topic && (plain.match(/[,،]/g) || []).length < 2 && !/[.!?]$/.test(plain)) {
    return { level: 3, text: plain };
  }
  return null;
}

/** Split a wall of text into shorter paragraphs on sentence boundaries. */
function splitDenseParagraph(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length < 220) return [cleaned];

  const parts = cleaned.split(/(?<=[.!?।])\s+(?=[^\s])/);
  if (parts.length < 2) return [cleaned];

  const paras: string[] = [];
  let buf = '';
  for (const part of parts) {
    const next = buf ? `${buf} ${part}` : part;
    if (next.length > 280 && buf) {
      paras.push(buf.trim());
      buf = part;
    } else {
      buf = next;
    }
  }
  if (buf.trim()) paras.push(buf.trim());
  return paras.length ? paras : [cleaned];
}

/**
 * Turn raw section body into structured markdown-friendly text:
 * paragraphs, ### headings, - bullets, 1. numbered lists.
 */
export function normalizeNarrativeBody(raw: string): string {
  let text = stripOuterQuotes(unescapeLiteralNewlines(raw ?? ''));
  if (!text.trim()) return '';

  // Soft-split glued "sentence.-Sentence" / "sentence.Sentence"
  text = text.replace(/([.!?])([^\s\d"'”’])/g, '$1 $2');

  const lines = text.split('\n').map((l) => l.trimEnd());
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) {
      if (out.length && out[out.length - 1] !== '') out.push('');
      continue;
    }

    const heading = normalizeHeadingLine(line);
    if (heading) {
      if (out.length && out[out.length - 1] !== '') out.push('');
      out.push(`${'#'.repeat(heading.level)} ${heading.text}`);
      out.push('');
      continue;
    }

    const bullet = normalizeBulletLine(line);
    if (bullet) {
      out.push(`- ${bullet}`);
      continue;
    }

    const numbered = normalizeNumberedLine(line);
    if (numbered) {
      const numMatch = line.trim().match(/^(\d{1,2})/);
      const n = numMatch ? Number(numMatch[1]) : out.filter((x) => /^\d+\.\s/.test(x)).length + 1;
      out.push(`${n}. ${numbered}`);
      continue;
    }

    // Label: rest → bold-friendly lead (kept as paragraph; HTML will bold label)
    const label = line.match(/^([^:]{2,40}):\s+(.+)$/);
    if (label && !/[.!?]$/.test(label[1])) {
      out.push(`**${label[1].trim()}:** ${label[2].trim()}`);
      continue;
    }

    for (const para of splitDenseParagraph(line)) {
      out.push(para);
      out.push('');
    }
  }

  // Collapse 3+ blank lines → 1 blank
  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Inline markdown: **bold**, *italic* (single pass, non-nested). */
function inlineHtml(text: string): string {
  let s = escapeHtml(text);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  return s;
}

/** Parse normalized markdown body into typed blocks. */
export function parseNarrativeBlocks(raw: string): NarrativeBlock[] {
  const text = normalizeNarrativeBody(raw);
  const lines = text.split('\n');
  const blocks: NarrativeBlock[] = [];
  let listItems: string[] = [];
  let orderedItems: string[] = [];
  let para: string[] = [];

  const flushPara = () => {
    if (!para.length) return;
    const joined = para.join(' ').replace(/\s+/g, ' ').trim();
    if (joined) blocks.push({ type: 'p', text: joined });
    para = [];
  };
  const flushUl = () => {
    if (!listItems.length) return;
    blocks.push({ type: 'ul', items: [...listItems] });
    listItems = [];
  };
  const flushOl = () => {
    if (!orderedItems.length) return;
    blocks.push({ type: 'ol', items: [...orderedItems] });
    orderedItems = [];
  };
  const flushLists = () => {
    flushUl();
    flushOl();
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) {
      flushLists();
      flushPara();
      continue;
    }

    const h3 = trimmed.match(/^###\s+(.+)$/);
    if (h3) {
      flushLists();
      flushPara();
      blocks.push({ type: 'h3', text: h3[1].trim() });
      continue;
    }
    const h4 = trimmed.match(/^####\s+(.+)$/);
    if (h4) {
      flushLists();
      flushPara();
      blocks.push({ type: 'h4', text: h4[1].trim() });
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      flushOl();
      flushPara();
      listItems.push(bullet[1].trim());
      continue;
    }

    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (numbered) {
      flushUl();
      flushPara();
      orderedItems.push(numbered[1].trim());
      continue;
    }

    flushLists();
    para.push(trimmed);
  }

  flushLists();
  flushPara();
  return blocks;
}

/** Convert section body → HTML for Chromium PDF. */
export function formatSectionBodyHtml(body: string): string {
  const blocks = parseNarrativeBlocks(body);
  if (!blocks.length) return `<p>${escapeHtml(body)}</p>`;

  return blocks
    .map((b) => {
      switch (b.type) {
        case 'h3':
          return `<h3>${inlineHtml(b.text)}</h3>`;
        case 'h4':
          return `<h4>${inlineHtml(b.text)}</h4>`;
        case 'p':
          return `<p>${inlineHtml(b.text)}</p>`;
        case 'ul':
          return `<ul>${b.items.map((li) => `<li>${inlineHtml(li)}</li>`).join('')}</ul>`;
        case 'ol':
          return `<ol>${b.items.map((li) => `<li>${inlineHtml(li)}</li>`).join('')}</ol>`;
        default:
          return '';
      }
    })
    .join('\n');
}
