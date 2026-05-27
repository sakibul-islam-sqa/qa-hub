'use client';

import type { LucideIcon } from 'lucide-react';

export interface ToolBtnProps {
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}

export function ToolBtn({ icon: Icon, active, onClick, label, disabled }: ToolBtnProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      disabled={disabled}
      className={
        'flex h-9 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ' +
        (active
          ? 'border-accent bg-accent/15 text-accent'
          : 'border-transparent bg-surface text-muted hover:text-fg')
      }
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export interface IconBtnProps {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}

export function IconBtn({ children, onClick, label, disabled }: IconBtnProps) {
  return (
    <button
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface-2 text-fg transition-colors hover:border-accent/50 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
