'use client';

import * as React from 'react';
import { ChevronDown, Loader2, RotateCcw, Save, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { resetPrompt, savePrompt, subscribePrompt, type PromptKey } from '@/lib/ai/promptStore';
import { useAuth } from '@/lib/auth/AuthContext';
import { cn } from '@/lib/utils';
import { RichTextEditor } from './RichTextEditor';

interface Props {
  promptKey: PromptKey;
  defaultPrompt: string;
  /** Short label shown next to the toggle, e.g. "test case prompt". */
  label: string;
}

type Mode = 'rich' | 'raw';

export function PromptEditor({ promptKey, defaultPrompt, label }: Props) {
  const toast = useToast();
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>('rich');
  const [draft, setDraft] = React.useState(defaultPrompt);
  const [stored, setStored] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const editedRef = React.useRef(false);

  React.useEffect(() => {
    editedRef.current = false;
    setLoaded(false);
    if (!user) {
      setStored(null);
      setDraft(defaultPrompt);
      setLoaded(true);
      return;
    }
    const unsub = subscribePrompt(user.uid, promptKey, (value) => {
      setStored(value);
      // Only overwrite the draft from remote when the user hasn't started editing.
      if (!editedRef.current) setDraft(value ?? defaultPrompt);
      setLoaded(true);
    });
    return unsub;
  }, [user, promptKey, defaultPrompt]);

  const effective = stored ?? defaultPrompt;
  const dirty = draft !== effective;
  const isCustom = stored != null;

  function updateDraft(next: string) {
    editedRef.current = true;
    setDraft(next);
  }

  async function save() {
    if (!user) {
      toast.warning('Sign in required', {
        description: 'Sign in to save your custom prompts to your account.',
      });
      return;
    }
    if (!draft.trim()) {
      toast.warning('Prompt is empty', {
        description: 'Add some instructions before saving.',
      });
      return;
    }
    setSaving(true);
    try {
      await savePrompt(user.uid, promptKey, draft);
      editedRef.current = false;
      toast.success('Prompt saved', {
        description: `Your custom ${label} is now in use.`,
      });
    } catch (e) {
      toast.error('Could not save prompt', {
        description: e instanceof Error ? e.message : 'Please try again in a moment.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (!user) return;
    setSaving(true);
    try {
      await resetPrompt(user.uid, promptKey);
      editedRef.current = false;
      toast.success('Prompt reset', {
        description: `The built-in ${label} is back in use.`,
      });
    } catch (e) {
      toast.error('Could not reset prompt', {
        description: e instanceof Error ? e.message : 'Please try again in a moment.',
      });
    } finally {
      setSaving(false);
    }
  }

  function loadBuiltin() {
    updateDraft(defaultPrompt);
  }

  return (
    <div className="rounded-lg border border-border bg-surface-2/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-surface-2"
        aria-expanded={open}
      >
        <Wand2 className="h-3.5 w-3.5 text-accent" />
        <span className="font-medium">Customize {label}</span>
        <span
          className={cn(
            'rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
            isCustom
              ? 'border-accent/40 bg-accent/10 text-accent'
              : 'border-border bg-surface text-muted',
          )}
        >
          {isCustom ? 'Customized' : 'Default'}
        </span>
        <ChevronDown
          className={cn('ml-auto h-4 w-4 text-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="space-y-3 border-t border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted">
              This is the system prompt sent to the model before your input. Format with the toolbar
              - no markdown required. Saved to your account.
            </p>
            <div
              role="tablist"
              className="inline-flex shrink-0 overflow-hidden rounded-md border border-border bg-surface text-[11px]"
            >
              <ModeTab active={mode === 'rich'} onClick={() => setMode('rich')}>
                Formatted
              </ModeTab>
              <ModeTab active={mode === 'raw'} onClick={() => setMode('raw')}>
                Raw text
              </ModeTab>
            </div>
          </div>

          {!loaded ? (
            <div className="flex h-24 items-center justify-center text-xs text-muted">
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Loading…
            </div>
          ) : mode === 'rich' ? (
            <RichTextEditor
              value={draft}
              onChange={updateDraft}
              placeholder="Describe how the AI should behave…"
            />
          ) : (
            <Textarea
              rows={14}
              mono
              value={draft}
              onChange={(e) => updateDraft(e.target.value)}
              className="text-[12px] leading-relaxed"
              spellCheck={false}
            />
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={save} disabled={!dirty || !draft.trim() || saving || !user}>
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}{' '}
              Save
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadBuiltin}
              disabled={draft === defaultPrompt}
            >
              Load default
            </Button>
            {isCustom && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-danger"
                onClick={reset}
                disabled={saving}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset to default
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 font-medium transition-colors',
        active ? 'bg-accent/15 text-accent' : 'text-muted hover:text-fg',
      )}
    >
      {children}
    </button>
  );
}
