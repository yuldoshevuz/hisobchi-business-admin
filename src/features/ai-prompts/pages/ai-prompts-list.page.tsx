import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useAiPrompts } from '../hooks/use-ai-prompts';
import { promptLabel } from '../lib/prompt-labels';
import type {
  ListPromptsQuery,
  PromptSummary,
} from '../api/ai-prompts.api';

const CATEGORY_LABEL: Record<string, string> = {
  stage1: 'Stage 1 — Intent Router',
  stage2: 'Stage 2 — Extractorlar',
  shared: 'Umumiy qoidalar',
  followup: 'Yakuniy javob (follow-up)',
};

function categoryLabel(code: string): string {
  return CATEGORY_LABEL[code] ?? code;
}

export function AiPromptsListPage(): React.ReactElement {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const search = params.get('search') ?? '';
  const category = params.get('category') ?? '';
  const activeFilter = params.get('active') ?? '';

  const debouncedSearch = useDebounce(search, 300);

  const filters: ListPromptsQuery = useMemo(() => {
    const out: ListPromptsQuery = {};
    if (debouncedSearch) out.search = debouncedSearch;
    if (category) out.category = category;
    if (activeFilter === 'yes') out.isActive = true;
    if (activeFilter === 'no') out.isActive = false;
    return out;
  }, [debouncedSearch, category, activeFilter]);

  const prompts = useAiPrompts(filters);

  function setParam(key: string, value: string): void {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const grouped = useMemo(() => {
    const rows = prompts.data ?? [];
    const groups = new Map<string, PromptSummary[]>();
    for (const row of rows) {
      const list = groups.get(row.category) ?? [];
      list.push(row);
      groups.set(row.category, list);
    }
    // Stable order: stage1 → stage2 → shared → followup → others
    const order = ['stage1', 'stage2', 'shared', 'followup'];
    return Array.from(groups.entries()).sort((a, b) => {
      const ai = order.indexOf(a[0]);
      const bi = order.indexOf(b[0]);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return categoryLabel(a[0]).localeCompare(categoryLabel(b[0]));
    });
  }, [prompts.data]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (prompts.data ?? []).forEach((t) => set.add(t.category));
    return Array.from(set).sort();
  }, [prompts.data]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">AI promptlari</h1>
          <p className="text-sm text-muted-foreground">
            Gemini AI uchun system promptlarni shu yerdan tahrirlang.
            O&apos;zgartirishlar bir necha soniyada barcha workerlarga
            tarqaladi. Yangi umumiy qoidalarni qo&apos;shish, eski versiyaga
            qaytarish va default&apos;ga reset mavjud.
          </p>
        </div>
        <Button onClick={() => navigate('/ai-prompts/new-rule')}>
          <Plus className="h-4 w-4" />
          Yangi umumiy qoida
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Kalit yoki tavsif bo'yicha izlash"
            value={search}
            onChange={(e) => setParam('search', e.target.value)}
            className="pl-9"
          />
          {prompts.isFetching && search ? (
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

      {prompts.isPending ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : prompts.isError ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-destructive">
            {getErrorMessage(prompts.error)}
          </CardContent>
        </Card>
      ) : grouped.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Hech qanday prompt topilmadi
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
                    {rows.length} ta prompt
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="divide-y">
                  {rows.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/ai-prompts/${row.id}`)}
                        className="flex w-full items-center gap-3 py-3 text-left hover:bg-accent/40"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">
                              {promptLabel(row.key)}
                            </span>
                            {!row.isBuiltIn ? (
                              <Badge
                                variant="default"
                                className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              >
                                Custom
                              </Badge>
                            ) : null}
                            {!row.isActive ? (
                              <Badge variant="secondary">
                                O&apos;chirilgan
                              </Badge>
                            ) : null}
                            {row.isActive && !row.matchesDefault && row.isBuiltIn ? (
                              <Badge
                                variant="default"
                                className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              >
                                <AlertTriangle className="h-3 w-3" />
                                O&apos;zgartirilgan
                              </Badge>
                            ) : null}
                          </div>
                          {row.description ? (
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                              {row.description}
                            </p>
                          ) : null}
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <code className="text-[10px]">{row.key}</code>
                            {row.placeholderName ? (
                              <code className="text-[10px]">
                                {`{{${row.placeholderName}}}`}
                              </code>
                            ) : null}
                            {row.currentVersion !== null ? (
                              <span>Versiya {row.currentVersion}</span>
                            ) : null}
                            {row.category === 'shared' && row.appliesTo.length > 0 ? (
                              <span>
                                {row.appliesTo.length} ta promptda
                              </span>
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
