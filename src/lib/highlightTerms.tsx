import * as React from 'react';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Split `text` around each `terms` match and wrap matches in <mark>. Used by
 * the model pickers to make typed search terms pop in the rendered rows.
 * Returns the original string untouched when there's nothing to highlight.
 */
export function highlightTerms(text: string, terms: string[]): React.ReactNode {
  if (terms.length === 0 || !text) return text;
  const pattern = terms.map(escapeRegex).join('|');
  const re = new RegExp(`(${pattern})`, 'gi');
  const parts = text.split(re);
  return parts.map((part, i) => {
    const lower = part.toLowerCase();
    const isMatch = terms.some((t) => t === lower);
    return isMatch ? (
      <mark key={i} className="rounded bg-yellow-300 px-0.5 font-medium text-black">
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    );
  });
}
