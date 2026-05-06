import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Star } from 'lucide-react';
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
import {
  DataTable,
  type ColumnDef,
} from '@/components/data-table/data-table';
import { getErrorMessage } from '@/lib/api/errors';
import { RoleGate } from '@/lib/role/require-role';
import type { Plan } from '../api/plans.api';
import { useCreatePlan, usePlans } from '../hooks/use-plans';

export function PlansListPage(): React.ReactElement {
  const navigate = useNavigate();
  const list = usePlans();
  const [createOpen, setCreateOpen] = useState(false);

  const columns = useMemo<ColumnDef<Plan, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Tarif',
        cell: ({ row }) => (
          <div>
            <div className="flex items-center gap-2 font-medium">
              {row.original.name}
              {row.original.isDefault ? (
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
              ) : null}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.original.code}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Holati',
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge variant="success">Faol</Badge>
          ) : (
            <Badge variant="secondary">Faol emas</Badge>
          ),
      },
      {
        id: 'features',
        header: 'Funksiyalar',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.features.length} ta
          </span>
        ),
      },
      {
        id: 'prices',
        header: 'Narxlar',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.prices.length > 0
              ? `${row.original.prices.length} ta tarif`
              : 'Bepul'}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tariflar</h1>
          <p className="text-sm text-muted-foreground">
            Foydalanuvchi obunalari uchun tariflar va ularning imkoniyatlari
          </p>
        </div>
        <RoleGate roles={['superadmin']}>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Yangi tarif
          </Button>
        </RoleGate>
      </header>

      <DataTable
        data={list.data ?? []}
        columns={columns}
        isLoading={list.isPending}
        emptyMessage={
          list.isError
            ? getErrorMessage(list.error)
            : 'Tariflar topilmadi. Avval "Yangi tarif" tugmasi orqali tarif yarating.'
        }
        onRowClick={(p) => navigate(`/plans/${p.id}`)}
      />

      <CreatePlanDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

const createSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[A-Z0-9_]+$/, "Faqat katta lotin harflari, raqamlar va '_'"),
  name: z.string().min(1).max(255),
  isActive: z.boolean(),
  isDefault: z.boolean(),
});
type CreateForm = z.infer<typeof createSchema>;

function CreatePlanDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): React.ReactElement {
  const create = useCreatePlan();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      code: '',
      name: '',
      isActive: true,
      isDefault: false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await create.mutateAsync(values);
      toast.success('Tarif yaratildi');
      reset();
      onOpenChange(false);
      navigate(`/plans/${created.id}`);
    } catch (err) {
      toast.error('Yaratib bo‘lmadi', getErrorMessage(err));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yangi tarif</DialogTitle>
          <DialogDescription>
            Tarif kodi noyob bo&apos;lishi va kelgusida kod bo&apos;yicha
            qidiriladi. Yaratilgandan so&apos;ng funksiyalar va narx
            variantlarini qo&apos;shasiz.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="plan-code">Kod (SCREAMING_SNAKE_CASE)</Label>
            <Input
              id="plan-code"
              placeholder="BUSINESS"
              {...register('code')}
            />
            {errors.code ? (
              <p className="text-xs text-destructive">{errors.code.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-name">Nomi (foydalanuvchilarga)</Label>
            <Input
              id="plan-name"
              placeholder="Business"
              {...register('name')}
            />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
            <input
              id="plan-active"
              type="checkbox"
              defaultChecked
              {...register('isActive')}
            />
            <Label htmlFor="plan-active" className="cursor-pointer">
              Faol (foydalanuvchilarga ko&apos;rinadi)
            </Label>
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
            <input
              id="plan-default"
              type="checkbox"
              {...register('isDefault')}
            />
            <Label htmlFor="plan-default" className="cursor-pointer">
              Default tarif (yangi foydalanuvchilarga avtomatik tayinlanadi)
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
              Yaratish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
