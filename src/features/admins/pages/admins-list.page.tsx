import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { formatDate } from '@/lib/date/format-date';
import { getErrorMessage } from '@/lib/api/errors';
import { RoleGate } from '@/lib/role/require-role';
import { useAuthStore, type AdminRole } from '@/stores/auth.store';
import {
  useAdminsList,
  useCreateAdmin,
  useDeleteAdmin,
  useResetAdminPassword,
  useUpdateAdminRole,
} from '../hooks/use-admins';
import type { PlatformAdmin } from '../api/admins.api';

const ROLE_LABEL: Record<AdminRole, string> = {
  superadmin: 'Superadmin',
  support: 'Support',
  billing: 'Billing',
};

const ROLE_VARIANT: Record<
  AdminRole,
  'default' | 'secondary' | 'success' | 'warning' | 'outline'
> = {
  superadmin: 'default',
  support: 'secondary',
  billing: 'warning',
};

export function AdminsListPage(): React.ReactElement {
  const list = useAdminsList();
  const currentAdmin = useAuthStore((s) => s.admin);

  const [createOpen, setCreateOpen] = useState(false);
  const [roleEdit, setRoleEdit] = useState<PlatformAdmin | null>(null);
  const [resetting, setResetting] = useState<PlatformAdmin | null>(null);
  const [deleting, setDeleting] = useState<PlatformAdmin | null>(null);

  const columns = useMemo<ColumnDef<PlatformAdmin, unknown>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Ism',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.fullName}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.phoneNumber ?? '—'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Rol',
        cell: ({ row }) => (
          <Badge variant={ROLE_VARIANT[row.original.role]}>
            {ROLE_LABEL[row.original.role]}
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Yaratilgan',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const admin = row.original;
          const isSelf = currentAdmin?.id === admin.userId;
          return (
            <RoleGate roles={['superadmin']}>
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRoleEdit(admin);
                  }}
                  title="Rolini o'zgartirish"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setResetting(admin);
                  }}
                  title="Parolni reset"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={isSelf}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleting(admin);
                  }}
                  title={isSelf ? "O'zingizni o'chira olmaysiz" : "O'chirish"}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </RoleGate>
          );
        },
      },
    ],
    [currentAdmin],
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Platforma adminlari</h1>
          <p className="text-sm text-muted-foreground">
            Rollar: superadmin / support / billing
          </p>
        </div>
        <RoleGate roles={['superadmin']}>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Yangi admin
          </Button>
        </RoleGate>
      </header>

      <DataTable
        data={list.data ?? []}
        columns={columns}
        isLoading={list.isPending}
        emptyMessage={
          list.isError ? getErrorMessage(list.error) : 'Adminlar yo‘q'
        }
      />

      <CreateAdminDialog open={createOpen} onOpenChange={setCreateOpen} />
      <RoleEditDialog
        admin={roleEdit}
        onOpenChange={(open) => !open && setRoleEdit(null)}
      />
      <ResetPasswordDialog
        admin={resetting}
        onOpenChange={(open) => !open && setResetting(null)}
      />
      <DeleteAdminDialog
        admin={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </div>
  );
}

// ─── Dialogs ─────────────────────────────────────────────────────────────

const E164 = /^\+?[1-9]\d{6,14}$/;

const createSchema = z.object({
  phoneNumber: z.string().regex(E164, "Telefon E.164 formatida (+998...)"),
  fullName: z.string().min(2).max(100),
  role: z.enum(['superadmin', 'support', 'billing']),
  temporaryPassword: z.string().min(8, 'Kamida 8 ta belgi').max(100),
});
type CreateForm = z.infer<typeof createSchema>;

function CreateAdminDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): React.ReactElement {
  const create = useCreateAdmin();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      phoneNumber: '',
      fullName: '',
      role: 'support',
      temporaryPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await create.mutateAsync(values);
      toast.success('Admin yaratildi');
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error('Yaratib bo‘lmadi', getErrorMessage(err));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yangi platforma admini</DialogTitle>
          <DialogDescription>
            Yangi admin uchun vaqtincha parol o&apos;rnating — admin birinchi kirgandan keyin uni almashtirishi tavsiya etiladi.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="adm-phone">Telefon</Label>
            <Input
              id="adm-phone"
              placeholder="+998901234567"
              {...register('phoneNumber')}
            />
            {errors.phoneNumber ? (
              <p className="text-xs text-destructive">
                {errors.phoneNumber.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adm-name">To‘liq ism</Label>
            <Input id="adm-name" {...register('fullName')} />
            {errors.fullName ? (
              <p className="text-xs text-destructive">
                {errors.fullName.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adm-role">Rol</Label>
            <select
              id="adm-role"
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              {...register('role')}
            >
              <option value="superadmin">Superadmin</option>
              <option value="support">Support</option>
              <option value="billing">Billing</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adm-pass">Vaqtinchalik parol</Label>
            <Input
              id="adm-pass"
              type="text"
              autoComplete="off"
              placeholder="Kamida 8 ta belgi"
              {...register('temporaryPassword')}
            />
            {errors.temporaryPassword ? (
              <p className="text-xs text-destructive">
                {errors.temporaryPassword.message}
              </p>
            ) : null}
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

function RoleEditDialog({
  admin,
  onOpenChange,
}: {
  admin: PlatformAdmin | null;
  onOpenChange: (open: boolean) => void;
}): React.ReactElement {
  const update = useUpdateAdminRole();
  const [role, setRole] = useState<AdminRole>(admin?.role ?? 'support');

  // Reset local state when target changes
  useEffect(() => {
    if (admin) setRole(admin.role);
  }, [admin]);

  const handleSave = async (): Promise<void> => {
    if (!admin) return;
    try {
      await update.mutateAsync({ id: admin.id, body: { role } });
      toast.success('Rol yangilandi');
      onOpenChange(false);
    } catch (err) {
      toast.error('Saqlab bo‘lmadi', getErrorMessage(err));
    }
  };

  return (
    <Dialog open={admin !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rolini o&apos;zgartirish</DialogTitle>
          <DialogDescription>
            {admin?.fullName} uchun yangi rolni tanlang.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Label htmlFor="role-select">Yangi rol</Label>
          <select
            id="role-select"
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
          >
            <option value="superadmin">Superadmin</option>
            <option value="support">Support</option>
            <option value="billing">Billing</option>
          </select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button
            onClick={handleSave}
            disabled={update.isPending || role === admin?.role}
          >
            {update.isPending ? <Spinner /> : null}
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  admin,
  onOpenChange,
}: {
  admin: PlatformAdmin | null;
  onOpenChange: (open: boolean) => void;
}): React.ReactElement {
  const reset = useResetAdminPassword();
  const [password, setPassword] = useState('');

  // Clear the field when target changes
  useEffect(() => {
    setPassword('');
  }, [admin]);

  const handleSubmit = async (): Promise<void> => {
    if (!admin) return;
    if (password.length < 8) {
      toast.error('Parol kamida 8 ta belgi');
      return;
    }
    try {
      await reset.mutateAsync({
        id: admin.id,
        body: { newTemporaryPassword: password },
      });
      toast.success(
        `${admin.fullName}: parol almashtirildi`,
        'Yangi parolni admin bilan xavfsiz kanalda ulashishingiz kerak.',
      );
      onOpenChange(false);
    } catch (err) {
      toast.error('Saqlab bo‘lmadi', getErrorMessage(err));
    }
  };

  return (
    <Dialog open={admin !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Parolni reset qilish</DialogTitle>
          <DialogDescription>
            {admin?.fullName} uchun yangi vaqtincha parol o&apos;rnating. Joriy
            sessiyalar avtomatik bekor qilinmaydi — parolni xavfsiz uzatishni
            ta&apos;minlang.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Label htmlFor="reset-pass">Yangi parol (kamida 8)</Label>
          <Input
            id="reset-pass"
            type="text"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={reset.isPending || password.length < 8}
          >
            {reset.isPending ? <Spinner /> : null}
            Tasdiqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAdminDialog({
  admin,
  onOpenChange,
}: {
  admin: PlatformAdmin | null;
  onOpenChange: (open: boolean) => void;
}): React.ReactElement {
  const remove = useDeleteAdmin();
  const handleConfirm = async (): Promise<void> => {
    if (!admin) return;
    try {
      await remove.mutateAsync(admin.id);
      toast.success("Admin o'chirildi");
      onOpenChange(false);
    } catch (err) {
      toast.error("O'chirib bo'lmadi", getErrorMessage(err));
    }
  };

  return (
    <Dialog open={admin !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>O&apos;chirishni tasdiqlang</DialogTitle>
          <DialogDescription>
            <strong>{admin?.fullName}</strong> ni platforma adminlari
            ro&apos;yxatidan o&apos;chirmoqchimisiz? Bu amal soft-delete: tarix
            saqlanadi, lekin foydalanuvchi endi admin huquqlariga ega bo&apos;lmaydi.
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
