'use client';

import * as React from 'react';
import yaml from 'js-yaml';
import { JSONPath } from 'jsonpath-plus';
import { Code2, AlignLeft, FormInput, ListTree, Download } from 'lucide-react';
import { ToolPage } from '@/components/ToolPage';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label, Input } from '@/components/ui/Input';
import { CopyButton } from '@/components/ui/CopyButton';
import { ResetButton } from '@/components/ui/ResetButton';
import { CodeEditor } from '@/components/ui/CodeEditor';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { JsonTree } from '@/components/json/JsonTree';
import { JsonForm } from '@/components/json/JsonForm';
import { formatBytes, downloadFile } from '@/lib/utils';

type Mode = 'format' | 'minify' | 'yaml' | 'jsonpath';
type View = 'code' | 'form' | 'text' | 'tree';

const SAMPLE = `{\n  "id": 42,\n  "user": { "name": "Ada", "email": "ada@example.com" },\n  "roles": ["admin", "qa"]\n}`;
const DEFAULT_PATH = '$.user.name';
const DEFAULT_INDENT = 2;
const DEFAULT_MODE: Mode = 'format';
const DEFAULT_VIEW: View = 'code';

const VIEWS: { key: View; label: string; icon: typeof Code2 }[] = [
  { key: 'code', label: 'Code', icon: Code2 },
  { key: 'form', label: 'Form', icon: FormInput },
  { key: 'text', label: 'Text', icon: AlignLeft },
  { key: 'tree', label: 'Tree', icon: ListTree },
];

