'use client';

import * as React from 'react';
import { Loader2, Sparkles, Square } from 'lucide-react';
import { ToolPage } from '@/components/ToolPage';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea, Label, Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CopyButton } from '@/components/ui/CopyButton';
import { ResetButton } from '@/components/ui/ResetButton';
import { useToast } from '@/components/ui/Toast';
import { ModelPicker, type PickerValue } from '@/components/ai/ModelPicker';
import { MarkdownPreview } from '@/components/ai/MarkdownPreview';
import { PromptEditor } from '@/components/ai/PromptEditor';
import { TEST_CASE_SYSTEM } from '@/lib/ai/prompts';
import { useCustomPrompt } from '@/lib/ai/useCustomPrompt';
import { useStreamGenerate } from '@/lib/ai/useStreamGenerate';

type Focus = 'auto' | 'happy' | 'edge' | 'negative' | 'security' | 'a11y';

const FOCUS_LABEL: Record<Focus, string> = {
  auto: 'Auto (balanced)',
  happy: 'Happy path emphasis',
  edge: 'Edge cases & boundaries',
  negative: 'Negative & validation',
  security: 'Security focus',
  a11y: 'Accessibility focus',
};

export default function AiTestCasesPage() {
  const toast = useToast();
  const { prompt: systemPrompt } = useCustomPrompt('test-cases', TEST_CASE_SYSTEM);
  const { output, setOutput, busy, run, stop } = useStreamGenerate();

  const [pick, setPick] = React.useState<PickerValue | null>(null);
  const [feature, setFeature] = React.useState('');
  const [acceptance, setAcceptance] = React.useState('');
  const [focus, setFocus] = React.useState<Focus>('auto');
  const [count, setCount] = React.useState(10);

  function reset() {
    if (busy) stop();
    setFeature('');
    setAcceptance('');
    setFocus('auto');
    setCount(10);
    setOutput('');
  }

  async function start() {
    const trimmed = feature.trim();
    if (!trimmed) {
      toast.warning('Feature description required', {
        description: 'Describe the feature you want test cases for.',
      });
      return;
    }
    const userMessage = buildUserMessage(trimmed, acceptance.trim(), focus, count);
    await run({
      pick,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.4,
      maxTokens: 4096,
    });
  }

  return (
    <ToolPage slug="ai-test-cases">
      <Card>
        <CardContent className="space-y-5 p-4 sm:p-5">
          <ModelPicker value={pick} onChange={setPick} />

          <PromptEditor
            promptKey="test-cases"
            defaultPrompt={TEST_CASE_SYSTEM}
            label="test case prompt"
          />

          <div>
            <Label>Feature / user story / spec</Label>
            <Textarea
              className="mt-2"
              rows={6}
              placeholder={`e.g. "As a user, I can reset my password via emailed link. Link expires in 30 minutes, single use. Rate-limit to 3 requests per hour per email."`}
              value={feature}
              onChange={(e) => setFeature(e.target.value)}
            />
          </div>

          <div>
            <Label>Acceptance criteria / notes (optional)</Label>
            <Textarea
              className="mt-2"
              rows={4}
              placeholder="Anything implicit you want covered - supported browsers, roles, data shape, errors to surface, etc."
              value={acceptance}
              onChange={(e) => setAcceptance(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Focus</Label>
              <Select
                className="mt-2"
                value={focus}
                onChange={(e) => setFocus(e.target.value as Focus)}
              >
                {(Object.keys(FOCUS_LABEL) as Focus[]).map((f) => (
                  <option key={f} value={f}>
                    {FOCUS_LABEL[f]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Cases (~)</Label>
              <Input
                type="number"
                min={1}
                max={50}
                className="mt-2"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 10)))}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {busy ? (
              <Button variant="secondary" onClick={stop}>
                <Square className="h-3.5 w-3.5" /> Stop
              </Button>
            ) : (
              <Button onClick={start} disabled={!pick || !feature.trim()}>
                <Sparkles className="h-3.5 w-3.5" /> Generate
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
              <h3 className="text-sm font-semibold">Generated test plan</h3>
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

function buildUserMessage(
  feature: string,
  acceptance: string,
  focus: Focus,
  count: number,
): string {
  const lines: string[] = [];
  lines.push(`Generate approximately ${count} test cases.`);
  if (focus !== 'auto') {
    const map: Record<Exclude<Focus, 'auto'>, string> = {
      happy: 'Bias toward end-to-end happy-path coverage of the primary user journey.',
      edge: 'Bias toward boundary values, off-by-one, large/empty inputs, timezone/locale edges.',
      negative: 'Bias toward invalid inputs, validation, permission denials, and error states.',
      security: 'Bias toward auth, authorization, injection, rate limits, and data exposure.',
      a11y: 'Bias toward keyboard navigation, screen reader semantics, contrast, and focus order.',
    };
    lines.push(map[focus]);
  }
  lines.push('');
  lines.push('## Feature / user story');
  lines.push(feature);
  if (acceptance) {
    lines.push('');
    lines.push('## Acceptance criteria / notes');
    lines.push(acceptance);
  }
  return lines.join('\n');
}
