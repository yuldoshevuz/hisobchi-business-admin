import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Image, Keyboard, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useDebounce } from '@/hooks/use-debounce';
import { getErrorMessage } from '@/lib/api/errors';
import { useBotTemplates } from '../hooks/use-bot-templates';
import type {
  ListTemplatesQuery,
  TemplateSummary,
} from '../api/bot-templates.api';

const CATEGORY_LABEL: Record<string, string> = {
  welcome: 'Salomlashish',
  auth: 'Ro‘yxatdan o‘tish',
  commands: 'Buyruqlar',
  balance: 'Balans',
  errors: 'Xatoliklar',
  ai: 'AI xabarlari',
  subscription: 'Obuna',
  notification: 'Bildirishnomalar',
};

function categoryLabel(code: string): string {
  return CATEGORY_LABEL[code] ?? code;
}

export function BotTemplatesListPage(): React.ReactElement {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const search = params.get('search') ?? '';
  const category = params.get('category') ?? '';
  const activeFilter = params.get('active') ?? '';

  const debouncedSearch = useDebounce(search, 300);

  const filters: ListTemplatesQuery = useMemo(() => {
    const out: ListTemplatesQuery = {};
    if (debouncedSearch) out.search = debouncedSearch;
    if (category) out.category = category;
    if (activeFilter === 'yes') out.isActive = true;
    if (activeFilter === 'no') out.isActive = false;
    return out;
  }, [debouncedSearch, category, activeFilter]);

  const templates = useBotTemplates(filters);

  function setParam(key: string, value: string): void {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const grouped = useMemo(() => {
    const rows = templates.data ?? [];
    const groups = new Map<string, TemplateSummary[]>();
    for (const row of rows) {
      const list = groups.get(row.category) ?? [];
      list.push(row);
      groups.set(row.category, list);
    }
    return Array.from(groups.entries()).sort((a, b) =>
      categoryLabel(a[0]).localeCompare(categoryLabel(b[0])),
    );
  }, [templates.data]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (templates.data ?? []).forEach((t) => set.add(t.category));
    return Array.from(set).sort();
  }, [templates.data]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Bot xabar shablonlari</h1>
        <p className="text-sm text-muted-foreground">
          Bot yuboradigan xabarlarni shu yerdan tahrirlang. O&apos;zgartirishlar
          bir necha soniyada barcha foydalanuvchilarga ta&apos;sir qiladi.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Xabar nomi yoki tavsifi bo‘yicha izlash"
            value={search}
            onChange={(e) => setParam('search', e.target.value)}
            className="pl-9"
          />
          {templates.isFetching && search ? (
            <Spinner className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          ) : null}
        </div>

        <select
          value={category}
          onChange={(e) => setParam('category', e.target.value)}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">Barcha bo&apos;limlar</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {categoryLabel(c)}
            </option>
          ))}
        </select>

        <select
          value={activeFilter}
          onChange={(e) => setParam('active', e.target.value)}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">Holati: barchasi</option>
          <option value="yes">Faqat yoqilganlar</option>
          <option value="no">Faqat o&apos;chirilganlar</option>
        </select>
      </div>

      {templates.isPending ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : templates.isError ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-destructive">
            {getErrorMessage(templates.error)}
          </CardContent>
        </Card>
      ) : grouped.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Hech qanday xabar topilmadi
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(([cat, rows]) => (
            <Card key={cat}>
              <CardHeader>
                <CardTitle className="text-base">
                  {categoryLabel(cat)}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {rows.length} ta xabar
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="divide-y">
                  {rows.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/bot-templates/${row.id}`)}
                        className="flex w-full items-center gap-3 py-3 text-left hover:bg-accent/40"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {row.description ?? row.key}
                            </span>
                            {!row.isActive ? (
                              <Badge variant="secondary">
                                O&apos;chirilgan
                              </Badge>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <code className="text-[10px]">{row.key}</code>
                            {row.hasMedia ? (
                              <span className="flex items-center gap-1">
                                <Image className="h-3 w-3" />
                                Rasm/Video
                              </span>
                            ) : null}
                            {row.hasButtons ? (
                              <span className="flex items-center gap-1">
                                <Keyboard className="h-3 w-3" />
                                Tugmalar
                              </span>
                            ) : null}
                            {row.currentVersion !== null ? (
                              <span>Versiya {row.currentVersion}</span>
                            ) : null}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
