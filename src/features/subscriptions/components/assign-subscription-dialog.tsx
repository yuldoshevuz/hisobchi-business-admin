import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/api/errors';
import { usePlans } from '@/features/plans/hooks/use-plans';
import { useAssignSubscription } from '../hooks/use-subscriptions';

interface AssignSubscriptionDialogProps {
  /** User who will own the subscription (org's createdBy). */
  userId: number;
  /** Display label for the target — typically the org owner's name. */
  userLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NO_PRICE_VALUE = 'NO_PRICE';

export function AssignSubscriptionDialog({
  userId,
  userLabel,
  open,
  onOpenChange,
}: AssignSubscriptionDialogProps): React.ReactElement {
  const plans = usePlans();
  const assign = useAssignSubscription();

  const activePlans = useMemo(
    () => (plans.data ?? []).filter((p) => p.isActive),
    [plans.data],
  );

  const [planId, setPlanId] = useState<number | null>(null);
  const [priceSelection, setPriceSelection] = useState<string>(NO_PRICE_VALUE);

  // Default the plan picker to the configured default plan, if any.
  useEffect(() => {
    if (planId !== null) return;
    const def = activePlans.find((p) => p.isDefault);
    if (def) {
      setPlanId(def.id);
    } else if (activePlans.length > 0) {
      setPlanId(activePlans[0].id);
    }
  }, [activePlans, planId]);

  // Reset price selection whenever the plan changes.
  useEffect(() => {
    setPriceSelection(NO_PRICE_VALUE);
  }, [planId]);

  const selectedPlan = activePlans.find((p) => p.id === planId) ?? null;
  const availablePrices = selectedPlan?.prices.filter((p) => p.isActive) ?? [];

  async function handleAssign(): Promise<void> {
    if (planId === null) return;
    const planPriceId =
      priceSelection === NO_PRICE_VALUE ? undefined : Number(priceSelection);
    try {
      await assign.mutateAsync({ userId, planId, planPriceId });
      toast.success('Obuna tayinlandi');
      onOpenChange(false);
    } catch (err) {
      toast.error("Tayinlab bo'lmadi", getErrorMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Obuna tayinlash</DialogTitle>
          <DialogDescription>
            <strong>{userLabel}</strong> uchun obunani belgilang. Narx
            tanlanmasa — tarif bepul/default sifatida tayinlanadi (cheksiz
            muddat). Eski aktiv obuna avtomatik bekor qilinadi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="assign-plan">Tarif</Label>
            <select
              id="assign-plan"
              value={planId ?? ''}
              onChange={(e) => setPlanId(Number(e.target.value))}
              disabled={plans.isPending}
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              {plans.isPending ? (
                <option value="">Yuklanmoqda...</option>
              ) : activePlans.length === 0 ? (
                <option value="">Faol tarif yo&apos;q</option>
              ) : (
                activePlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.isDefault ? ' (default)' : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assign-price">Narx (muddat)</Label>
            <select
              id="assign-price"
              value={priceSelection}
              onChange={(e) => setPriceSelection(e.target.value)}
              disabled={planId === null}
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value={NO_PRICE_VALUE}>
                Bepul / cheksiz muddat (default obuna)
              </option>
              {availablePrices.map((price) => (
                <option key={price.id} value={String(price.id)}>
                  {price.durationDays} kun —{' '}
                  {Number(price.price).toLocaleString('uz-UZ')} {price.currency}
                </option>
              ))}
            </select>
            {availablePrices.length === 0 && planId !== null ? (
              <p className="text-xs text-muted-foreground">
                Bu tarifda faol narx yo&apos;q — obuna bepul (cheksiz)
                tayinlanadi.
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button
            onClick={handleAssign}
            disabled={planId === null || assign.isPending}
          >
            {assign.isPending ? <Spinner /> : null}
            Tayinlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
