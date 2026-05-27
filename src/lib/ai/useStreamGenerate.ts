'use client';

import * as React from 'react';
import { generate, isAbortError } from '@/lib/ai/client';
import type { ChatMessage, GenerateOptions } from '@/lib/ai/types';
import { useToast } from '@/components/ui/Toast';
import { useResolveApiKey } from '@/lib/ai/useResolveApiKey';
import type { PickerValue } from '@/components/ai/ModelPicker';

export interface RunArgs {
  pick: PickerValue | null;
  system: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /** Toast description shown if the user clicks Stop. Defaults to a generic copy. */
  stoppedDescription?: string;
}

export interface StreamGenerate {
  output: string;
  setOutput: React.Dispatch<React.SetStateAction<string>>;
  busy: boolean;
  /** Generate against the picker selection, streaming into `output`. */
  run: (args: RunArgs) => Promise<void>;
  /** Abort the in-flight stream. Safe to call when idle. */
  stop: () => void;
}

/**
 * One-shot streaming generator that the test-cases and bug-report pages
 * share. Owns the abort controller, the streaming buffer, the busy flag,
 * and the toasts for the four common outcomes: missing model, missing key,
 * aborted, and failed.
 */
export function useStreamGenerate(): StreamGenerate {
  const toast = useToast();
  const resolveApiKey = useResolveApiKey();

  const [output, setOutput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(
    () => () => {
      abortRef.current?.abort();
      abortRef.current = null;
    },
    [],
  );

  const stop = React.useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const run = React.useCallback<StreamGenerate['run']>(
    async ({ pick, system, messages, temperature, maxTokens, stoppedDescription }) => {
      if (!pick) {
        toast.warning('No model selected', {
          description: 'Pick an AI model from the picker above.',
        });
        return;
      }
      const apiKey = await resolveApiKey(pick.provider);
      if (apiKey == null) return;

      setBusy(true);
      setOutput('');
      const controller = new AbortController();
      abortRef.current = controller;

      const opts: GenerateOptions = {
        provider: pick.provider,
        model: pick.model,
        apiKey,
        system,
        messages,
        temperature,
        maxTokens,
        signal: controller.signal,
        onDelta: (chunk) => setOutput((prev) => prev + chunk),
      };

      try {
        await generate(opts);
      } catch (e) {
        if (isAbortError(e)) {
          toast.info('Generation stopped', {
            description: stoppedDescription ?? 'You can edit your input and run it again.',
          });
        } else {
          const msg = e instanceof Error ? e.message : 'Generation failed';
          toast.error('Generation failed', { description: msg.slice(0, 200) });
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [toast, resolveApiKey],
  );

  return { output, setOutput, busy, run, stop };
}
