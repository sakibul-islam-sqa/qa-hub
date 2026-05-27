'use client';

import * as React from 'react';
import { ToolPage } from '@/components/ToolPage';
import { Card, CardContent } from '@/components/ui/Card';
import { Label } from '@/components/ui/Input';
import { CopyButton } from '@/components/ui/CopyButton';
import { ResetButton } from '@/components/ui/ResetButton';
import { CodeEditor } from '@/components/ui/CodeEditor';
import { CodeBlock } from '@/components/ui/CodeBlock';
import type { Lang } from '@/lib/prism';

const SAMPLE = `curl -X POST 'https://api.example.com/users' \\
  -H 'Authorization: Bearer abc123' \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"Ada","role":"admin"}'`;

interface Parsed {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

function parseCurl(input: string): Parsed {
  const cleaned = input.replace(/\\\n/g, ' ').trim();
  const tokens = tokenize(cleaned);
  if (tokens[0] !== 'curl') throw new Error('Command must start with `curl`');
  tokens.shift();

  let method = 'GET';
  let url = '';
  const headers: Record<string, string> = {};
  let body: string | undefined;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === '-X' || t === '--request') {
      method = tokens[++i].toUpperCase();
    } else if (t === '-H' || t === '--header') {
      const h = tokens[++i];
      const idx = h.indexOf(':');
      if (idx > 0) headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
    } else if (t === '-d' || t === '--data' || t === '--data-raw' || t === '--data-binary') {
      body = tokens[++i];
      if (method === 'GET') method = 'POST';
    } else if (t === '-u' || t === '--user') {
      const cred = tokens[++i];
      headers['Authorization'] = 'Basic ' + btoa(cred);
    } else if (t === '--compressed' || t === '-i' || t === '-s' || t === '-v' || t === '-k') {
      // ignore
    } else if (!t.startsWith('-') && !url) {
      url = t;
    }
  }
  if (!url) throw new Error('No URL found');
  return { method, url, headers, body };
}

function tokenize(input: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < input.length) {
    const c = input[i];
    if (c === ' ' || c === '\t' || c === '\n') {
      i++;
      continue;
    }
    if (c === "'" || c === '"') {
      const quote = c;
      let j = i + 1;
      let s = '';
      while (j < input.length && input[j] !== quote) {
        if (input[j] === '\\' && j + 1 < input.length) {
          s += input[j + 1];
          j += 2;
        } else {
          s += input[j++];
        }
      }
      out.push(s);
      i = j + 1;
    } else {
      let s = '';
      while (i < input.length && !/\s/.test(input[i]) && input[i] !== "'" && input[i] !== '"') {
        s += input[i++];
      }
      out.push(s);
    }
  }
  return out;
}

function toFetch(p: Parsed): string {
  const opts: string[] = [`  method: '${p.method}'`];
  if (Object.keys(p.headers).length) {
    opts.push(`  headers: ${JSON.stringify(p.headers, null, 4).replace(/\n/g, '\n  ')}`);
  }
  if (p.body) {
    opts.push(`  body: ${JSON.stringify(p.body)}`);
  }
  return `const response = await fetch('${p.url}', {\n${opts.join(',\n')}\n});\nconst data = await response.json();`;
}

function toAxios(p: Parsed): string {
  const cfg: Record<string, unknown> = { method: p.method, url: p.url };
  if (Object.keys(p.headers).length) cfg.headers = p.headers;
  if (p.body) {
    try {
      cfg.data = JSON.parse(p.body);
    } catch {
      cfg.data = p.body;
    }
  }
  return `const response = await axios(${JSON.stringify(cfg, null, 2)});`;
}

function toPython(p: Parsed): string {
  const lines = [`import requests`, ``];
  if (Object.keys(p.headers).length) {
    lines.push(`headers = ${JSON.stringify(p.headers, null, 4)}`);
  }
  if (p.body) {
    lines.push(`data = ${p.body}`);
  }
  const args = [`'${p.url}'`];
  if (Object.keys(p.headers).length) args.push('headers=headers');
  if (p.body) args.push('data=data');
  lines.push(``, `response = requests.${p.method.toLowerCase()}(${args.join(', ')})`);
  lines.push(`print(response.json())`);
  return lines.join('\n');
}

export default function CurlPage() {
  const [input, setInput] = React.useState(SAMPLE);

  const result = React.useMemo(() => {
    try {
      const parsed = parseCurl(input);
      return {
        fetch: toFetch(parsed),
        axios: toAxios(parsed),
        python: toPython(parsed),
        error: '',
      };
    } catch (e) {
      return {
        fetch: '',
        axios: '',
        python: '',
        error: e instanceof Error ? e.message : 'Parse error',
      };
    }
  }, [input]);

  return (
    <ToolPage slug="curl-converter">
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>cURL command</Label>
              <ResetButton onClick={() => setInput(SAMPLE)} />
            </div>
            <CodeEditor value={input} onChange={setInput} language="bash" minHeight={180} />
            {result.error && <p className="mt-2 text-xs text-danger">{result.error}</p>}
          </div>
        </CardContent>
      </Card>

      {(
        [
          { key: 'fetch', label: 'JavaScript · fetch()', lang: 'javascript' },
          { key: 'axios', label: 'JavaScript · axios', lang: 'javascript' },
          { key: 'python', label: 'Python · requests', lang: 'python' },
        ] as { key: 'fetch' | 'axios' | 'python'; label: string; lang: Lang }[]
      ).map(({ key, label, lang }) => (
        <Card key={key}>
          <CardContent className="p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between">
              <Label>{label}</Label>
              <CopyButton value={result[key]} />
            </div>
            <CodeBlock code={result[key] || ' '} language={lang} maxHeight="320px" />
          </CardContent>
        </Card>
      ))}
    </ToolPage>
  );
}
