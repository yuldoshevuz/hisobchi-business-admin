import { useMemo } from 'react';
import type { InlineButton } from '../api/bot-templates.api';

interface HtmlPreviewProps {
  html: string;
  mediaType: 'photo' | 'video' | 'document' | 'album' | null;
  mediaUrl: string | null;
  /**
   * Optional: when set (album), the preview renders every URL in a
   * stacked grid the way Telegram lays out a media group. Falls back
   * to `mediaUrl` when omitted.
   */
  mediaUrls?: string[];
  buttons: InlineButton[][];
}

/**
 * Lightweight HTML sanitiser tuned for Telegram's Bot API parse_mode=HTML.
 * Strips every tag except the ones Telegram itself renders, then converts
 * remaining `<` / `>` to entities so the preview can't run arbitrary
 * scripts even if an admin tries to inject some.
 */
const ALLOWED = new Set([
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

function escapeAttr(value: string): string {
  return value.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function sanitizeTelegramHtml(input: string): string {
  return input.replace(/<(\/?)\s*([a-zA-Z]+)([^>]*)>/g, (match, slash, tag, attrs: string) => {
    const lower = tag.toLowerCase();
    if (!ALLOWED.has(lower)) {
      return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    if (lower === 'a' && !slash) {
      // Pull href out, drop everything else
      const m = /href=["']([^"']+)["']/i.exec(attrs);
      const href = m ? m[1] : '#';
      const safeHref =
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('tg://')
          ? href
          : '#';
      return `<a href="${escapeAttr(safeHref)}" target="_blank" rel="noreferrer">`;
    }
    return `<${slash}${lower}>`;
  });
}

function interpolatePlaceholders(html: string): string {
  return html.replace(
    /\{(\w+)\}/g,
    (_, name: string) =>
      `<span class="rounded bg-amber-100 px-1 text-amber-900">{${name}}</span>`,
  );
}

export function HtmlPreview({
  html,
  mediaType,
  mediaUrl,
  mediaUrls,
  buttons,
}: HtmlPreviewProps): React.ReactElement {
  const rendered = useMemo(() => {
    return sanitizeTelegramHtml(interpolatePlaceholders(html));
  }, [html]);

  const photos: string[] =
    mediaType === 'album'
      ? (mediaUrls ?? (mediaUrl ? [mediaUrl] : []))
      : mediaType === 'photo' && mediaUrl
        ? [mediaUrl]
        : [];

  return (
    <div className="rounded-xl bg-[#e5ddd5] p-4">
      <div className="ml-auto max-w-md space-y-2">
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          {photos.length > 0 ? (
            <div className="mb-2 overflow-hidden rounded-lg">
              <AlbumGrid urls={photos} />
            </div>
          ) : mediaType && mediaUrl && mediaType !== 'photo' && mediaType !== 'album' ? (
            <div className="mb-2 overflow-hidden rounded-lg bg-muted">
              <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
                {mediaType === 'video' ? '🎬 Video' : '📎 Hujjat'}
              </div>
            </div>
          ) : null}
          <div
            className="whitespace-pre-wrap text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        </div>
        {buttons.length > 0 ? (
          <div className="space-y-1.5">
            {buttons.map((row, rowIndex) => (
              <div key={rowIndex} className="flex flex-wrap gap-1.5">
                {row.map((btn, btnIndex) =>
                  btn.text.trim() ? (
                    <a
                      key={btnIndex}
                      href={btn.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 rounded-lg bg-white px-3 py-2 text-center text-sm font-medium text-primary shadow-sm hover:bg-accent"
                    >
                      {btn.text}
                    </a>
                  ) : null,
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Telegram-style media-group layout: 1 → single image, 2 → side-by-side,
 * 3 → first big + 2 below, 4+ → 2×N grid. Up to 10 photos.
 */
function AlbumGrid({ urls }: { urls: string[] }): React.ReactElement {
  const trimmed = urls.slice(0, 10);
  const count = trimmed.length;

  if (count === 1) {
    return (
      <img
        src={trimmed[0]}
        alt=""
        className="max-h-80 w-full rounded-lg object-contain bg-muted"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1">
      {trimmed.map((u, i) => (
        <img
          key={`${u}-${i}`}
          src={u}
          alt=""
          className="h-32 w-full rounded-md object-cover bg-muted"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ))}
    </div>
  );
}
