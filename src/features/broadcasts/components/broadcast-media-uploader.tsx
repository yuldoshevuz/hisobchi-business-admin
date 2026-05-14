import { useCallback, useRef, useState } from 'react';
import {
  File as FileIcon,
  Trash2,
  Upload,
  Video as VideoIcon,
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { env } from '@/config/env';
import { uploadAdminMedia } from '@/lib/api/uploads';
import { getErrorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/utils';
import type { BroadcastMediaType } from '../api/broadcasts.api';

interface BroadcastMediaUploaderProps {
  /** Currently attached URLs. The component tracks the implied media
   * type from the files themselves and bubbles it up via `onChange`. */
  urls: string[];
  mediaType: BroadcastMediaType | null;
  onChange: (next: {
    urls: string[];
    mediaType: BroadcastMediaType | null;
  }) => void;
  disabled?: boolean;
}

type Category = 'photo' | 'video' | 'document';

const MAX_PHOTOS = 10;

const ACCEPT_ALL =
  'image/jpeg,image/png,image/webp,image/gif,' +
  'video/mp4,video/webm,video/quicktime,' +
  '.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.csv';

function resolveAbsolute(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${env.BACKEND_BASE_URL}${url}`;
}

function fileNameFromUrl(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1] ?? url;
}

function categoryFromMediaType(t: BroadcastMediaType | null): Category | null {
  if (t === 'photo' || t === 'album') return 'photo';
  if (t === 'video') return 'video';
  if (t === 'document') return 'document';
  return null;
}

function deriveMediaType(
  count: number,
  category: Category | null,
): BroadcastMediaType | null {
  if (count === 0 || category === null) return null;
  if (category === 'photo') return count > 1 ? 'album' : 'photo';
  return category;
}

export function BroadcastMediaUploader({
  urls,
  mediaType,
  onChange,
  disabled = false,
}: BroadcastMediaUploaderProps): React.ReactElement {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Locked category — once the first file is uploaded, subsequent
  // uploads must match. This avoids the bad UX of "upload a photo +
  // video together" which Telegram can't send as one message.
  const lockedCategory: Category | null = categoryFromMediaType(mediaType);
  const canStackMore =
    !lockedCategory ||
    (lockedCategory === 'photo' && urls.length < MAX_PHOTOS);

  const handleFiles = useCallback(
    async (files: FileList | File[]): Promise<void> => {
      const list = Array.from(files);
      if (list.length === 0) return;

      setUploading(true);
      try {
        let currentCategory = lockedCategory;
        const accumulated = [...urls];

        for (const file of list) {
          if (
            currentCategory === 'photo' &&
            accumulated.length >= MAX_PHOTOS
          ) {
            toast.error(`Maksimal ${MAX_PHOTOS} ta rasm biriktirsangiz bo'ladi`);
            break;
          }
          // Non-photo types only allow one file.
          if (
            (currentCategory === 'video' || currentCategory === 'document') &&
            accumulated.length >= 1
          ) {
            toast.error(
              currentCategory === 'video'
                ? 'Faqat bitta video biriktirish mumkin'
                : 'Faqat bitta hujjat biriktirish mumkin',
            );
            break;
          }

          const res = await uploadAdminMedia(file);

          if (currentCategory === null) {
            currentCategory = res.category;
          } else if (currentCategory !== res.category) {
            toast.error(
              `${file.name}: turi mos kelmadi. Hozir ${describeCategory(currentCategory)} biriktirilgan.`,
            );
            continue;
          }

          accumulated.push(res.url);
        }

        const finalCategory = currentCategory;
        onChange({
          urls: accumulated,
          mediaType: deriveMediaType(accumulated.length, finalCategory),
        });
      } catch (err) {
        toast.error("Yuklab bo'lmadi", getErrorMessage(err));
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [urls, lockedCategory, onChange],
  );

  function removeAt(index: number): void {
    const next = urls.filter((_, i) => i !== index);
    onChange({
      urls: next,
      mediaType: deriveMediaType(next.length, lockedCategory),
    });
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>): void {
    e.preventDefault();
    setDragging(false);
    if (disabled || uploading) return;
    void handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      {urls.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {urls.map((url, index) => (
            <li
              key={`${url}-${index}`}
              className="group relative overflow-hidden rounded-md border bg-muted/30"
            >
              <Preview url={url} category={lockedCategory ?? 'photo'} />
              {!disabled ? (
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="absolute right-1.5 top-1.5 rounded-md bg-background/90 p-1 text-destructive opacity-0 shadow-sm transition group-hover:opacity-100"
                  title="O'chirish"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {canStackMore && !disabled ? (
        <label
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragging(false);
          }}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={onDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed bg-card p-6 text-center text-sm text-muted-foreground transition hover:bg-accent/30',
            dragging && 'border-primary bg-primary/5',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={lockedCategory ? acceptFor(lockedCategory) : ACCEPT_ALL}
            multiple={lockedCategory === 'photo' || lockedCategory === null}
            onChange={(e) => {
              if (e.target.files) void handleFiles(e.target.files);
            }}
            className="hidden"
            disabled={disabled || uploading}
          />
          {uploading ? (
            <>
              <Spinner className="h-5 w-5" />
              <span>Yuklanmoqda...</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              {urls.length === 0 ? (
                <>
                  <span className="font-medium text-foreground">
                    Fayl tashlang yoki bosib tanlang
                  </span>
                  <span className="text-xs">
                    Rasm, video yoki hujjat · bir nechta rasm tanlasangiz album
                    bo&apos;lib yuboriladi
                  </span>
                </>
              ) : (
                <>
                  <span>Yana rasm qo&apos;shish ({urls.length}/{MAX_PHOTOS})</span>
                </>
              )}
            </>
          )}
        </label>
      ) : urls.length > 0 && !lockedCategory ? null : urls.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {lockedCategory === 'video'
            ? 'Bitta video biriktirildi. Boshqasini qo‘shish uchun avval o‘chiring.'
            : lockedCategory === 'document'
              ? 'Bitta hujjat biriktirildi. Boshqasini qo‘shish uchun avval o‘chiring.'
              : ''}
        </p>
      ) : null}
    </div>
  );
}

function describeCategory(c: Category): string {
  switch (c) {
    case 'photo':
      return 'rasm';
    case 'video':
      return 'video';
    case 'document':
      return 'hujjat';
  }
}

function acceptFor(c: Category): string {
  switch (c) {
    case 'photo':
      return 'image/jpeg,image/png,image/webp,image/gif';
    case 'video':
      return 'video/mp4,video/webm,video/quicktime';
    case 'document':
      return '.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.csv';
  }
}

function Preview({
  url,
  category,
}: {
  url: string;
  category: Category;
}): React.ReactElement {
  const absolute = resolveAbsolute(url);
  if (category === 'photo') {
    return (
      <img
        src={absolute}
        alt=""
        className="h-32 w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }
  if (category === 'video') {
    return (
      <div className="flex h-32 w-full flex-col items-center justify-center gap-1 px-2 text-xs text-muted-foreground">
        <VideoIcon className="h-6 w-6" />
        <span className="truncate">{fileNameFromUrl(url)}</span>
      </div>
    );
  }
  return (
    <div className="flex h-32 w-full flex-col items-center justify-center gap-1 px-2 text-xs text-muted-foreground">
      <FileIcon className="h-6 w-6" />
      <span className="truncate">{fileNameFromUrl(url)}</span>
    </div>
  );
}
