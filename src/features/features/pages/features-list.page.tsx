import { useEffect, useMemo, useState } from 'react';
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
import {
  DataTable,
  type ColumnDef,
} from '@/components/data-table/data-table';
import { getErrorMessage } from '@/lib/api/errors';
import { RoleGate } from '@/lib/role/require-role';
import type { Feature } from '../api/features.api';
import { FEATURE_TYPE_LABEL, getFeatureLabel } from '../feature-i18n';
import {
  useCreateFeature,
  useDeleteFeature,
  useFeatures,
  useUpdateFeature,
} from '../hooks/use-features';

export function FeaturesListPage(): React.ReactElement {
  const list = useFeatures();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Feature | null>(null);
  const [deleting, setDeleting] = useState<Feature | null>(null);

  const columns = useMemo<ColumnDef<Feature, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Funksiya',
        cell: ({ row }) => {
          const i18n = getFeatureLabel(row.original.code);
          return (
            <div>
              <div className="font-medium">{i18n.name}</div>
              <code className="text-[10px] text-muted-foreground">
                {row.original.code}
              </code>
            </div>
          );
        },
      },
      {
        accessorKey: 'type',
        header: 'Turi',
        cell: ({ row }) => (
          <Badge
            variant={row.original.type === 'BOOLEAN' ? 'secondary' : 'outline'}
          >
            {FEATURE_TYPE_LABEL[row.original.type]}
          </Badge>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Tavsif',
        cell: ({ row }) => {
          const i18n = getFeatureLabel(row.original.code);
          return (
            <span className="text-sm text-muted-foreground">
              {i18n.description || row.original.description || '—'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RoleGate roles={['superadmin']}>
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(row.original);
                }}
                title="Tahrirlash"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleting(row.original);
                }}
                title="O'chirish"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </RoleGate>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Funksiyalar</h1>
          <p className="text-sm text-muted-foreground">
            Tariflarga biriktiriladigan imkoniyatlar katalogi
          </p>
        </div>
        <RoleGate roles={['superadmin']}>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Yangi funksiya
          </Button>
        </RoleGate>
      </header>

      <div className="rounded-md border bg-amber-50 p-3 text-xs text-amber-900">
        <strong>Eslatma:</strong> Asosiy funksiyalar (ACCOUNT_LIMIT,
        EMPLOYEES_LIMIT, INVENTORY_MANAGEMENT va h.k.) tizim ishga tushganda
        avtomatik yaratiladi. Yangi funksiya qo&apos;shish faqat backend
        kodi bilan birga aniqlangan kodlar uchun ma&apos;noga ega.
      </div>

      <DataTable
        data={list.data ?? []}
        columns={columns}
        isLoading={list.isPending}
        emptyMessage={
          list.isError
            ? getErrorMessage(list.error)
            : 'Funksiyalar topilmadi.'
        }
      />

      <CreateFeatureDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditFeatureDialog
        feature={editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />
      <DeleteFeatureDialog
        feature={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </div>
  );
}

const createSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[A-Z0-9_]+$/, "Faqat katta lotin harflari, raqamlar va '_'"),
  type: z.enum(['BOOLEAN', 'LIMIT']),
  description: z.string().max(500).optional(),
});
type CreateForm = z.infer<typeof createSchema>;

function CreateFeatureDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): React.ReactElement {
  const create = useCreateFeature();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { code: '', type: 'BOOLEAN', description: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await create.mutateAsync(values);
      toast.success('Funksiya yaratildi');
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error("Yaratib bo'lmadi", getErrorMessage(err));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yangi funksiya</DialogTitle>
          <DialogDescription>
            Funksiyaning kodi va turini belgilang. Yaratgandan so&apos;ng kod va
            tur o&apos;zgarmaydi (faqat tavsif tahrirlanadi).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="feat-code">Kod (SCREAMING_SNAKE_CASE)</Label>
            <Input
              id="feat-code"
              placeholder="MY_FEATURE"
              {...register('code')}
            />
            {errors.code ? (
              <p className="text-xs text-destructive">{errors.code.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="feat-type">Turi</Label>
            <select
              id="feat-type"
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              {...register('type')}
            >
              <option value="BOOLEAN">BOOLEAN — yoqilgan/o&apos;chirilgan</option>
              <option value="LIMIT">LIMIT — sonli chegara</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="feat-desc">Tavsif (ixtiyoriy)</Label>
            <Input id="feat-desc" {...register('description')} />
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

function EditFeatureDialog({
  feature,
  onOpenChange,
}: {
  feature: Feature | null;
  onOpenChange: (open: boolean) => void;
}): React.ReactElement {
  const update = useUpdateFeature();
  const [description, setDescription] = useState('');

  useEffect(() => {
    setDescription(feature?.description ?? '');
  }, [feature]);

  async function handleSave(): Promise<void> {
    if (!feature) return;
    try {
      await update.mutateAsync({
        id: feature.id,
        body: { description: description.trim() || undefined },
      });
      toast.success('Saqlandi');
      onOpenChange(false);
    } catch (err) {
      toast.error("Saqlab bo'lmadi", getErrorMessage(err));
    }
  }

  return (
    <Dialog open={feature !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tavsifni tahrirlash</DialogTitle>
          <DialogDescription>
            <code>{feature?.code}</code> ({feature?.type})
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="edit-desc">Tavsif</Label>
          <Input
            id="edit-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? <Spinner /> : null}
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteFeatureDialog({
  feature,
  onOpenChange,
}: {
  feature: Feature | null;
  onOpenChange: (open: boolean) => void;
}): React.ReactElement {
  const remove = useDeleteFeature();
  async function handleConfirm(): Promise<void> {
    if (!feature) return;
    try {
      await remove.mutateAsync(feature.id);
      toast.success("Funksiya o'chirildi");
      onOpenChange(false);
    } catch (err) {
      toast.error("O'chirib bo'lmadi", getErrorMessage(err));
    }
  }
  return (
    <Dialog open={feature !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Funksiyani o&apos;chirish</DialogTitle>
          <DialogDescription>
            <code>{feature?.code}</code> funksiyasini o&apos;chirmoqchimisiz?
            Tariflardagi tegishli yozuvlar avtomatik tarzda yo&apos;qoladi.
            Tizimning asosiy funksiyalarini o&apos;chirmang — ular keyingi
            ishga tushishda qayta yaratilib qoladi.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={remove.isPending}
          >
            {remove.isPending ? <Spinner /> : null}
            O&apos;chirish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
