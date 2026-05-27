'use client';

import * as React from 'react';
import {
  ArrowUpRight,
  Circle,
  Copy,
  Crop,
  Download,
  Hash,
  Highlighter,
  Image as ImageIcon,
  Maximize2,
  Minus,
  MousePointer2,
  PenLine,
  Redo2,
  Sparkles,
  Square,
  Trash2,
  Type as TypeIcon,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from 'lucide-react';
import { ToolPage } from '@/components/ToolPage';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ResetButton } from '@/components/ui/ResetButton';
import { useToast } from '@/components/ui/Toast';
import { ToolBtn, IconBtn } from '@/components/screenshot/ToolBtn';
import { ContextualOptions } from '@/components/screenshot/ContextualOptions';
import { COLORS, TOOL_KEYS, type Annotation, type Tool } from '@/lib/screenshot/types';
import { applyConstraint, hitTest } from '@/lib/screenshot/geometry';
import { drawAnnotation, drawCropOverlay, drawSelection } from '@/lib/screenshot/draw';
import { useScreenshotHistory } from '@/lib/screenshot/useScreenshotHistory';

const TOOL_LIST: { tool: Tool; icon: LucideIcon; label: string; key: string }[] = [
  { tool: 'select', icon: MousePointer2, label: 'Select / Move', key: 'V' },
  { tool: 'rect', icon: Square, label: 'Rectangle', key: 'R' },
  { tool: 'ellipse', icon: Circle, label: 'Ellipse', key: 'O' },
  { tool: 'arrow', icon: ArrowUpRight, label: 'Arrow', key: 'A' },
  { tool: 'line', icon: Minus, label: 'Line', key: 'L' },
  { tool: 'pen', icon: PenLine, label: 'Pen', key: 'P' },
  { tool: 'highlighter', icon: Highlighter, label: 'Highlighter', key: 'H' },
  { tool: 'text', icon: TypeIcon, label: 'Text', key: 'T' },
  { tool: 'number', icon: Hash, label: 'Number badge', key: 'N' },
  { tool: 'blur', icon: Sparkles, label: 'Blur / redact', key: 'B' },
  { tool: 'crop', icon: Crop, label: 'Crop', key: 'C' },
];

