import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useDebounce } from '@/hooks/use-debounce';
import { usePlatformUsers } from '@/features/platform-users/hooks/use-platform-users';
import type {
  BroadcastTargeting,
  SubscriptionStatus,
} from '../api/broadcasts.api';

interface AudienceBuilderProps {
  value: BroadcastTargeting;
  onChange: (value: BroadcastTargeting) => void;
}

const SUBSCRIPTION_STATUSES: { value: SubscriptionStatus; label: string }[] = [
  { value: 'active', label: 'Aktiv' },
  { value: 'expired', label: 'Tugagan' },
  { value: 'cancelled', label: 'Bekor qilingan' },
];

const LOCALES: { value: string; label: string }[] = [
  { value: 'uz', label: "🇺🇿 O'zbekcha" },
  { value: 'ru', label: '🇷🇺 Русский' },
  { value: 'en', label: '🇬🇧 English' },
];

export function AudienceBuilder({
  value,
  onChange,
}: AudienceBuilderProps): React.ReactElement {
  const { kind } = value;

  function setKind(next: BroadcastTargeting['kind']): void {
    if (next === 'all') onChange({ kind: 'all' });
    else if (next === 'users') onChange({ kind: 'users', userIds: [] });
    else onChange({ kind: 'segment', filter: {} });
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Kimga yuboriladi?</Label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(
            [
              { value: 'all', label: 'Hammaga', desc: 'Barcha foydalanuvchilar' },
              { value: 'users', label: 'Tanlangan', desc: 'Bir necha foydalanuvchi' },
              { value: 'segment', label: 'Segment', desc: 'Filtr bo&apos;yicha' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setKind(opt.value)}
              className={`rounded-md border p-3 text-left transition ${
                kind === opt.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="font-medium">{opt.label}</div>
              <div className="text-xs text-muted-foreground">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {kind === 'users' ? (
        <UserPicker
          value={value.userIds ?? []}
          onChange={(userIds) => onChange({ kind: 'users', userIds })}
        />
      ) : null}

      {kind === 'segment' ? (
        <SegmentFilters
          value={value.filter ?? {}}
          onChange={(filter) => onChange({ kind: 'segment', filter })}
        />
      ) : null}
    </div>
  );
}

interface UserPickerProps {
  value: number[];
  onChange: (ids: number[]) => void;
}

function UserPicker({ value, onChange }: UserPickerProps): React.ReactElement {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const users = usePlatformUsers({
    page: 1,
    limit: 50,
    search: debounced || undefined,
  });

  const selectedSet = useMemo(() => new Set(value), [value]);

  // Cache labels for already-selected users so removing the filter
  // doesn't lose the chip text.
  const [labels, setLabels] = useState<Map<number, string>>(new Map());
  useEffect(() => {
    const next = new Map(labels);
    (users.data?.data ?? []).forEach((u) => next.set(u.id, u.fullName));
    if (next.size !== labels.size) setLabels(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users.data]);

  function toggle(id: number, label: string): void {
    if (selectedSet.has(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
      const next = new Map(labels);
      next.set(id, label);
      setLabels(next);
    }
  }

  return (
    <div className="space-y-2">
      <Label>Foydalanuvchilar</Label>

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <Badge key={id} variant="secondary" className="gap-1">
              {labels.get(id) ?? `#${id}`}
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== id))}
                className="ml-1 rounded-full hover:bg-foreground/10"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Ism, telefon yoki Telegram ID bo&apos;yicha izlash"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="max-h-64 overflow-y-auto rounded-md border">
        {users.isPending ? (
          <div className="flex justify-center py-6">
            <Spinner className="h-5 w-5" />
          </div>
        ) : (users.data?.data ?? []).length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Foydalanuvchilar topilmadi
          </p>
        ) : (
          <ul className="divide-y">
            {(users.data?.data ?? []).map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => toggle(u.id, u.fullName)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-accent/40 ${
                    selectedSet.has(u.id) ? 'bg-accent/50' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{u.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      {u.phoneNumber ?? '—'}
                      {u.telegramId ? ` · TG: ${u.telegramId}` : ''}
                    </div>
                  </div>
                  {selectedSet.has(u.id) ? (
                    <Badge variant="success">Tanlangan</Badge>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface SegmentFiltersProps {
  value: NonNullable<BroadcastTargeting['filter']>;
  onChange: (filter: NonNullable<BroadcastTargeting['filter']>) => void;
}

function SegmentFilters({
  value,
  onChange,
}: SegmentFiltersProps): React.ReactElement {
  function toggleLocale(locale: string): void {
    const current = value.locales ?? [];
    onChange({
      ...value,
      locales: current.includes(locale)
        ? current.filter((l) => l !== locale)
        : [...current, locale],
    });
  }

  function toggleSubscriptionStatus(status: SubscriptionStatus): void {
    const current = value.subscriptionStatuses ?? [];
    onChange({
      ...value,
      subscriptionStatuses: current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status],
    });
  }

  return (
    <div className="space-y-3 rounded-md border bg-muted/20 p-3">
      <div>
        <Label className="text-xs">Til</Label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {LOCALES.map((l) => {
            const selected = (value.locales ?? []).includes(l.value);
            return (
              <button
                key={l.value}
                type="button"
                onClick={() => toggleLocale(l.value)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border'
                }`}
              >
                {l.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="text-xs">Obuna holati</Label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {SUBSCRIPTION_STATUSES.map((s) => {
            const selected = (value.subscriptionStatuses ?? []).includes(
              s.value,
            );
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => toggleSubscriptionStatus(s.value)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Telegram bog&apos;langan</Label>
          <select
            value={
              value.hasTelegram === true
                ? 'yes'
                : value.hasTelegram === false
                  ? 'no'
                  : ''
            }
            onChange={(e) =>
              onChange({
                ...value,
                hasTelegram:
                  e.target.value === 'yes'
                    ? true
                    : e.target.value === 'no'
                      ? false
                      : undefined,
              })
            }
            className="mt-1 h-9 w-full rounded-md border border-input bg-card px-2 text-sm"
          >
            <option value="">Farqi yo&apos;q</option>
            <option value="yes">Ha</option>
            <option value="no">Yo&apos;q</option>
          </select>
        </div>
        <div>
          <Label className="text-xs">Tashkiloti bor</Label>
          <select
            value={
              value.hasOrganization === true
                ? 'yes'
                : value.hasOrganization === false
                  ? 'no'
                  : ''
            }
            onChange={(e) =>
              onChange({
                ...value,
                hasOrganization:
                  e.target.value === 'yes'
                    ? true
                    : e.target.value === 'no'
                      ? false
                      : undefined,
              })
            }
            className="mt-1 h-9 w-full rounded-md border border-input bg-card px-2 text-sm"
          >
            <option value="">Farqi yo&apos;q</option>
            <option value="yes">Ha</option>
            <option value="no">Yo&apos;q</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="from" className="text-xs">
            Ro&apos;yxatdan: dan
          </Label>
          <Input
            id="from"
            type="datetime-local"
            value={value.createdFrom?.slice(0, 16) ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                createdFrom: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined,
              })
            }
            className="mt-1 h-9"
          />
        </div>
        <div>
          <Label htmlFor="to" className="text-xs">
            gacha
          </Label>
          <Input
            id="to"
            type="datetime-local"
            value={value.createdTo?.slice(0, 16) ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                createdTo: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined,
              })
            }
            className="mt-1 h-9"
          />
        </div>
      </div>
    </div>
  );
}

