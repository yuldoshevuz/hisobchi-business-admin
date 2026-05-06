import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/api/errors';
import type { Plan, PlanPrice } from '../api/plans.api';
import {
  useCreatePlanPrice,
  useRemovePlanPrice,
  useUpdatePlanPrice,
} from '../hooks/use-plans';

interface PlanPricesProps {
  plan: Plan;
}

export function PlanPrices({ plan }: PlanPricesProps): React.ReactElement {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<PlanPrice | null>(null);
  const [deleting, setDeleting] = useState<PlanPrice | null>(null);
  const remove = useRemovePlanPrice();

  async function handleConfirmDelete(): Promise<void> {
    if (!deleting) return;
    try {
      await remove.mutateAsync({ planId: plan.id, priceId: deleting.id });
      toast.success("Narx o'chirildi");
      setDeleting(null);
    } catch (err) {
      toast.error("O'chirib bo'lmadi", getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Bir tarifga bir nechta muddat va narx qo&apos;shish mumkin (masalan,
          30 / 90 / 365 kunlik). Narxsiz tarif — bepul (default uchun mos).
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Narx qo&apos;shish
        </Button>
      </div>

      {plan.prices.length === 0 ? (
        <div className="rounded-md border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          Narxlar yo&apos;q — tarif foydalanuvchilarga bepul taqdim etiladi.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Muddat</th>
                <th className="px-3 py-2 font-medium">Narx</th>
                <th className="px-3 py-2 font-medium">Valyuta</th>
                <th className="px-3 py-2 font-medium">Holati</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {plan.prices.map((price) => (
                <tr key={price.id}>
                  <td className="px-3 py-2 font-medium">
                    {price.durationDays} kun
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {Number(price.price).toLocaleString('uz-UZ')}
                  </td>
                  <td className="px-3 py-2">{price.currency}</td>
                  <td className="px-3 py-2">
                    {price.isActive ? (
                      <Badge variant="success">Faol</Badge>
                    ) : (
                      <Badge variant="secondary">Faol emas</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(price)}
                        title="Tahrirlash"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleting(price)}
                        title="O'chirish"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreatePriceDialog
        planId={plan.id}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <EditPriceDialog
        planId={plan.id}
        price={editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />
      <DeletePriceDialog
        price={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={handleConfirmDelete}
        loading={remove.isPending}
      />
    </div>
  );
}

const priceSchema = z.object({
  durationDays: z.coerce.number().int().min(1).max(36500),
  price: z.coerce.number().min(0),
  currency: z.string().length(3).toUpperCase(),
  isActive: z.boolean(),
});
type PriceForm = z.infer<typeof priceSchema>;

function CreatePriceDialog({
  planId,
  open,
  onOpenChange,
}: {
  planId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): React.ReactElement {
  const create = useCreatePlanPrice();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<PriceForm>({
    resolver: zodResolver(priceSchema),
    defaultValues: {
      durationDays: 30,
      price: 0,
      currency: 'UZS',
      isActive: true,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await create.mutateAsync({ planId, body: values });
      toast.success("Narx qo'shildi");
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error("Saqlab bo'lmadi", getErrorMessage(err));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Narx qo&apos;shish</DialogTitle>
          <DialogDescription>
            Tarifning ma&apos;lum bir muddat uchun narxini belgilang.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="price-days">Muddat (kun)</Label>
            <Input
              id="price-days"
              type="number"
              min={1}
              {...register('durationDays')}
            />
            {errors.durationDays ? (
              <p className="text-xs text-destructive">
                {errors.durationDays.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="price-amount">Narx</Label>
            <Input
              id="price-amount"
              type="number"
              step="0.01"
              min={0}
              {...register('price')}
            />
            {errors.price ? (
              <p className="text-xs text-destructive">{errors.price.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="price-currency">Valyuta (3 harf)</Label>
            <Input
              id="price-currency"
              maxLength={3}
              {...register('currency')}
            />
            {errors.currency ? (
              <p className="text-xs text-destructive">
                {errors.currency.message}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
            <input
              id="price-active"
              type="checkbox"
              defaultChecked
              {...register('isActive')}
            />
            <Label htmlFor="price-active" className="cursor-pointer">
              Faol
            </Label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={!isValid || create.isPending}>
              {create.isPending ? <Spinner /> : null}
              Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditPriceDialog({
  planId,
  price,
  onOpenChange,
}: {
  planId: number;
  price: PlanPrice | null;
  onOpenChange: (open: boolean) => void;
}): React.ReactElement {
  const update = useUpdatePlanPrice();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<PriceForm>({
    resolver: zodResolver(priceSchema),
    defaultValues: {
      durationDays: 30,
      price: 0,
      currency: 'UZS',
      isActive: true,
    },
  });

  // Hydrate the form whenever the dialog opens for a different price row.
  useEffect(() => {
    if (price) {
      reset({
        durationDays: price.durationDays,
        price: Number(price.price),
        currency: price.currency,
        isActive: price.isActive,
      });
    }
  }, [price, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!price) return;
    try {
      await update.mutateAsync({
        planId,
        priceId: price.id,
        body: values,
      });
      toast.success('Narx yangilandi');
      onOpenChange(false);
    } catch (err) {
      toast.error("Saqlab bo'lmadi", getErrorMessage(err));
    }
  });

  return (
    <Dialog open={price !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Narxni tahrirlash</DialogTitle>
          <DialogDescription>
            Mavjud foydalanuvchilarning aktiv obunalariga ta&apos;sir qilmaydi
            — narx faqat keyingi tayinlovlarda qo&apos;llaniladi.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-price-days">Muddat (kun)</Label>
            <Input
              id="edit-price-days"
              type="number"
              min={1}
              {...register('durationDays')}
            />
            {errors.durationDays ? (
              <p className="text-xs text-destructive">
                {errors.durationDays.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-price-amount">Narx</Label>
            <Input
              id="edit-price-amount"
              type="number"
              step="0.01"
              min={0}
              {...register('price')}
            />
            {errors.price ? (
              <p className="text-xs text-destructive">{errors.price.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-price-currency">Valyuta (3 harf)</Label>
            <Input
              id="edit-price-currency"
              maxLength={3}
              {...register('currency')}
            />
            {errors.currency ? (
              <p className="text-xs text-destructive">
                {errors.currency.message}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
            <input
              id="edit-price-active"
              type="checkbox"
              {...register('isActive')}
            />
            <Label htmlFor="edit-price-active" className="cursor-pointer">
              Faol
            </Label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={!isValid || update.isPending}>
              {update.isPending ? <Spinner /> : null}
              Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeletePriceDialog({
  price,
  onOpenChange,
  onConfirm,
  loading,
}: {
  price: PlanPrice | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  loading: boolean;
}): React.ReactElement {
  return (
    <Dialog open={price !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Narxni o&apos;chirish</DialogTitle>
          <DialogDescription>
            {price
              ? `${price.durationDays} kun · ${Number(price.price).toLocaleString(
                  'uz-UZ',
                )} ${price.currency} narx variantini o'chirmoqchimisiz?`
              : ''}
            <br />
            Aktiv obunalarga ta&apos;sir qilmaydi — ular o&apos;z muddatigacha
            ishlab turaveradi.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button
            variant="destructive"
            onClick={() => void onConfirm()}
            disabled={loading}
          >
            {loading ? <Spinner /> : null}
            O&apos;chirish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
