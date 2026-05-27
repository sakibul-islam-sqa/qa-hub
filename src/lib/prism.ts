'use client';

import Prism from 'prismjs';
import { escapeHtml } from '@/lib/utils';

// Prism auto-runs `highlightAll()` on DOMContentLoaded, which mutates every
// <pre><code class="language-*"> element by adding `tabindex="0"`. That DOM
// mutation happens before React hydrates and triggers a hydration warning
// ("Extra attributes from the server: tabindex"). We only ever use
// `Prism.highlight()` to render strings, so disable the auto-highlighter.
Prism.manual = true;

import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-regex';

export type Lang =
  | 'json'
  | 'yaml'
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'bash'
  | 'markup'
  | 'css'
  | 'regex'
  | 'plain';

export function highlight(code: string, lang: Lang): string {
  if (lang === 'plain' || !Prism.languages[lang]) {
    return escapeHtml(code);
  }
  return Prism.highlight(code, Prism.languages[lang], lang);
}

export { Prism };
