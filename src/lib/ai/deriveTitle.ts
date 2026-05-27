/** Truncate the first user prompt into a sidebar-friendly chat title. */
export function deriveTitle(text: string): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return 'New chat';
  if (trimmed.length <= 60) return trimmed;
  return trimmed.slice(0, 57).trimEnd() + '…';
}
