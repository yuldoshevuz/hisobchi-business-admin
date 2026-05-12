import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  ImageIcon,
  Pause,
  Play,
} from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { env } from '@/config/env';
import { formatDateTime } from '@/lib/date/format-date';
import { getErrorMessage } from '@/lib/api/errors';
import { useAdminRawMessage } from '../hooks/use-raw-messages';
import type { RawMessageStatus } from '../api/raw-messages.api';

const STATUS_LABEL: Record<RawMessageStatus, string> = {
  pending: 'Kutilmoqda',
  processed: 'Qayta ishlandi',
  failed: 'Xatolik',
  ignored: 'Bekor qilindi',
};

const STATUS_VARIANT: Record<
  RawMessageStatus,
  'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'
> = {
  pending: 'warning',
  processed: 'success',
  failed: 'destructive',
  ignored: 'secondary',
};

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

function InfoRow({ label, value }: InfoRowProps): React.ReactElement {
  return (
    <div className="flex items-start gap-3 border-b py-2 last:border-b-0">
      <div className="w-40 shrink-0 text-xs text-muted-foreground">{label}</div>
      <div className="flex-1 text-sm">{value}</div>
    </div>
  );
}

function JsonBlock({ value }: { value: unknown }): React.ReactElement {
  if (value === null || value === undefined) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <pre className="max-h-[400px] overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

/**
 * Inline media renderer for voice / image raw_messages. The stored
 * `mediaUrl` is a relative path like `/uploads/2026/04/abc.ogg` that
 * the backend serves as a static asset (see `main.ts useStaticAssets`),
 * so we just prefix it with the API base URL. The MIME type is used
 * to pick the voice card vs the image thumbnail (image opens a
 * shadcn Dialog lightbox); falls back to `messageType` when the row
 * pre-dates the migration that started persisting MIME.
 */
function MediaPreview({
  url,
  mimeType,
  messageType,
}: {
  url: string;
  mimeType: string | null;
  messageType: string;
}): React.ReactElement {
  const absolute = url.startsWith('http')
    ? url
    : `${env.BACKEND_BASE_URL}${url}`;
  const isAudio =
    (mimeType ?? '').startsWith('audio/') || messageType === 'voice';
  const isImage =
    (mimeType ?? '').startsWith('image/') || messageType === 'image';
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);

  if (isAudio) {
    return <AdminVoicePlayer src={absolute} mimeType={mimeType} />;
  }

  if (isImage) {
    return (
      <>
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Rasmni to'liq ko'rish"
          className="group relative block max-w-md overflow-hidden rounded-lg border bg-muted/40 transition-shadow hover:shadow-md"
        >
          <img
            src={absolute}
            alt="raw_message media"
            className="aspect-[4/3] w-full object-cover"
            loading="lazy"
          />
          {mimeType ? (
            <div className="absolute bottom-2 left-2 rounded-md bg-background/85 px-2 py-0.5 text-xs text-muted-foreground backdrop-blur">
              {mimeType}
            </div>
          ) : null}
        </button>
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={[{ src: absolute, alt: 'raw_message media' }]}
          plugins={[Zoom]}
          carousel={{ finite: true }}
          render={{ buttonPrev: () => null, buttonNext: () => null }}
        />
      </>
    );
  }

  // Unknown media type — surface the path as a link so the file is
  // still reachable without breaking the layout.
  return (
    <a
      href={absolute}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs hover:bg-muted"
    >
      <ImageIcon className="h-4 w-4 text-muted-foreground" />
      <span className="font-mono text-primary underline-offset-4 hover:underline">
        {url}
      </span>
      {mimeType ? (
        <span className="text-muted-foreground">· {mimeType}</span>
      ) : null}
    </a>
  );
}

/**
 * Custom voice player for raw_message audio. Native `<audio>` ref
 * under the hood (so Telegram OGG/opus plays without a Web Audio
 * decode dance) + Tailwind UI. Same pattern as the frontend mini-app's
 * `VoiceWavePlayer`; kept here as a sibling so the admin doesn't
 * grow a cross-app component.
 */
