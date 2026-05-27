'use client';

import * as React from 'react';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  RemoveFormatting,
  Type,
} from 'lucide-react';
import { htmlToMarkdown, markdownToHtml } from '@/lib/ai/markdownHtml';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (next: string) => void;
  minHeight?: number;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, minHeight = 280, placeholder }: Props) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const lastEmittedRef = React.useRef<string>('');

  // Push value into the contentEditable only when it changes from the outside
  // (parent reset / load default / initial mount). Don't touch DOM on every keystroke
  // - that would wipe the caret position.
  React.useEffect(() => {
    if (!editorRef.current) return;
    if (value === lastEmittedRef.current) return;
    editorRef.current.innerHTML = markdownToHtml(value);
    lastEmittedRef.current = value;
  }, [value]);

  function emit() {
    if (!editorRef.current) return;
    const md = htmlToMarkdown(editorRef.current.innerHTML);
    lastEmittedRef.current = md;
    onChange(md);
  }

  function exec(cmd: string, arg?: string) {
    // Preserve the editor's selection through the click.
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    // Strip foreign formatting - paste as plain text so the editor stays clean.
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    emit();
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface-2">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-surface px-1.5 py-1">
        <ToolbarBtn onClick={() => exec('bold')} title="Bold (⌘B)">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('italic')} title="Italic (⌘I)">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={() => exec('formatBlock', 'H1')} title="Heading 1">
          <Heading1 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('formatBlock', 'H2')} title="Heading 2">
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('formatBlock', 'H3')} title="Heading 3">
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('formatBlock', 'P')} title="Paragraph">
          <Type className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={() => exec('insertUnorderedList')} title="Bullet list">
          <List className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('insertOrderedList')} title="Numbered list">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={() => exec('formatBlock', 'BLOCKQUOTE')} title="Quote">
          <Quote className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('formatBlock', 'PRE')} title="Code block">
          <Code className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={() => exec('removeFormat')} title="Clear formatting">
          <RemoveFormatting className="h-3.5 w-3.5" />
        </ToolbarBtn>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className={cn(
          'prose-qa overflow-y-auto p-4 text-sm leading-relaxed focus:outline-none',
          'qa-rte',
        )}
        style={{ minHeight, maxHeight: 'min(540px, 60vh)' }}
      />

      <style jsx global>{`
        .qa-rte:empty::before {
          content: attr(data-placeholder);
          color: hsl(var(--muted));
          pointer-events: none;
        }
        .qa-rte:focus-within {
          /* keep border subtle; container handles outline */
        }
      `}</style>
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      // mousedown.preventDefault keeps the selection inside the editor when clicking the toolbar.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="rounded p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-fg"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-0.5 h-4 w-px bg-border" aria-hidden />;
}
