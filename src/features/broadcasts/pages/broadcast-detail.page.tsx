import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Languages,
  Megaphone,
  Phone,
  Send,
  Users,
  Video,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { env } from '@/config/env';
import { formatDateTime } from '@/lib/date/format-date';
import { getErrorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/utils';
import {
  useBroadcast,
  useBroadcastDeliveries,
  useCancelBroadcast,
  useSendBroadcast,
} from '../hooks/use-broadcasts';
import { BroadcastComposerPage } from './broadcast-composer.page';
import type {
  BroadcastDelivery,
  BroadcastDeliveryStatus,
  BroadcastDetail,
  BroadcastMediaType,
  BroadcastStatus,
} from '../api/broadcasts.api';

const STATUS_LABEL: Record<BroadcastStatus, string> = {
  draft: 'Qoralama',
  scheduled: 'Rejalashtirilgan',
  sending: 'Yuborilmoqda',
  sent: 'Yuborilgan',
  cancelled: 'Bekor qilingan',
  failed: 'Xato',
};

const STATUS_VARIANT: Record<
  BroadcastStatus,
  'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'
> = {
  draft: 'secondary',
  scheduled: 'warning',
  sending: 'default',
  sent: 'success',
  cancelled: 'secondary',
  failed: 'destructive',
};

const DELIVERY_STATUS_LABEL: Record<BroadcastDeliveryStatus, string> = {
  pending: 'Kutilmoqda',
  sent: 'Yetkazib berildi',
  failed: 'Xato',
  blocked: 'Foydalanuvchi bloklagan',
  skipped: 'Tashlab ketildi',
};

const DELIVERY_VARIANT: Record<
  BroadcastDeliveryStatus,
  'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'
> = {
  pending: 'outline',
  sent: 'success',
  failed: 'destructive',
  blocked: 'warning',
  skipped: 'secondary',
};

const TARGET_LABEL: Record<string, string> = {
  all: 'Barcha foydalanuvchilarga',
  users: 'Tanlangan foydalanuvchilarga',
  segment: 'Tanlangan segmentga',
};

const RECURRENCE_LABEL: Record<string, string> = {
  daily: 'Har kuni',
  weekly: 'Har hafta',
  monthly: 'Har oy',
  yearly: 'Har yili',
};

export function BroadcastDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const broadcastId = Number(id);
  const broadcast = useBroadcast(
    Number.isFinite(broadcastId) ? broadcastId : null,
  );
  const navigate = useNavigate();
  const showLiveDeliveries =
    broadcast.data?.status === 'sending' ||
    broadcast.data?.status === 'sent' ||
    broadcast.data?.status === 'failed';
  const deliveries = useBroadcastDeliveries(
    showLiveDeliveries ? broadcastId : null,
  );
  const cancelMut = useCancelBroadcast();
  const sendMut = useSendBroadcast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  if (broadcast.isPending) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (broadcast.isError || !broadcast.data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-destructive">
          {getErrorMessage(broadcast.error) || 'Xabar topilmadi'}
        </CardContent>
      </Card>
    );
  }

  const b = broadcast.data;
  const isEditable = b.status === 'draft' || b.status === 'scheduled';
  if (isEditable) {
    return <BroadcastComposerPage />;
  }

  async function handleCancel(): Promise<void> {
    try {
      await cancelMut.mutateAsync(broadcastId);
      toast.success('Bekor qilindi');
      setCancelOpen(false);
    } catch (err) {
      toast.error("Bekor qilib bo'lmadi", getErrorMessage(err));
    }
  }

  async function handleSend(): Promise<void> {
    try {
      await sendMut.mutateAsync(broadcastId);
      toast.success('Yuborish boshlandi');
      setSendOpen(false);
    } catch (err) {
      toast.error("Yuborib bo'lmadi", getErrorMessage(err));
    }
  }

  const progressPct =
    b.totalCount === 0
      ? 0
      : Math.round(
          ((b.sentCount + b.failedCount + b.blockedCount) / b.totalCount) * 100,
        );

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/broadcasts')}
        className="-ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Ommaviy xabarlar
      </Button>

      {/* HERO */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                <Badge variant={STATUS_VARIANT[b.status]}>
                  {STATUS_LABEL[b.status]}
                </Badge>
                {b.recurrence !== 'once' ? (
                  <Badge variant="outline">
                    {RECURRENCE_LABEL[b.recurrence] ?? b.recurrence}
                  </Badge>
                ) : null}
                {b.isMultiLanguage ? (
                  <Badge variant="outline" className="gap-1">
                    <Languages className="h-3 w-3" />
                    Ko&apos;p tilda
                  </Badge>
                ) : null}
              </div>
              <CardTitle className="text-xl">{b.title}</CardTitle>
              <CardDescription className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {TARGET_LABEL[b.targetKind] ?? b.targetKind}
                </span>
                <span className="text-muted-foreground/50">·</span>
                <span>Yaratilgan: {formatDateTime(b.createdAt)}</span>
                {b.completedAt ? (
                  <>
                    <span className="text-muted-foreground/50">·</span>
                    <span>Tugagan: {formatDateTime(b.completedAt)}</span>
                  </>
                ) : null}
              </CardDescription>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              {b.status === 'sending' ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setCancelOpen(true)}
                >
                  <X className="h-4 w-4" />
                  Bekor qilish
                </Button>
              ) : null}
              {(b.status === 'sent' || b.status === 'failed') &&
              b.recurrence === 'once' ? (
                <Button size="sm" onClick={() => setSendOpen(true)}>
                  <Send className="h-4 w-4" />
                  Qayta yuborish
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>

        {b.totalCount > 0 ? (
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat icon={Users} label="Jami" value={b.totalCount} />
              <Stat
                icon={CheckCircle2}
                label="Yetkazib berildi"
                value={b.sentCount}
                tone="success"
              />
              <Stat
                icon={AlertCircle}
                label="Bloklaganlar"
                value={b.blockedCount}
                tone="warning"
              />
              <Stat
                icon={X}
                label="Xato"
                value={b.failedCount}
                tone="destructive"
              />
            </div>
            {b.status === 'sending' ? (
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Yuborish jarayoni</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            ) : null}
          </CardContent>
        ) : null}
      </Card>

      {/* MESSAGE PREVIEW */}
      <MessageSection broadcast={b} />

      {/* MEDIA PREVIEW */}
      {b.mediaUrls.length > 0 && b.mediaType ? (
        <MediaSection mediaType={b.mediaType} mediaUrls={b.mediaUrls} />
      ) : null}

      {/* DELIVERIES */}
      {b.totalCount > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yetkazib berish jadvali</CardTitle>
            <CardDescription>
              Har bir foydalanuvchiga yuborish natijasi · har 5 soniyada
              yangilanadi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeliveryTable
              loading={deliveries.isPending}
              rows={deliveries.data ?? []}
            />
          </CardContent>
        </Card>
      ) : null}

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Xabarni bekor qilish"
        description="Bu xabar bekor qilinsinmi? Yetkazib berilmaganlar to&apos;xtaydi."
        confirmLabel="Ha, bekor qilish"
        destructive
        loading={cancelMut.isPending}
        onConfirm={handleCancel}
      />

      <ConfirmDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        title="Qayta yuborish"
        description="Xabar barcha mos foydalanuvchilarga qaytadan yuboriladi."
        confirmLabel="Ha, yuborish"
        loading={sendMut.isPending}
        onConfirm={handleSend}
      />
    </div>
  );
}

