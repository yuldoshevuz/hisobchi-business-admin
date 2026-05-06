import { useEffect, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/api/errors';
import { RoleGate } from '@/lib/role/require-role';
import {
  useDeleteTranslation,
  useTranslations,
  useUpsertTranslation,
} from '../hooks/use-system-categories';

const SUPPORTED_LOCALES = ['uz', 'ru', 'en'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const LOCALE_LABEL: Record<SupportedLocale, string> = {
  uz: "O'zbekcha",
  ru: 'Русский',
  en: 'English',
};

interface TranslationsEditorProps {
  systemCategoryId: number;
  /** Code shown as a fallback hint when a locale row is empty. */
  fallbackHintCode: string;
}

export function TranslationsEditor({
  systemCategoryId,
  fallbackHintCode,
}: TranslationsEditorProps): React.ReactElement {
  const translations = useTranslations(systemCategoryId);

  const byLocale = new Map(
    (translations.data ?? []).map((t) => [t.locale, t.name]),
  );

  if (translations.isPending) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }
  if (translations.isError) {
    return (
      <p className="px-2 py-4 text-sm text-destructive">
        {getErrorMessage(translations.error)}
      </p>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {SUPPORTED_LOCALES.map((locale) => (
        <TranslationCell
          key={locale}
          systemCategoryId={systemCategoryId}
          locale={locale}
          existingName={byLocale.get(locale) ?? null}
          fallbackHintCode={fallbackHintCode}
        />
      ))}
    </div>
  );
}

interface CellProps {
  systemCategoryId: number;
  locale: SupportedLocale;
  existingName: string | null;
  fallbackHintCode: string;
}

function TranslationCell({
  systemCategoryId,
  locale,
  existingName,
  fallbackHintCode,
}: CellProps): React.ReactElement {
  const [name, setName] = useState<string>(existingName ?? '');
  const upsert = useUpsertTranslation();
  const remove = useDeleteTranslation();

  useEffect(() => {
    setName(existingName ?? '');
  }, [existingName]);

  const dirty = name.trim() !== (existingName ?? '');

  const handleSave = async (): Promise<void> => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      toast.error('Bo‘sh nom saqlanmaydi');
      return;
    }
    try {
      await upsert.mutateAsync({
        id: systemCategoryId,
        locale,
        body: { name: trimmed },
      });
      toast.success(`${LOCALE_LABEL[locale]}: saqlandi`);
    } catch (err) {
      toast.error('Saqlab bo‘lmadi', getErrorMessage(err));
    }
  };

  const handleRemove = async (): Promise<void> => {
    if (!existingName) return;
    try {
      await remove.mutateAsync({ id: systemCategoryId, locale });
      toast.success(`${LOCALE_LABEL[locale]}: o‘chirildi`);
      setName('');
    } catch (err) {
      toast.error('O‘chirib bo‘lmadi', getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-2 rounded-md border bg-card p-3">
      <div className="flex items-center justify-between">
        <Label htmlFor={`tr-${locale}`} className="text-sm">
          {LOCALE_LABEL[locale]}
        </Label>
        <span className="font-mono text-[10px] text-muted-foreground">
          {locale}
        </span>
      </div>
      <Input
        id={`tr-${locale}`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={
          existingName ? '' : `Bo‘sh — ${fallbackHintCode} ko‘rinadi`
        }
      />
      <RoleGate roles={['superadmin']}>
        <div className="flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant={dirty ? 'default' : 'outline'}
            disabled={!dirty || upsert.isPending}
            onClick={handleSave}
          >
            {upsert.isPending && upsert.variables?.locale === locale ? (
              <Spinner className="h-3.5 w-3.5" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Saqlash
          </Button>
          {existingName ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={remove.isPending}
              onClick={handleRemove}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      </RoleGate>
    </div>
  );
}
