"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  onUploadImage?: (file: File) => Promise<string>;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your article content here...",
  minHeight = "320px",
  onUploadImage,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRawHtml, setIsRawHtml] = useState(false);
  const [rawText, setRawText] = useState(value || "");
  const [isUploading, setIsUploading] = useState(false);
  const isUpdatingFromPropRef = useRef(false);

  // Sync prop value into editor innerHTML when value changes externally
  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value && !isUpdatingFromPropRef.current) {
      editorRef.current.innerHTML = value || "";
    }
    setRawText(value || "");
  }, [value]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    isUpdatingFromPropRef.current = true;
    const html = editorRef.current.innerHTML;
    onChange(html);
    setRawText(html);
    setTimeout(() => {
      isUpdatingFromPropRef.current = false;
    }, 50);
  }, [onChange]);

  const exec = (command: string, val: string | undefined = undefined) => {
    if (isRawHtml) return;
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleInput();
  };

  const handleFormatBlock = (tag: string) => {
    exec("formatBlock", tag ? `<${tag}>` : "<p>");
  };

  const handleInsertLink = () => {
    const url = window.prompt("Enter link URL (e.g. https://...):");
    if (url) {
      exec("createLink", url);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      let imageUrl = "";

      if (onUploadImage) {
        imageUrl = await onUploadImage(file);
      } else {
        // Fallback: Read as base64 data URL
        const reader = new FileReader();
        imageUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      if (imageUrl) {
        editorRef.current?.focus();
        exec("insertImage", imageUrl);
      }
    } catch (err: unknown) {
      alert(`Image upload failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRawChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setRawText(next);
    onChange(next);
    if (editorRef.current) {
      editorRef.current.innerHTML = next;
    }
  };

  return (
    <div className="relative rounded-xl border border-line bg-[color-mix(in_srgb,var(--bg-card)_70%,black)] overflow-hidden shadow-sm">
      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-line/70 bg-[color-mix(in_srgb,var(--bg)_85%,#121d33)] px-2.5 py-1.5 text-xs text-ink">
        {/* Headings */}
        <button
          type="button"
          onClick={() => handleFormatBlock("p")}
          className="rounded px-2 py-1 font-medium hover:bg-white/10 active:scale-95 transition"
          title="Paragraph"
        >
          P
        </button>
        <button
          type="button"
          onClick={() => handleFormatBlock("h2")}
          className="rounded px-2 py-1 font-bold hover:bg-white/10 active:scale-95 transition text-accent"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => handleFormatBlock("h3")}
          className="rounded px-2 py-1 font-semibold hover:bg-white/10 active:scale-95 transition text-accent/80"
          title="Heading 3"
        >
          H3
        </button>

        <span className="h-4 w-px bg-line/60 mx-1" />

        {/* Text Styles */}
        <button
          type="button"
          onClick={() => exec("bold")}
          className="rounded px-2 py-1 font-bold hover:bg-white/10 active:scale-95 transition"
          title="Bold (Ctrl+B)"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => exec("italic")}
          className="rounded px-2 py-1 italic font-serif hover:bg-white/10 active:scale-95 transition"
          title="Italic (Ctrl+I)"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => exec("underline")}
          className="rounded px-2 py-1 underline hover:bg-white/10 active:scale-95 transition"
          title="Underline (Ctrl+U)"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => exec("strikeThrough")}
          className="rounded px-2 py-1 line-through hover:bg-white/10 active:scale-95 transition text-muted"
          title="Strikethrough"
        >
          S
        </button>

        <span className="h-4 w-px bg-line/60 mx-1" />

        {/* Lists & Quote */}
        <button
          type="button"
          onClick={() => exec("insertUnorderedList")}
          className="rounded px-2 py-1 hover:bg-white/10 active:scale-95 transition"
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => exec("insertOrderedList")}
          className="rounded px-2 py-1 hover:bg-white/10 active:scale-95 transition"
          title="Numbered List"
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => handleFormatBlock("blockquote")}
          className="rounded px-2 py-1 hover:bg-white/10 active:scale-95 transition italic text-muted"
          title="Quote Block"
        >
          “ Quote
        </button>

        <span className="h-4 w-px bg-line/60 mx-1" />

        {/* Media & Links */}
        <button
          type="button"
          onClick={handleInsertLink}
          className="rounded px-2 py-1 text-sky-400 hover:bg-white/10 active:scale-95 transition"
          title="Insert Link"
        >
          🔗 Link
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1 rounded bg-accent/15 px-2.5 py-1 font-medium text-accent hover:bg-accent/25 active:scale-95 transition disabled:opacity-50"
          title="Upload & Insert Image"
        >
          {isUploading ? "Uploading..." : "📷 Insert Image"}
        </button>

        <span className="h-4 w-px bg-line/60 mx-1" />

        {/* Clear formatting & undo */}
        <button
          type="button"
          onClick={() => exec("undo")}
          className="rounded px-1.5 py-1 text-muted hover:bg-white/10 active:scale-95 transition"
          title="Undo"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => exec("redo")}
          className="rounded px-1.5 py-1 text-muted hover:bg-white/10 active:scale-95 transition"
          title="Redo"
        >
          ↷
        </button>
        <button
          type="button"
          onClick={() => exec("removeFormat")}
          className="rounded px-2 py-1 text-muted hover:bg-white/10 active:scale-95 transition"
          title="Clear Formatting"
        >
          Tx
        </button>

        {/* HTML switch */}
        <button
          type="button"
          onClick={() => setIsRawHtml(!isRawHtml)}
          className={`ml-auto rounded px-2.5 py-1 text-[11px] font-mono transition border ${
            isRawHtml
              ? "border-accent bg-accent/20 text-accent font-semibold"
              : "border-line/60 text-muted hover:text-ink"
          }`}
          title="Toggle HTML code view"
        >
          {isRawHtml ? "WYSIWYG Mode" : "</> HTML Code"}
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="p-3">
        {isRawHtml ? (
          <textarea
            value={rawText}
            onChange={handleRawChange}
            style={{ minHeight }}
            className="w-full rounded-lg border border-line/60 bg-black/40 p-3 font-mono text-xs leading-relaxed text-amber-200 focus:border-accent focus:outline-none"
            placeholder="Edit raw HTML code..."
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            style={{ minHeight }}
            data-placeholder={placeholder}
            className="blog-editor-prose prose-invert min-h-[320px] w-full rounded-lg p-3 text-sm leading-relaxed text-ink focus:outline-none focus:ring-1 focus:ring-accent/40 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-accent [&_h2]:my-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_h3]:my-2 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-accent/60 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-3 [&_img]:border [&_img]:border-line/60 [&_a]:text-sky-400 [&_a]:underline"
          />
        )}
      </div>
    </div>
  );
}
