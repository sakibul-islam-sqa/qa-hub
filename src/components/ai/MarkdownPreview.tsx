'use client';

import * as React from 'react';
import { highlight, type Lang } from '@/lib/prism';
import { copyToClipboard, escapeHtml } from '@/lib/utils';

/**
 * Minimal markdown → HTML for AI output preview.
 * Handles headings, bold/italic, inline code, fenced code with Prism
 * syntax highlighting, ordered/unordered lists, blockquotes, links, and
 * GFM-style pipe tables. Sanitizes by escaping all non-code input first
 * and then re-applying a fixed set of tags.
 */
export function MarkdownPreview({ source }: { source: string }) {
  const html = React.useMemo(() => renderMarkdown(source), [source]);
  const rootRef = React.useRef<HTMLDivElement>(null);

  // Delegated click handler for inline "Copy code" buttons inside the
  // rendered markdown. The buttons are produced as plain HTML by the
  // renderer (we can't put React children inside a dangerouslySetInnerHTML
  // tree), so we listen on the outer div and act on data-action="copy-code".
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest('[data-action="copy-code"]') as HTMLButtonElement | null;
      if (!btn || !root!.contains(btn)) return;
      e.preventDefault();
      const wrap = btn.closest('.prose-qa-code');
      const codeEl = wrap?.querySelector('pre code') ?? wrap?.querySelector('pre');
      const text = codeEl?.textContent ?? '';
      void copyToClipboard(text).then((ok) => {
        if (!ok) return;
        const original = btn.innerHTML;
        btn.innerHTML = `${ICON_CHECK_HTML}<span>Copied</span>`;
        btn.dataset.copied = 'true';
        window.setTimeout(() => {
          // Guard against the button having been replaced by a re-render.
          if (btn.isConnected) {
            btn.innerHTML = original;
            delete btn.dataset.copied;
          }
        }, 1500);
      });
    }
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, []);

  return (
    <div
      ref={rootRef}
      className="prose-qa"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Render markdown to HTML using the same rules as <MarkdownPreview>. Exposed
 * so callers (e.g. the chat copy-with-formatting button) can serialize a
 * message to HTML for the clipboard without going through the DOM.
 */
export function renderMarkdownToHtml(source: string): string {
  return renderMarkdown(source);
}

/**
 * Normalize a fence info-string ("```python") to a known Prism Lang, or
 * `null` when the language is unknown / unsupported.
 */
function normalizeLang(raw: string): Lang | null {
  const key = raw.toLowerCase();
  const map: Record<string, Lang> = {
    js: 'javascript',
    javascript: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    typescript: 'typescript',
    tsx: 'typescript',
    py: 'python',
    python: 'python',
    sh: 'bash',
    shell: 'bash',
    zsh: 'bash',
    bash: 'bash',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    html: 'markup',
    xml: 'markup',
    svg: 'markup',
    markup: 'markup',
    css: 'css',
    regex: 'regex',
  };
  return map[key] ?? null;
}

function inline(s: string) {
  // Inline code first, with placeholders so other replacements don't touch it.
  const codes: string[] = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(`<code>${c}</code>`);
    return ` C${codes.length - 1} `;
  });

  // Bold then italic.
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');

  // Links [text](url) — only http(s) and relative paths.
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) => {
    const safe = /^(https?:|\/|#|mailto:)/.test(href) ? href : '#';
    const external = /^https?:/.test(safe);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${safe}"${attrs}>${text}</a>`;
  });

  // Restore inline code.
  s = s.replace(/ C(\d+) /g, (_, i) => codes[Number(i)]);
  return s;
}

// Inline SVGs so the renderer doesn't depend on React for the copy/check
// icons — `currentColor` lets CSS drive the color.
const ICON_COPY_HTML =
  '<svg aria-hidden="true" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
const ICON_CHECK_HTML =
  '<svg aria-hidden="true" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

