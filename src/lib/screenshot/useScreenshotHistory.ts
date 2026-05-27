'use client';

import * as React from 'react';
import type { Annotation } from './types';

export interface HistoryEntry {
  image: HTMLImageElement | null;
  annotations: Annotation[];
}

export interface ScreenshotHistory {
  push(entry: HistoryEntry): void;
  undo(): HistoryEntry | null;
  redo(): HistoryEntry | null;
  reset(): void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Undo/redo stack that bundles the image and annotations together so a crop
 * (which replaces both) is reversible in a single step.
 */
export function useScreenshotHistory(): ScreenshotHistory {
  const ref = React.useRef<HistoryEntry[]>([{ image: null, annotations: [] }]);
  const indexRef = React.useRef(0);
  // `tick` re-renders consumers so canUndo / canRedo stay reactive.
  const [tick, setTick] = React.useState(0);

  const push = React.useCallback((entry: HistoryEntry) => {
    const h = ref.current.slice(0, indexRef.current + 1);
    h.push(entry);
    ref.current = h;
    indexRef.current = h.length - 1;
    setTick((t) => t + 1);
  }, []);

  const undo = React.useCallback((): HistoryEntry | null => {
    if (indexRef.current <= 0) return null;
    indexRef.current -= 1;
    setTick((t) => t + 1);
    return ref.current[indexRef.current];
  }, []);

  const redo = React.useCallback((): HistoryEntry | null => {
    if (indexRef.current >= ref.current.length - 1) return null;
    indexRef.current += 1;
    setTick((t) => t + 1);
    return ref.current[indexRef.current];
  }, []);

  const reset = React.useCallback(() => {
    ref.current = [{ image: null, annotations: [] }];
    indexRef.current = 0;
    setTick((t) => t + 1);
  }, []);

  // Memoize so consumers can safely use the returned object as an effect
  // dep without thrashing. canUndo/canRedo derive from the refs; reading
  // `tick` inside the memo body is what makes the linter recognize it as a
  // legitimate trigger so the snapshot re-derives whenever the stack moves.
  return React.useMemo<ScreenshotHistory>(() => {
    void tick;
    return {
      push,
      undo,
      redo,
      reset,
      canUndo: indexRef.current > 0,
      canRedo: indexRef.current < ref.current.length - 1,
    };
  }, [push, undo, redo, reset, tick]);
}
