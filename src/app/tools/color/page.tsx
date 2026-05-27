'use client';

import * as React from 'react';
import { Shuffle, AlertCircle } from 'lucide-react';
import { ToolPage } from '@/components/ToolPage';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { CopyButton } from '@/components/ui/CopyButton';
import { ResetButton } from '@/components/ui/ResetButton';
import { cn } from '@/lib/utils';

type RGB = { r: number; g: number; b: number };

const DEFAULT_RGB: RGB = { r: 124, g: 58, b: 237 }; // pleasant violet

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function rgbToHex({ r, g, b }: RGB) {
  const h = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function hexToRgb(hex: string): RGB | null {
  const parsed = parseHex(hex);
  return parsed ? { r: parsed.r, g: parsed.g, b: parsed.b } : null;
}

function parseHex(input: string): { r: number; g: number; b: number; a: number } | null {
  const m = input
    .trim()
    .replace('#', '')
    .match(/^([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3 || h.length === 4) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

function rgbaToHex8(rgb: RGB, alpha: number) {
  const h = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `${rgbToHex(rgb)}${h(alpha * 255)}`;
}

function rgbToHsl({ r, g, b }: RGB) {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case R:
        h = (G - B) / d + (G < B ? 6 : 0);
        break;
      case G:
        h = (B - R) / d + 2;
        break;
      case B:
        h = (R - G) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): RGB {
  const H = h / 360;
  const S = s / 100;
  const L = l / 100;
  if (S === 0) {
    const v = Math.round(L * 255);
    return { r: v, g: v, b: v };
  }
  const q = L < 0.5 ? L * (1 + S) : L + S - L * S;
  const p = 2 * L - q;
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return {
    r: Math.round(hue2rgb(H + 1 / 3) * 255),
    g: Math.round(hue2rgb(H) * 255),
    b: Math.round(hue2rgb(H - 1 / 3) * 255),
  };
}

function rgbToHsv({ r, g, b }: RGB) {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (d) {
    switch (max) {
      case R:
        h = (G - B) / d + (G < B ? 6 : 0);
        break;
      case G:
        h = (B - R) / d + 2;
        break;
      case B:
        h = (R - G) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function rgbToCmyk({ r, g, b }: RGB) {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const k = 1 - Math.max(R, G, B);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - R - k) / (1 - k)) * 100),
    m: Math.round(((1 - G - k) / (1 - k)) * 100),
    y: Math.round(((1 - B - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

function luminance({ r, g, b }: RGB) {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

const PRESETS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#000000',
  '#ffffff',
];

export default function ColorPage() {
  const [rgb, setRgb] = React.useState<RGB>(DEFAULT_RGB);
  const [alpha, setAlpha] = React.useState(1);
  const [hexInput, setHexInput] = React.useState(rgbToHex(DEFAULT_RGB));

  React.useEffect(() => {
    setHexInput(alpha < 1 ? rgbaToHex8(rgb, alpha) : rgbToHex(rgb));
  }, [rgb, alpha]);

  function setFromHex(v: string) {
    setHexInput(v);
    const parsed = parseHex(v);
    if (parsed) {
      setRgb({ r: parsed.r, g: parsed.g, b: parsed.b });
      const digits = v.trim().replace('#', '').length;
      if (digits === 4 || digits === 8) setAlpha(parsed.a);
    }
  }

  function setChannel(channel: keyof RGB, value: number) {
    setRgb((cur) => ({ ...cur, [channel]: clamp(value, 0, 255) }));
  }

  function setHslChannel(channel: 'h' | 's' | 'l', value: number) {
    const hsl = rgbToHsl(rgb);
    const next = {
      ...hsl,
      [channel]: clamp(value, 0, channel === 'h' ? 360 : 100),
    };
    setRgb(hslToRgb(next.h, next.s, next.l));
  }

  function randomize() {
    setRgb({
      r: Math.floor(Math.random() * 256),
      g: Math.floor(Math.random() * 256),
      b: Math.floor(Math.random() * 256),
    });
  }

  function reset() {
    setRgb(DEFAULT_RGB);
    setAlpha(1);
  }

  const hex = rgbToHex(rgb);
  const hex8 = rgbaToHex8(rgb, alpha);
  const hsl = rgbToHsl(rgb);
  const hsv = rgbToHsv(rgb);
  const cmyk = rgbToCmyk(rgb);
  const hexIsValid = parseHex(hexInput) !== null;
  const showHexError = hexInput.trim() !== '' && !hexIsValid;
  const aFixed = Number(alpha.toFixed(2));
  const alphaPct = Math.round(alpha * 100);
  const lum = luminance(rgb);
  const contrastVsWhite = (1 + 0.05) / (lum + 0.05);
  const contrastVsBlack = (lum + 0.05) / 0.05;
  const textOnColor = lum > 0.5 ? '#000000' : '#ffffff';

  const hexDisplay = alpha < 1 ? hex8 : hex;
  const formats: { label: string; value: string }[] = [
    { label: 'HEX', value: hexDisplay },
    { label: 'HEX8 (with alpha)', value: hex8 },
    { label: 'HEX (no #)', value: hexDisplay.replace('#', '') },
    { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
    { label: 'RGBA', value: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${aFixed})` },
    { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
    { label: 'HSLA', value: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${aFixed})` },
    { label: 'HSV / HSB', value: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)` },
    { label: 'CMYK', value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)` },
    {
      label: 'Tailwind arbitrary',
      value: alpha < 1 ? `bg-[${hex}]/[${aFixed}]` : `bg-[${hex}]`,
    },
    {
      label: 'Swift UIColor',
      value: `UIColor(red: ${(rgb.r / 255).toFixed(3)}, green: ${(rgb.g / 255).toFixed(3)}, blue: ${(rgb.b / 255).toFixed(3)}, alpha: ${aFixed})`,
    },
    {
      label: 'Android',
      value: `0x${hex8.replace('#', '').slice(6).toUpperCase()}${hex.replace('#', '').toUpperCase()}`,
    },
  ];

  return (
    <ToolPage slug="color">
      <Card>
        <CardContent className="space-y-5 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <Label>Pick a color</Label>
            <div className="flex gap-1.5">
              <Button size="sm" variant="secondary" onClick={randomize}>
                <Shuffle className="h-3.5 w-3.5" /> Random
              </Button>
              <ResetButton onClick={reset} />
            </div>
          </div>

          <div
            className="overflow-hidden rounded-xl border border-border shadow-soft"
            style={{
              backgroundImage:
                'linear-gradient(45deg, hsl(var(--border)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--border)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--border)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--border)) 75%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
            }}
          >
            <div
              className="flex h-40 items-center justify-center font-mono text-lg font-semibold"
              style={{
                backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${aFixed})`,
                color: textOnColor,
              }}
            >
              {hexDisplay.toUpperCase()}
            </div>
          </div>

          <div>
            <Label>HEX</Label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={hex}
                onChange={(e) => setFromHex(e.target.value)}
                className="h-9 w-14 shrink-0 cursor-pointer rounded-md border border-border bg-surface-2"
              />
              <Input
                value={hexInput}
                onChange={(e) => setFromHex(e.target.value)}
                aria-invalid={showHexError || undefined}
                className={cn(
                  'flex-1 font-mono',
                  showHexError && 'border-danger focus-visible:ring-danger/40',
                )}
                placeholder="#7c3aed"
              />
            </div>
            {showHexError && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-danger">
                <AlertCircle className="h-3.5 w-3.5" />
                Invalid hex - expected 3 or 6 hex digits (e.g. #abc or #aabbcc).
              </p>
            )}
          </div>

          <div>
            <Label>Presets</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setFromHex(p)}
                  className="h-7 w-7 rounded-md ring-offset-2 ring-offset-surface transition-all hover:scale-110"
                  style={{
                    backgroundColor: p,
                    outline: hex.toLowerCase() === p ? '2px solid hsl(var(--fg))' : 'none',
                  }}
                  title={p}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-5">
            <Label>RGBA · 0–255 / α 0–100</Label>
            <Channel
              name="R"
              value={rgb.r}
              max={255}
              onChange={(v) => setChannel('r', v)}
              accent="rgb(239,68,68)"
            />
            <Channel
              name="G"
              value={rgb.g}
              max={255}
              onChange={(v) => setChannel('g', v)}
              accent="rgb(34,197,94)"
            />
            <Channel
              name="B"
              value={rgb.b}
              max={255}
              onChange={(v) => setChannel('b', v)}
              accent="rgb(59,130,246)"
            />
            <Channel
              name="A"
              value={alphaPct}
              max={100}
              unit="%"
              onChange={(v) => setAlpha(clamp(v, 0, 100) / 100)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4 sm:p-5">
            <Label>HSL</Label>
            <Channel
              name="H"
              value={hsl.h}
              max={360}
              unit="°"
              onChange={(v) => setHslChannel('h', v)}
            />
            <Channel
              name="S"
              value={hsl.s}
              max={100}
              unit="%"
              onChange={(v) => setHslChannel('s', v)}
            />
            <Channel
              name="L"
              value={hsl.l}
              max={100}
              unit="%"
              onChange={(v) => setHslChannel('l', v)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4 sm:p-5">
            <Label>Derived (read-only)</Label>
            <ReadStat label="HSV" value={`${hsv.h}°, ${hsv.s}%, ${hsv.v}%`} />
            <ReadStat label="CMYK" value={`${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k}`} />
            <ReadStat label="Luminance" value={lum.toFixed(3)} />
            <ReadStat label="Contrast vs #fff" value={`${contrastVsWhite.toFixed(2)}:1`} />
            <ReadStat label="Contrast vs #000" value={`${contrastVsBlack.toFixed(2)}:1`} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <Label>Copy as…</Label>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {formats.map((f) => (
              <div
                key={f.label}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-2 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                    {f.label}
                  </div>
                  <div className="mt-0.5 truncate font-mono text-xs">{f.value}</div>
                </div>
                <CopyButton value={f.value} label="" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </ToolPage>
  );
}

function Channel({
  name,
  value,
  max,
  unit,
  onChange,
  accent,
}: {
  name: string;
  value: number;
  max: number;
  unit?: string;
  onChange: (v: number) => void;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 font-mono text-xs font-semibold" style={{ color: accent }}>
        {name}
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-accent"
      />
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 w-16 rounded-md border border-border bg-surface-2 px-2 text-right font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      />
      <span className="w-3 text-xs text-muted">{unit ?? ''}</span>
    </div>
  );
}

function ReadStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-2 px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
        {label}
      </span>
      <span className="font-mono text-xs">{value}</span>
    </div>
  );
}
