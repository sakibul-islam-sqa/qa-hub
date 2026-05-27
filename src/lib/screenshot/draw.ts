import type { Annotation } from './types';
import { boundingBox } from './geometry';

export function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  a: Annotation,
  image: HTMLImageElement,
) {
  ctx.save();
  ctx.strokeStyle = a.color;
  ctx.fillStyle = a.color;
  ctx.lineWidth = a.strokeWidth ?? 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (a.tool === 'rect' && a.x1 != null && a.y1 != null && a.x2 != null && a.y2 != null) {
    const x = Math.min(a.x1, a.x2);
    const y = Math.min(a.y1, a.y2);
    const w = Math.abs(a.x2 - a.x1);
    const h = Math.abs(a.y2 - a.y1);
    if (a.filled) {
      ctx.globalAlpha = 0.25;
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
    }
    ctx.strokeRect(x, y, w, h);
  } else if (a.tool === 'ellipse' && a.x1 != null && a.y1 != null && a.x2 != null && a.y2 != null) {
    const cx = (a.x1 + a.x2) / 2;
    const cy = (a.y1 + a.y2) / 2;
    const rx = Math.abs(a.x2 - a.x1) / 2;
    const ry = Math.abs(a.y2 - a.y1) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (a.filled) {
      ctx.globalAlpha = 0.25;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.stroke();
  } else if (a.tool === 'arrow' && a.x1 != null && a.y1 != null && a.x2 != null && a.y2 != null) {
    drawArrow(ctx, a.x1, a.y1, a.x2, a.y2, a.strokeWidth);
  } else if (a.tool === 'line' && a.x1 != null && a.y1 != null && a.x2 != null && a.y2 != null) {
    ctx.beginPath();
    ctx.moveTo(a.x1, a.y1);
    ctx.lineTo(a.x2, a.y2);
    ctx.stroke();
  } else if (a.tool === 'pen' && a.points?.length) {
    ctx.beginPath();
    ctx.moveTo(a.points[0].x, a.points[0].y);
    for (let i = 1; i < a.points.length; i++) ctx.lineTo(a.points[i].x, a.points[i].y);
    ctx.stroke();
  } else if (a.tool === 'highlighter' && a.points?.length) {
    ctx.globalAlpha = 0.35;
    ctx.lineCap = 'square';
    ctx.lineWidth = Math.max(a.strokeWidth ?? 14, 14);
    ctx.beginPath();
    ctx.moveTo(a.points[0].x, a.points[0].y);
    for (let i = 1; i < a.points.length; i++) ctx.lineTo(a.points[i].x, a.points[i].y);
    ctx.stroke();
  } else if (a.tool === 'text' && a.text && a.x1 != null && a.y1 != null) {
    const fs = a.fontSize ?? 24;
    ctx.font = `600 ${fs}px system-ui, -apple-system, sans-serif`;
    ctx.textBaseline = 'top';
    // Subtle backing shadow so text is readable on any background
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 4;
    ctx.fillText(a.text, a.x1, a.y1);
    ctx.shadowBlur = 0;
  } else if (a.tool === 'number' && a.number != null && a.x1 != null && a.y1 != null) {
    const fs = a.fontSize ?? 24;
    const r = fs * 0.85;
    ctx.beginPath();
    ctx.arc(a.x1, a.y1, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${fs}px system-ui, -apple-system, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(String(a.number), a.x1, a.y1 + 1);
  } else if (a.tool === 'blur' && a.x1 != null && a.y1 != null && a.x2 != null && a.y2 != null) {
    const x = Math.min(a.x1, a.x2);
    const y = Math.min(a.y1, a.y2);
    const w = Math.abs(a.x2 - a.x1);
    const h = Math.abs(a.y2 - a.y1);
    if (w > 0 && h > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.filter = `blur(${a.blurRadius ?? 12}px)`;
      ctx.drawImage(image, 0, 0);
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  strokeWidth?: number,
) {
  const sw = strokeWidth ?? 3;
  const head = Math.max(12, sw * 3);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - Math.cos(angle) * head * 0.5, y2 - Math.sin(angle) * head * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 7), y2 - head * Math.sin(angle - Math.PI / 7));
  ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 7), y2 - head * Math.sin(angle + Math.PI / 7));
  ctx.closePath();
  ctx.fill();
}

export function drawSelection(ctx: CanvasRenderingContext2D, a: Annotation) {
  const box = boundingBox(a);
  if (!box) return;
  const pad = 6;
  ctx.save();
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(box.x - pad, box.y - pad, box.w + pad * 2, box.h + pad * 2);
  ctx.restore();
}

export function drawCropOverlay(
  ctx: CanvasRenderingContext2D,
  a: Annotation,
  image: HTMLImageElement,
) {
  if (a.x1 == null || a.y1 == null || a.x2 == null || a.y2 == null) return;
  const x = Math.min(a.x1, a.x2);
  const y = Math.min(a.y1, a.y2);
  const w = Math.abs(a.x2 - a.x1);
  const h = Math.abs(a.y2 - a.y1);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  // Four bands around the crop rect
  ctx.fillRect(0, 0, image.width, y);
  ctx.fillRect(0, y + h, image.width, image.height - (y + h));
  ctx.fillRect(0, y, x, h);
  ctx.fillRect(x + w, y, image.width - (x + w), h);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
