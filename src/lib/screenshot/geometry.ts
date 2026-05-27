import type { Annotation } from './types';

export function boundingBox(a: Annotation): { x: number; y: number; w: number; h: number } | null {
  if (a.tool === 'pen' || a.tool === 'highlighter') {
    if (!a.points?.length) return null;
    const xs = a.points.map((p) => p.x);
    const ys = a.points.map((p) => p.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
  }
  if (a.tool === 'text' && a.x1 != null && a.y1 != null) {
    const fs = a.fontSize ?? 24;
    return { x: a.x1, y: a.y1, w: (a.text?.length ?? 0) * fs * 0.6, h: fs };
  }
  if (a.tool === 'number' && a.x1 != null && a.y1 != null) {
    const fs = a.fontSize ?? 24;
    const r = fs * 0.85;
    return { x: a.x1 - r, y: a.y1 - r, w: r * 2, h: r * 2 };
  }
  if (a.x1 != null && a.y1 != null && a.x2 != null && a.y2 != null) {
    const x = Math.min(a.x1, a.x2);
    const y = Math.min(a.y1, a.y2);
    return { x, y, w: Math.abs(a.x2 - a.x1), h: Math.abs(a.y2 - a.y1) };
  }
  return null;
}

export function hitTest(annotations: Annotation[], x: number, y: number): Annotation | null {
  // Iterate in reverse (top-most first)
  const pad = 8;
  for (let i = annotations.length - 1; i >= 0; i--) {
    const a = annotations[i];
    const b = boundingBox(a);
    if (!b) continue;
    if (x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad) {
      return a;
    }
  }
  return null;
}

/** With shift held: snap rectangular shapes to squares and lines/arrows to 15° angles. */
export function applyConstraint(a: Annotation, shift: boolean): Annotation {
  if (!shift) return a;
  if (a.x1 == null || a.x2 == null || a.y1 == null || a.y2 == null) return a;
  if (a.tool === 'rect' || a.tool === 'ellipse' || a.tool === 'blur' || a.tool === 'crop') {
    const dx = a.x2 - a.x1;
    const dy = a.y2 - a.y1;
    const size = Math.max(Math.abs(dx), Math.abs(dy));
    return {
      ...a,
      x2: a.x1 + Math.sign(dx || 1) * size,
      y2: a.y1 + Math.sign(dy || 1) * size,
    };
  }
  if (a.tool === 'arrow' || a.tool === 'line') {
    const dx = a.x2 - a.x1;
    const dy = a.y2 - a.y1;
    const len = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const step = Math.PI / 12;
    const snapped = Math.round(angle / step) * step;
    return {
      ...a,
      x2: a.x1 + Math.cos(snapped) * len,
      y2: a.y1 + Math.sin(snapped) * len,
    };
  }
  return a;
}
