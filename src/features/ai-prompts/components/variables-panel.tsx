import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PromptVariable } from '../api/ai-prompts.api';

interface VariablesPanelProps {
  variables: PromptVariable[];
  content: string;
}

/**
 * Lists every declared placeholder for the prompt. Required variables
 * that are missing from the current content are flagged in red so the
 * admin sees the problem before saving — the backend also rejects the
 * save, but a live indicator avoids the round-trip.
 */
export function VariablesPanel({
  variables,
  content,
}: VariablesPanelProps): React.ReactElement {
  if (variables.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Bu prompt o&apos;zgaruvchilarsiz ishlaydi.
      </p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {variables.map((v) => {
        const token = `{{${v.name}}}`;
        const present = content.includes(token);
        const missing = v.required && !present;
        return (
          <li
            key={v.name}
            className={cn(
              'flex items-start gap-2 rounded-md border p-2 text-xs',
              missing
                ? 'border-destructive/50 bg-destructive/5'
                : 'border-border',
            )}
          >
            {missing ? (
              <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
            ) : (
              <CheckCircle2
                className={cn(
                  'mt-0.5 h-3.5 w-3.5 shrink-0',
                  present ? 'text-emerald-600' : 'text-muted-foreground/60',
                )}
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <code className="text-[11px] font-medium">{token}</code>
                {v.required ? (
                  <Badge variant="outline" className="text-[10px]">
                    majburiy
                  </Badge>
                ) : null}
              </div>
              {v.description ? (
                <p className="mt-0.5 text-muted-foreground">{v.description}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
