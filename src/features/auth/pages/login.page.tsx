import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/api/errors';
import { useAuthStore } from '@/stores/auth.store';
import { useLogin } from '../hooks/use-login';

const schema = z.object({
  phoneNumber: z
    .string()
    .min(9, 'Telefon raqami juda qisqa')
    .max(20, "Telefon raqami juda uzun"),
  password: z.string().min(8, 'Parol kamida 8 ta belgi'),
});
type FormValues = z.infer<typeof schema>;

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const login = useLogin();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { phoneNumber: '', password: '' },
  });

  if (accessToken) {
    return <Navigate to="/dashboard" replace />;
  }

  const fromPath = (location.state as LocationState | null)?.from?.pathname;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await login.mutateAsync(values);
      toast.success('Xush kelibsiz');
      navigate(fromPath ?? '/dashboard', { replace: true });
    } catch (err) {
      toast.error('Kirish muvaffaqiyatsiz', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Hisobchi Admin</CardTitle>
          <CardDescription>Platforma operatorlari uchun kirish</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber">Telefon raqami</Label>
              <Input
                id="phoneNumber"
                type="tel"
                inputMode="tel"
                autoComplete="username"
                placeholder="+998901234567"
                aria-invalid={Boolean(errors.phoneNumber)}
                {...register('phoneNumber')}
              />
              {errors.phoneNumber ? (
                <p className="text-xs text-destructive">
                  {errors.phoneNumber.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Parol</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
              />
              {errors.password ? (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!isValid || submitting}
            >
              {submitting ? <Spinner /> : null}
              Kirish
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
