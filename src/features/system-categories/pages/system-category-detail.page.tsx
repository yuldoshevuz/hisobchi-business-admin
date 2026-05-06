import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/api/errors';
import { RoleGate } from '@/lib/role/require-role';
import {
  CATEGORY_TYPES,
  type CategoryType,
} from '../api/system-categories.api';
import { TranslationsEditor } from '../components/translations-editor';
import {
  useDeleteSystemCategory,
  useSystemCategory,
  useUpdateSystemCategory,
} from '../hooks/use-system-categories';

const TYPE_LABEL: Record<CategoryType, string> = {
  income: 'Daromad',
  expense: 'Xarajat',
  product: 'Mahsulot',
};

export function SystemCategoryDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const scId = Number(id);
  const sc = useSystemCategory(Number.isFinite(scId) ? scId : null);
  const update = useUpdateSystemCategory();
  const remove = useDeleteSystemCategory();
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Local form state for the inline editor
  const [type, setType] = useState<CategoryType>('expense');
  const [icon, setIcon] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [order, setOrder] = useState<string>('100');
  const [active, setActive] = useState<boolean>(true);

  useEffect(() => {
    if (!sc.data) return;
    setType(sc.data.type);
    setIcon(sc.data.icon ?? '');
    setColor(sc.data.color ?? '');
    setOrder(String(sc.data.displayOrder));
    setActive(sc.data.isActive);
  }, [sc.data]);

  if (sc.isPending) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (sc.isError || !sc.data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-destructive">
          {getErrorMessage(sc.error) || 'Tizim kategoriyasi topilmadi'}
        </CardContent>
      </Card>
    );
  }

  const handleSave = async (): Promise<void> => {
    try {
      const orderNum = Number(order);
      if (!Number.isFinite(orderNum) || orderNum < 0) {
        toast.error('Tartib noto‘g‘ri');
        return;
      }
      await update.mutateAsync({
        id: sc.data.id,
        body: {
          type,
          displayOrder: orderNum,
          isActive: active,
          icon: icon.trim() || null,
          color: color.trim() || null,
        },
      });
      toast.success('Saqlandi');
    } catch (err) {
      toast.error('Saqlab bo‘lmadi', getErrorMessage(err));
    }
  };

  const handleDelete = async (): Promise<void> => {
    try {
      await remove.mutateAsync(sc.data.id);
      toast.success('O‘chirildi');
      navigate('/system-categories', { replace: true });
    } catch (err) {
      toast.error('O‘chirib bo‘lmadi', getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/system-categories')}
        className="-ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Tizim kategoriyalari
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="font-mono text-xl">{sc.data.code}</CardTitle>
            <CardDescription>
              <Badge variant="outline">{TYPE_LABEL[sc.data.type]}</Badge>
              <span className="ml-2 text-xs">
                ID: {sc.data.id} · {sc.data.isActive ? 'Faol' : 'Nofaol'}
              </span>
            </CardDescription>
          </div>
          <RoleGate roles={['superadmin']}>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              O‘chirish
            </Button>
          </RoleGate>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sozlamalar</CardTitle>
          <CardDescription>
            Mavjud tashkilot kategoriyalari saqlangan nomini saqlab qoladi —
            faqat keyingi lazy ko&apos;chirishlar yangi qiymatlarni qabul qiladi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sc-type">Turi</Label>
              <select
                id="sc-type"
                value={type}
                onChange={(e) => setType(e.target.value as CategoryType)}
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                {CATEGORY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABEL[t]}
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
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sc-icon">Ikonka</Label>
              <Input
                id="sc-icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="shopping_cart"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sc-color">Rang (#FFAA88)</Label>
              <Input
                id="sc-color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#FF8800"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={active} onCheckedChange={setActive} />
            <Label>Faol</Label>
          </div>

          <RoleGate roles={['superadmin']}>
            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={update.isPending}>
                {update.isPending ? <Spinner /> : <Save className="h-4 w-4" />}
                Saqlash
              </Button>
            </div>
          </RoleGate>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tarjimalar</CardTitle>
          <CardDescription>
            uz / ru / en. Lokalizatsiya so&apos;ralganda tartib: so&apos;ralgan
            til → uz → kod.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TranslationsEditor
            systemCategoryId={sc.data.id}
            fallbackHintCode={sc.data.code}
          />
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>O‘chirishni tasdiqlang</DialogTitle>
            <DialogDescription>
              <strong>{sc.data.code}</strong> tizim kategoriyasini o‘chirish.
              Agar tashkilot kategoriyalari bu kodga bog‘langan bo‘lsa, server{' '}
              <code>SYSTEM_CATEGORY_IN_USE</code> bilan rad etadi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={remove.isPending}
            >
              {remove.isPending ? <Spinner /> : null}
              O‘chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
