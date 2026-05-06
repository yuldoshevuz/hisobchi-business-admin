import { create } from 'zustand';
import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastEntry {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
  /** Optional correlationId from the API error, shown for tracing. */
  meta?: string;
}

interface ToastState {
  items: ToastEntry[];
  push: (entry: Omit<ToastEntry, 'id'>) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (entry) =>
    set((s) => ({
      items: [...s.items, { id: nextId++, ...entry }],
    })),
  dismiss: (id) =>
    set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (title: string, description?: string): void =>
    useToastStore.getState().push({ tone: 'success', title, description }),
  error: (title: string, description?: string, meta?: string): void =>
    useToastStore
      .getState()
      .push({ tone: 'error', title, description, meta }),
  info: (title: string, description?: string): void =>
    useToastStore.getState().push({ tone: 'info', title, description }),
};

const ICON_BY_TONE = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

const TONE_CLS: Record<ToastTone, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-border bg-card text-foreground',
};

export function Toaster(): React.ReactElement {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    const timers = items.map((item) =>
      window.setTimeout(() => dismiss(item.id), 5000),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [items, dismiss]);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[360px] flex-col gap-2">
      {items.map((item) => {
        const Icon = ICON_BY_TONE[item.tone];
        return (
          <div
            key={item.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-md border p-3 shadow-md',
              TONE_CLS[item.tone],
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">
                {item.title}
              </p>
              {item.description ? (
                <p className="mt-0.5 text-xs leading-snug opacity-90">
                  {item.description}
                </p>
              ) : null}
              {item.meta ? (
                <p className="mt-0.5 truncate font-mono text-[10px] opacity-70">
                  {item.meta}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Yopish"
              onClick={() => dismiss(item.id)}
              className="shrink-0 rounded-full p-0.5 opacity-70 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
