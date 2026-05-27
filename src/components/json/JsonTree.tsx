'use client';

import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  data: unknown;
  maxHeight?: string;
}

export function JsonTree({ data, maxHeight = '24rem' }: Props) {
  return (
    <div
      style={{ maxHeight: `min(${maxHeight}, 60vh)` }}
      className="overflow-auto rounded-md border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed"
    >
      <TreeNode name="$" value={data} depth={0} isRoot />
    </div>
  );
}

interface NodeProps {
  name: string | number;
  value: unknown;
  depth: number;
  isRoot?: boolean;
}

function TreeNode({ name, value, depth, isRoot }: NodeProps) {
  const [open, setOpen] = React.useState(depth < 2);
  const isObject = value !== null && typeof value === 'object';

  if (!isObject) {
    return (
      <div className="flex items-baseline gap-1.5 py-0.5 pl-5">
        {!isRoot && <KeyLabel name={name} />}
        {!isRoot && <Punct>:</Punct>}
        <ValueDisplay value={value} />
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const entries = isArray
    ? (value as unknown[]).map((v, i) => [i, v] as const)
    : (Object.entries(value as Record<string, unknown>) as Array<
        readonly [string | number, unknown]
      >);
  const openBrace = isArray ? '[' : '{';
  const closeBrace = isArray ? ']' : '}';
  const count = entries.length;
  const noun = isArray ? 'item' : 'key';
  const summary = `${openBrace} ${count} ${noun}${count === 1 ? '' : 's'} ${closeBrace}`;

  return (
    <div className="select-text">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-baseline gap-1.5 rounded py-0.5 text-left transition-colors hover:bg-surface"
      >
        <ChevronRight
          className={cn('mt-0.5 h-3 w-3 shrink-0 transition-transform', open && 'rotate-90')}
          style={{ color: 'hsl(var(--code-punctuation))' }}
        />
        {!isRoot && <KeyLabel name={name} />}
        {!isRoot && <Punct>:</Punct>}
        {open ? <Punct>{openBrace}</Punct> : <span className="text-muted">{summary}</span>}
      </button>
      {open && (
        <>
          <div className="ml-1.5 border-l border-border">
            {entries.map(([k, v]) => (
              <TreeNode key={String(k)} name={k} value={v} depth={depth + 1} />
            ))}
          </div>
          <div className="pl-5">
            <Punct>{closeBrace}</Punct>
          </div>
        </>
      )}
    </div>
  );
}

function KeyLabel({ name }: { name: string | number }) {
  return (
    <span style={{ color: 'hsl(var(--code-property))' }}>
      {typeof name === 'number' ? name : `"${name}"`}
    </span>
  );
}

function Punct({ children }: { children: React.ReactNode }) {
  return <span style={{ color: 'hsl(var(--code-punctuation))' }}>{children}</span>;
}

function ValueDisplay({ value }: { value: unknown }) {
  if (value === null) {
    return <span style={{ color: 'hsl(var(--code-number))', fontStyle: 'italic' }}>null</span>;
  }
  if (typeof value === 'undefined') {
    return <span style={{ color: 'hsl(var(--code-number))', fontStyle: 'italic' }}>undefined</span>;
  }
  if (typeof value === 'string') {
    return <span style={{ color: 'hsl(var(--code-string))' }}>"{value}"</span>;
  }
  if (typeof value === 'number') {
    return <span style={{ color: 'hsl(var(--code-number))' }}>{String(value)}</span>;
  }
  if (typeof value === 'boolean') {
    return (
      <span style={{ color: 'hsl(var(--code-number))', fontWeight: 500 }}>{String(value)}</span>
    );
  }
  return <span>{String(value)}</span>;
}
