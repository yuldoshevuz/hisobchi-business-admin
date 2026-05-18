import { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/utils';
import { SHARED_RULE_TARGET_KEYS } from '../api/ai-prompts.api';
import { useUpdateAiPromptAppliesTo } from '../hooks/use-ai-prompts';
import { shortTargetLabel } from '../lib/prompt-labels';

interface AppliesToSelectorProps {
  promptId: number;
  initialAppliesTo: string[];
}

export function AppliesToSelector({
  promptId,
  initialAppliesTo,
}: AppliesToSelectorProps): React.ReactElement {
  const [selected, setSelected] = useState<string[]>(initialAppliesTo);
  const update = useUpdateAiPromptAppliesTo();

  function toggle(key: string): void {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  const dirty = !sameSet(initialAppliesTo, selected);

  async function save(): Promise<void> {
    if (selected.length === 0) {
      toast.error('Kamida bitta prompt tanlang');
      return;
    }
    try {
      await update.mutateAsync({
        id: promptId,
        body: { appliesTo: selected },
      });
      toast.success('Saqlandi');
    } catch (err) {
      toast.error("Saqlab bo'lmadi", getErrorMessage(err));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Qaysi promptlarda amal qiladi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {SHARED_RULE_TARGET_KEYS.map((key) => {
            const checked = selected.includes(key);
            return (
              <label
                key={key}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md border p-2 text-xs',
                  checked && 'border-primary bg-primary/5',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(key)}
                  className="h-3.5 w-3.5 flex-shrink-0"
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium leading-tight">
                    {shortTargetLabel(key)}
                  </span>
                  <code className="truncate text-[10px] leading-tight text-muted-foreground">
                    {key}
                  </code>
                </div>
              </label>
            );
          })}
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            size="sm"
            onClick={() => void save()}
            disabled={!dirty || update.isPending}
          >
            <Save className="h-3.5 w-3.5" />
            Saqlash
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  for (const v of b) if (!sa.has(v)) return false;
  return true;
}
