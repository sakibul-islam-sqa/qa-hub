'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { highlight, type Lang } from '@/lib/prism';
import { cn } from '@/lib/utils';

// react-simple-code-editor renders a controlled <textarea> whose value React
// only sets at runtime - the SSR'd markup ends up empty, which React 18 flags
// as a hydration mismatch. Importing it with ssr: false guarantees the editor
// never runs on the server, and the `Placeholder` below renders identically on
// the server and on the client's first paint, so hydration is clean.
const Editor = dynamic(
  () => import('react-simple-code-editor').then((m) => ({ default: m.default })),
  {
    ssr: false,
    loading: () => null,
  },
);

interface CodeEditorProps {
  value: string;
  onChange: (v: string) => void;
  language?: Lang;
  placeholder?: string;
  className?: string;
  minHeight?: number;
  readOnly?: boolean;
  wrap?: boolean;
}

export function CodeEditor({
  value,
  onChange,
  language = 'plain',
  placeholder,
  className,
  minHeight = 280,
  readOnly = false,
  wrap = true,
}: CodeEditorProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const wrapperClass = cn(
    'overflow-auto rounded-md border border-border bg-surface-2 transition-colors focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/40',
    'language-' + language,
    !wrap && 'code-editor-nowrap',
    className,
  );

  if (!mounted) {
    return (
      <div className={wrapperClass} style={{ maxHeight: 'min(32rem, 60vh)' }}>
        <StaticHighlightedPre value={value} language={language} minHeight={minHeight} wrap={wrap} />
      </div>
    );
  }

  return (
    <div className={wrapperClass} style={{ maxHeight: 'min(32rem, 60vh)' }}>
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={(code) => highlight(code, language)}
        padding={12}
        placeholder={placeholder}
        readOnly={readOnly}
        textareaClassName="focus:outline-none"
        preClassName={`language-${language}`}
        style={{
          fontFamily: 'var(--font-mono), ui-monospace, monospace',
          fontSize: 12,
          lineHeight: 1.6,
          minHeight,
        }}
      />
    </div>
  );
}

function StaticHighlightedPre({
  value,
  language,
  minHeight,
  wrap,
}: {
  value: string;
  language: Lang;
  minHeight: number;
  wrap: boolean;
}) {
  const html = highlight(value, language);
  return (
    <pre
      className={`language-${language}`}
      style={{
        margin: 0,
        padding: 12,
        minHeight,
        fontFamily: 'var(--font-mono), ui-monospace, monospace',
        fontSize: 12,
        lineHeight: 1.6,
        whiteSpace: wrap ? 'pre-wrap' : 'pre',
        wordBreak: wrap ? 'keep-all' : 'normal',
        overflowWrap: wrap ? 'break-word' : 'normal',
      }}
    >
      <code className={`language-${language}`} dangerouslySetInnerHTML={{ __html: html || ' ' }} />
    </pre>
  );
}
