import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  DataTable,
  type ColumnDef,
} from '@/components/data-table/data-table';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDateTime } from '@/lib/date/format-date';
import { getErrorMessage } from '@/lib/api/errors';
import { useAdminOrgs } from '../hooks/use-organizations';
import type {
  ListOrgsQuery,
  OrganizationStatus,
  OrgSummary,
} from '../api/organizations.api';

const STATUS_LABEL: Record<OrganizationStatus, string> = {
  active: 'Faol',
  suspended: "To'xtatilgan",
  archived: 'Arxiv',
};

const STATUS_VARIANT: Record<
  OrganizationStatus,
  'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'
> = {
  active: 'success',
  suspended: 'warning',
  archived: 'secondary',
};

export function OrgsListPage(): React.ReactElement {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const search = params.get('search') ?? '';
  const status = (params.get('status') as OrganizationStatus | null) ?? '';
  const page = Number(params.get('page') ?? '1');

  const debouncedSearch = useDebounce(search, 300);

  const filters: ListOrgsQuery = useMemo(
    () => ({
      page,
      limit: 20,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(status ? { status } : {}),
    }),
    [debouncedSearch, status, page],
  );

  const orgs = useAdminOrgs(filters);

  function setParam(key: string, value: string): void {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  }

  const columns = useMemo<ColumnDef<OrgSummary, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Tashkilot',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.ownerName}
            </div>
          </div>
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
        accessorKey: 'memberCount',
        header: "A'zolar",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.memberCount}</span>
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
        <h1 className="text-2xl font-semibold">Tashkilotlar</h1>
        <p className="text-sm text-muted-foreground">
          Cross-tenant ko&apos;rinish — biznes ma&apos;lumotlari ko&apos;rsatilmaydi
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tashkilot nomini izlash"
            value={search}
            onChange={(e) => setParam('search', e.target.value)}
            className="pl-9"
          />
          {orgs.isFetching && search ? (
            <Spinner className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          ) : null}
        </div>

        <select
          value={status}
          onChange={(e) => setParam('status', e.target.value)}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">Barcha statuslar</option>
          <option value="active">Faol</option>
          <option value="suspended">To&apos;xtatilgan</option>
          <option value="archived">Arxiv</option>
        </select>
      </div>

      <DataTable
        data={orgs.data?.data ?? []}
        columns={columns}
        isLoading={orgs.isPending}
        emptyMessage={
          orgs.isError
            ? getErrorMessage(orgs.error)
            : 'Tashkilotlar topilmadi'
        }
        onRowClick={(o) => navigate(`/organizations/${o.id}`)}
        pagination={
          orgs.data
            ? {
                page: orgs.data.meta.page,
                totalPages: orgs.data.meta.totalPages,
                onChange: (p) => setParam('page', String(p)),
              }
            : undefined
        }
      />
    </div>
  );
}
