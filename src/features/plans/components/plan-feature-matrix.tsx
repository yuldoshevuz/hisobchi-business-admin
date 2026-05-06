import { useMemo, useState } from 'react';
import { Check, Infinity as InfinityIcon, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/api/errors';
import { useFeatures } from '@/features/features/hooks/use-features';
import type { Feature } from '@/features/features/api/features.api';
import {
  FEATURE_TYPE_LABEL,
  getFeatureLabel,
} from '@/features/features/feature-i18n';
import type { Plan, PlanFeatureRow } from '../api/plans.api';
import {
  useRemovePlanFeature,
  useUpsertPlanFeature,
} from '../hooks/use-plans';

interface PlanFeatureMatrixProps {
  plan: Plan;
}

/**
 * Editable plan ↔ feature matrix.
 *
 * Lists every catalog feature; for each, shows:
 *   - BOOLEAN → enable/disable toggle
 *   - LIMIT   → numeric input + save button
 *
 * Plan rows missing from the catalog (legacy) are surfaced as a separate
 * section with a remove button so admins can clean them up.
 */
export function PlanFeatureMatrix({
  plan,
}: PlanFeatureMatrixProps): React.ReactElement {
  const features = useFeatures();

  const planByCode = useMemo(
    () => new Map(plan.features.map((f) => [f.featureCode, f] as const)),
    [plan.features],
  );

  const catalogCodes = new Set((features.data ?? []).map((f) => f.code));
  const orphanedRows = plan.features.filter(
    (f) => !catalogCodes.has(f.featureCode),
  );

  if (features.isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }
  if (features.isError) {
    return (
      <p className="text-sm text-destructive">
        {getErrorMessage(features.error)}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Funksiya</th>
              <th className="px-3 py-2 font-medium">Turi</th>
              <th className="px-3 py-2 font-medium">Holati / Limit</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {(features.data ?? []).map((feature) => (
              <FeatureRow
                key={feature.id}
                planId={plan.id}
                feature={feature}
                row={planByCode.get(feature.code) ?? null}
              />
            ))}
          </tbody>
        </table>
      </div>

      {orphanedRows.length > 0 ? (
        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
            Katalogdan o&apos;chirilgan funksiyalar
          </h4>
          <div className="space-y-2">
            {orphanedRows.map((row) => (
              <OrphanRow key={row.featureCode} planId={plan.id} row={row} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface FeatureRowProps {
  planId: number;
  feature: Feature;
  row: PlanFeatureRow | null;
}

function FeatureRow({ planId, feature, row }: FeatureRowProps): React.ReactElement {
  const upsert = useUpsertPlanFeature();
  const remove = useRemovePlanFeature();
  const i18n = getFeatureLabel(feature.code);
  const isUnlimited = row !== null && row.limit === null;
  const [limitDraft, setLimitDraft] = useState<string>(
    row?.limit !== null && row?.limit !== undefined ? String(row.limit) : '',
  );

  async function setBoolean(enabled: boolean): Promise<void> {
    try {
      await upsert.mutateAsync({
        planId,
        body: { featureCode: feature.code, isEnabled: enabled },
      });
      toast.success(enabled ? 'Yoqildi' : "O'chirildi");
    } catch (err) {
      toast.error('Saqlab bo‘lmadi', getErrorMessage(err));
    }
  }

  async function saveLimit(): Promise<void> {
    const trimmed = limitDraft.trim();
    if (trimmed === '') {
      toast.error('Chegara qiymati kerak yoki "Cheksiz"ni tanlang');
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < 0) {
      toast.error('Chegara musbat butun son bo‘lishi kerak');
      return;
    }
    try {
      await upsert.mutateAsync({
        planId,
        body: { featureCode: feature.code, limit: parsed },
      });
      toast.success('Chegara saqlandi');
    } catch (err) {
      toast.error('Saqlab bo‘lmadi', getErrorMessage(err));
    }
  }

  async function setUnlimited(): Promise<void> {
    try {
      await upsert.mutateAsync({
        planId,
        body: { featureCode: feature.code, limit: null },
      });
      setLimitDraft('');
      toast.success("Cheksiz qilib belgilandi");
    } catch (err) {
      toast.error('Saqlab bo‘lmadi', getErrorMessage(err));
    }
  }

  async function clearRow(): Promise<void> {
    try {
      await remove.mutateAsync({ planId, featureCode: feature.code });
      setLimitDraft('');
      toast.success('Funksiya tarifdan olib tashlandi');
    } catch (err) {
      toast.error("O'chirib bo'lmadi", getErrorMessage(err));
    }
  }

  const pending = upsert.isPending || remove.isPending;

  return (
    <tr>
      <td className="px-3 py-2">
        <div className="font-medium">{i18n.name}</div>
        <div className="text-xs text-muted-foreground">
          {i18n.description ? (
            <>
              {i18n.description}
              <span className="ml-1 font-mono text-[10px] opacity-60">
                ({feature.code})
              </span>
            </>
          ) : (
            <span className="font-mono text-[10px]">{feature.code}</span>
          )}
        </div>
      </td>
      <td className="px-3 py-2">
        <Badge variant={feature.type === 'BOOLEAN' ? 'secondary' : 'outline'}>
          {FEATURE_TYPE_LABEL[feature.type]}
        </Badge>
      </td>
      <td className="px-3 py-2">
        {feature.type === 'BOOLEAN' ? (
          <BooleanCell
            isEnabled={row ? row.isEnabled : false}
            onToggle={setBoolean}
            disabled={pending}
          />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              min={0}
              value={limitDraft}
              onChange={(e) => setLimitDraft(e.target.value)}
              placeholder={isUnlimited ? 'cheksiz' : 'masalan 5'}
              className="h-8 w-24"
              disabled={pending}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={saveLimit}
              disabled={pending || limitDraft.trim() === ''}
            >
              {upsert.isPending ? <Spinner className="h-3 w-3" /> : 'Saqlash'}
            </Button>
            <Button
              size="sm"
              variant={isUnlimited ? 'default' : 'outline'}
              onClick={setUnlimited}
              disabled={pending}
              title="Bu funksiya bo'yicha hech qanday cheklov bo'lmasin"
            >
              <InfinityIcon className="h-3.5 w-3.5" />
              Cheksiz
            </Button>
            {isUnlimited ? (
              <Badge variant="success" className="text-[10px]">
                Hozir cheksiz
              </Badge>
            ) : null}
          </div>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        {row ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearRow}
            disabled={pending}
            title="Bu funksiyani tarifdan olib tashlash"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
}

function BooleanCell({
  isEnabled,
  onToggle,
  disabled,
}: {
  isEnabled: boolean;
  onToggle: (next: boolean) => void;
  disabled: boolean;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={isEnabled ? 'default' : 'outline'}
        disabled={disabled}
        onClick={() => onToggle(true)}
      >
        <Check className="h-3.5 w-3.5" />
        Yoqilgan
      </Button>
      <Button
        size="sm"
        variant={!isEnabled ? 'default' : 'outline'}
        disabled={disabled}
        onClick={() => onToggle(false)}
      >
        <X className="h-3.5 w-3.5" />
        O&apos;chirilgan
      </Button>
    </div>
  );
}

function OrphanRow({
  planId,
  row,
}: {
  planId: number;
  row: PlanFeatureRow;
}): React.ReactElement {
  const remove = useRemovePlanFeature();
  async function handleRemove(): Promise<void> {
    try {
      await remove.mutateAsync({ planId, featureCode: row.featureCode });
      toast.success("O'chirildi");
    } catch (err) {
      toast.error("O'chirib bo'lmadi", getErrorMessage(err));
    }
  }
  return (
    <div className="flex items-center justify-between rounded-md border bg-amber-50 px-3 py-2 text-sm">
      <div>
        <div className="font-medium">{row.featureCode}</div>
        <div className="text-xs text-muted-foreground">
          Katalogda yo&apos;q — eski yozuv
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleRemove}
        disabled={remove.isPending}
      >
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  );
}
