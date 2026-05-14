import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bold,
  Code,
  Italic,
  Link as LinkIcon,
  RemoveFormatting,
  Strikethrough,
  Underline,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Telegram-compatible WYSIWYG HTML editor. Outputs only the tags the
 * Bot API renders under `parse_mode=HTML`: <b>, <i>, <u>, <s>, <code>,
 * <pre>, <a>, plus <br> for newlines. Admins format text with the
 * toolbar instead of typing raw tags.
 *
 * Internally uses `contenteditable` + `document.execCommand`. execCommand
 * is technically deprecated but is universally supported and matches the
 * narrow surface we need; a future swap to a selection-based
 * implementation can keep the same API.
 */

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

const ALLOWED_TAGS = new Set([
  'b',
  'strong',
  'i',
  'em',
  'u',
  'ins',
  's',
  'strike',
  'del',
  'a',
  'code',
  'pre',
  'br',
]);

function normalizeTag(tag: string): string {
  const lower = tag.toLowerCase();
  if (lower === 'strong') return 'b';
  if (lower === 'em') return 'i';
  if (lower === 'ins') return 'u';
  if (lower === 'strike' || lower === 'del') return 's';
  return lower;
}

/**
 * Walk the DOM and emit Telegram-compliant HTML. Line breaks are
 * emitted as literal `\n` characters — Telegram's `parse_mode=HTML`
 * rejects `<br>` tags, so newlines stay outside the tag set.
 * `<div>`/`<p>` boundaries collapse into `\n`, unknown tags are
 * unwrapped.
 */
function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent ?? '');
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  if (tag === 'br') return '\n';
  if (tag === 'div' || tag === 'p') {
    const inner = Array.from(el.childNodes).map(serializeNode).join('');
    // Each block becomes a line. The leading newline only between blocks.
    return inner.length > 0 ? inner + '\n' : '\n';
  }

  const inner = Array.from(el.childNodes).map(serializeNode).join('');
  const normalizedTag = normalizeTag(tag);

  if (!ALLOWED_TAGS.has(normalizedTag)) {
    return inner;
  }

  if (normalizedTag === 'a') {
    const href = el.getAttribute('href') ?? '';
    const safeHref =
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('tg://')
        ? href
        : null;
    if (!safeHref) return inner;
    return `<a href="${escapeAttr(safeHref)}">${inner}</a>`;
  }

  return `<${normalizedTag}>${inner}</${normalizedTag}>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Tighten the serialized output: drop trailing newlines and collapse
 * runs of 3+ blank lines to 2.
 */
function tidy(html: string): string {
  return html.replace(/\n+$/g, '').replace(/\n{3,}/g, '\n\n');
}

/**
 * Convert persisted content (which uses literal `\n` for line breaks)
 * into the HTML the contenteditable surface expects (`<br>`). Legacy
 * `<br>` tags in older content stay intact.
 */
function htmlToContent(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '<br>')
    .replace(/\n/g, '<br>');
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  rows = 8,
  disabled = false,
  className,
}: RichTextEditorProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<Range | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const lastEmittedRef = useRef<string>('');

  // Hydrate from `value` only when it diverges from what we last emitted.
  // Avoids overwriting the user's caret while typing.
  useEffect(() => {
    if (!ref.current) return;
    if (value === lastEmittedRef.current) return;
    ref.current.innerHTML = htmlToContent(value);
    lastEmittedRef.current = value;
  }, [value]);

  const emit = useCallback(() => {
    if (!ref.current) return;
    const html = tidy(
      Array.from(ref.current.childNodes).map(serializeNode).join(''),
    );
    lastEmittedRef.current = html;
    onChange(html);
  }, [onChange]);

  function exec(command: string): void {
    if (disabled) return;
    document.execCommand(command, false);
    ref.current?.focus();
    emit();
  }

  function applyTag(tagName: 'code' | 'pre'): void {
    if (disabled) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    const wrapper = document.createElement(tagName);
    try {
      wrapper.appendChild(range.extractContents());
      range.insertNode(wrapper);
      sel.removeAllRanges();
    } catch {
      /* swallow — selection spans block boundaries */
    }
    emit();
  }

  function captureSelectionForLink(): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    setPendingSelection(sel.getRangeAt(0).cloneRange());
    setLinkUrl('');
    setLinkOpen(true);
  }

  function commitLink(): void {
    if (!pendingSelection) {
      setLinkOpen(false);
      return;
    }
    if (!linkUrl.trim()) {
      setLinkOpen(false);
      return;
    }
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(pendingSelection);
    }
    document.execCommand('createLink', false, linkUrl.trim());
    setLinkOpen(false);
    setPendingSelection(null);
    emit();
  }

  function clearFormat(): void {
    if (disabled) return;
    document.execCommand('removeFormat', false);
    document.execCommand('unlink', false);
    emit();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>): void {
    // Strip everything but plain text on paste. Prevents pasted styling
    // from Word / web pages leaking unsupported tags into the output.
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }

  return (
    <div className={cn('rounded-md border bg-card', className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 p-1">
        <ToolbarButton onClick={() => exec('bold')} title="Qalin (Ctrl+B)" disabled={disabled}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('italic')} title="Kursiv (Ctrl+I)" disabled={disabled}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => exec('underline')}
          title="Tagiga chizilgan (Ctrl+U)"
          disabled={disabled}
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => exec('strikeThrough')}
          title="O'chirilgan"
          disabled={disabled}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton
          onClick={() => applyTag('code')}
          title="Kod (monospace)"
          disabled={disabled}
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={captureSelectionForLink}
          title="Havola qo'shish"
          disabled={disabled}
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton onClick={clearFormat} title="Formatni tozalash" disabled={disabled}>
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <div
        ref={ref}
        contentEditable={!disabled}
        onInput={emit}
        onBlur={emit}
        onPaste={handlePaste}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className={cn(
          'min-h-[6rem] whitespace-pre-wrap break-words p-3 text-sm leading-relaxed focus:outline-none',
          'data-[placeholder]:before:pointer-events-none data-[placeholder]:before:text-muted-foreground',
          'empty:before:content-[attr(data-placeholder)]',
          disabled && 'cursor-not-allowed opacity-60',
        )}
        style={{ minHeight: `${rows * 1.5}rem` }}
      />

      {linkOpen ? (
        <div className="flex items-center gap-2 border-t bg-muted/30 p-2">
          <input
            type="url"
            placeholder="https://..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitLink();
              } else if (e.key === 'Escape') {
                setLinkOpen(false);
                setPendingSelection(null);
              }
            }}
            className="flex-1 rounded-md border border-input bg-card px-2 py-1 text-sm"
            autoFocus
          />
          <Button type="button" size="sm" onClick={commitLink}>
            Qo&apos;yish
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setLinkOpen(false);
              setPendingSelection(null);
            }}
          >
            Bekor
          </Button>
        </div>
      ) : null}
    </div>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  title,
  disabled,
  children,
}: ToolbarButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        // Prevent the editor from losing focus before the command runs.
        e.preventDefault();
      }}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-40"
    >
      {children}
    </button>
  );
}
