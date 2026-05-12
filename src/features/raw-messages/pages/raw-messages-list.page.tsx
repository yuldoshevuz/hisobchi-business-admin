import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DataTable,
  type ColumnDef,
} from '@/components/data-table/data-table';
import { formatDateTime } from '@/lib/date/format-date';
import { getErrorMessage } from '@/lib/api/errors';
import { useAdminRawMessages } from '../hooks/use-raw-messages';
import type {
  ListRawMessagesQuery,
  RawMessageRow,
  RawMessageStatus,
} from '../api/raw-messages.api';

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

export function RawMessagesListPage(): React.ReactElement {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const status = (params.get('status') as RawMessageStatus | null) ?? '';
  const orgIdRaw = params.get('organizationId');
  const orgIdParam = orgIdRaw ? Number(orgIdRaw) : null;
  const page = Number(params.get('page') ?? '1');

  const filters: ListRawMessagesQuery = useMemo(
    () => ({
      page,
      limit: 20,
      ...(status ? { status } : {}),
      ...(orgIdParam && Number.isFinite(orgIdParam)
        ? { organizationId: orgIdParam }
        : {}),
    }),
    [status, orgIdParam, page],
  );

  const rows = useAdminRawMessages(filters);

  function setParam(key: string, value: string): void {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  }

  const columns = useMemo<ColumnDef<RawMessageRow, unknown>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs">#{row.original.id}</span>
        ),
      },
      {
        accessorKey: 'organizationName',
        header: 'Tashkilot',
        cell: ({ row }) => (
          <div>
            <div className="text-sm font-medium">
              {row.original.organizationName ?? '—'}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.original.memberFullName ?? '—'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'messageType',
        header: 'Turi',
        cell: ({ row }) => (
          <span className="text-xs uppercase text-muted-foreground">
            {row.original.messageType}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status]}>
            {STATUS_LABEL[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: 'aiConfidence',
        header: 'Ishonch',
        cell: ({ row }) =>
          row.original.aiConfidence ? (
            <span className="font-mono text-xs">
              {row.original.aiConfidence}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'content',
        header: 'Matn',
        cell: ({ row }) => {
          const text =
            row.original.contentTranscribed ?? row.original.content ?? '';
          if (!text) return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <span className="line-clamp-1 max-w-[420px] text-sm">{text}</span>
          );
        },
      },
      {
        accessorKey: 'transactionId',
        header: 'Tranzaksiya',
        cell: ({ row }) =>
          row.original.transactionId ? (
            <span className="font-mono text-xs">
              #{row.original.transactionId}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Yaratilgan',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">AI xabarlar</h1>
        <p className="text-sm text-muted-foreground">
          Cross-tenant Gemini audit jurnali. Faqat o&apos;qish uchun.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Tashkilot ID"
          value={orgIdRaw ?? ''}
          onChange={(e) => setParam('organizationId', e.target.value)}
          className="max-w-[180px]"
          inputMode="numeric"
        />

        <select
          value={status}
          onChange={(e) => setParam('status', e.target.value)}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">Barcha statuslar</option>
          <option value="pending">Kutilmoqda</option>
          <option value="processed">Qayta ishlandi</option>
          <option value="failed">Xatolik</option>
          <option value="ignored">Bekor qilindi</option>
        </select>
      </div>

      <DataTable
        data={rows.data?.data ?? []}
        columns={columns}
        isLoading={rows.isPending}
        emptyMessage={
          rows.isError ? getErrorMessage(rows.error) : 'Xabarlar topilmadi'
        }
        onRowClick={(r) => navigate(`/raw-messages/${r.id}`)}
        pagination={
          rows.data
            ? {
                page: rows.data.meta.page,
                totalPages: rows.data.meta.totalPages,
                onChange: (p) => setParam('page', String(p)),
              }
            : undefined
        }
      />
    </div>
  );
}
