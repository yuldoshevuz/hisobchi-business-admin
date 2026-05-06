import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
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
import {
  CATEGORY_TYPES,
  type CategoryType,
  type SystemCategory,
} from '../api/system-categories.api';
import {
  useCreateSystemCategory,
  useSystemCategories,
} from '../hooks/use-system-categories';

const TYPE_LABEL: Record<CategoryType, string> = {
  income: 'Daromad',
  expense: 'Xarajat',
  product: 'Mahsulot',
};

const TYPE_VARIANT: Record<
  CategoryType,
  'default' | 'secondary' | 'success' | 'warning' | 'outline'
> = {
  income: 'success',
  expense: 'warning',
  product: 'secondary',
};

export function SystemCategoriesListPage(): React.ReactElement {
  const navigate = useNavigate();
  const list = useSystemCategories();
  const [typeFilter, setTypeFilter] = useState<CategoryType | ''>('');
  const [showInactive, setShowInactive] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const data = useMemo(() => {
    let rows = list.data ?? [];
    if (typeFilter) rows = rows.filter((r) => r.type === typeFilter);
    if (!showInactive) rows = rows.filter((r) => r.isActive);
    return rows.slice().sort((a, b) => a.displayOrder - b.displayOrder);
  }, [list.data, typeFilter, showInactive]);

  const columns = useMemo<ColumnDef<SystemCategory, unknown>[]>(
    () => [
      {
        accessorKey: 'displayOrder',
        header: 'Tartib',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.displayOrder}
          </span>
        ),
      },
      {
        accessorKey: 'code',
        header: 'Kod',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.icon || row.original.color ? (
              <span
                className="inline-block h-4 w-4 rounded-full border"
                style={{
                  backgroundColor: row.original.color ?? 'transparent',
                }}
                title={row.original.icon ?? ''}
              />
            ) : null}
            <span className="font-mono text-xs">{row.original.code}</span>
          </div>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Nomi',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.locale}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Turi',
        cell: ({ row }) => (
          <Badge variant={TYPE_VARIANT[row.original.type]}>
            {TYPE_LABEL[row.original.type]}
          </Badge>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Holat',
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge variant="outline">Faol</Badge>
          ) : (
            <Badge variant="secondary">Nofaol</Badge>
          ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tizim kategoriyalari</h1>
          <p className="text-sm text-muted-foreground">
            Global katalog. Tashkilot foydalanganda lazy ko‘chirib olinadi.
          </p>
        </div>
        <RoleGate roles={['superadmin']}>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Yangi
          </Button>
        </RoleGate>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as CategoryType | '')}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">Barcha turlar</option>
          {CATEGORY_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="h-4 w-4"
          />
          Nofaollarni ko‘rsatish
        </label>
      </div>

      <DataTable
        data={data}
        columns={columns}
        isLoading={list.isPending}
        emptyMessage={
          list.isError
            ? getErrorMessage(list.error)
            : "Tizim kategoriyalari yo'q"
        }
        onRowClick={(c) => navigate(`/system-categories/${c.id}`)}
      />

      <CreateSystemCategoryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => navigate(`/system-categories/${id}`)}
      />
    </div>
  );
}

const createSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_]+$/, 'Faqat A-Z, 0-9, _'),
  type: z.enum(['income', 'expense', 'product']),
  icon: z.string().max(50).optional(),
  color: z
    .string()
    .regex(/^#?[0-9A-Fa-f]{6}$/, "Hex format: #FFAA88")
    .optional()
    .or(z.literal('')),
  displayOrder: z.coerce.number().int().min(0),
  isActive: z.boolean().default(true),
});
type CreateForm = z.infer<typeof createSchema>;

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: number) => void;
}

function CreateSystemCategoryDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateDialogProps): React.ReactElement {
  const create = useCreateSystemCategory();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      code: '',
      type: 'expense',
      icon: '',
      color: '',
      displayOrder: 100,
      isActive: true,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await create.mutateAsync({
        code: values.code,
        type: values.type,
        displayOrder: values.displayOrder,
        isActive: values.isActive,
        ...(values.icon ? { icon: values.icon } : {}),
        ...(values.color
          ? { color: values.color.startsWith('#') ? values.color : `#${values.color}` }
          : {}),
      });
      toast.success('Tizim kategoriyasi yaratildi');
      reset();
      onOpenChange(false);
      onCreated(created.id);
    } catch (err) {
      toast.error('Yaratib bo‘lmadi', getErrorMessage(err));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yangi tizim kategoriyasi</DialogTitle>
          <DialogDescription>
            Yaratgandan so&apos;ng tarjimalarni alohida ekrandan kiritasiz.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="sc-code">Kod (SCREAMING_SNAKE_CASE)</Label>
            <Input
              id="sc-code"
              placeholder="OFFICE_SUPPLIES"
              {...register('code')}
            />
            {errors.code ? (
              <p className="text-xs text-destructive">{errors.code.message}</p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sc-type">Turi</Label>
              <select
                id="sc-type"
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                {...register('type')}
              >
                {CATEGORY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sc-order">Tartib</Label>
              <Input
                id="sc-order"
                type="number"
                min={0}
                {...register('displayOrder')}
              />
              {errors.displayOrder ? (
                <p className="text-xs text-destructive">
                  {errors.displayOrder.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sc-icon">Ikonka (ixtiyoriy)</Label>
              <Input
                id="sc-icon"
                placeholder="shopping_cart"
                {...register('icon')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sc-color">Rang (#FFAA88)</Label>
              <Input id="sc-color" placeholder="#FF8800" {...register('color')} />
              {errors.color ? (
                <p className="text-xs text-destructive">{errors.color.message}</p>
              ) : null}
            </div>
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
