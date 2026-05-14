import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Megaphone,
  Plus,
  Repeat,
  Send,
  Users,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { formatDateTime } from '@/lib/date/format-date';
import { getErrorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/utils';
import { useBroadcasts } from '../hooks/use-broadcasts';
import type {
  BroadcastStatus,
  BroadcastSummary,
  ListBroadcastsQuery,
} from '../api/broadcasts.api';

const STATUS_META: Record<
  BroadcastStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline';
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
  }
> = {
  draft: {
    label: 'Qoralama',
    variant: 'secondary',
    icon: Clock,
    accent: 'border-l-muted-foreground/40',
  },
  scheduled: {
    label: 'Rejalashtirilgan',
    variant: 'warning',
    icon: CalendarClock,
    accent: 'border-l-amber-500',
  },
  sending: {
    label: 'Yuborilmoqda',
    variant: 'default',
    icon: Send,
    accent: 'border-l-primary',
  },
  sent: {
    label: 'Yuborilgan',
    variant: 'success',
    icon: CheckCircle2,
    accent: 'border-l-green-500',
  },
  cancelled: {
    label: 'Bekor qilingan',
    variant: 'secondary',
    icon: X,
    accent: 'border-l-muted-foreground/40',
  },
  failed: {
    label: 'Xato',
    variant: 'destructive',
    icon: X,
    accent: 'border-l-destructive',
  },
};

const TARGET_LABEL: Record<string, string> = {
  all: 'Barchaga',
  users: 'Tanlangan',
  segment: 'Segment',
};

const RECURRENCE_LABEL: Record<string, string> = {
  daily: 'Har kuni',
  weekly: 'Har hafta',
  monthly: 'Har oy',
  yearly: 'Har yili',
};

const PAGE_SIZE = 20;

export function BroadcastsListPage(): React.ReactElement {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const status = (params.get('status') as BroadcastStatus | null) ?? '';
  const page = Number(params.get('page') ?? '1');

  const filters: ListBroadcastsQuery = useMemo(() => {
    const out: ListBroadcastsQuery = { page, limit: PAGE_SIZE };
    if (status) out.status = status as BroadcastStatus;
    return out;
  }, [status, page]);

  const broadcasts = useBroadcasts(filters);

  function setParam(key: string, value: string): void {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Ommaviy xabarlar</h1>
          <p className="text-sm text-muted-foreground">
            Bot orqali foydalanuvchilarga yuboriladigan xabarlarni
            tayyorlang, jo&apos;nating va natijasini kuzating
          </p>
        </div>
        <Button onClick={() => navigate('/broadcasts/new')}>
          <Plus className="h-4 w-4" />
          Yangi xabar yaratish
        </Button>
      </header>

      <StatusFilter
        current={status as BroadcastStatus | ''}
        onChange={(v) => setParam('status', v)}
        loading={broadcasts.isFetching}
      />

      {broadcasts.isPending ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : broadcasts.isError ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-destructive">
            {getErrorMessage(broadcasts.error)}
          </CardContent>
        </Card>
      ) : (broadcasts.data?.data ?? []).length === 0 ? (
        <EmptyState onCreate={() => navigate('/broadcasts/new')} />
      ) : (
        <div className="space-y-3">
          {broadcasts.data!.data.map((b) => (
            <BroadcastCard
              key={b.id}
              broadcast={b}
              onClick={() => navigate(`/broadcasts/${b.id}`)}
            />
          ))}
        </div>
      )}

      {broadcasts.data && broadcasts.data.meta.totalPages > 1 ? (
        <Pagination
          page={broadcasts.data.meta.page}
          totalPages={broadcasts.data.meta.totalPages}
          onChange={(p) => setParam('page', String(p))}
        />
      ) : null}
    </div>
  );
}

// ─── Components ───────────────────────────────────────────────────────

