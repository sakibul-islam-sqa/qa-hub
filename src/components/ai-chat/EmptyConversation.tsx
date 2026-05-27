const SUGGESTIONS = [
  'Suggest test cases for a password reset flow with rate limiting.',
  'I just got a 502 from /upload intermittently — help me design a repro.',
  'Write a Playwright test that verifies a toast appears and auto-dismisses.',
  'What edge cases would you cover for a date range picker that supports timezones?',
];

export function EmptyConversation() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface-2/40 p-4 text-sm">
      <p className="font-medium text-fg">Ask anything QA-shaped.</p>
      <p className="mt-1 text-xs text-muted">
        The assistant is tuned to think like a senior QA — test design, repro steps, severity calls,
        automation, risk analysis.
      </p>
      <ul className="mt-3 space-y-1.5 text-xs text-muted">
        {SUGGESTIONS.map((s) => (
          <li key={s} className="list-inside list-disc">
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
