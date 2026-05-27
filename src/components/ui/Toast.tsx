'use client';

import * as React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2, X } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastOptions {
  /** Short headline (1–4 words). Defaults to a sensible label for the tone. */
  title?: string;
  /** Optional supporting line under the title. */
  description?: string;
  /** Time in ms before auto-dismiss. `loading` defaults to no auto-dismiss. */
  duration?: number;
  /** Optional inline action, e.g. Undo. */
  action?: { label: string; onClick: () => void };
}

interface ToastItem extends Required<Pick<ToastOptions, 'title'>> {
  id: string;
  tone: ToastTone;
  description?: string;
  duration: number;
  action?: ToastOptions['action'];
  createdAt: number;
}

type LegacyTone = 'info' | 'success' | 'error' | 'warning';

interface ToastApi {
  (message: string, tone?: LegacyTone): string;
  success: (titleOrMessage: string, opts?: ToastOptions) => string;
  error: (titleOrMessage: string, opts?: ToastOptions) => string;
  warning: (titleOrMessage: string, opts?: ToastOptions) => string;
  info: (titleOrMessage: string, opts?: ToastOptions) => string;
  loading: (titleOrMessage: string, opts?: ToastOptions) => string;
  dismiss: (id?: string) => void;
  update: (id: string, tone: ToastTone, opts?: ToastOptions) => void;
}

const ToastContext = React.createContext<ToastApi | null>(null);

const DEFAULT_DURATION: Record<ToastTone, number> = {
  success: 10000,
  info: 10000,
  warning: 10000,
  error: 10000,
  loading: Infinity,
};

const DEFAULT_TITLE: Record<ToastTone, string> = {
  success: 'Success',
  error: 'Something went wrong',
  warning: 'Heads up',
  info: 'Notice',
  loading: 'Working on it…',
};

// Time the exit animation runs before the toast is removed from state.
// Must be >= the longest leave-animation duration in globals.css.
const EXIT_MS = 360;

