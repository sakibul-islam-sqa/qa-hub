'use client';

import * as React from 'react';
import { diffLines, diffWordsWithSpace } from 'diff';
import { ToolPage } from '@/components/ToolPage';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Input';
import { ResetButton } from '@/components/ui/ResetButton';
import { CodeEditor } from '@/components/ui/CodeEditor';

type View = 'split' | 'inline';

const DEFAULT_LEFT = 'Hello world\nThe quick brown fox\njumps over the lazy dog';
const DEFAULT_RIGHT = 'Hello, world!\nThe quick brown fox\nleaps over the lazy cat';

export default function DiffPage() {
  const [left, setLeft] = React.useState(DEFAULT_LEFT);
  const [right, setRight] = React.useState(DEFAULT_RIGHT);
  const [view, setView] = React.useState<View>('inline');
  const [granularity, setGranularity] = React.useState<'line' | 'word'>('word');

  function reset() {
    setLeft(DEFAULT_LEFT);
    setRight(DEFAULT_RIGHT);
    setView('inline');
    setGranularity('word');
  }

  const parts = React.useMemo(() => {
    return granularity === 'line' ? diffLines(left, right) : diffWordsWithSpace(left, right);
  }, [left, right, granularity]);

  const stats = React.useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const p of parts) {
      // In line mode `p.count` is the line count of the chunk; in word mode
      // the `diff` library uses it as the token count. Either way it's the
      // right "things changed" number to surface — never fall back to a
      // newline count, which yields 0 for inline edits in word mode.
      const c = p.count ?? 1;
      if (p.added) added += c;
      if (p.removed) removed += c;
    }
    return { added, removed };
  }, [parts]);

  return (
    <ToolPage slug="diff">
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={view === 'inline' ? 'primary' : 'secondary'}
              onClick={() => setView('inline')}
            >
              Inline view
            </Button>
            <Button
              size="sm"
              variant={view === 'split' ? 'primary' : 'secondary'}
              onClick={() => setView('split')}
            >
              Split view
            </Button>
            <div className="mx-2 h-5 w-px bg-border" />
            <Button
              size="sm"
              variant={granularity === 'word' ? 'primary' : 'secondary'}
              onClick={() => setGranularity('word')}
            >
              Word
            </Button>
            <Button
              size="sm"
              variant={granularity === 'line' ? 'primary' : 'secondary'}
              onClick={() => setGranularity('line')}
            >
              Line
            </Button>
            <div className="ml-auto flex items-center gap-3 text-xs">
              <span className="text-success">+{stats.added}</span>
              <span className="text-danger">−{stats.removed}</span>
              <ResetButton onClick={reset} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <div>
              <Label>Original</Label>
              <div className="mt-2">
                <CodeEditor value={left} onChange={setLeft} language="plain" minHeight={200} />
              </div>
            </div>
            <div>
              <Label>Modified</Label>
              <div className="mt-2">
                <CodeEditor value={right} onChange={setRight} language="plain" minHeight={200} />
              </div>
            </div>
          </div>

          <div>
            <Label>Diff</Label>
            <div className="mt-2 overflow-auto rounded-md border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed">
              {view === 'inline' ? (
                <pre className="whitespace-pre-wrap break-words">
                  {parts.map((p, i) => (
                    <span
                      key={i}
                      className={
                        p.added
                          ? 'bg-success/15 text-success'
                          : p.removed
                            ? 'bg-danger/15 text-danger line-through'
                            : ''
                      }
                    >
                      {p.value}
                    </span>
                  ))}
                </pre>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <pre className="whitespace-pre-wrap break-words">
                    {parts.map((p, i) =>
                      p.added ? null : (
                        <span key={i} className={p.removed ? 'bg-danger/15 text-danger' : ''}>
                          {p.value}
                        </span>
                      ),
                    )}
                  </pre>
                  <pre className="whitespace-pre-wrap break-words">
                    {parts.map((p, i) =>
                      p.removed ? null : (
                        <span key={i} className={p.added ? 'bg-success/15 text-success' : ''}>
                          {p.value}
                        </span>
                      ),
                    )}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolPage>
  );
}