function AdminVoicePlayer({
  src,
  mimeType,
}: {
  src: string;
  mimeType: string | null;
}): React.ReactElement {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    function onLoaded(): void {
      if (audio && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    }
    function onTime(): void {
      if (!audio) return;
      setCurrentTime(audio.currentTime);
      if (
        (duration === 0 || !Number.isFinite(duration)) &&
        Number.isFinite(audio.duration)
      ) {
        setDuration(audio.duration);
      }
    }
    function onEnded(): void {
      setIsPlaying(false);
      setCurrentTime(0);
    }
    function onPlay(): void {
      setIsPlaying(true);
    }
    function onPause(): void {
      setIsPlaying(false);
    }
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('durationchange', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('durationchange', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [duration]);

  function toggle(): void {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }

  function seekFromEvent(e: React.MouseEvent<HTMLDivElement>): void {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !Number.isFinite(audio.duration)) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(
      Math.max((e.clientX - rect.left) / rect.width, 0),
      1,
    );
    audio.currentTime = ratio * audio.duration;
    setCurrentTime(audio.currentTime);
  }

  function fmt(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const progressPct =
    duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  return (
    <div className="flex max-w-xl items-center gap-3 rounded-lg border bg-muted/40 p-3">
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? 'pause' : 'play'}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
        )}
      </button>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium">Ovozli xabar</span>
          {mimeType ? (
            <span className="text-muted-foreground">· {mimeType}</span>
          ) : null}
        </div>
        <div
          ref={progressRef}
          role="slider"
          aria-label="Audio progress"
          aria-valuemin={0}
          aria-valuemax={duration || 0}
          aria-valuenow={currentTime}
          onClick={seekFromEvent}
          className="relative h-1.5 w-full cursor-pointer overflow-hidden rounded-full bg-muted-foreground/20"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-100"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {fmt(currentTime)} / {fmt(duration)}
      </span>
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Faylni alohida ochish"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
    </div>
  );
}

export function RawMessageDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numericId = Number(id);
  const row = useAdminRawMessage(Number.isFinite(numericId) ? numericId : null);

  if (row.isPending) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (row.isError || !row.data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-destructive">
          {getErrorMessage(row.error) || 'Xabar topilmadi'}
        </CardContent>
      </Card>
    );
  }

  const r = row.data;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/raw-messages')}
        className="-ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        AI xabarlar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="font-mono text-base">#{r.id}</span>
            <Badge variant={STATUS_VARIANT[r.status]}>
              {STATUS_LABEL[r.status]}
            </Badge>
          </CardTitle>
          <CardDescription>
            {formatDateTime(r.createdAt)} · {r.source} · {r.messageType}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InfoRow
            label="Tashkilot"
            value={
              <span>
                {r.organizationName ?? '—'}{' '}
                <span className="text-xs text-muted-foreground">
                  (ID: {r.organizationId})
                </span>
              </span>
            }
          />
          <InfoRow
            label="A'zo"
            value={
              <span>
                {r.memberFullName ?? '—'}{' '}
                <span className="text-xs text-muted-foreground">
                  (ID: {r.memberId})
                </span>
              </span>
            }
          />
          <InfoRow
            label="Telegram message ID"
            value={
              r.telegramMessageId ? (
                <span className="font-mono text-xs">{r.telegramMessageId}</span>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )
            }
          />
          <InfoRow
            label="AI ishonchi"
            value={
              r.aiConfidence ? (
                <span className="font-mono text-sm">{r.aiConfidence}</span>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )
            }
          />
          <InfoRow
            label="Tranzaksiya"
            value={
              r.transactionId ? (
                <span className="font-mono text-sm">#{r.transactionId}</span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Yaratilmagan
                </span>
              )
            }
          />
          <InfoRow
            label="Yangilangan"
            value={
              <span className="text-xs text-muted-foreground">
                {formatDateTime(r.updatedAt)}
              </span>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Foydalanuvchi xabari</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <InfoRow
            label="Matn"
            value={
              r.content ? (
                <p className="whitespace-pre-wrap text-sm">{r.content}</p>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )
            }
          />
          <InfoRow
            label="Transkript"
            value={
              r.contentTranscribed ? (
                <p className="whitespace-pre-wrap text-sm">
                  {r.contentTranscribed}
                </p>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )
            }
          />
          <InfoRow
            label="Media"
            value={
              r.mediaUrl ? (
                <MediaPreview
                  url={r.mediaUrl}
                  mimeType={r.mimeType}
                  messageType={r.messageType}
                />
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gemini javobi (audit)</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <JsonBlock value={r.aiRawResponse} />
        </CardContent>
      </Card>

      {r.proposalData ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasdiqlash uchun taklif</CardTitle>
            <CardDescription>
              Confidence pastligi sababli foydalanuvchidan tasdiqlash so&apos;ralgan.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <JsonBlock value={r.proposalData} />
          </CardContent>
        </Card>
      ) : null}

      {r.errorData ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Xatolik tafsilotlari
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <JsonBlock value={r.errorData} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