let counter = 0;
const nextId = () => {
  counter += 1;
  return `t_${Date.now().toString(36)}_${counter}`;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id?: string) => {
    setToasts((list) => (id ? list.filter((t) => t.id !== id) : []));
  }, []);

  const show = React.useCallback((tone: ToastTone, message: string, opts: ToastOptions = {}) => {
    const id = nextId();
    // If the caller passed only a single string we still want a nicely
    // structured toast: use a tone-appropriate title and treat the string
    // as the description.
    const hasTitle = typeof opts.title === 'string' && opts.title.length > 0;
    const item: ToastItem = {
      id,
      tone,
      title: hasTitle ? (opts.title as string) : message,
      description: hasTitle ? message : opts.description,
      duration: opts.duration ?? DEFAULT_DURATION[tone],
      action: opts.action,
      createdAt: Date.now(),
    };
    setToasts((list) => [...list, item]);
    return id;
  }, []);

  const update = React.useCallback((id: string, tone: ToastTone, opts: ToastOptions = {}) => {
    setToasts((list) =>
      list.map((t) =>
        t.id === id
          ? {
              ...t,
              tone,
              title: opts.title ?? DEFAULT_TITLE[tone],
              description: opts.description ?? t.description,
              duration: opts.duration ?? DEFAULT_DURATION[tone],
              action: opts.action ?? t.action,
              createdAt: Date.now(),
            }
          : t,
      ),
    );
  }, []);

  const api = React.useMemo<ToastApi>(() => {
    const fn = ((message: string, tone: LegacyTone = 'info') => {
      const mapped: ToastTone = tone;
      return show(mapped, message);
    }) as ToastApi;

    fn.success = (m, o) => show('success', m, o);
    fn.error = (m, o) => show('error', m, o);
    fn.warning = (m, o) => show('warning', m, o);
    fn.info = (m, o) => show('info', m, o);
    fn.loading = (m, o) => show('loading', m, o);
    fn.dismiss = dismiss;
    fn.update = update;
    return fn;
  }, [show, dismiss, update]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    // Fail loud — same contract as useAuth/useVault. A silent no-op here used
    // to swallow real provider-misuse bugs (e.g. a feature rendered outside
    // the app shell during tests or refactors). The top-level ErrorBoundary
    // catches this so it shows a fallback instead of crashing the page.
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Viewport + individual toast                                        */
/* ------------------------------------------------------------------ */

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  // Pass the stable `onDismiss` directly (not wrapped in an inline arrow)
  // so adding / removing toasts does not change the prop reference for
  // existing ToastCards — that would reset their auto-dismiss timers.
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-0 right-0 z-[60] flex w-full max-w-[420px] flex-col px-4 pb-2 pt-4 sm:bottom-4 sm:right-4"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

const TONE_STYLES: Record<ToastTone, { icon: string; bar: string; iconBg: string }> = {
  success: {
    icon: 'text-success',
    iconBg: 'bg-success/10',
    bar: 'bg-success',
  },
  error: {
    icon: 'text-danger',
    iconBg: 'bg-danger/10',
    bar: 'bg-danger',
  },
  warning: {
    icon: 'text-warning',
    iconBg: 'bg-warning/10',
    bar: 'bg-warning',
  },
  info: {
    icon: 'text-accent',
    iconBg: 'bg-accent/10',
    bar: 'bg-accent',
  },
  loading: {
    icon: 'text-accent',
    iconBg: 'bg-accent/10',
    bar: 'bg-accent',
  },
};

const TONE_ICON: Record<ToastTone, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const styles = TONE_STYLES[item.tone];
  const Icon = TONE_ICON[item.tone];
  const leavingRef = React.useRef(false);

  // Flip to "open" on the next animation frame so CSS transitions run from
  // the initial closed state into the open state (otherwise the browser
  // paints directly at the final values and skips the entrance animation).
  React.useEffect(() => {
    let f2 = 0;
    const f1 = requestAnimationFrame(() => {
      f2 = requestAnimationFrame(() => setOpen(true));
    });
    return () => {
      cancelAnimationFrame(f1);
      if (f2) cancelAnimationFrame(f2);
    };
  }, []);

  const close = React.useCallback(() => {
    // Guard against double-fire (e.g. timer + manual click, or Strict Mode
    // re-invocations) using a ref so the side-effect lives outside the
    // state-updater function.
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    window.setTimeout(() => onDismiss(item.id), EXIT_MS);
  }, [item.id, onDismiss]);

  // Per-toast remaining-time tracking. Each card owns its own countdown
  // so that adding / removing other toasts (which re-renders the
  // viewport) does NOT reset this toast's timer. Also pauses/resumes
  // cleanly on hover: we bank the elapsed time on cleanup and start a
  // fresh timer for the leftover when resuming.
  const remainingRef = React.useRef(item.duration);

  // On update() the duration / createdAt change — refill the remaining
  // budget so the timer restarts from scratch with the new duration.
  React.useEffect(() => {
    remainingRef.current = item.duration;
  }, [item.duration, item.createdAt]);

  React.useEffect(() => {
    if (!Number.isFinite(item.duration)) return;
    if (leaving || paused) return;
    const startedAt = Date.now();
    const t = window.setTimeout(close, remainingRef.current);
    return () => {
      window.clearTimeout(t);
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAt));
    };
  }, [item.duration, item.createdAt, paused, leaving, close]);

  const state: 'entering' | 'open' | 'leaving' = leaving ? 'leaving' : open ? 'open' : 'entering';
  const hasProgress = Number.isFinite(item.duration);

  return (
    <div className="toast-shell" data-state={state}>
      <div
        role="status"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        data-state={state}
        className="toast-card pointer-events-auto relative overflow-hidden rounded-lg border border-border bg-surface/95 shadow-floating backdrop-blur-md"
      >
        <div className="flex items-start gap-3 px-3.5 py-3 pr-10">
          <div
            className={
              'mt-px flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-inner-border ring-1 ring-inset ring-border/40 ' +
              styles.iconBg
            }
          >
            <Icon
              className={
                'h-[18px] w-[18px] ' +
                styles.icon +
                (item.tone === 'loading' ? ' animate-spin' : '')
              }
            />
          </div>

          <div className="min-w-0 flex-1 pt-px">
            <div className="text-[13px] font-semibold leading-5 tracking-tight text-fg">
              {item.title}
            </div>
            {item.description && (
              <div className="mt-1 break-words text-[12.5px] leading-[1.45] text-muted">
                {item.description}
              </div>
            )}
            {item.action && (
              <button
                type="button"
                onClick={() => {
                  item.action?.onClick();
                  close();
                }}
                className="mt-2.5 inline-flex h-7 items-center rounded-md border border-border bg-surface-2 px-2.5 text-[11.5px] font-medium text-fg shadow-sm transition-all hover:border-accent/40 hover:bg-surface hover:text-accent"
              >
                {item.action.label}
              </button>
            )}
          </div>

          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={close}
            className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted/70 transition-all hover:bg-surface-2 hover:text-fg"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {hasProgress && (
          <div className="absolute inset-x-0 bottom-0 h-[2px] bg-border/30">
            <div
              // Key by (id, createdAt) so update() restarts the bar with
              // the new duration, but hover-pause does NOT remount it —
              // the CSS animationPlayState handles pause/resume in place.
              key={`${item.id}-${item.createdAt}`}
              className={'toast-progress h-full rounded-r-full ' + styles.bar}
              style={
                {
                  animationDuration: `${item.duration}ms`,
                  animationPlayState: paused ? 'paused' : 'running',
                } as React.CSSProperties
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