function renderCodeBlock(raw: string, infoString: string): string {
  // If the block was tagged as markdown/text (or untagged) and its contents
  // look like a table the model drew with pipes and dashes, render it as a
  // real <table> instead of a code block — many open models default to
  // ASCII-art tables even when asked for GFM, and users want the table.
  const tag = infoString.toLowerCase();
  if (
    tag === '' ||
    tag === 'markdown' ||
    tag === 'md' ||
    tag === 'text' ||
    tag === 'txt' ||
    tag === 'plaintext'
  ) {
    const tableHtml = tryParsePipeBlockAsTable(raw);
    if (tableHtml) return tableHtml;
  }

  const lang = normalizeLang(infoString);
  const body = lang ? highlight(raw, lang) : escapeHtml(raw);
  const cls = infoString ? ` class="language-${escapeHtml(infoString)}"` : '';
  const langLabel = infoString ? escapeHtml(infoString) : 'code';
  const header =
    `<div class="prose-qa-code-lang">` +
    `<span>${langLabel}</span>` +
    `<button type="button" class="prose-qa-code-copy" data-action="copy-code" aria-label="Copy code">${ICON_COPY_HTML}<span>Copy</span></button>` +
    `</div>`;
  return `<div class="prose-qa-code">${header}<pre${cls}><code${cls}>${body}</code></pre></div>`;
}

/**
 * Detect pipe-and-dash tables a model has drawn inside a code fence and
 * convert them to a real HTML table. Handles both:
 *   1. ASCII-art tables with +-----+ separator rows
 *   2. GFM-style pipe tables that the model wrapped in a code fence
 * Returns null when the content doesn't look like a table.
 */
function tryParsePipeBlockAsTable(raw: string): string | null {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) return null;

  // A separator looks like +-----+-----+ or |-----|-----| or just -----|-----.
  const isAsciiSep = (l: string) => /^[+|][-+=\s|]*[-=][-+=\s|]*[+|]?$/.test(l) && /[-=]/.test(l);
  // A GFM-style separator like | --- | :---: |
  const isGfmSep = (l: string) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(l);
  const isData = (l: string) => l.includes('|') && !isAsciiSep(l) && !isGfmSep(l);

  const hasSep = lines.some((l) => isAsciiSep(l) || isGfmSep(l));
  if (!hasSep) return null;

  const dataLines = lines.filter(isData);
  if (dataLines.length < 1) return null;

  const splitCells = (line: string): string[] => {
    // Strip a single leading/trailing pipe if present, then split.
    const trimmed = line.replace(/^\s*\|/, '').replace(/\|\s*$/, '');
    return trimmed.split('|').map((c) => c.trim());
  };

  // First data line is the header. Subsequent lines are body rows. Lines
  // where the first cell is empty are treated as continuations of the
  // previous row — many models draw ASCII tables that wrap long cells.
  const rows: string[][] = [];
  for (const line of dataLines) {
    const cells = splitCells(line);
    const isContinuation = rows.length > 0 && cells.length > 0 && cells[0] === '';
    if (isContinuation) {
      const prev = rows[rows.length - 1];
      const cols = Math.max(prev.length, cells.length);
      for (let i = 0; i < cols; i++) {
        const c = (cells[i] ?? '').trim();
        if (!c) continue;
        prev[i] = prev[i] ? prev[i] + ' ' + c : c;
      }
    } else {
      rows.push(cells);
    }
  }

  if (rows.length < 1) return null;

  // Pad short rows so the table stays rectangular.
  const cols = Math.max(...rows.map((r) => r.length));
  if (cols < 2) return null;
  for (const r of rows) {
    while (r.length < cols) r.push('');
    if (r.length > cols) r.length = cols;
  }
  if (!rows.some((r) => r.some((c) => c.length > 0))) return null;

  const [header, ...body] = rows;
  const thead =
    '<thead><tr>' +
    header.map((c) => `<th>${inline(escapeHtml(c))}</th>`).join('') +
    '</tr></thead>';
  const tbody = body.length
    ? '<tbody>' +
      body
        .map((r) => '<tr>' + r.map((c) => `<td>${inline(escapeHtml(c))}</td>`).join('') + '</tr>')
        .join('') +
      '</tbody>'
    : '';
  return `<div class="prose-qa-table"><table>${thead}${tbody}</table></div>`;
}

