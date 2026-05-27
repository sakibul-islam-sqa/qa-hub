'use client';

import { RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface ResetButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}

export function ResetButton({ onClick, label = 'Reset', disabled }: ResetButtonProps) {
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={onClick}
      disabled={disabled}
      title="Reset to defaults"
    >
      <RotateCcw className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
