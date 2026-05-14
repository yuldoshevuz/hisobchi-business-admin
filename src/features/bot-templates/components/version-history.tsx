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
  useBotTemplateVersions,
  useRestoreBotTemplateVersion,
} from '../hooks/use-bot-templates';
import type { TemplateVersion } from '../api/bot-templates.api';

interface VersionHistoryProps {
  templateId: number;
}

export function VersionHistory({
  templateId,
}: VersionHistoryProps): React.ReactElement {
  const versions = useBotTemplateVersions(templateId);
  const restore = useRestoreBotTemplateVersion();
  const [restoreTarget, setRestoreTarget] = useState<TemplateVersion | null>(
    null,
  );

  async function handleRestore(): Promise<void> {
    if (!restoreTarget) return;
    try {
      await restore.mutateAsync({
        id: templateId,
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
      <p className="text-sm text-muted-foreground">Versiyalar tarixi bo&apos;sh</p>
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
                <span className="text-sm font-medium">
                  Versiya {v.version}
                </span>
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
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {v.contentUz}
              </p>
            </div>
            {!v.isCurrent ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
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
        onOpenChange={(o) => {
          if (!o) setRestoreTarget(null);
        }}
        title="Eski versiyaga qaytarish"
        description={
          restoreTarget ? (
            <span>
              <strong>Versiya {restoreTarget.version}</strong> ga qaytarilsinmi?
              Joriy versiya tarixda saqlanib qoladi va istasangiz keyin qayta
              tiklash mumkin.
            </span>
          ) : (
            ''
          )
        }
        confirmLabel="Ha, qaytarish"
        loading={restore.isPending}
        onConfirm={handleRestore}
      />
    </>
  );
}
