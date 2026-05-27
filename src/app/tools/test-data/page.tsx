'use client';

import * as React from 'react';
import { faker } from '@faker-js/faker';
import { Download, RefreshCw } from 'lucide-react';
import { ToolPage } from '@/components/ToolPage';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { CopyButton } from '@/components/ui/CopyButton';
import { ResetButton } from '@/components/ui/ResetButton';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { downloadFile } from '@/lib/utils';

type Field = {
  key: string;
  label: string;
  fn: () => string;
};

const ALL_FIELDS: Field[] = [
  { key: 'firstName', label: 'First name', fn: () => faker.person.firstName() },
  { key: 'lastName', label: 'Last name', fn: () => faker.person.lastName() },
  { key: 'fullName', label: 'Full name', fn: () => faker.person.fullName() },
  { key: 'email', label: 'Email', fn: () => faker.internet.email() },
  { key: 'username', label: 'Username', fn: () => faker.internet.userName() },
  { key: 'password', label: 'Password', fn: () => faker.internet.password() },
  { key: 'phone', label: 'Phone', fn: () => faker.phone.number() },
  { key: 'address', label: 'Street address', fn: () => faker.location.streetAddress() },
  { key: 'city', label: 'City', fn: () => faker.location.city() },
  { key: 'country', label: 'Country', fn: () => faker.location.country() },
  { key: 'zip', label: 'ZIP', fn: () => faker.location.zipCode() },
  { key: 'company', label: 'Company', fn: () => faker.company.name() },
  { key: 'jobTitle', label: 'Job title', fn: () => faker.person.jobTitle() },
  { key: 'uuid', label: 'UUID', fn: () => faker.string.uuid() },
  { key: 'creditCard', label: 'Credit card', fn: () => faker.finance.creditCardNumber() },
  { key: 'iban', label: 'IBAN', fn: () => faker.finance.iban() },
  { key: 'pastDate', label: 'Past date', fn: () => faker.date.past().toISOString() },
  { key: 'futureDate', label: 'Future date', fn: () => faker.date.future().toISOString() },
  { key: 'url', label: 'URL', fn: () => faker.internet.url() },
  { key: 'ipv4', label: 'IPv4', fn: () => faker.internet.ipv4() },
];

type Preview = 'table' | 'json' | 'csv';

const DEFAULT_COUNT = 10;
const DEFAULT_FIELDS = ['fullName', 'email', 'phone', 'city', 'uuid'];

export default function TestDataPage() {
  const [count, setCount] = React.useState(DEFAULT_COUNT);
  const [selected, setSelected] = React.useState<Set<string>>(new Set(DEFAULT_FIELDS));
  const [seed, setSeed] = React.useState(0);
  const [preview, setPreview] = React.useState<Preview>('table');

  function reset() {
    setCount(DEFAULT_COUNT);
    setSelected(new Set(DEFAULT_FIELDS));
    setPreview('table');
    setSeed((s) => s + 1);
  }

  const rows = React.useMemo(() => {
    if (selected.size === 0) return [];
    const fields = ALL_FIELDS.filter((f) => selected.has(f.key));
    return Array.from({ length: count }, () => {
      const row: Record<string, string> = {};
      for (const f of fields) row[f.key] = f.fn();
      return row;
    });
    // re-run on seed change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, selected, seed]);

  const fields = ALL_FIELDS.filter((f) => selected.has(f.key));
  const csv = React.useMemo(() => toCsv(fields, rows), [fields, rows]);
  const json = React.useMemo(() => JSON.stringify(rows, null, 2), [rows]);

  function toggle(key: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <ToolPage slug="test-data">
      <Card>
        <CardContent className="space-y-5 p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label>Rows</Label>
              <Input
                type="number"
                min={1}
                max={1000}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))}
                className="mt-2 w-24"
              />
            </div>
            <Button onClick={() => setSeed((s) => s + 1)} size="md">
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </Button>
            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => downloadFile('test-data.csv', csv, 'text/csv')}
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => downloadFile('test-data.json', json, 'application/json')}
              >
                <Download className="h-3.5 w-3.5" /> JSON
              </Button>
              <ResetButton onClick={reset} />
            </div>
          </div>

          <div>
            <Label>Fields ({selected.size} selected)</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ALL_FIELDS.map((f) => {
                const on = selected.has(f.key);
                return (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(f.key)}
                    className={
                      'rounded-full border px-3 py-1 text-xs transition-colors ' +
                      (on
                        ? 'border-accent bg-accent/15 text-accent'
                        : 'border-border bg-surface-2 text-muted hover:text-fg')
                    }
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {(['table', 'json', 'csv'] as Preview[]).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={preview === p ? 'primary' : 'secondary'}
                    onClick={() => setPreview(p)}
                  >
                    {p.toUpperCase()}
                  </Button>
                ))}
                <div className="ml-auto flex gap-2">
                  <CopyButton value={preview === 'csv' ? csv : json} label="Copy" />
                </div>
              </div>

              {preview === 'table' && (
                <div className="overflow-hidden rounded-md border border-border">
                  <div className="max-h-96 overflow-auto">
                    <table className="w-full min-w-[600px] text-xs">
                      <thead className="sticky top-0 bg-surface-2 text-muted">
                        <tr>
                          {fields.map((f) => (
                            <th key={f.key} className="px-3 py-2 text-left font-medium">
                              {f.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr key={i} className="border-t border-border">
                            {fields.map((f) => (
                              <td key={f.key} className="whitespace-nowrap px-3 py-2 font-mono">
                                {row[f.key]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {preview === 'json' && <CodeBlock code={json} language="json" maxHeight="24rem" />}
              {preview === 'csv' && <CodeBlock code={csv} language="plain" maxHeight="24rem" />}
            </div>
          )}
        </CardContent>
      </Card>
    </ToolPage>
  );
}

function toCsv(fields: Field[], rows: Record<string, string>[]) {
  const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const head = fields.map((f) => f.label).join(',');
  const body = rows.map((r) => fields.map((f) => escape(r[f.key] ?? '')).join(',')).join('\n');
  return head + '\n' + body;
}
