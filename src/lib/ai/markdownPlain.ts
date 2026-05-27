/**
 * Convert markdown source into clean plain text — strip syntax characters
 * like #, **, *, `, ```, [, ], (, ), > so users get something they can paste
 * into emails, chat boxes, or tickets without raw markdown leaking through.
 *
 * Structural markers that map to readable plain-text equivalents are kept:
 *   - Unordered list items become "• ..."
 *   - Ordered list items keep their "1. " numbering
 *   - GFM pipe tables become tab-separated rows
 *   - Fenced code blocks lose their fences but keep their contents verbatim
 *   - Headings are emitted as their text on their own line
 *
 * This is the converter used by the chat "copy as plain text" option.
 */
export function markdownToPlainText(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let inCode = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced code block — drop the fence, keep the inner content verbatim.
    if (/^\s*```/.test(line)) {
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      out.push(line);
      continue;
    }

    // GFM pipe table — only when the next line is a separator row.
    if (line.includes('|')) {
      const next = lines[i + 1] ?? '';
      const isSep = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(next);
      if (isSep) {
        const splitCells = (l: string): string[] =>
          l
            .replace(/^\s*\|/, '')
            .replace(/\|\s*$/, '')
            .split('|')
            .map((c) => c.trim());
        out.push(splitCells(line).map(inlineToPlain).join('\t'));
        i++; // skip separator row
        while (i + 1 < lines.length && lines[i + 1].includes('|')) {
          i++;
          out.push(splitCells(lines[i]).map(inlineToPlain).join('\t'));
        }
        continue;
      }
    }

    // Horizontal rule: collapse to a blank line.
    if (/^\s*[-*_]{3,}\s*$/.test(line)) {
      out.push('');
      continue;
    }

    // Heading: "## Heading" → "Heading"
    const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
    if (heading) {
      out.push(inlineToPlain(heading[2]));
      continue;
    }

    // Blockquote: "> text" → "text"
    const bq = line.match(/^\s*>\s?(.*)$/);
    if (bq) {
      out.push(inlineToPlain(bq[1]));
      continue;
    }

    // Unordered list: "- item" → "• item"
    const ul = line.match(/^(\s*)[-*+]\s+(.*)$/);
    if (ul) {
      out.push(`${ul[1]}• ${inlineToPlain(ul[2])}`);
      continue;
    }

    // Ordered list: keep the "1. " marker.
    const ol = line.match(/^(\s*)(\d+\.)\s+(.*)$/);
    if (ol) {
      out.push(`${ol[1]}${ol[2]} ${inlineToPlain(ol[3])}`);
      continue;
    }

    out.push(inlineToPlain(line));
  }

  // Collapse runs of 3+ blank lines to a single paragraph break.
  return (
    out
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+$/g, '') + '\n'
  );
}

function inlineToPlain(s: string): string {
  // Images: ![alt](url) → alt (do this before links so the leading ! survives).
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '$1');
  // Links: [text](url) → text
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1');
  // Inline code: `code` → code
  s = s.replace(/`([^`]+)`/g, '$1');
  // Bold then italic. Bold first so the asterisks inside ** don't trip italic.
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '$1');
  s = s.replace(/__([^_\n]+)__/g, '$1');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2');
  s = s.replace(/(^|[^_])_([^_\n]+)_/g, '$1$2');
  return s;
}
