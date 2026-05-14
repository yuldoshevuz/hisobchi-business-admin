import { useCallback, useRef, useState } from 'react';
import { File as FileIcon, Trash2, Upload, Video } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { env } from '@/config/env';
import { uploadAdminMedia } from '@/lib/api/uploads';
import { getErrorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/utils';

export type MediaCategory = 'photo' | 'video' | 'document';
export type MediaUploaderKind =
  | 'photo'
  | 'video'
  | 'document'
  | 'album';

interface MediaUploaderProps {
  kind: MediaUploaderKind | null;
  urls: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  /** Override the max-items cap. Default: 10 for album, 1 otherwise. */
  maxItems?: number;
}

const ACCEPT_BY_KIND: Record<MediaUploaderKind, string> = {
  photo: 'image/jpeg,image/png,image/webp,image/gif',
  video: 'video/mp4,video/webm,video/quicktime',
  document:
    '.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.csv,application/pdf',
  album: 'image/jpeg,image/png,image/webp',
};

function resolveAbsolute(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${env.BACKEND_BASE_URL}${url}`;
}

function categoryFor(kind: MediaUploaderKind): MediaCategory {
  if (kind === 'album') return 'photo';
  return kind;
}

function fileNameFromUrl(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1] ?? url;
}

export function MediaUploader({
  kind,
  urls,
  onChange,
  disabled = false,
  maxItems,
}: MediaUploaderProps): React.ReactElement | null {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (kind === null) return null;

  const cap = maxItems ?? (kind === 'album' ? 10 : 1);
  const expectedCategory = categoryFor(kind);
  const accept = ACCEPT_BY_KIND[kind];

  const handleFiles = useCallback(
    async (files: FileList | File[]): Promise<void> => {
      const list = Array.from(files);
      if (list.length === 0) return;
      const remaining = cap - urls.length;
      if (remaining <= 0) {
        toast.error(`Faqat ${cap} ta fayl biriktirish mumkin`);
        return;
      }
      const toUpload = list.slice(0, remaining);
      setUploading(true);
      try {
        const uploaded: string[] = [];
        for (const file of toUpload) {
          const res = await uploadAdminMedia(file);
          if (res.category !== expectedCategory) {
            toast.error(
              `${file.name}: media turi (${res.category}) tanlangan (${expectedCategory}) ga mos kelmadi`,
            );
            continue;
          }
          uploaded.push(res.url);
        }
        if (uploaded.length > 0) {
          onChange([...urls, ...uploaded]);
          toast.success(
            uploaded.length === 1
              ? 'Yuklandi'
              : `${uploaded.length} ta fayl yuklandi`,
          );
        }
      } catch (err) {
        toast.error("Yuklab bo'lmadi", getErrorMessage(err));
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [urls, onChange, cap, expectedCategory],
  );

  function removeAt(index: number): void {
    onChange(urls.filter((_, i) => i !== index));
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>): void {
    e.preventDefault();
    setDragging(false);
    if (disabled || uploading) return;
    void handleFiles(e.dataTransfer.files);
  }

  const canAddMore = urls.length < cap;

  return (
    <div className="space-y-3">
      {urls.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {urls.map((url, index) => (
            <li
              key={`${url}-${index}`}
              className="group relative overflow-hidden rounded-md border bg-muted/30"
            >
              <Preview url={url} category={expectedCategory} />
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

      {canAddMore && !disabled ? (
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
            accept={accept}
            multiple={kind === 'album'}
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
              <span>
                Fayl tashlang yoki bosib tanlang
                {kind === 'album' ? ` (${urls.length}/${cap})` : ''}
              </span>
              <span className="text-xs">{labelFor(kind)}</span>
            </>
          )}
        </label>
      ) : null}
    </div>
  );
}

function labelFor(kind: MediaUploaderKind): string {
  switch (kind) {
    case 'photo':
      return 'JPG, PNG, WebP, GIF · maks 10 MB';
    case 'video':
      return 'MP4, WebM, MOV · maks 50 MB';
    case 'document':
      return 'PDF, DOC, XLSX, ZIP, TXT · maks 20 MB';
    case 'album':
      return 'JPG, PNG, WebP — 10 tagacha';
  }
}

interface PreviewProps {
  url: string;
  category: MediaCategory;
}

function Preview({ url, category }: PreviewProps): React.ReactElement {
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
      <div className="flex h-32 w-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
        <Video className="h-6 w-6" />
        <span className="truncate px-2">{fileNameFromUrl(url)}</span>
      </div>
    );
  }
  return (
    <div className="flex h-32 w-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
      <FileIcon className="h-6 w-6" />
      <span className="truncate px-2">{fileNameFromUrl(url)}</span>
    </div>
  );
}
