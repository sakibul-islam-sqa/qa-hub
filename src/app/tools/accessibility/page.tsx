'use client';

import * as React from 'react';
import { ToolPage } from '@/components/ToolPage';
import { Card, CardContent } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { ResetButton } from '@/components/ui/ResetButton';

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function luminance([r, g, b]: [number, number, number]) {
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function contrast(fg: string, bg: string) {
  const a = hexToRgb(fg);
  const b = hexToRgb(bg);
  if (!a || !b) return null;
  const l1 = luminance(a);
  const l2 = luminance(b);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return ratio;
}

function Badge({ pass, label }: { pass: boolean; label: string }) {
  return (
    <div
      className={
        'flex items-center justify-between rounded-md border px-3 py-2 text-sm ' +
        (pass
          ? 'border-success/40 bg-success/10 text-success'
          : 'border-danger/40 bg-danger/10 text-danger')
      }
    >
      <span>{label}</span>
      <span className="font-medium">{pass ? 'PASS' : 'FAIL'}</span>
    </div>
  );
}

const DEFAULT_FG = '#0f172a';
const DEFAULT_BG = '#ffffff';

export default function AccessibilityPage() {
  const [fg, setFg] = React.useState(DEFAULT_FG);
  const [bg, setBg] = React.useState(DEFAULT_BG);
  const ratio = contrast(fg, bg);

  function reset() {
    setFg(DEFAULT_FG);
    setBg(DEFAULT_BG);
  }

  return (
    <ToolPage slug="accessibility">
      <Card>
        <CardContent className="space-y-5 p-4 sm:p-5">
          <div className="flex justify-end">
            <ResetButton onClick={reset} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Foreground (text)</Label>
              <div className="mt-2 flex gap-2">
                <input
                  type="color"
                  value={fg}
                  onChange={(e) => setFg(e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded-md border border-border bg-surface-2"
                />
                <Input value={fg} onChange={(e) => setFg(e.target.value)} className="font-mono" />
              </div>
            </div>
            <div>
              <Label>Background</Label>
              <div className="mt-2 flex gap-2">
                <input
                  type="color"
                  value={bg}
                  onChange={(e) => setBg(e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded-md border border-border bg-surface-2"
                />
                <Input value={bg} onChange={(e) => setBg(e.target.value)} className="font-mono" />
              </div>
            </div>
          </div>

          <div
            className="rounded-xl border border-border p-5 sm:p-8"
            style={{ backgroundColor: bg, color: fg }}
          >
            <p className="text-xl font-semibold sm:text-3xl">Large text sample</p>
            <p className="mt-3 text-base">
              The quick brown fox jumps over the lazy dog. The five boxing wizards jump quickly.
            </p>
            <p className="mt-2 text-sm">
              Smaller body text, often used for captions and helper text.
            </p>
          </div>

          {ratio ? (
            <>
              <div className="rounded-xl border border-border bg-surface-2 p-4 text-center sm:p-5">
                <div className="text-xs uppercase tracking-widest text-muted">Contrast ratio</div>
                <div className="mt-1 text-2xl font-bold tracking-tight sm:text-4xl">
                  {ratio.toFixed(2)}:1
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Badge pass={ratio >= 4.5} label="WCAG AA · Normal text (≥ 4.5:1)" />
                <Badge pass={ratio >= 3} label="WCAG AA · Large text (≥ 3:1)" />
                <Badge pass={ratio >= 7} label="WCAG AAA · Normal text (≥ 7:1)" />
                <Badge pass={ratio >= 4.5} label="WCAG AAA · Large text (≥ 4.5:1)" />
                <Badge pass={ratio >= 3} label="WCAG · Non-text UI (≥ 3:1)" />
              </div>
            </>
          ) : (
            <p className="text-sm text-danger">Enter valid hex colors (e.g. #1a2b3c or #abc)</p>
          )}
        </CardContent>
      </Card>
    </ToolPage>
  );
}
