import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
 * to pick `<audio>` vs `<img>`; falls back to `messageType` when the
 * row pre-dates the migration that started persisting MIME.
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

  return (
    <div className="space-y-2">
      {isAudio ? (
        <audio controls src={absolute} className="w-full" preload="metadata" />
      ) : null}
      {isImage ? (
        <img
          src={absolute}
          alt="raw_message media"
          className="max-h-[480px] rounded-md border object-contain"
        />
      ) : null}
      <div className="text-xs">
        <a
          href={absolute}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-primary underline-offset-4 hover:underline"
        >
          {url}
        </a>
        {mimeType ? (
          <span className="text-muted-foreground"> · {mimeType}</span>
        ) : null}
      </div>
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
