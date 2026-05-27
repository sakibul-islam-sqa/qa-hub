import type { LucideIcon } from 'lucide-react';
import {
  Braces,
  Database,
  Code2,
  Regex,
  Clock,
  GitCompare,
  ImageIcon,
  Eye,
  Monitor,
  Terminal,
  CaseSensitive,
  Palette,
  Sparkles,
  Bug,
  ListChecks,
  MessageSquare,
} from 'lucide-react';

export type ToolCategory =
  | 'AI Assistants'
  | 'Data & Formats'
  | 'Generators'
  | 'Compare & Inspect'
  | 'API & Web'
  | 'Design & A11y';

export interface Tool {
  slug: string;
  title: string;
  description: string;
  category: ToolCategory;
  icon: LucideIcon;
  badge?: string;
}

export const TOOLS: Tool[] = [
  {
    slug: 'ai-test-cases',
    title: 'AI Test Case Generator',
    description: 'Generate test cases from a feature spec or user story using your AI model.',
    category: 'AI Assistants',
    icon: ListChecks,
    badge: 'AI',
  },
  {
    slug: 'ai-bug-report',
    title: 'AI Bug Report Helper',
    description: 'Turn rough notes into a clean, reproducible bug report with your AI model.',
    category: 'AI Assistants',
    icon: Bug,
    badge: 'AI',
  },
  {
    slug: 'ai-chat',
    title: 'AI QA Chat',
    description: 'Chat with any connected AI model. Tuned to think and answer like a senior QA.',
    category: 'AI Assistants',
    icon: MessageSquare,
    badge: 'AI',
  },
  {
    slug: 'json',
    title: 'JSON Tools',
    description: 'Format, validate, convert, and query JSON with JSONPath.',
    category: 'Data & Formats',
    icon: Braces,
  },
  {
    slug: 'encoding',
    title: 'Encoding & Hashing',
    description: 'Base64, URL, HTML entities, JWT decode, MD5/SHA hashing.',
    category: 'Data & Formats',
    icon: Code2,
  },
  {
    slug: 'regex',
    title: 'Regex Playground',
    description: 'Live regex testing with highlighted matches and a pattern library.',
    category: 'Data & Formats',
    icon: Regex,
  },
  {
    slug: 'timestamp',
    title: 'Timestamp Converter',
    description: 'Unix ↔ ISO ↔ human readable, with timezone conversion.',
    category: 'Data & Formats',
    icon: Clock,
  },
  {
    slug: 'text-case',
    title: 'Text Case Converter',
    description: 'camelCase, snake_case, kebab, PascalCase, Title, sentence - all at once.',
    category: 'Data & Formats',
    icon: CaseSensitive,
  },
  {
    slug: 'test-data',
    title: 'Test Data Generator',
    description: 'Fake names, emails, addresses, credit cards, UUIDs - bulk CSV export.',
    category: 'Generators',
    icon: Database,
  },
  {
    slug: 'diff',
    title: 'Diff Viewer',
    description: 'Side-by-side text & JSON diff with inline highlights.',
    category: 'Compare & Inspect',
    icon: GitCompare,
  },
  {
    slug: 'screenshot',
    title: 'Screenshot Annotator',
    description: 'Paste an image, draw arrows/boxes/text, download - all in-browser.',
    category: 'Compare & Inspect',
    icon: ImageIcon,
  },
  {
    slug: 'curl-converter',
    title: 'cURL ↔ fetch',
    description: 'Convert cURL commands to JavaScript fetch and back.',
    category: 'API & Web',
    icon: Terminal,
  },
  {
    slug: 'color',
    title: 'Color Picker',
    description: 'Pick a color and convert between HEX, RGB, HSL, HSV, and CMYK.',
    category: 'Design & A11y',
    icon: Palette,
  },
  {
    slug: 'accessibility',
    title: 'A11y Contrast',
    description: 'WCAG contrast ratio calculator for color pairs.',
    category: 'Design & A11y',
    icon: Eye,
  },
  {
    slug: 'viewport',
    title: 'Viewport Reference',
    description: 'Common device & screen sizes for responsive testing.',
    category: 'Design & A11y',
    icon: Monitor,
  },
];

export const CATEGORIES: ToolCategory[] = [
  'AI Assistants',
  'Data & Formats',
  'Generators',
  'Compare & Inspect',
  'API & Web',
  'Design & A11y',
];

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}