export default function JsonToolPage() {
  const [input, setInput] = React.useState(SAMPLE);
  const [mode, setMode] = React.useState<Mode>(DEFAULT_MODE);
  const [view, setView] = React.useState<View>(DEFAULT_VIEW);
  const [jsonPath, setJsonPath] = React.useState(DEFAULT_PATH);
  const [indent, setIndent] = React.useState(DEFAULT_INDENT);

  function reset() {
    setInput(SAMPLE);
    setMode(DEFAULT_MODE);
    setView(DEFAULT_VIEW);
    setJsonPath(DEFAULT_PATH);
    setIndent(DEFAULT_INDENT);
  }

  const { output, error, valid, outputLang } = React.useMemo(() => {
    const lang: 'json' | 'yaml' = mode === 'yaml' ? 'yaml' : 'json';
    if (!input.trim()) return { output: '', error: '', valid: false, outputLang: lang };
    try {
      const parsed = JSON.parse(input);
      if (mode === 'format')
        return {
          output: JSON.stringify(parsed, null, indent),
          error: '',
          valid: true,
          outputLang: lang,
        };
      if (mode === 'minify')
        return { output: JSON.stringify(parsed), error: '', valid: true, outputLang: lang };
      if (mode === 'yaml')
        return { output: yaml.dump(parsed), error: '', valid: true, outputLang: lang };
      if (mode === 'jsonpath') {
        const result = JSONPath({ path: jsonPath || '$', json: parsed });
        return {
          output: JSON.stringify(result, null, indent),
          error: '',
          valid: true,
          outputLang: lang,
        };
      }
      return { output: '', error: '', valid: true, outputLang: lang };
    } catch (e) {
      return {
        output: '',
        error: e instanceof Error ? e.message : 'Invalid JSON',
        valid: false,
        outputLang: lang,
      };
    }
  }, [input, mode, jsonPath, indent]);

  const stats = React.useMemo(() => {
    const bytes = new Blob([input]).size;
    const lines = input ? input.split('\n').length : 0;
    return { bytes, lines };
  }, [input]);

  const parsedOutput = React.useMemo<unknown>(() => {
    if (!output) return undefined;
    try {
      return JSON.parse(output);
    } catch {
      if (outputLang === 'yaml') {
        try {
          return yaml.load(output);
        } catch {
          return undefined;
        }
      }
      return undefined;
    }
  }, [output, outputLang]);

  const hasStructured = parsedOutput !== undefined;

  return (
    <ToolPage slug="json">
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {(['format', 'minify', 'yaml', 'jsonpath'] as Mode[]).map((m) => (
              <Button
                key={m}
                size="sm"
                variant={mode === m ? 'primary' : 'secondary'}
                onClick={() => setMode(m)}
              >
                {m === 'jsonpath'
                  ? 'JSONPath'
                  : m === 'yaml'
                    ? 'To YAML'
                    : m[0].toUpperCase() + m.slice(1)}
              </Button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              {(mode === 'format' || mode === 'jsonpath') && (
                <>
                  <Label className="!normal-case !tracking-normal">Indent</Label>
                  <Input
                    type="number"
                    min={0}
                    max={8}
                    value={indent}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (Number.isNaN(n)) return;
                      setIndent(Math.max(0, Math.min(8, Math.floor(n))));
                    }}
                    className="h-8 w-16"
                  />
                </>
              )}
              <ResetButton onClick={reset} />
            </div>
          </div>

          {mode === 'jsonpath' && (
            <div className="mb-3 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
              <Label>Path</Label>
              <Input
                value={jsonPath}
                onChange={(e) => setJsonPath(e.target.value)}
                placeholder="$.user.name"
                className="font-mono"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Input · JSON</Label>
                <span className="text-[11px] text-muted">
                  {formatBytes(stats.bytes)} · {stats.lines} lines
                </span>
              </div>
              <CodeEditor
                value={input}
                onChange={setInput}
                language="json"
                minHeight={360}
                wrap={false}
              />
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <Label>Output · {outputLang.toUpperCase()}</Label>
                <div className="flex gap-1.5">
                  <CopyButton value={output} />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      downloadFile(
                        outputLang === 'yaml' ? 'output.yaml' : 'output.json',
                        output,
                        outputLang === 'yaml' ? 'application/yaml' : 'application/json',
                      )
                    }
                    disabled={!output}
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </Button>
                </div>
              </div>

              <div className="mb-2 inline-flex rounded-md border border-border bg-surface-2 p-0.5">
                {VIEWS.map((v) => {
                  const Icon = v.icon;
                  const disabled = (v.key === 'form' || v.key === 'tree') && !hasStructured;
                  const active = view === v.key;
                  return (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => !disabled && setView(v.key)}
                      disabled={disabled}
                      className={
                        'inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-all ' +
                        (active
                          ? 'bg-accent text-accent-fg shadow-soft'
                          : 'text-muted hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted')
                      }
                      title={disabled ? 'Output is not structured data' : v.label}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {v.label}
                    </button>
                  );
                })}
              </div>

              {view === 'code' && (
                <CodeBlock code={output || ' '} language={outputLang} maxHeight="360px" />
              )}
              {view === 'text' && (
                <pre
                  style={{ maxHeight: 'min(360px, 60vh)' }}
                  className="overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed"
                >
                  {output || ' '}
                </pre>
              )}
              {view === 'form' &&
                (hasStructured ? (
                  <JsonForm data={parsedOutput} maxHeight="360px" />
                ) : (
                  <EmptyView message="Form view needs structured (JSON/YAML) output." />
                ))}
              {view === 'tree' &&
                (hasStructured ? (
                  <JsonTree data={parsedOutput} maxHeight="360px" />
                ) : (
                  <EmptyView message="Tree view needs structured (JSON/YAML) output." />
                ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 text-xs" data-stats-row>
            <span
              className={
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ' +
                (valid
                  ? 'bg-success/10 text-success'
                  : input
                    ? 'bg-danger/10 text-danger'
                    : 'bg-surface-2 text-muted')
              }
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {valid ? 'Valid JSON' : input ? 'Invalid' : 'Empty'}
            </span>
            {error && <span className="text-danger">{error}</span>}
          </div>
        </CardContent>
      </Card>
    </ToolPage>
  );
}

function EmptyView({ message }: { message: string }) {
  return (
    <div
      style={{ maxHeight: 'min(360px, 60vh)' }}
      className="flex h-32 items-center justify-center rounded-md border border-dashed border-border bg-surface-2 p-3 text-xs text-muted"
    >
      {message}
    </div>
  );
}
