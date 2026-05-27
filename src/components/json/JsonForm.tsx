'use client';

import * as React from 'react';

interface Props {
  data: unknown;
  maxHeight?: string;
}

export function JsonForm({ data, maxHeight = '24rem' }: Props) {
  const rows = React.useMemo(() => Object.entries(flatten(data)), [data]);

  return (
    <div
      style={{ maxHeight: `min(${maxHeight}, 60vh)` }}
      className="overflow-auto rounded-md border border-border bg-surface-2 p-3"
    >
      {rows.length === 0 ? (
        <div className="px-2 py-3 text-xs text-muted">Empty</div>
      ) : (
        <div className="divide-y divide-border">
          {rows.map(([path, value]) => (
            <FormRow key={path} path={path} value={value} />
          ))}
        </div>
      )}
    </div>
  );
}

function FormRow({ path, value }: { path: string; value: unknown }) {
  const type = getType(value);
  return (
    <div className="grid grid-cols-1 items-start gap-2 py-2 sm:grid-cols-[minmax(0,2fr)_3fr] sm:gap-4">
      <div className="min-w-0">
        <div className="break-all font-mono text-xs font-medium" title={path}>
          {path}
        </div>
        <div className="mt-0.5 inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
          {type}
        </div>
      </div>
      <div className="min-h-[34px] break-all rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-xs">
        {formatValue(value)}
      </div>
    </div>
  );
}

function flatten(root: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  function walk(v: unknown, path: string) {
    if (v === null || typeof v !== 'object') {
      out[path || '$'] = v;
      return;
    }
    if (Array.isArray(v)) {
      if (v.length === 0) {
        out[path || '$'] = '[]';
        return;
      }
      v.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    const keys = Object.keys(v as Record<string, unknown>);
    if (keys.length === 0) {
      out[path || '$'] = '{}';
      return;
    }
    for (const k of keys) {
      const sub = path ? `${path}.${k}` : k;
      walk((v as Record<string, unknown>)[k], sub);
    }
  }

  walk(root, '');
  return out;
}

function getType(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

function formatValue(v: unknown): string {
  if (v === null) return 'null';
  if (typeof v === 'undefined') return 'undefined';
  if (typeof v === 'string') return `"${v}"`;
  return String(v);
}
