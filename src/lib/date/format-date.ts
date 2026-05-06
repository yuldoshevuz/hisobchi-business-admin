import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';
import { uz, ru, enUS } from 'date-fns/locale';

const LOCALES = { uz, ru, en: enUS } as const;

function resolveLocale(locale = 'uz'): (typeof LOCALES)[keyof typeof LOCALES] {
  return (LOCALES[locale as keyof typeof LOCALES] ?? uz) as (typeof LOCALES)[keyof typeof LOCALES];
}

export function formatDate(input: string | Date | null, locale = 'uz'): string {
  if (!input) return '—';
  const date = typeof input === 'string' ? parseISO(input) : input;
  if (!isValid(date)) return '—';
  return format(date, 'dd MMM yyyy', { locale: resolveLocale(locale) });
}

export function formatRelative(input: string | Date | null, locale = 'uz'): string {
  if (!input) return '—';
  const date = typeof input === 'string' ? parseISO(input) : input;
  if (!isValid(date)) return '—';
  return formatDistanceToNowStrict(date, {
    addSuffix: true,
    locale: resolveLocale(locale),
  });
}

export function isExpired(input: string | null): boolean {
  if (!input) return false;
  const date = parseISO(input);
  if (!isValid(date)) return false;
  return date.getTime() < Date.now();
}
