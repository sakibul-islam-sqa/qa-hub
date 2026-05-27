'use client';

import { Eye, EyeOff } from 'lucide-react';
import { Input, Label } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export interface PassphraseFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow?: () => void;
  placeholder?: string;
}

export function PassphraseField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
}: PassphraseFieldProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-2">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className={cn('font-mono', onToggleShow && 'pr-9')}
          placeholder={placeholder}
        />
        {onToggleShow && (
          <button
            type="button"
            onClick={onToggleShow}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-fg"
            aria-label={show ? 'Hide passphrase' : 'Show passphrase'}
          >
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}
