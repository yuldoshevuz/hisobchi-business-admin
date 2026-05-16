import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/api/errors';
import {
  useAiPrompt,
  useDeleteAiPrompt,
  useResetAiPromptToDefault,
  useToggleAiPrompt,
  useUpdateAiPrompt,
} from '../hooks/use-ai-prompts';
import { AppliesToSelector } from '../components/applies-to-selector';
import { DriftBanner } from '../components/drift-banner';
import { VariablesPanel } from '../components/variables-panel';
import { PromptVersionHistory } from '../components/version-history';
import { promptLabel } from '../lib/prompt-labels';

export function AiPromptDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const promptId = Number(id);
  const prompt = useAiPrompt(Number.isFinite(promptId) ? promptId : null);
  const update = useUpdateAiPrompt();
  const toggle = useToggleAiPrompt();
  const reset = useResetAiPromptToDefault();
  const del = useDeleteAiPrompt();

  const [content, setContent] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!prompt.data || hydrated) return;
    setContent(prompt.data.content ?? prompt.data.defaultContent);
    setHydrated(true);
  }, [prompt.data, hydrated]);

  const missingRequired = useMemo(() => {
    if (!prompt.data) return [] as string[];
    return prompt.data.variables
      .filter((v) => v.required)
      .filter((v) => !content.includes(`{{${v.name}}}`))
      .map((v) => v.name);
  }, [prompt.data, content]);

  async function handleSave(): Promise<void> {
    if (!prompt.data) return;
    if (missingRequired.length > 0) {
      toast.error(
        'Majburiy o‘zgaruvchilar yo‘q',
        missingRequired.map((n) => `{{${n}}}`).join(', '),
      );
      return;
    }
    if (content.trim() === '') {
      toast.error("Prompt bo'sh bo'lishi mumkin emas");
      return;
    }
    try {
      await update.mutateAsync({
        id: prompt.data.id,
        body: {
          content,
          changeNote: changeNote.trim() || undefined,
        },
      });
      toast.success('Saqlandi — yangi versiya yaratildi');
      setChangeNote('');
    } catch (err) {
      toast.error("Saqlab bo'lmadi", getErrorMessage(err));
    }
  }

  async function handleToggleActive(next: boolean): Promise<void> {
    if (!prompt.data) return;
    try {
      await toggle.mutateAsync({ id: prompt.data.id, isActive: next });
      toast.success(next ? 'Yoqildi' : "O'chirildi");
    } catch (err) {
      toast.error("O'zgartirib bo'lmadi", getErrorMessage(err));
    }
  }

  async function handleResetToDefault(): Promise<void> {
    if (!prompt.data) return;
    try {
      const fresh = await reset.mutateAsync({ id: prompt.data.id });
      setContent(fresh.content ?? fresh.defaultContent);
      toast.success("Default'ga qaytarildi");
    } catch (err) {
      toast.error('Reset bajarilmadi', getErrorMessage(err));
    }
  }

  async function handleDelete(): Promise<void> {
    if (!prompt.data) return;
    try {
      await del.mutateAsync({ id: prompt.data.id });
      toast.success("Qoida o'chirildi");
      setConfirmDeleteOpen(false);
      navigate('/ai-prompts');
    } catch (err) {
      toast.error("O'chirib bo'lmadi", getErrorMessage(err));
    }
  }

  if (prompt.isPending) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (prompt.isError || !prompt.data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-destructive">
          {getErrorMessage(prompt.error) || 'Prompt topilmadi'}
        </CardContent>
      </Card>
    );
  }

  const p = prompt.data;
  const driftFromCurrent = p.content !== null && p.content !== p.defaultContent;
  const dirty = hydrated && p.content !== null && content !== p.content;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/ai-prompts')}
        className="-ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        AI promptlari ro&apos;yxati
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex flex-wrap items-center gap-2">
                {promptLabel(p.key)}
                {!p.isBuiltIn ? (
                  <Badge
                    variant="default"
                    className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  >
                    Custom
                  </Badge>
                ) : null}
              </CardTitle>
              <CardDescription className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <code className="text-xs">{p.key}</code>
                {p.placeholderName ? (
                  <>
                    <span className="text-xs">·</span>
                    <code className="text-xs">
                      {`{{${p.placeholderName}}}`}
                    </code>
                  </>
                ) : null}
                <span className="text-xs">·</span>
                <span className="text-xs">Bo&apos;lim: {p.category}</span>
                {p.currentVersion !== null ? (
                  <>
                    <span className="text-xs">·</span>
                    <span className="text-xs">
                      Joriy versiya: {p.currentVersion}
                    </span>
                  </>
                ) : null}
              </CardDescription>
              {p.description ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {p.description}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {!p.isActive ? (
                <Badge variant="secondary">O&apos;chirilgan</Badge>
              ) : null}
              <Label htmlFor="active-toggle" className="text-xs">
                Yoqilgan
              </Label>
              <Switch
                id="active-toggle"
                checked={p.isActive}
                disabled={toggle.isPending}
                onCheckedChange={(checked) => void handleToggleActive(checked)}
              />
              {!p.isBuiltIn ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-2 border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={del.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  O&apos;chirish
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
      </Card>

      {driftFromCurrent ? (
        <DriftBanner
          defaultContent={p.defaultContent}
          currentContent={p.content ?? ''}
          onResetToDefault={() => void handleResetToDefault()}
          resetPending={reset.isPending}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prompt matni</CardTitle>
            <CardDescription>
              Placeholder&apos;lar (masalan{' '}
              <code className="text-xs">{'{{TODAY}}'}</code>) runtimeda
              kontekst bilan to&apos;ldiriladi. Majburiy
              placeholder&apos;ni o&apos;chirish saqlashni bloklaydi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
              className="min-h-[480px] w-full resize-y rounded-md border border-input bg-card p-3 font-mono text-xs leading-relaxed"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                {content.length} ta belgi
                {missingRequired.length > 0 ? (
                  <span className="ml-2 text-destructive">
                    · {missingRequired.length} ta majburiy placeholder yo&apos;q
                  </span>
                ) : null}
                {dirty ? (
                  <span className="ml-2 text-amber-600">· saqlanmagan</span>
                ) : null}
              </div>
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={
                  update.isPending ||
                  missingRequired.length > 0 ||
                  content.trim() === ''
                }
              >
                <Save className="h-4 w-4" />
                Saqlash va e&apos;lon qilish
              </Button>
            </div>
            <div className="mt-3">
              <Label htmlFor="change-note" className="text-xs">
                O&apos;zgarish izohi (ixtiyoriy)
              </Label>
              <Input
                id="change-note"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="Masalan: salary aniqlash qoidasini yangiladim"
                maxLength={500}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {p.category === 'shared' ? (
            <AppliesToSelector
              promptId={p.id}
              initialAppliesTo={p.appliesTo}
            />
          ) : null}

          {p.variables.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  O&apos;zgaruvchilar
                </CardTitle>
                <CardDescription>
                  Promptda ishlatiladigan placeholder&apos;lar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VariablesPanel
                  variables={p.variables}
                  content={content}
                />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Versiyalar tarixi</CardTitle>
            </CardHeader>
            <CardContent>
              <PromptVersionHistory promptId={p.id} />
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Qoidani o'chirishni tasdiqlaysizmi?"
        description={
          <>
            <code className="text-xs">{p.key}</code> qoidasi va uning butun
            versiya tarixi o&apos;chiriladi. Bu amalni qaytarib bo&apos;lmaydi.
          </>
        }
        confirmLabel="Ha, o'chirish"
        destructive
        onConfirm={() => void handleDelete()}
        loading={del.isPending}
      />
    </div>
  );
}
