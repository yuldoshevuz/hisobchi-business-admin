import { useState } from 'react';
import { Check, History, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { formatDateTime } from '@/lib/date/format-date';
import { getErrorMessage } from '@/lib/api/errors';
import {
  useAiPromptVersions,
  useRestoreAiPromptVersion,
} from '../hooks/use-ai-prompts';
import type { PromptVersion } from '../api/ai-prompts.api';

interface PromptVersionHistoryProps {
  promptId: number;
}

export function PromptVersionHistory({
  promptId,
}: PromptVersionHistoryProps): React.ReactElement {
  const versions = useAiPromptVersions(promptId);
  const restore = useRestoreAiPromptVersion();
  const [restoreTarget, setRestoreTarget] = useState<PromptVersion | null>(
    null,
  );

  async function handleRestore(): Promise<void> {
    if (!restoreTarget) return;
    try {
      await restore.mutateAsync({
        id: promptId,
        versionId: restoreTarget.id,
      });
      toast.success('Eski versiyaga qaytarildi');
      setRestoreTarget(null);
    } catch (err) {
      toast.error('Qaytarib bo&apos;lmadi', getErrorMessage(err));
    }
  }

  if (versions.isPending) {
    return (
      <div className="flex justify-center py-6">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }
  if (versions.isError) {
    return (
      <p className="py-4 text-sm text-destructive">
        {getErrorMessage(versions.error)}
      </p>
    );
  }
  const rows = versions.data ?? [];
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Versiyalar tarixi bo&apos;sh
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {rows.map((v) => (
          <li
            key={v.id}
            className="flex items-start justify-between rounded-md border p-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">Versiya {v.version}</span>
                {v.isCurrent ? (
                  <Badge variant="success" className="gap-1">
                    <Check className="h-3 w-3" />
                    Hozir ishlatilmoqda
                  </Badge>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDateTime(v.createdAt)}
              </p>
              {v.changeNote ? (
                <p className="mt-1 text-xs italic text-muted-foreground">
                  &ldquo;{v.changeNote}&rdquo;
                </p>
              ) : null}
              <pre className="mt-2 max-h-32 overflow-hidden whitespace-pre-wrap break-words text-[10px] leading-snug text-muted-foreground line-clamp-4">
                {v.content}
              </pre>
            </div>
            {!v.isCurrent ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-3 shrink-0"
                onClick={() => setRestoreTarget(v)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Qaytarish
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={restoreTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRestoreTarget(null);
        }}
        title={`Versiya ${restoreTarget?.version} ni qaytarmoqchimisiz?`}
        description="Joriy versiya o'rniga shu eski versiya ishlatiladi. Tarix saqlanib qoladi."
        confirmLabel="Ha, qaytarish"
        onConfirm={handleRestore}
        loading={restore.isPending}
      />
    </>
  );
}
