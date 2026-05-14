import { cn } from '@/lib/utils';

export type Lang = 'uz' | 'ru' | 'en';

const LABELS: Record<Lang, string> = {
  uz: "O'zbekcha",
  ru: 'Русский',
  en: 'English',
};

const FLAGS: Record<Lang, string> = {
  uz: '🇺🇿',
  ru: '🇷🇺',
  en: '🇬🇧',
};

interface LangTabsProps {
  value: Lang;
  onChange: (lang: Lang) => void;
}

export function LangTabs({ value, onChange }: LangTabsProps): React.ReactElement {
  return (
    <div className="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-1">
      {(['uz', 'ru', 'en'] as Lang[]).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          className={cn(
            'flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition',
            value === lang
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <span>{FLAGS[lang]}</span>
          <span>{LABELS[lang]}</span>
        </button>
      ))}
    </div>
  );
}