/**
 * Parse a GFM pipe-table starting at lines[i]. Returns the rendered HTML
 * and the line index *after* the table on success, or null when the lines
 * don't form a valid table.
 */
function tryParseTable(lines: string[], start: number): { html: string; next: number } | null {
  const header = lines[start];
  const sep = lines[start + 1];
  if (!header || !sep) return null;
  if (!/\|/.test(header)) return null;
  if (!/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(sep)) return null;

  const splitRow = (row: string): string[] =>
    row
      .replace(/^\s*\|/, '')
      .replace(/\|\s*$/, '')
      .split('|')
      .map((c) => c.trim());

  const headerCells = splitRow(header);
  const alignCells = splitRow(sep).map((c) => {
    const left = c.startsWith(':');
    const right = c.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    if (left) return 'left';
    return null;
  });
  if (headerCells.length !== alignCells.length) return null;

  const rows: string[][] = [];
  let i = start + 2;
  while (i < lines.length) {
    const row = lines[i];
    if (!/\|/.test(row) || row.trim() === '') break;
    const cells = splitRow(row);
    // Pad/trim to header width so the table stays rectangular.
    while (cells.length < headerCells.length) cells.push('');
    if (cells.length > headerCells.length) cells.length = headerCells.length;
    rows.push(cells);
    i++;
  }

  const styleFor = (idx: number) =>
    alignCells[idx] ? ` style="text-align:${alignCells[idx]}"` : '';

  const thead =
    '<thead><tr>' +
    headerCells.map((c, idx) => `<th${styleFor(idx)}>${inline(escapeHtml(c))}</th>`).join('') +
    '</tr></thead>';

  const tbody = rows.length
    ? '<tbody>' +
      rows
        .map(
          (r) =>
            '<tr>' +
            r.map((c, idx) => `<td${styleFor(idx)}>${inline(escapeHtml(c))}</td>`).join('') +
            '</tr>',
        )
        .join('') +
      '</tbody>'
    : '';

  return {
    html: `<div class="prose-qa-table"><table>${thead}${tbody}</table></div>`,
    next: i,
  };
}

function renderMarkdown(input: string): string {
  const lines = input.split('\n');
  const out: string[] = [];

  let inCode = false;
  let codeLang = '';
  let codeBuf: string[] = [];

  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];

    const fence = rawLine.match(/^```(\w*)\s*$/);
    if (fence) {
      if (inCode) {
        closeList();
        out.push(renderCodeBlock(codeBuf.join('\n'), codeLang));
        codeBuf = [];
        codeLang = '';
        inCode = false;
      } else {
        closeList();
        inCode = true;
        codeLang = fence[1] || '';
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(rawLine);
      continue;
    }

    // Try a GFM pipe table starting on this line.
    const table = tryParseTable(lines, i);
    if (table) {
      closeList();
      out.push(table.html);
      i = table.next - 1; // for-loop will ++
      continue;
    }

    // Escape this line, then apply inline transforms / block matching.
    const line = escapeHtml(rawLine);

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    const ul = line.match(/^\s*[-*]\s+(.*)$/);

    if (ol) {
      if (listType !== 'ol') {
        closeList();
        out.push('<ol>');
        listType = 'ol';
      }
      out.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }
    if (ul) {
      if (listType !== 'ul') {
        closeList();
        out.push('<ul>');
        listType = 'ul';
      }
      out.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }

    if (line.trim() === '') {
      closeList();
      continue;
    }

    const bq = line.match(/^>\s?(.*)$/);
    if (bq) {
      closeList();
      out.push(`<blockquote>${inline(bq[1])}</blockquote>`);
      continue;
    }

    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }

  if (inCode) {
    out.push(renderCodeBlock(codeBuf.join('\n'), codeLang));
  }
  closeList();
  return out.join('\n');
}
