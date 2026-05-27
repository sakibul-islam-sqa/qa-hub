'use client';

import * as React from 'react';
import { ToolPage } from '@/components/ToolPage';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Label } from '@/components/ui/Input';
import { ResetButton } from '@/components/ui/ResetButton';
import { escapeHtml } from '@/lib/utils';

const PRESETS = [
  { name: 'Email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}' },
  { name: 'URL', pattern: "https?://[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=]*" },
  { name: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b' },
  {
    name: 'UUID',
    pattern: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
  },
  { name: 'US phone', pattern: '\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}' },
  { name: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-\\d{2}-\\d{2}' },
];

const FLAG_KEYS = ['g', 'i', 'm', 's', 'u'] as const;

const DEFAULT_PATTERN = PRESETS[0].pattern;
const DEFAULT_FLAGS = 'gi';
const DEFAULT_TEXT = 'Contact ada@example.com or tester@qa.io. Backup: bob.smith+test@mail.co.uk';

// Soft caps to keep the browser responsive on pathological inputs / patterns.
// A truly catastrophic regex like /(a+)+b/ on a long string can still hang the
// main thread inside a single re.exec() call — there's no way to interrupt
// the engine from JS — but capping the search window and match count limits
// the blast radius enough that the page stays usable in practice.
const MAX_SEARCH_LEN = 200_000;
const MAX_MATCHES = 10_000;

export default function RegexPage() {
  const [pattern, setPattern] = React.useState(DEFAULT_PATTERN);
  const [flags, setFlags] = React.useState(DEFAULT_FLAGS);
  const [text, setText] = React.useState(DEFAULT_TEXT);

  function reset() {
    setPattern(DEFAULT_PATTERN);
    setFlags(DEFAULT_FLAGS);
    setText(DEFAULT_TEXT);
  }

  const { error, matches, highlighted, truncated, searchLen } = React.useMemo(() => {
    if (!pattern)
      return {
        error: '',
        matches: [] as RegExpExecArray[],
        highlighted: text,
        truncated: false,
        searchLen: text.length,
      };
    const searchText = text.length > MAX_SEARCH_LEN ? text.slice(0, MAX_SEARCH_LEN) : text;
    try {
      const re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
      const list: RegExpExecArray[] = [];
      let m: RegExpExecArray | null;
      let capped = false;
      while ((m = re.exec(searchText)) !== null) {
        if (m.index === re.lastIndex) re.lastIndex++;
        list.push(m);
        if (list.length >= MAX_MATCHES) {
          capped = true;
          break;
        }
      }
      let html = '';
      let cursor = 0;
      for (const x of list) {
        html += escapeHtml(searchText.slice(cursor, x.index));
        html += `<mark class="rounded bg-accent/30 px-0.5 text-fg">${escapeHtml(x[0])}</mark>`;
        cursor = x.index + x[0].length;
      }
      html += escapeHtml(searchText.slice(cursor));
      return {
        error: '',
        matches: list,
        highlighted: html,
        truncated: capped || text.length > MAX_SEARCH_LEN,
        searchLen: searchText.length,
      };
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : 'Invalid regex',
        matches: [] as RegExpExecArray[],
        highlighted: escapeHtml(searchText),
        truncated: text.length > MAX_SEARCH_LEN,
        searchLen: searchText.length,
      };
    }
  }, [pattern, flags, text]);

  function toggleFlag(f: string) {
    setFlags((cur) => (cur.includes(f) ? cur.replace(f, '') : cur + f));
  }

  return (
    <ToolPage slug="regex">
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.name}
                size="sm"
                variant="secondary"
                onClick={() => setPattern(p.pattern)}
              >
                {p.name}
              </Button>
            ))}
            <div className="ml-auto">
              <ResetButton onClick={reset} />
            </div>
          </div>

          <div>
            <Label>Pattern</Label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="font-mono text-sm text-muted">/</span>
                <Input
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  className="font-mono"
                  placeholder="regex pattern"
                />
                <span className="font-mono text-sm text-muted">/</span>
              </div>
              <div className="flex gap-1">
                {FLAG_KEYS.map((f) => {
                  const on = flags.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      aria-pressed={on}
                      aria-label={`Flag ${f}`}
                      onClick={() => toggleFlag(f)}
                      className={
                        'h-9 w-9 shrink-0 rounded-md border font-mono text-xs transition-colors ' +
                        (on
                          ? 'border-accent bg-accent/15 text-accent'
                          : 'border-border bg-surface-2 text-muted hover:text-fg')
                      }
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>
            {error && <p className="mt-2 text-xs text-danger">{error}</p>}
          </div>

          <div>
            <Label>Test string</Label>
            <Textarea
              mono
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              className="mt-2"
              spellCheck={false}
            />
          </div>

          <div>
            <Label>Highlighted</Label>
            <pre
              className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </div>

          {truncated && !error && (
            <p className="text-xs text-warning">
              {matches.length >= MAX_MATCHES
                ? `Showing the first ${MAX_MATCHES.toLocaleString()} matches.`
                : `Search limited to the first ${searchLen.toLocaleString()} of ${text.length.toLocaleString()} characters.`}
            </p>
          )}

          <div>
            <Label>
              {matches.length} match{matches.length === 1 ? '' : 'es'}
            </Label>
            {matches.length > 0 && (
              <div className="mt-2 overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[480px] text-xs">
                  <thead className="bg-surface-2 text-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">#</th>
                      <th className="px-3 py-2 text-left font-medium">Match</th>
                      <th className="px-3 py-2 text-left font-medium">Index</th>
                      <th className="px-3 py-2 text-left font-medium">Groups</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((m, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2 text-muted">{i + 1}</td>
                        <td className="px-3 py-2 font-mono">{m[0]}</td>
                        <td className="px-3 py-2 text-muted">{m.index}</td>
                        <td className="px-3 py-2 font-mono text-muted">
                          {m.length > 1
                            ? m
                                .slice(1)
                                .map((g) => (g === undefined ? '∅' : JSON.stringify(g)))
                                .join(', ')
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </ToolPage>
  );
}
