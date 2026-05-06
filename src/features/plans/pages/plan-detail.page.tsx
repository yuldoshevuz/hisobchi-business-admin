import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Trash2 } from 'lucide-react';
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
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/api/errors';
import { RoleGate } from '@/lib/role/require-role';
import { PlanFeatureMatrix } from '../components/plan-feature-matrix';
import { PlanPrices } from '../components/plan-prices';
import { useDeletePlan, usePlan, useUpdatePlan } from '../hooks/use-plans';

export function PlanDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const planId = Number(id);
  const plan = usePlan(Number.isFinite(planId) ? planId : null);
  const update = useUpdatePlan();
  const remove = useDeletePlan();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (plan.isPending) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (plan.isError || !plan.data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-destructive">
          {getErrorMessage(plan.error) || 'Tarif topilmadi'}
        </CardContent>
      </Card>
    );
  }

  const data = plan.data;

  async function toggleActive(): Promise<void> {
    try {
      await update.mutateAsync({
        id: data.id,
        body: { isActive: !data.isActive },
      });
      toast.success(data.isActive ? 'Faol emas qilindi' : 'Faol qilindi');
    } catch (err) {
      toast.error("Saqlab bo'lmadi", getErrorMessage(err));
    }
  }

  async function makeDefault(): Promise<void> {
    try {
      await update.mutateAsync({
        id: data.id,
        body: { isDefault: true },
      });
      toast.success('Default sifatida belgilandi');
    } catch (err) {
      toast.error("Saqlab bo'lmadi", getErrorMessage(err));
    }
  }

  async function clearDefault(): Promise<void> {
    try {
      await update.mutateAsync({
        id: data.id,
        body: { isDefault: false },
      });
      toast.success('Default belgilanmagan');
    } catch (err) {
      toast.error("Saqlab bo'lmadi", getErrorMessage(err));
    }
  }

  async function handleDelete(): Promise<void> {
    try {
      await remove.mutateAsync(data.id);
      toast.success("Tarif o'chirildi");
      navigate('/plans');
    } catch (err) {
      toast.error("O'chirib bo'lmadi", getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/plans')}
        className="-ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Tariflar
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {data.name}
              {data.isDefault ? (
                <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
              ) : null}
              {data.isActive ? (
                <Badge variant="success">Faol</Badge>
              ) : (
                <Badge variant="secondary">Faol emas</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Kod: <code className="text-xs">{data.code}</code>
              {' · '}
              ID: {data.id}
            </CardDescription>
          </div>
          <RoleGate roles={['superadmin']}>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleActive}
                disabled={update.isPending}
              >
                {data.isActive ? 'Faol emas qilish' : 'Faol qilish'}
              </Button>
              {data.isDefault ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearDefault}
                  disabled={update.isPending}
                >
                  Default belgilash bekor
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={makeDefault}
                  disabled={update.isPending}
                >
                  <Star className="h-3.5 w-3.5" />
                  Default qilish
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </RoleGate>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funksiyalar matritsasi</CardTitle>
          <CardDescription>
            Har bir funksiya uchun tarifda yoqilgan/o&apos;chirilgan ekanini
            yoki LIMIT qiymatini belgilang. AI/Telegram bot xabar yuborish —
            cheksiz va barcha tariflarda mavjud (matrixda yo&apos;q).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlanFeatureMatrix plan={data} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Narxlar</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanPrices plan={data} />
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tarifni o&apos;chirish</DialogTitle>
            <DialogDescription>
              <strong>{data.name}</strong> tarifini o&apos;chirmoqchimisiz? Agar
              tarifda aktiv obunalar bo&apos;lsa, server o&apos;chirishni rad
              etadi.
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
              O&apos;chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
