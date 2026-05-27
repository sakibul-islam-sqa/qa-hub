'use client';

import * as React from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from './Button';
import { copyToClipboard } from '@/lib/utils';
import { useToast } from './Toast';

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);
  const toast = useToast();
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  async function handle() {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      toast.success('Copied to clipboard', {
        description: 'Paste it anywhere with ⌘V / Ctrl+V.',
      });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } else {
      toast.error('Copy failed', {
        description: 'Your browser blocked clipboard access. Try again or copy manually.',
      });
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={handle} disabled={!value}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : label}
    </Button>
  );
}
