import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Phone, Search, Send } from 'lucide-react';
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
import { usePlatformUsers } from '../hooks/use-platform-users';
import type {
  ListPlatformUsersQuery,
  PlatformUserSummary,
} from '../api/platform-users.api';

type DeletedFilter = '' | 'active' | 'deleted' | 'all';
type TelegramFilter = '' | 'yes' | 'no';
type OrgFilter = '' | 'yes' | 'no';

const PAGE_SIZE = 20;

export function PlatformUsersListPage(): React.ReactElement {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const search = params.get('search') ?? '';
  const tg = (params.get('tg') as TelegramFilter) ?? '';
  const org = (params.get('org') as OrgFilter) ?? '';
  const del = (params.get('del') as DeletedFilter) ?? 'active';
  const page = Number(params.get('page') ?? '1');

  const debouncedSearch = useDebounce(search, 300);

  const filters: ListPlatformUsersQuery = useMemo(() => {
    const out: ListPlatformUsersQuery = { page, limit: PAGE_SIZE };
    if (debouncedSearch) out.search = debouncedSearch;
    if (tg === 'yes') out.hasTelegram = true;
    if (tg === 'no') out.hasTelegram = false;
    if (org === 'yes') out.hasOrganization = true;
    if (org === 'no') out.hasOrganization = false;
    if (del === 'deleted') {
      out.onlyDeleted = true;
      out.includeDeleted = true;
    } else if (del === 'all') {
      out.includeDeleted = true;
    }
    return out;
  }, [debouncedSearch, tg, org, del, page]);

  const users = usePlatformUsers(filters);

  function setParam(key: string, value: string): void {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  }

  const columns = useMemo<ColumnDef<PlatformUserSummary, unknown>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Foydalanuvchi',
        cell: ({ row }) => (
          <div>
            <div className="flex items-center gap-2 font-medium">
              {row.original.fullName}
              {row.original.deletedAt ? (
                <Badge variant="destructive">O&apos;chirilgan</Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {row.original.phoneNumber ? (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {row.original.phoneNumber}
                </span>
              ) : (
                <span className="text-muted-foreground/70">
                  Telefon yo&apos;q
                </span>
              )}
              {row.original.telegramId ? (
                <span className="flex items-center gap-1">
                  <Send className="h-3 w-3" />
                  {row.original.telegramId}
                </span>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'primaryOrganizationName',
        header: 'Asosiy tashkilot',
        cell: ({ row }) =>
          row.original.primaryOrganizationName ? (
            <span className="text-sm">
              {row.original.primaryOrganizationName}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'membershipsCount',
        header: "A'zoliklar",
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.membershipsCount}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Ro‘yxatdan o‘tgan',
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
        <h1 className="text-2xl font-semibold">Foydalanuvchilar</h1>
        <p className="text-sm text-muted-foreground">
          Platformaning barcha foydalanuvchilari: bot va mini-app orqali
          ro&apos;yxatdan o&apos;tganlar
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Ism, telefon, email yoki Telegram ID"
            value={search}
            onChange={(e) => setParam('search', e.target.value)}
            className="pl-9"
          />
          {users.isFetching && search ? (
            <Spinner className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          ) : null}
        </div>

        <select
          value={tg}
          onChange={(e) => setParam('tg', e.target.value)}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">Telegram: barchasi</option>
          <option value="yes">Telegram bog&apos;langan</option>
          <option value="no">Telegramsiz</option>
        </select>

        <select
          value={org}
          onChange={(e) => setParam('org', e.target.value)}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">Tashkilot: barchasi</option>
          <option value="yes">Tashkiloti bor</option>
          <option value="no">Tashkilotsiz</option>
        </select>

        <select
          value={del}
          onChange={(e) => setParam('del', e.target.value)}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="active">Faqat faollar</option>
          <option value="deleted">Faqat o&apos;chirilganlar</option>
          <option value="all">Hammasi</option>
        </select>
      </div>

      <DataTable
        data={users.data?.data ?? []}
        columns={columns}
        isLoading={users.isPending}
        emptyMessage={
          users.isError
            ? getErrorMessage(users.error)
            : 'Foydalanuvchilar topilmadi'
        }
        onRowClick={(u) => navigate(`/platform-users/${u.id}`)}
        pagination={
          users.data
            ? {
                page: users.data.meta.page,
                totalPages: users.data.meta.totalPages,
                onChange: (p) => setParam('page', String(p)),
              }
            : undefined
        }
      />
    </div>
  );
}