function StatusFilter({
  current,
  onChange,
  loading,
}: {
  current: BroadcastStatus | '';
  onChange: (v: string) => void;
  loading: boolean;
}): React.ReactElement {
  const options: { value: BroadcastStatus | ''; label: string }[] = [
    { value: '', label: 'Hammasi' },
    { value: 'draft', label: 'Qoralama' },
    { value: 'scheduled', label: 'Rejalashtirilgan' },
    { value: 'sending', label: 'Yuborilmoqda' },
    { value: 'sent', label: 'Yuborilgan' },
    { value: 'cancelled', label: 'Bekor qilingan' },
    { value: 'failed', label: 'Xato' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value || 'all'}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-sm transition',
            current === opt.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border hover:border-primary/50',
          )}
        >
          {opt.label}
        </button>
      ))}
      {loading ? <Spinner className="h-4 w-4 text-muted-foreground" /> : null}
    </div>
  );
}

function BroadcastCard({
  broadcast,
  onClick,
}: {
  broadcast: BroadcastSummary;
  onClick: () => void;
}): React.ReactElement {
  const meta = STATUS_META[broadcast.status];
  const Icon = meta.icon;
  const finished =
    broadcast.sentCount + broadcast.failedCount + broadcast.blockedCount;
  const progress =
    broadcast.totalCount === 0
      ? 0
      : Math.round((finished / broadcast.totalCount) * 100);

  const moment = useMemo(() => {
    if (broadcast.completedAt) {
      return `Tugagan: ${formatDateTime(broadcast.completedAt)}`;
    }
    if (broadcast.startedAt && broadcast.status === 'sending') {
      return `Boshlangan: ${formatDateTime(broadcast.startedAt)}`;
    }
    if (broadcast.scheduledAt) {
      return `Rejada: ${formatDateTime(broadcast.scheduledAt)}`;
    }
    return `Yaratilgan: ${formatDateTime(broadcast.createdAt)}`;
  }, [broadcast]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full flex-col gap-3 rounded-lg border border-l-4 bg-card p-4 text-left transition hover:shadow-sm md:flex-row md:items-center',
        meta.accent,
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/40">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h3 className="truncate font-medium group-hover:text-primary">
            {broadcast.title}
          </h3>
          <Badge variant={meta.variant}>{meta.label}</Badge>
          {broadcast.recurrence !== 'once' ? (
            <Badge variant="outline" className="gap-1">
              <Repeat className="h-3 w-3" />
              {RECURRENCE_LABEL[broadcast.recurrence] ?? broadcast.recurrence}
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {TARGET_LABEL[broadcast.targetKind] ?? broadcast.targetKind}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span>{moment}</span>
        </div>
      </div>

      {broadcast.totalCount > 0 ? (
        <div className="flex w-full shrink-0 flex-col gap-1.5 md:w-56">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {broadcast.sentCount.toLocaleString('uz-UZ')} /{' '}
              {broadcast.totalCount.toLocaleString('uz-UZ')}
            </span>
            <span className="font-medium tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full transition-all',
                broadcast.status === 'sending'
                  ? 'bg-primary'
                  : broadcast.status === 'sent'
                    ? 'bg-green-500'
                    : 'bg-muted-foreground/40',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          {broadcast.failedCount + broadcast.blockedCount > 0 ? (
            <div className="flex items-center gap-2 text-[10px]">
              {broadcast.failedCount > 0 ? (
                <span className="text-destructive">
                  {broadcast.failedCount} xato
                </span>
              ) : null}
              {broadcast.blockedCount > 0 ? (
                <span className="text-amber-600">
                  {broadcast.blockedCount} bloklagan
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="hidden w-56 text-right text-xs text-muted-foreground md:block">
          Hali yuborilmagan
        </div>
      )}
    </button>
  );
}

function EmptyState({
  onCreate,
}: {
  onCreate: () => void;
}): React.ReactElement {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Megaphone className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-medium">Hozircha xabar yo&apos;q</h3>
          <p className="text-sm text-muted-foreground">
            Birinchi ommaviy xabaringizni tayyorlang va foydalanuvchilarga
            yuboring
          </p>
        </div>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Yangi xabar yaratish
        </Button>
      </CardContent>
    </Card>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
      >
        Oldingi
      </Button>
      <span className="px-2 text-sm text-muted-foreground">
        {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
      >
        Keyingi
      </Button>
    </div>
  );
}
