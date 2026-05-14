import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Send, Users } from 'lucide-react';
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
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { env } from '@/config/env';
import { HtmlPreview } from '@/features/bot-templates/components/html-preview';
import { InlineButtonsEditor } from '@/features/bot-templates/components/inline-buttons-editor';
import {
  LangTabs,
  type Lang,
} from '@/features/bot-templates/components/lang-tabs';
import {
  useBroadcast,
  useCreateBroadcast,
  usePreviewAudience,
  useSendBroadcast,
  useUpdateBroadcast,
} from '../hooks/use-broadcasts';
import { AudienceBuilder } from '../components/audience-builder';
import { BroadcastMediaUploader } from '../components/broadcast-media-uploader';
import type {
  BroadcastMediaType,
  BroadcastRecurrence,
  BroadcastTargeting,
  InlineButton,
  UpsertBroadcastBody,
} from '../api/broadcasts.api';

interface FormState {
  title: string;
  contentUz: string;
  contentRu: string;
  contentEn: string;
  isMultiLanguage: boolean;
  mediaType: BroadcastMediaType | null;
  mediaUrls: string[];
  inlineButtons: InlineButton[][];
  targeting: BroadcastTargeting;
  recurrence: BroadcastRecurrence;
  scheduledAt: string;
}

function resolveMediaUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${env.BACKEND_BASE_URL}${url}`;
}

const EMPTY_FORM: FormState = {
  title: '',
  contentUz: '',
  contentRu: '',
  contentEn: '',
  isMultiLanguage: false,
  mediaType: null,
  mediaUrls: [],
  inlineButtons: [],
  targeting: { kind: 'all' },
  recurrence: 'once',
  scheduledAt: '',
};

export function BroadcastComposerPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined && id !== 'new';
  const broadcastId = isEdit ? Number(id) : null;
  const navigate = useNavigate();

  const existing = useBroadcast(broadcastId);
  const createMut = useCreateBroadcast();
  const updateMut = useUpdateBroadcast();
  const sendMut = useSendBroadcast();
  const previewMut = usePreviewAudience();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [activeLang, setActiveLang] = useState<Lang>('uz');
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!existing.data || hydrated) return;
    setForm({
      title: existing.data.title,
      contentUz: existing.data.contentUz,
      contentRu: existing.data.contentRu,
      contentEn: existing.data.contentEn,
      isMultiLanguage: existing.data.isMultiLanguage,
      mediaType: existing.data.mediaType,
      mediaUrls: existing.data.mediaUrls,
      inlineButtons: existing.data.inlineButtons,
      targeting: existing.data.targeting,
      recurrence: existing.data.recurrence,
      scheduledAt: existing.data.scheduledAt
        ? existing.data.scheduledAt.slice(0, 16)
        : '',
    });
    setHydrated(true);
  }, [existing.data, hydrated]);

  function buildBody(scheduledAt?: string): UpsertBroadcastBody {
    return {
      title: form.title.trim(),
      contentUz: form.contentUz,
      // In single-language mode the server mirrors contentUz; sending
      // the unused ru/en is harmless and keeps the API contract simple.
      contentRu: form.isMultiLanguage ? form.contentRu : form.contentUz,
      contentEn: form.isMultiLanguage ? form.contentEn : form.contentUz,
      isMultiLanguage: form.isMultiLanguage,
      mediaType: form.mediaType,
      mediaUrls: form.mediaUrls.filter((u) => u.trim() !== ''),
      inlineButtons: form.inlineButtons
        .filter((row) => row.length > 0)
        .map((row) => ({ buttons: row })),
      targeting: form.targeting,
      recurrence: form.recurrence,
      ...(scheduledAt
        ? { scheduledAt: new Date(scheduledAt).toISOString() }
        : {}),
    };
  }

  async function handleSaveDraft(): Promise<void> {
    if (!form.title.trim()) {
      toast.error('Sarlavhani kiriting');
      return;
    }
    const body = buildBody(form.scheduledAt || undefined);
    try {
      if (broadcastId !== null) {
        await updateMut.mutateAsync({ id: broadcastId, body });
        toast.success('Saqlandi');
      } else {
        const created = await createMut.mutateAsync(body);
        toast.success('Yaratildi');
        navigate(`/broadcasts/${created.id}`, { replace: true });
      }
    } catch (err) {
      toast.error('Saqlab bo&apos;lmadi', getErrorMessage(err));
    }
  }

  async function handleSendNow(): Promise<void> {
    if (!form.title.trim()) {
      toast.error('Sarlavhani kiriting');
      return;
    }
    try {
      let targetId = broadcastId;
      if (targetId === null) {
        const body = buildBody();
        const created = await createMut.mutateAsync(body);
        targetId = created.id;
      } else {
        await updateMut.mutateAsync({ id: targetId, body: buildBody() });
      }
      await sendMut.mutateAsync(targetId);
      toast.success("Yuborish boshlandi");
      navigate(`/broadcasts/${targetId}`);
    } catch (err) {
      toast.error("Yuborib bo'lmadi", getErrorMessage(err));
    }
    setSendConfirmOpen(false);
  }

  async function handlePreview(): Promise<void> {
    try {
      await previewMut.mutateAsync(form.targeting);
    } catch (err) {
      toast.error('Olmadik', getErrorMessage(err));
    }
  }

  // Single-language mode hides the lang tabs entirely; the editor is
  // always bound to contentUz (which the server mirrors to ru/en on
  // save). Multi-language mode honours the active tab.
  const effectiveLang: Lang = form.isMultiLanguage ? activeLang : 'uz';
  const currentLangText =
    effectiveLang === 'ru'
      ? form.contentRu
      : effectiveLang === 'en'
        ? form.contentEn
        : form.contentUz;

  function setLangText(value: string): void {
    setForm((prev) => {
      if (effectiveLang === 'ru') return { ...prev, contentRu: value };
      if (effectiveLang === 'en') return { ...prev, contentEn: value };
      return { ...prev, contentUz: value };
    });
  }

  if (isEdit && existing.isPending) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (isEdit && existing.isError) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-destructive">
          {getErrorMessage(existing.error)}
        </CardContent>
      </Card>
    );
  }

  const isReadonly =
    isEdit && existing.data && existing.data.status !== 'draft' && existing.data.status !== 'scheduled';

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/broadcasts')}
        className="-ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Ommaviy xabarlar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEdit ? 'Xabarni tahrirlash' : 'Yangi ommaviy xabar'}
          </CardTitle>
          <CardDescription>
            Foydalanuvchilarga bot orqali HTML formatdagi xabar yuboring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="title">Sarlavha (faqat admin ko&apos;radi)</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Masalan: Yangi PRO tarif e&apos;loni"
            className="mt-1"
            disabled={!!isReadonly}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="space-y-2">
            <div className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Xabar matni</CardTitle>
              {form.isMultiLanguage ? (
                <LangTabs value={activeLang} onChange={setActiveLang} />
              ) : null}
            </div>
            <label className="flex items-start gap-2 text-xs">
              <Switch
                checked={form.isMultiLanguage}
                onCheckedChange={(v) =>
                  setForm((prev) => ({ ...prev, isMultiLanguage: v }))
                }
                disabled={!!isReadonly}
              />
              <span>
                <span className="font-medium">Ko&apos;p tilda yuborish</span>
                <span className="ml-1 text-muted-foreground">
                  — yoqilsa, har bir foydalanuvchiga o&apos;z tilidagi matn
                  yuboriladi. O&apos;chiq bo&apos;lsa, hammaga bitta matn yuboriladi.
                </span>
              </span>
            </label>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              value={currentLangText}
              onChange={setLangText}
              disabled={!!isReadonly}
              rows={12}
              placeholder="Xabar matnini kiriting. Yuqoridagi tugmalar orqali formatlash mumkin."
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {form.isMultiLanguage
                ? "Har 3 tilda ham matn kiriting. Bot foydalanuvchi tiliga qarab tegishlisini yuboradi."
                : "Bu matn barcha foydalanuvchilarga (til farqsiz) yuboriladi."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ko&apos;rinishi</CardTitle>
          </CardHeader>
          <CardContent>
            <HtmlPreview
              html={currentLangText}
              mediaType={form.mediaType}
              mediaUrl={
                form.mediaUrls[0]
                  ? resolveMediaUrl(form.mediaUrls[0])
                  : null
              }
              mediaUrls={form.mediaUrls.map(resolveMediaUrl)}
              buttons={form.inlineButtons}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Media (ixtiyoriy)</CardTitle>
          <CardDescription>
            Bitta rasm, video yoki hujjat biriktirsangiz bo'ladi.
            Bir nechta rasm tanlasangiz album bo'lib yuboriladi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BroadcastMediaUploader
            urls={form.mediaUrls}
            mediaType={form.mediaType}
            onChange={(next) =>
              setForm((prev) => ({
                ...prev,
                mediaUrls: next.urls,
                mediaType: next.mediaType,
              }))
            }
            disabled={!!isReadonly}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <InlineButtonsEditor
            rows={form.inlineButtons}
            onChange={(inlineButtons) =>
              setForm((prev) => ({ ...prev, inlineButtons }))
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kimga yuboriladi</CardTitle>
        </CardHeader>
        <CardContent>
          <AudienceBuilder
            value={form.targeting}
            onChange={(targeting) =>
              setForm((prev) => ({ ...prev, targeting }))
            }
          />
          <div className="mt-4 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={previewMut.isPending}
            >
              {previewMut.isPending ? (
                <Spinner />
              ) : (
                <Users className="h-3.5 w-3.5" />
              )}
              Nechta odamga yuboriladi?
            </Button>
            {previewMut.data ? (
              <div className="text-sm">
                <Badge variant="success">
                  Yetkaziladi: {previewMut.data.deliverableCount}
                </Badge>
                {previewMut.data.excludedNoTelegram > 0 ? (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({previewMut.data.excludedNoTelegram} ta Telegram'siz
                    chiqarib tashlandi)
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yuborish vaqti</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="scheduled-at">Rejalashtirilgan vaqt</Label>
            <Input
              id="scheduled-at"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, scheduledAt: e.target.value }))
              }
              disabled={!!isReadonly}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Bo&apos;sh qoldirsangiz qoralama bo&apos;lib saqlanadi
            </p>
          </div>
          <div>
            <Label htmlFor="recurrence">Takrorlash</Label>
            <select
              id="recurrence"
              value={form.recurrence}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  recurrence: e.target.value as BroadcastRecurrence,
                }))
              }
              disabled={!!isReadonly}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="once">Bir martalik</option>
              <option value="daily">Har kuni</option>
              <option value="weekly">Har hafta</option>
              <option value="monthly">Har oy</option>
              <option value="yearly">Har yili</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {!isReadonly ? (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={createMut.isPending || updateMut.isPending}
          >
            {createMut.isPending || updateMut.isPending ? (
              <Spinner />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Qoralama saqlash
          </Button>
          <Button
            type="button"
            onClick={() => setSendConfirmOpen(true)}
            disabled={sendMut.isPending}
          >
            <Send className="h-4 w-4" />
            Hozir yuborish
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={sendConfirmOpen}
        onOpenChange={setSendConfirmOpen}
        title="Xabarni yuborish"
        description={
          <span>
            {previewMut.data ? (
              <>
                <strong>{previewMut.data.deliverableCount}</strong> ta
                foydalanuvchiga yuboriladi. Davom etilsinmi?
              </>
            ) : (
              "Tanlangan foydalanuvchilarga xabar yuboriladi. Davom etilsinmi?"
            )}
          </span>
        }
        confirmLabel="Ha, yuborish"
        loading={
          sendMut.isPending || createMut.isPending || updateMut.isPending
        }
        onConfirm={handleSendNow}
      />
    </div>
  );
}
