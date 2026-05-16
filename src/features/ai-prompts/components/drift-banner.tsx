import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DriftBannerProps {
  defaultContent: string;
  currentContent: string;
  onResetToDefault: () => void;
  resetPending: boolean;
}

/**
 * Surfaces when the in-code default has diverged from what the admin
 * last saved. Shown only after a new deploy bumps the `defaultChecksum`
 * — the seed never overwrites the saved version automatically, so the
 * admin sees the new default here and decides whether to merge or reset.
 */
export function DriftBanner({
  defaultContent,
  currentContent,
  onResetToDefault,
  resetPending,
}: DriftBannerProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Kod default&apos;i yangilanibdi
          </p>
          <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
            Joriy versiya kodda yozilgan default&apos;dan farq qiladi. Yangi
            default&apos;ni ko&apos;rib chiqing — kerak bo&apos;lsa
            tahriringizga moslang yoki default&apos;ga to&apos;liq qaytaring.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Yopish
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  Default&apos;ni ko&apos;rsatish
                </>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onResetToDefault}
              disabled={resetPending}
            >
              {resetPending ? 'Reset qilinmoqda…' : "Default'ga reset qilish"}
            </Button>
          </div>
        </div>
      </div>
      {expanded ? (
        <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
          <div className="rounded border bg-card p-2">
            <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">
              Joriy versiya
            </p>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-snug">
              {currentContent}
            </pre>
          </div>
          <div className="rounded border bg-card p-2">
            <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">
              Kod default
            </p>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-snug">
              {defaultContent}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
