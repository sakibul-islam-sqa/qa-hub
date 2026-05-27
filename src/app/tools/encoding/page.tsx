'use client';

import * as React from 'react';
import { ToolPage } from '@/components/ToolPage';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea, Label } from '@/components/ui/Input';
import { CopyButton } from '@/components/ui/CopyButton';
import { ResetButton } from '@/components/ui/ResetButton';
import { CodeBlock } from '@/components/ui/CodeBlock';
import type { Lang } from '@/lib/prism';
import { escapeHtml } from '@/lib/utils';

type Op =
  | 'base64-encode'
  | 'base64-decode'
  | 'url-encode'
  | 'url-decode'
  | 'html-encode'
  | 'html-decode'
  | 'jwt-decode'
  | 'sha-1'
  | 'sha-256'
  | 'sha-384'
  | 'sha-512';

const OPS: { value: Op; label: string; group: string }[] = [
  { value: 'base64-encode', label: 'Base64 encode', group: 'Base64' },
  { value: 'base64-decode', label: 'Base64 decode', group: 'Base64' },
  { value: 'url-encode', label: 'URL encode', group: 'URL' },
  { value: 'url-decode', label: 'URL decode', group: 'URL' },
  { value: 'html-encode', label: 'HTML encode', group: 'HTML' },
  { value: 'html-decode', label: 'HTML decode', group: 'HTML' },
  { value: 'jwt-decode', label: 'JWT decode', group: 'JWT' },
  { value: 'sha-1', label: 'SHA-1', group: 'Hash' },
  { value: 'sha-256', label: 'SHA-256', group: 'Hash' },
  { value: 'sha-384', label: 'SHA-384', group: 'Hash' },
  { value: 'sha-512', label: 'SHA-512', group: 'Hash' },
];

const htmlEncode = escapeHtml;
function htmlDecode(s: string) {
  // Use the browser's HTML parser so we cover named entities (&copy;, &nbsp;,
  // …) and numeric entities (&#169;, &#xA9;) — not just the five we'd manually
  // map. SSR-safe fallback uses the same five-entity mapping.
  if (typeof document === 'undefined') {
    return s
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
  }
  const el = document.createElement('textarea');
  el.innerHTML = s;
  return el.value;
}
function utf8FromBytes(bytes: Uint8Array): string {
  return new TextDecoder('utf-8').decode(bytes);
}
function bytesFromUtf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}
function base64Encode(s: string): string {
  const bytes = bytesFromUtf8(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function base64Decode(s: string): string {
  // Tolerate URL-safe variants and stray whitespace from copy/paste.
  const cleaned = s.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = cleaned + '='.repeat((4 - (cleaned.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return utf8FromBytes(bytes);
}
function b64urlDecodeUtf8(s: string): string {
  const cleaned = s.replace(/-/g, '+').replace(/_/g, '/');
  const padded = cleaned + '='.repeat((4 - (cleaned.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return utf8FromBytes(bytes);
}
function jwtDecode(token: string) {
  const parts = token.split('.');
  if (parts.length < 2) throw new Error('Not a JWT (expected header.payload.signature)');
  const header = JSON.parse(b64urlDecodeUtf8(parts[0]));
  const payload = JSON.parse(b64urlDecodeUtf8(parts[1]));
  return JSON.stringify({ header, payload }, null, 2);
}
async function sha(algo: string, text: string) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest(algo, buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const DEFAULT_OP: Op = 'base64-encode';
const DEFAULT_INPUT = 'hello world';

export default function EncodingPage() {
  const [op, setOp] = React.useState<Op>(DEFAULT_OP);
  const [input, setInput] = React.useState(DEFAULT_INPUT);
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState('');

  function reset() {
    setOp(DEFAULT_OP);
    setInput(DEFAULT_INPUT);
  }

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let result = '';
        switch (op) {
          case 'base64-encode':
            result = base64Encode(input);
            break;
          case 'base64-decode':
            result = base64Decode(input);
            break;
          case 'url-encode':
            result = encodeURIComponent(input);
            break;
          case 'url-decode':
            result = decodeURIComponent(input);
            break;
          case 'html-encode':
            result = htmlEncode(input);
            break;
          case 'html-decode':
            result = htmlDecode(input);
            break;
          case 'jwt-decode':
            result = jwtDecode(input.trim());
            break;
          case 'sha-1':
            result = await sha('SHA-1', input);
            break;
          case 'sha-256':
            result = await sha('SHA-256', input);
            break;
          case 'sha-384':
            result = await sha('SHA-384', input);
            break;
          case 'sha-512':
            result = await sha('SHA-512', input);
            break;
        }
        if (!cancelled) {
          setOutput(result);
          setError('');
        }
      } catch (e) {
        if (!cancelled) {
          setOutput('');
          setError(e instanceof Error ? e.message : 'Conversion failed');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [op, input]);

  const groups = Array.from(new Set(OPS.map((o) => o.group)));
  const outputLang: Lang = op === 'jwt-decode' ? 'json' : 'plain';

  return (
    <ToolPage slug="encoding">
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="mb-4 flex justify-end">
            <ResetButton onClick={reset} />
          </div>
          <div className="mb-4 flex flex-wrap gap-4">
            {groups.map((g) => (
              <div key={g} className="flex flex-col gap-1.5">
                <Label>{g}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {OPS.filter((o) => o.group === g).map((o) => (
                    <Button
                      key={o.value}
                      size="sm"
                      variant={op === o.value ? 'primary' : 'secondary'}
                      onClick={() => setOp(o.value)}
                    >
                      {o.label}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <Label>Input</Label>
              <Textarea
                mono
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={12}
                className="mt-2"
                spellCheck={false}
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>
                  Output{outputLang !== 'plain' ? ' · ' + outputLang.toUpperCase() : ''}
                </Label>
                <CopyButton value={output} />
              </div>
              <CodeBlock code={output || ' '} language={outputLang} maxHeight="280px" />
              {error && <p className="mt-2 text-xs text-danger">{error}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolPage>
  );
}
