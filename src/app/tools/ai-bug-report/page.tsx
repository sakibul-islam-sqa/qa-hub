'use client';

import * as React from 'react';
import { Bug, Loader2, Square } from 'lucide-react';
import { ToolPage } from '@/components/ToolPage';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea, Label, Input } from '@/components/ui/Input';
import { CopyButton } from '@/components/ui/CopyButton';
import { ResetButton } from '@/components/ui/ResetButton';
import { useToast } from '@/components/ui/Toast';
import { ModelPicker, type PickerValue } from '@/components/ai/ModelPicker';
import { MarkdownPreview } from '@/components/ai/MarkdownPreview';
import { PromptEditor } from '@/components/ai/PromptEditor';
import { BUG_REPORT_SYSTEM } from '@/lib/ai/prompts';
import { useCustomPrompt } from '@/lib/ai/useCustomPrompt';
import { useStreamGenerate } from '@/lib/ai/useStreamGenerate';

export default function AiBugReportPage() {
  const toast = useToast();
  const { prompt: systemPrompt } = useCustomPrompt('bug-report', BUG_REPORT_SYSTEM);
  const { output, setOutput, busy, run, stop } = useStreamGenerate();

  const [pick, setPick] = React.useState<PickerValue | null>(null);
  const [notes, setNotes] = React.useState('');
  const [environment, setEnvironment] = React.useState('');
  const [expected, setExpected] = React.useState('');
  const [actual, setActual] = React.useState('');

  function reset() {
    if (busy) stop();
    setNotes('');
    setEnvironment('');
    setExpected('');
    setActual('');
    setOutput('');
  }

  async function start() {
    const trimmed = notes.trim();
    if (!trimmed) {
      toast.warning('Description required', {
        description: 'Add at least a rough description of the bug.',
      });
      return;
    }
    const userMessage = buildMessage({ notes: trimmed, environment, expected, actual });
    await run({
      pick,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.2,
      maxTokens: 2048,
    });
  }

  return (
    <ToolPage slug="ai-bug-report">
      <Card>
        <CardContent className="space-y-5 p-4 sm:p-5">
          <ModelPicker value={pick} onChange={setPick} />

          <PromptEditor
            promptKey="bug-report"
            defaultPrompt={BUG_REPORT_SYSTEM}
            label="bug report prompt"
          />

          <div>
            <Label>What happened (rough notes, steps, anything)</Label>
            <Textarea
              className="mt-2"
              rows={6}
              placeholder={`e.g. "tried to upload a 12mb pdf on the docs page, spinner kept going for ~40s then nothing happened, no error toast. tried again with a 1mb file, worked fine. console showed a 413 from /upload."`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <Label>Expected (optional)</Label>
            <Textarea
              className="mt-2"
              rows={3}
              placeholder="Upload succeeds"
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
            />
          </div>
          <div>
            <Label>Actual (optional)</Label>
            <Textarea
              className="mt-2"
              rows={3}
              placeholder="Hangs silently"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
            />
          </div>
          <div>
            <Label>Environment (optional)</Label>
            <Input
              className="mt-2"
              placeholder="Chrome 124, macOS 14, staging, role: admin"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {busy ? (
              <Button variant="secondary" onClick={stop}>
                <Square className="h-3.5 w-3.5" /> Stop
              </Button>
            ) : (
              <Button onClick={start} disabled={!pick || !notes.trim()}>
                <Bug className="h-3.5 w-3.5" /> Generate report
              </Button>
            )}
            <ResetButton onClick={reset} />
          </div>
        </CardContent>
      </Card>

      {(busy || output) && (
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Bug report</h3>
              {busy && (
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <Loader2 className="h-3 w-3 animate-spin" /> streaming…
                </span>
              )}
              <div className="ml-auto flex gap-2">
                <CopyButton value={output} label="Copy markdown" />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface-2/40 p-4">
              {output ? (
                <MarkdownPreview source={output} />
              ) : (
                <div className="text-sm text-muted">Waiting for the model…</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </ToolPage>
  );
}

function buildMessage(parts: {
  notes: string;
  environment: string;
  expected: string;
  actual: string;
}): string {
  const lines: string[] = [];
  lines.push('## Reporter notes');
  lines.push(parts.notes);
  if (parts.environment.trim()) {
    lines.push('');
    lines.push('## Environment');
    lines.push(parts.environment.trim());
  }
  if (parts.expected.trim()) {
    lines.push('');
    lines.push('## Expected');
    lines.push(parts.expected.trim());
  }
  if (parts.actual.trim()) {
    lines.push('');
    lines.push('## Actual');
    lines.push(parts.actual.trim());
  }
  return lines.join('\n');
}
