'use client';

import * as React from 'react';
import { highlight, type Lang } from '@/lib/prism';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: Lang;
  className?: string;
  maxHeight?: string;
}

export function CodeBlock({
  code,
  language = 'plain',
  className,
  maxHeight = '24rem',
}: CodeBlockProps) {
  const html = React.useMemo(() => highlight(code, language), [code, language]);

  return (
    <pre
      tabIndex={0}
      style={{ maxHeight: `min(${maxHeight}, 60vh)` }}
      className={cn(
        'overflow-auto rounded-md border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed',
        'language-' + language,
        className,
      )}
    >
      <code className={`language-${language}`} dangerouslySetInnerHTML={{ __html: html || ' ' }} />
    </pre>
  );
}