export default function ScreenshotPage() {
  const toast = useToast();
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);
  const [tool, setTool] = React.useState<Tool>('rect');
  const [color, setColor] = React.useState(COLORS[0]);
  const [strokeWidth, setStrokeWidth] = React.useState(4);
  const [filled, setFilled] = React.useState(false);
  const [fontSize, setFontSize] = React.useState(24);
  const [blurRadius, setBlurRadius] = React.useState(12);
  const [annotations, setAnnotations] = React.useState<Annotation[]>([]);
  const [drawing, setDrawing] = React.useState<Annotation | null>(null);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [dragOver, setDragOver] = React.useState(false);

  const history = useScreenshotHistory();
  const moveRef = React.useRef<{
    id: number;
    startX: number;
    startY: number;
    original: Annotation;
  } | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const fitZoom = React.useCallback(() => {
    if (!image || !wrapperRef.current) return;
    const w = wrapperRef.current.clientWidth - 16;
    setZoom(Math.min(1, w / image.width));
  }, [image]);

  const undo = React.useCallback(() => {
    const s = history.undo();
    if (!s) return;
    setImage(s.image);
    setAnnotations(s.annotations);
    setSelectedId(null);
  }, [history]);

  const redo = React.useCallback(() => {
    const s = history.redo();
    if (!s) return;
    setImage(s.image);
    setAnnotations(s.annotations);
    setSelectedId(null);
  }, [history]);

  // ----- File loading -----
  const loadImage = React.useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setAnnotations([]);
          setSelectedId(null);
          const w = wrapperRef.current?.clientWidth ?? img.width;
          setZoom(Math.min(1, w / img.width));
          history.push({ image: img, annotations: [] });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    },
    [history],
  );

  // Paste from clipboard
  React.useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const item = Array.from(e.clipboardData?.items || []).find((i) =>
        i.type.startsWith('image/'),
      );
      if (!item) return;
      const file = item.getAsFile();
      if (file) loadImage(file);
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [loadImage]);

  // ----- Keyboard shortcuts -----
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (meta && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        setDrawing(null);
        return;
      }
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedId != null) {
        e.preventDefault();
        const next = annotations.filter((a) => a.id !== selectedId);
        setAnnotations(next);
        setSelectedId(null);
        history.push({ image, annotations: next });
        return;
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom((z) => Math.min(4, +(z + 0.1).toFixed(2)));
        return;
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom((z) => Math.max(0.1, +(z - 0.1).toFixed(2)));
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        fitZoom();
        return;
      }
      const t = TOOL_KEYS[e.key.toLowerCase()];
      if (t) {
        setTool(t);
        if (t !== 'select') setSelectedId(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [annotations, selectedId, image, redo, undo, history, fitZoom]);

  // ----- Rendering -----
  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(image, 0, 0);
    const all = drawing ? [...annotations, drawing] : annotations;
    for (const a of all) drawAnnotation(ctx, a, image);
    if (selectedId != null && !drawing) {
      const sel = annotations.find((a) => a.id === selectedId);
      if (sel) drawSelection(ctx, sel);
    }
    if (drawing?.tool === 'crop') {
      drawCropOverlay(ctx, drawing, image);
    }
  }, [image, annotations, drawing, selectedId]);

  React.useEffect(() => {
    draw();
  }, [draw]);

  // ----- Mouse handling -----
  function canvasPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!image) return;
    const { x, y } = canvasPos(e);

    if (tool === 'select') {
      const hit = hitTest(annotations, x, y);
      if (hit) {
        setSelectedId(hit.id);
        moveRef.current = { id: hit.id, startX: x, startY: y, original: hit };
      } else {
        setSelectedId(null);
      }
      return;
    }

    if (tool === 'text') {
      const text = window.prompt('Text:');
      if (text) {
        const a: Annotation = {
          id: Date.now(),
          tool: 'text',
          color,
          strokeWidth,
          fontSize,
          x1: x,
          y1: y,
          text,
        };
        const next = [...annotations, a];
        setAnnotations(next);
        history.push({ image, annotations: next });
      }
      return;
    }

    if (tool === 'number') {
      const used = annotations.filter((a) => a.tool === 'number').length;
      const a: Annotation = {
        id: Date.now(),
        tool: 'number',
        color,
        strokeWidth,
        fontSize,
        x1: x,
        y1: y,
        number: used + 1,
      };
      const next = [...annotations, a];
      setAnnotations(next);
      history.push({ image, annotations: next });
      return;
    }

    if (tool === 'pen' || tool === 'highlighter') {
      setDrawing({
        id: Date.now(),
        tool,
        color,
        strokeWidth: tool === 'highlighter' ? Math.max(strokeWidth, 14) : strokeWidth,
        points: [{ x, y }],
      });
      return;
    }

    setDrawing({
      id: Date.now(),
      tool,
      color,
      strokeWidth,
      filled,
      blurRadius: tool === 'blur' ? blurRadius : undefined,
      x1: x,
      y1: y,
      x2: x,
      y2: y,
    });
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!image) return;
    const { x, y } = canvasPos(e);

    if (tool === 'select' && moveRef.current) {
      const { startX, startY, original } = moveRef.current;
      const dx = x - startX;
      const dy = y - startY;
      const moved: Annotation = { ...original };
      if (moved.x1 != null) moved.x1 = (original.x1 ?? 0) + dx;
      if (moved.y1 != null) moved.y1 = (original.y1 ?? 0) + dy;
      if (moved.x2 != null) moved.x2 = (original.x2 ?? 0) + dx;
      if (moved.y2 != null) moved.y2 = (original.y2 ?? 0) + dy;
      if (moved.points) moved.points = original.points!.map((p) => ({ x: p.x + dx, y: p.y + dy }));
      setAnnotations((arr) => arr.map((a) => (a.id === moved.id ? moved : a)));
      return;
    }

    if (!drawing) return;

    if (drawing.tool === 'pen' || drawing.tool === 'highlighter') {
      setDrawing({ ...drawing, points: [...(drawing.points ?? []), { x, y }] });
      return;
    }

    setDrawing(applyConstraint({ ...drawing, x2: x, y2: y }, e.shiftKey));
  }

  function onMouseUp() {
    if (tool === 'select' && moveRef.current) {
      moveRef.current = null;
      history.push({ image, annotations });
      return;
    }
    if (!drawing) return;
    if (drawing.tool !== 'pen' && drawing.tool !== 'highlighter') {
      if (drawing.x1 === drawing.x2 && drawing.y1 === drawing.y2) {
        setDrawing(null);
        return;
      }
    }
    if (drawing.tool === 'crop') {
      // Crop is applied via the Apply button — keep drawing state alive.
      return;
    }
    const next = [...annotations, drawing];
    setAnnotations(next);
    setDrawing(null);
    history.push({ image, annotations: next });
  }

  // ----- Crop apply -----
  function applyCrop() {
    if (!drawing || drawing.tool !== 'crop' || !image) return;
    const x = Math.min(drawing.x1!, drawing.x2!);
    const y = Math.min(drawing.y1!, drawing.y2!);
    const w = Math.abs(drawing.x2! - drawing.x1!);
    const h = Math.abs(drawing.y2! - drawing.y1!);
    if (w < 2 || h < 2) {
      setDrawing(null);
      return;
    }
    const full = document.createElement('canvas');
    full.width = image.width;
    full.height = image.height;
    const fctx = full.getContext('2d')!;
    fctx.drawImage(image, 0, 0);
    for (const a of annotations) drawAnnotation(fctx, a, image);

    const cropped = document.createElement('canvas');
    cropped.width = w;
    cropped.height = h;
    const cctx = cropped.getContext('2d')!;
    cctx.drawImage(full, x, y, w, h, 0, 0, w, h);

    const newImg = new Image();
    newImg.onload = () => {
      setImage(newImg);
      setAnnotations([]);
      setDrawing(null);
      setSelectedId(null);
      history.push({ image: newImg, annotations: [] });
      fitZoom();
    };
    newImg.src = cropped.toDataURL('image/png');
  }

  function cancelCrop() {
    setDrawing(null);
  }

  // ----- Export -----
  function exportCanvas(): HTMLCanvasElement | null {
    if (!image) return null;
    const c = document.createElement('canvas');
    c.width = image.width;
    c.height = image.height;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0);
    for (const a of annotations) drawAnnotation(ctx, a, image);
    return c;
  }

  function downloadImage(format: 'png' | 'jpg' = 'png') {
    const c = exportCanvas();
    if (!c) return;
    const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
    // Prefer toBlob → object URL so we don't hold a multi-megabyte data URL
    // in memory while the download is dispatching.
    c.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `annotated.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      },
      mime,
      format === 'jpg' ? 0.92 : undefined,
    );
  }

  async function copyToClipboard() {
    const c = exportCanvas();
    if (!c) return;
    try {
      await new Promise<void>((resolve, reject) => {
        c.toBlob(async (blob) => {
          if (!blob) return reject(new Error('blob failed'));
          try {
            const ClipItem = (window as unknown as { ClipboardItem?: typeof ClipboardItem })
              .ClipboardItem;
            if (!ClipItem) throw new Error('Clipboard API not supported');
            await navigator.clipboard.write([new ClipItem({ 'image/png': blob })]);
            resolve();
          } catch (e) {
            reject(e);
          }
        }, 'image/png');
      });
      toast.success('Image copied', {
        description: 'Paste it into any chat or doc with ⌘V / Ctrl+V.',
      });
    } catch {
      toast.error('Copy failed', {
        description: 'Your browser may not support image clipboard. Try downloading instead.',
      });
    }
  }

  function reset() {
    setImage(null);
    setAnnotations([]);
    setDrawing(null);
    setSelectedId(null);
    setTool('rect');
    setColor(COLORS[0]);
    setStrokeWidth(4);
    setFilled(false);
    setFontSize(24);
    setBlurRadius(12);
    setZoom(1);
    history.reset();
  }

  // ----- Drag and drop -----
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
    if (file) loadImage(file);
  }

  const cursor = tool === 'select' ? 'default' : 'crosshair';
  const cropInProgress = tool === 'crop' && !!drawing;

  return (
    <ToolPage slug="screenshot">
      <Card>
        <CardContent className="space-y-3 p-3 sm:p-4">
          {/* Top toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" /> Upload
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && loadImage(e.target.files[0])}
            />
            <span className="text-xs text-muted">or paste (⌘V) / drop image</span>

            <div className="mx-2 h-6 w-px bg-border" />

            <IconBtn label="Undo (⌘Z)" onClick={undo} disabled={!history.canUndo}>
              <Undo2 className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn label="Redo (⌘⇧Z)" onClick={redo} disabled={!history.canRedo}>
              <Redo2 className="h-3.5 w-3.5" />
            </IconBtn>

            <div className="mx-2 h-6 w-px bg-border" />

            <IconBtn
              label="Zoom out (-)"
              onClick={() => setZoom((z) => Math.max(0.1, +(z - 0.1).toFixed(2)))}
              disabled={!image}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </IconBtn>
            <span className="min-w-[44px] text-center text-xs tabular-nums text-muted">
              {Math.round(zoom * 100)}%
            </span>
            <IconBtn
              label="Zoom in (+)"
              onClick={() => setZoom((z) => Math.min(4, +(z + 0.1).toFixed(2)))}
              disabled={!image}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn label="Fit (0)" onClick={fitZoom} disabled={!image}>
              <Maximize2 className="h-3.5 w-3.5" />
            </IconBtn>

            <div className="ml-auto flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setAnnotations([]);
                  setSelectedId(null);
                  history.push({ image, annotations: [] });
                }}
                disabled={!annotations.length}
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </Button>
              <Button size="sm" variant="secondary" onClick={copyToClipboard} disabled={!image}>
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => downloadImage('jpg')}
                disabled={!image}
              >
                JPG
              </Button>
              <Button size="sm" onClick={() => downloadImage('png')} disabled={!image}>
                <Download className="h-3.5 w-3.5" /> PNG
              </Button>
              <ResetButton onClick={reset} disabled={!image && !annotations.length} />
            </div>
          </div>

          {/* Body: tool rail + canvas */}
          <div className="flex gap-2 sm:gap-3">
            {/* Tool rail */}
            <div className="flex w-10 shrink-0 flex-col items-stretch gap-1 rounded-md border border-border bg-surface-2 p-1 sm:w-12">
              {TOOL_LIST.map((t) => (
                <ToolBtn
                  key={t.tool}
                  icon={t.icon}
                  active={tool === t.tool}
                  onClick={() => {
                    setTool(t.tool);
                    if (t.tool !== 'select') setSelectedId(null);
                  }}
                  label={`${t.label} (${t.key})`}
                  disabled={!image && t.tool !== 'select'}
                />
              ))}
            </div>

            {/* Right column: contextual options + canvas */}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {image && tool !== 'select' && (
                <ContextualOptions
                  tool={tool}
                  color={color}
                  setColor={setColor}
                  strokeWidth={strokeWidth}
                  setStrokeWidth={setStrokeWidth}
                  filled={filled}
                  setFilled={setFilled}
                  fontSize={fontSize}
                  setFontSize={setFontSize}
                  blurRadius={blurRadius}
                  setBlurRadius={setBlurRadius}
                  cropInProgress={cropInProgress}
                  onApplyCrop={applyCrop}
                  onCancelCrop={cancelCrop}
                />
              )}

              {image && tool === 'select' && (
                <div className="flex items-center gap-3 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
                  Click an annotation to select. Drag to move.
                  <kbd className="rounded border border-border bg-surface px-1">Del</kbd> to delete.
                </div>
              )}

              {/* Canvas / drop zone */}
              <div
                ref={wrapperRef}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={
                  'relative overflow-auto rounded-md border bg-[linear-gradient(45deg,_rgba(128,128,128,0.08)_25%,_transparent_25%,_transparent_75%,_rgba(128,128,128,0.08)_75%),linear-gradient(45deg,_rgba(128,128,128,0.08)_25%,_transparent_25%,_transparent_75%,_rgba(128,128,128,0.08)_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px] ' +
                  (dragOver ? 'border-accent ring-2 ring-accent/40' : 'border-border')
                }
                style={{ maxHeight: '70vh' }}
              >
                {image ? (
                  <div style={{ width: image.width * zoom, height: image.height * zoom }}>
                    <canvas
                      ref={canvasRef}
                      onMouseDown={onMouseDown}
                      onMouseMove={onMouseMove}
                      onMouseUp={onMouseUp}
                      onMouseLeave={onMouseUp}
                      style={{
                        cursor,
                        display: 'block',
                        width: image.width * zoom,
                        height: image.height * zoom,
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex h-96 flex-col items-center justify-center gap-3 text-muted">
                    <ImageIcon className="h-10 w-10" />
                    <p className="text-sm">Paste, drop, or upload an image to get started</p>
                    <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                      <Upload className="h-3.5 w-3.5" /> Choose file
                    </Button>
                  </div>
                )}
              </div>

              {image && (
                <p className="text-[11px] text-muted">
                  Shortcuts:{' '}
                  {TOOL_LIST.map((t) => (
                    <span key={t.tool} className="mr-2">
                      <kbd className="rounded border border-border bg-surface px-1">{t.key}</kbd>{' '}
                      {t.label}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolPage>
  );
}
