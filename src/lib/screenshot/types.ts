export type Tool =
  | 'select'
  | 'rect'
  | 'ellipse'
  | 'arrow'
  | 'line'
  | 'pen'
  | 'highlighter'
  | 'text'
  | 'number'
  | 'blur'
  | 'crop';

export interface Annotation {
  id: number;
  tool: Tool;
  color: string;
  strokeWidth: number;
  filled?: boolean;
  fontSize?: number;
  blurRadius?: number;
  // Shape coords (rect, ellipse, arrow, line, blur, crop)
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  // Pen / highlighter
  points?: { x: number; y: number }[];
  // Text
  text?: string;
  // Number badge
  number?: number;
}

export const COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#0f172a',
  '#ffffff',
];

export const STROKE_WIDTHS = [2, 4, 6, 10, 16];
export const FONT_SIZES = [16, 24, 32, 48];
export const BLUR_RADII = [6, 12, 20, 32];

export const TOOL_KEYS: Record<string, Tool> = {
  v: 'select',
  r: 'rect',
  o: 'ellipse',
  a: 'arrow',
  l: 'line',
  p: 'pen',
  h: 'highlighter',
  t: 'text',
  n: 'number',
  b: 'blur',
  c: 'crop',
};