// ─── Message preview section ──────────────────────────────────────────

function MessageSection({
  broadcast,
}: {
  broadcast: BroadcastDetail;
}): React.ReactElement {
  if (!broadcast.isMultiLanguage) {
    return (
      <MessagePreviewCard
        title="Xabar matni"
        subtitle="Barcha foydalanuvchilarga (til farqsiz) shu matn yuboriladi"
        html={broadcast.contentUz}
      />
    );
  }
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <MessagePreviewCard
        title="🇺🇿 O‘zbekcha"
        subtitle="Uz tilidagi foydalanuvchilarga"
        html={broadcast.contentUz}
      />
      <MessagePreviewCard
        title="🇷🇺 Русский"
        subtitle="Rus tilidagi foydalanuvchilarga"
        html={broadcast.contentRu}
      />
      <MessagePreviewCard
        title="🇬🇧 English"
        subtitle="Ingliz tilidagi foydalanuvchilarga"
        html={broadcast.contentEn}
      />
    </div>
  );
}

function MessagePreviewCard({
  title,
  subtitle,
  html,
}: {
  title: string;
  subtitle?: string;
  html: string;
}): React.ReactElement {
  const [showRaw, setShowRaw] = useState(false);
  const sanitized = useMemo(() => previewHtml(html), [html]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {subtitle ? (
            <CardDescription className="text-xs">{subtitle}</CardDescription>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setShowRaw((v) => !v)}
          className="whitespace-nowrap text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          {showRaw ? "Ko'rinishda" : 'HTML kodda'}
        </button>
      </CardHeader>
      <CardContent>
        {showRaw ? (
          <pre className="whitespace-pre-wrap break-words rounded-md bg-muted/40 p-3 text-xs font-mono">
            {html || (
              <span className="text-muted-foreground">— bo&apos;sh —</span>
            )}
          </pre>
        ) : html.trim() === '' ? (
          <p className="rounded-md bg-muted/40 p-3 text-sm italic text-muted-foreground">
            Matn kiritilmagan
          </p>
        ) : (
          <div
            className="whitespace-pre-wrap break-words rounded-md bg-card p-3 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitized }}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ─── Media preview section ────────────────────────────────────────────

function MediaSection({
  mediaType,
  mediaUrls,
}: {
  mediaType: BroadcastMediaType;
  mediaUrls: string[];
}): React.ReactElement {
  const label =
    mediaType === 'photo'
      ? '🖼️ Rasm'
      : mediaType === 'video'
        ? '🎬 Video'
        : mediaType === 'document'
          ? '📎 Hujjat'
          : '🖼️ Rasmlar (album)';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{label}</CardTitle>
        <CardDescription>
          Xabarga biriktirilgan{' '}
          {mediaType === 'album' ? `${mediaUrls.length} ta fayl` : 'fayl'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {mediaUrls.map((url, idx) => (
            <MediaPreview key={`${url}-${idx}`} url={url} type={mediaType} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MediaPreview({
  url,
  type,
}: {
  url: string;
  type: BroadcastMediaType;
}): React.ReactElement {
  const absolute = url.startsWith('http')
    ? url
    : `${env.BACKEND_BASE_URL}${url}`;
  const name = url.split('/').pop() ?? url;

  if (type === 'photo' || type === 'album') {
    return (
      <a
        href={absolute}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-md border bg-muted/30 transition hover:shadow"
      >
        <img
          src={absolute}
          alt=""
          className="h-32 w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </a>
    );
  }
  if (type === 'video') {
    return (
      <a
        href={absolute}
        target="_blank"
        rel="noreferrer"
        className="flex h-32 flex-col items-center justify-center gap-1 rounded-md border bg-muted/30 px-2 text-xs text-muted-foreground transition hover:bg-accent/40"
      >
        <Video className="h-6 w-6" />
        <span className="truncate">{name}</span>
      </a>
    );
  }
  return (
    <a
      href={absolute}
      target="_blank"
      rel="noreferrer"
      className="flex h-32 flex-col items-center justify-center gap-1 rounded-md border bg-muted/30 px-2 text-xs text-muted-foreground transition hover:bg-accent/40"
    >
      <FileText className="h-6 w-6" />
      <span className="truncate">{name}</span>
    </a>
  );
}

// ─── Delivery table ───────────────────────────────────────────────────

function DeliveryTable({
  loading,
  rows,
}: {
  loading: boolean;
  rows: BroadcastDelivery[];
}): React.ReactElement {
  const [statusFilter, setStatusFilter] = useState<
    BroadcastDeliveryStatus | ''
  >('');

  const filtered = useMemo(
    () =>
      statusFilter ? rows.filter((r) => r.status === statusFilter) : rows,
    [rows, statusFilter],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Hozircha hech narsa yo&apos;q
      </p>
    );
  }

  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const chip = (status: BroadcastDeliveryStatus, label: string) => (
    <button
      key={status}
      type="button"
      onClick={() =>
        setStatusFilter(statusFilter === status ? '' : status)
      }
      className={cn(
        'rounded-full border px-3 py-1 text-xs',
        statusFilter === status
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border hover:border-primary/50',
      )}
    >
      {label} ({counts[status] ?? 0})
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {chip('sent', '✅ Yetkazib berildi')}
        {chip('failed', '❌ Xato')}
        {chip('blocked', '🚫 Bloklagan')}
        {chip('pending', '⏳ Kutilmoqda')}
        {chip('skipped', '↷ Tashlab ketildi')}
      </div>

      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Foydalanuvchi</th>
              <th className="px-3 py-2 font-medium">Holati</th>
              <th className="px-3 py-2 font-medium">Vaqt</th>
              <th className="px-3 py-2 font-medium">Tafsilot</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.slice(0, 200).map((d) => (
              <tr key={d.id} className="align-top">
                <td className="px-3 py-2">
                  <div className="font-medium">{d.userFullName}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {d.userPhoneNumber ? (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {d.userPhoneNumber}
                      </span>
                    ) : null}
                    <span>· {d.locale.toUpperCase()}</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <Badge variant={DELIVERY_VARIANT[d.status]}>
                    {DELIVERY_STATUS_LABEL[d.status]}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {d.sentAt ? formatDateTime(d.sentAt) : '—'}
                </td>
                <td className="px-3 py-2 text-xs">
                  {d.errorMessage ? (
                    <span className="break-words text-destructive">
                      {humaniseError(d.errorMessage)}
                    </span>
                  ) : d.status === 'sent' ? (
                    <span className="text-muted-foreground">
                      Muvaffaqiyatli
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 200 ? (
          <p className="border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Faqat birinchi 200 ta qator ko&apos;rsatildi.
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Replace common Telegram error phrases with readable Uzbek hints so a
 * non-technical admin understands what happened without Googling.
 */
function humaniseError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('chat not found') || lower.includes('user not found')) {
    return "Foydalanuvchi botda topilmadi (bo'sh chat yoki o'chirilgan akkaunt)";
  }
  if (lower.includes('blocked by the user')) {
    return 'Foydalanuvchi botni bloklagan';
  }
  if (lower.includes("can't parse entities") || lower.includes('parse')) {
    return "Xabar matnida noto'g'ri HTML format bor";
  }
  if (lower.includes('webpage_media_empty')) {
    return 'Telegram media faylga ulana olmadi (URL ochiq emas)';
  }
  if (lower.includes('too many requests')) {
    return 'Telegram tezlikni cheklayapti — biroz kuting';
  }
  if (lower.includes('network')) {
    return "Tarmoq xatosi — qayta urinib ko'ring";
  }
  return msg;
}

// ─── Telegram-style HTML preview ──────────────────────────────────────

const TELEGRAM_TAGS = new Set([
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
]);

function previewHtml(input: string): string {
  return input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(
      /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g,
      (match, slash, tag: string, attrs: string) => {
        const lower = tag.toLowerCase();
        if (!TELEGRAM_TAGS.has(lower)) {
          return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
        if (lower === 'a' && !slash) {
          const m = /href=["']([^"']+)["']/i.exec(attrs);
          const href = m ? m[1] : '#';
          const safe =
            href.startsWith('http://') ||
            href.startsWith('https://') ||
            href.startsWith('tg://')
              ? href
              : '#';
          return `<a href="${safe.replace(/"/g, '&quot;')}" target="_blank" rel="noreferrer" class="text-primary underline">`;
        }
        return `<${slash}${lower}>`;
      },
    );
}

// ─── Stat tile ────────────────────────────────────────────────────────

interface StatProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: 'success' | 'warning' | 'destructive';
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: StatProps): React.ReactElement {
  const colorClass =
    tone === 'success'
      ? 'text-green-700'
      : tone === 'warning'
        ? 'text-amber-600'
        : tone === 'destructive'
          ? 'text-destructive'
          : 'text-foreground';
  const bgClass =
    tone === 'success'
      ? 'bg-green-50'
      : tone === 'warning'
        ? 'bg-amber-50'
        : tone === 'destructive'
          ? 'bg-red-50'
          : 'bg-muted/30';
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg',
          bgClass,
        )}
      >
        <Icon className={cn('h-4 w-4', colorClass)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={cn(
            'text-xl font-semibold tabular-nums leading-tight',
            colorClass,
          )}
        >
          {value.toLocaleString('uz-UZ')}
        </p>
      </div>
    </div>
  );
}
