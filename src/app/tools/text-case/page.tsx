'use client';

import * as React from 'react';
import { ToolPage } from '@/components/ToolPage';
import { Card, CardContent } from '@/components/ui/Card';
import { Textarea, Label } from '@/components/ui/Input';
import { CopyButton } from '@/components/ui/CopyButton';
import { ResetButton } from '@/components/ui/ResetButton';

const SAMPLE = 'My QA Hub Test Case';

function toWords(s: string): string[] {
  return s
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s\-_./\\]+/)
    .filter(Boolean);
}

function cap(w: string) {
  return w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w;
}

type Case = {
  key: string;
  label: string;
  example: string;
  fn: (s: string) => string;
};

const CASES: Case[] = [
  { key: 'lower', label: 'lowercase', example: 'hello world', fn: (s) => s.toLowerCase() },
  { key: 'upper', label: 'UPPERCASE', example: 'HELLO WORLD', fn: (s) => s.toUpperCase() },
  {
    key: 'title',
    label: 'Title Case',
    example: 'Hello World',
    fn: (s) => toWords(s).map(cap).join(' '),
  },
  {
    key: 'sentence',
    label: 'Sentence case',
    example: 'Hello world',
    fn: (s) => {
      const lower = s.toLowerCase();
      return lower.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, p, c) => p + c.toUpperCase());
    },
  },
  {
    key: 'camel',
    label: 'camelCase',
    example: 'helloWorld',
    fn: (s) => {
      const w = toWords(s);
      if (!w.length) return '';
      return w[0].toLowerCase() + w.slice(1).map(cap).join('');
    },
  },
  {
    key: 'pascal',
    label: 'PascalCase',
    example: 'HelloWorld',
    fn: (s) => toWords(s).map(cap).join(''),
  },
  {
    key: 'snake',
    label: 'snake_case',
    example: 'hello_world',
    fn: (s) =>
      toWords(s)
        .map((w) => w.toLowerCase())
        .join('_'),
  },
  {
    key: 'constant',
    label: 'CONSTANT_CASE',
    example: 'HELLO_WORLD',
    fn: (s) =>
      toWords(s)
        .map((w) => w.toUpperCase())
        .join('_'),
  },
  {
    key: 'kebab',
    label: 'kebab-case',
    example: 'hello-world',
    fn: (s) =>
      toWords(s)
        .map((w) => w.toLowerCase())
        .join('-'),
  },
  {
    key: 'cobol',
    label: 'COBOL-CASE',
    example: 'HELLO-WORLD',
    fn: (s) =>
      toWords(s)
        .map((w) => w.toUpperCase())
        .join('-'),
  },
  {
    key: 'dot',
    label: 'dot.case',
    example: 'hello.world',
    fn: (s) =>
      toWords(s)
        .map((w) => w.toLowerCase())
        .join('.'),
  },
  {
    key: 'path',
    label: 'path/case',
    example: 'hello/world',
    fn: (s) =>
      toWords(s)
        .map((w) => w.toLowerCase())
        .join('/'),
  },
  {
    key: 'header',
    label: 'Header-Case',
    example: 'Hello-World',
    fn: (s) => toWords(s).map(cap).join('-'),
  },
  {
    key: 'alternating',
    label: 'aLtErNaTiNg',
    example: 'hElLo WoRlD',
    fn: (s) =>
      s
        .split('')
        .map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase()))
        .join(''),
  },
  {
    key: 'inverse',
    label: 'iNVERSE cASE',
    example: 'hELLO wORLD',
    fn: (s) =>
      s
        .split('')
        .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
        .join(''),
  },
  {
    key: 'reverse',
    label: 'Reverse',
    example: 'dlroW olleH',
    fn: (s) => s.split('').reverse().join(''),
  },
  {
    key: 'slug',
    label: 'url-slug',
    example: 'hello-world',
    fn: (s) =>
      toWords(s)
        .map((w) => w.toLowerCase().replace(/[^a-z0-9]+/g, ''))
        .filter(Boolean)
        .join('-'),
  },
  {
    key: 'trim',
    label: 'Trimmed (squashed spaces)',
    example: 'hello world',
    fn: (s) => s.trim().replace(/\s+/g, ' '),
  },
];

export default function TextCasePage() {
  const [input, setInput] = React.useState(SAMPLE);

  const stats = React.useMemo(() => {
    const chars = input.length;
    const charsNoSpace = input.replace(/\s/g, '').length;
    const words = input.trim() ? input.trim().split(/\s+/).length : 0;
    const lines = input ? input.split('\n').length : 0;
    const bytes = new Blob([input]).size;
    return { chars, charsNoSpace, words, lines, bytes };
  }, [input]);

  return (
    <ToolPage slug="text-case">
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <Label>Input</Label>
            <ResetButton onClick={() => setInput(SAMPLE)} />
          </div>
          <Textarea
            mono
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            placeholder="Type or paste text…"
            spellCheck={false}
          />
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
            <Stat label="Chars" value={stats.chars} />
            <Stat label="No spaces" value={stats.charsNoSpace} />
            <Stat label="Words" value={stats.words} />
            <Stat label="Lines" value={stats.lines} />
            <Stat label="Bytes" value={stats.bytes} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {CASES.map((c) => {
          const value = input ? c.fn(input) : '';
          return (
            <Card key={c.key}>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {c.label}
                    </div>
                    <div className="text-[10px] text-muted/70">e.g. {c.example}</div>
                  </div>
                  <CopyButton value={value} label="" />
                </div>
                <div className="break-all rounded-md border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed">
                  {value || <span className="italic text-muted">-</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ToolPage>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-2">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">{label}</div>
      <div className="mt-0.5 font-mono text-base">{value}</div>
    </div>
  );
}
