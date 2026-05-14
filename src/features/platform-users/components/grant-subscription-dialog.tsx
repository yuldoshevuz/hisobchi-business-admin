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
import { useGrantSubscription } from '../hooks/use-platform-users';

interface GrantSubscriptionDialogProps {
  userId: number;
  userLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NO_PRICE_VALUE = 'NO_PRICE';

export function GrantSubscriptionDialog({
  userId,
  userLabel,
  open,
  onOpenChange,
}: GrantSubscriptionDialogProps): React.ReactElement {
  const plans = usePlans();
  const grant = useGrantSubscription();

  const activePlans = useMemo(
    () => (plans.data ?? []).filter((p) => p.isActive),
    [plans.data],
  );

  const [planId, setPlanId] = useState<number | null>(null);
  const [priceSelection, setPriceSelection] = useState<string>(NO_PRICE_VALUE);

  useEffect(() => {
    if (!open) return;
    if (planId !== null) return;
    const def = activePlans.find((p) => p.isDefault);
    if (def) {
      setPlanId(def.id);
    } else if (activePlans.length > 0) {
      setPlanId(activePlans[0].id);
    }
  }, [activePlans, planId, open]);

  useEffect(() => {
    setPriceSelection(NO_PRICE_VALUE);
  }, [planId]);

  const selectedPlan = activePlans.find((p) => p.id === planId) ?? null;
  const availablePrices = selectedPlan?.prices.filter((p) => p.isActive) ?? [];

  async function handleGrant(): Promise<void> {
    if (planId === null) return;
    const planPriceId =
      priceSelection === NO_PRICE_VALUE ? undefined : Number(priceSelection);
    try {
      await grant.mutateAsync({
        userId,
        body: { planId, planPriceId },
      });
      toast.success('Obuna berildi');
      onOpenChange(false);
    } catch (err) {
      toast.error("Obuna berib bo'lmadi", getErrorMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Obuna berish</DialogTitle>
          <DialogDescription>
            <strong>{userLabel}</strong> uchun yangi obunani belgilang. Narx
            tanlanmasa — bepul/default sifatida tayinlanadi (cheksiz muddat).
            Foydalanuvchining eski aktiv obunasi avtomatik bekor qilinadi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="grant-plan">Tarif</Label>
            <select
              id="grant-plan"
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
            <Label htmlFor="grant-price">Narx (muddat)</Label>
            <select
              id="grant-price"
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
                beriladi.
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button
            onClick={handleGrant}
            disabled={planId === null || grant.isPending}
          >
            {grant.isPending ? <Spinner /> : null}
            Berish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
