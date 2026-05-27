'use client';

import { Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { COLORS, STROKE_WIDTHS, FONT_SIZES, BLUR_RADII, type Tool } from '@/lib/screenshot/types';

export interface ContextualOptionsProps {
  tool: Tool;
  color: string;
  setColor(c: string): void;
  strokeWidth: number;
  setStrokeWidth(w: number): void;
  filled: boolean;
  setFilled(f: (prev: boolean) => boolean): void;
  fontSize: number;
  setFontSize(s: number): void;
  blurRadius: number;
  setBlurRadius(r: number): void;
  cropInProgress: boolean;
  onApplyCrop(): void;
  onCancelCrop(): void;
}

export function ContextualOptions(props: ContextualOptionsProps) {
  const {
    tool,
    color,
    setColor,
    strokeWidth,
    setStrokeWidth,
    filled,
    setFilled,
    fontSize,
    setFontSize,
    blurRadius,
    setBlurRadius,
    cropInProgress,
    onApplyCrop,
    onCancelCrop,
  } = props;

  const showStroke =
    tool === 'rect' || tool === 'ellipse' || tool === 'arrow' || tool === 'line' || tool === 'pen';
  const showFill = tool === 'rect' || tool === 'ellipse';
  const showFontSize = tool === 'text' || tool === 'number';
  const showBlur = tool === 'blur';
  const showColor =
    tool !== 'select' && tool !== 'blur' && tool !== 'crop' && tool !== 'highlighter'
      ? true
      : tool === 'highlighter';

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs">
      {showColor && (
        <div className="flex items-center gap-2">
          <Label className="!text-[10px]">Color</Label>
          <div className="flex gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                title={c}
                className={
                  'h-5 w-5 rounded-full ring-offset-2 ring-offset-surface-2 transition-all ' +
                  (color === c ? 'ring-2 ring-fg' : 'hover:scale-110')
                }
                style={{ backgroundColor: c }}
              />
            ))}
            <label
              className="relative h-5 w-5 cursor-pointer overflow-hidden rounded-full border border-border"
              title="Custom color"
              style={{ backgroundColor: color }}
            >
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>
      )}

      {showStroke && (
        <div className="flex items-center gap-2">
          <Label className="!text-[10px]">Stroke</Label>
          <div className="flex gap-1">
            {STROKE_WIDTHS.map((w) => (
              <button
                key={w}
                onClick={() => setStrokeWidth(w)}
                title={`${w}px`}
                className={
                  'flex h-6 w-6 items-center justify-center rounded border transition-colors ' +
                  (strokeWidth === w
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border bg-surface text-muted hover:text-fg')
                }
              >
                <span
                  className="block rounded-full bg-current"
                  style={{ width: Math.min(w, 14), height: Math.min(w, 14) }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {showFill && (
        <div className="flex items-center gap-2">
          <Label className="!text-[10px]">Fill</Label>
          <button
            onClick={() => setFilled((f) => !f)}
            className={
              'flex h-6 items-center gap-1.5 rounded border px-2 text-xs transition-colors ' +
              (filled
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-border bg-surface text-muted hover:text-fg')
            }
          >
            {filled ? 'Filled' : 'Outline'}
          </button>
        </div>
      )}

      {showFontSize && (
        <div className="flex items-center gap-2">
          <Label className="!text-[10px]">Size</Label>
          <div className="flex gap-1">
            {FONT_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setFontSize(s)}
                className={
                  'flex h-6 min-w-[28px] items-center justify-center rounded border px-1.5 text-xs transition-colors ' +
                  (fontSize === s
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border bg-surface text-muted hover:text-fg')
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {showBlur && (
        <div className="flex items-center gap-2">
          <Label className="!text-[10px]">Blur</Label>
          <div className="flex gap-1">
            {BLUR_RADII.map((r) => (
              <button
                key={r}
                onClick={() => setBlurRadius(r)}
                className={
                  'flex h-6 min-w-[28px] items-center justify-center rounded border px-1.5 text-xs transition-colors ' +
                  (blurRadius === r
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border bg-surface text-muted hover:text-fg')
                }
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {tool === 'crop' && cropInProgress && (
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={onCancelCrop}>
            Cancel
          </Button>
          <Button size="sm" onClick={onApplyCrop}>
            Apply crop
          </Button>
        </div>
      )}

      {tool === 'crop' && !cropInProgress && (
        <span className="ml-auto text-[11px] text-muted">
          Drag a rectangle on the image, then Apply crop
        </span>
      )}

      <span className="ml-auto text-[11px] text-muted">
        Tip: hold <kbd className="rounded border border-border bg-surface px-1">⇧</kbd> to constrain
      </span>
    </div>
  );
}
