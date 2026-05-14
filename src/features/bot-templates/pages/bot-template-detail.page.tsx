import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/api/errors';
import { MediaUploader } from '@/components/ui/media-uploader';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { env } from '@/config/env';
import {
  useBotTemplate,
  useToggleBotTemplate,
  useUpdateBotTemplate,
} from '../hooks/use-bot-templates';
import { HtmlPreview } from '../components/html-preview';
import { InlineButtonsEditor } from '../components/inline-buttons-editor';
import { LangTabs, type Lang } from '../components/lang-tabs';
import { VersionHistory } from '../components/version-history';
import type { InlineButton } from '../api/bot-templates.api';

type MediaType = 'photo' | 'video' | 'document' | null;

export function BotTemplateDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const templateId = Number(id);
  const template = useBotTemplate(Number.isFinite(templateId) ? templateId : null);
  const update = useUpdateBotTemplate();
  const toggle = useToggleBotTemplate();

  const [activeLang, setActiveLang] = useState<Lang>('uz');
  const [showPreview, setShowPreview] = useState(true);
  const [contents, setContents] = useState({
    contentUz: '',
    contentRu: '',
    contentEn: '',
  });
  const [mediaType, setMediaType] = useState<MediaType>(null);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [buttons, setButtons] = useState<InlineButton[][]>([]);
  const [changeNote, setChangeNote] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!template.data || hydrated) return;
    const current = template.data.current;
    setContents({
      contentUz: current?.contentUz ?? '',
      contentRu: current?.contentRu ?? '',
      contentEn: current?.contentEn ?? '',
    });
    setMediaType(current?.mediaType ?? null);
    setMediaUrl(current?.mediaUrl ?? '');
    setButtons(current?.inlineButtons ?? []);
    setHydrated(true);
  }, [template.data, hydrated]);

  const currentLangText = useMemo(() => {
    switch (activeLang) {
      case 'ru':
        return contents.contentRu;
      case 'en':
        return contents.contentEn;
      default:
        return contents.contentUz;
    }
  }, [contents, activeLang]);

  function setLangText(value: string): void {
    setContents((prev) => {
      switch (activeLang) {
        case 'ru':
          return { ...prev, contentRu: value };
        case 'en':
          return { ...prev, contentEn: value };
        default:
          return { ...prev, contentUz: value };
      }
    });
  }

  async function handleSave(): Promise<void> {
    if (!template.data) return;
    if (mediaType !== null && mediaUrl.trim() === '') {
      toast.error("Rasm/Video havolasini kiriting yoki turini bo'shating");
      return;
    }
    if (mediaType === null && mediaUrl.trim() !== '') {
      toast.error('Media turini tanlang yoki havolani olib tashlang');
      return;
    }
    try {
      await update.mutateAsync({
        id: template.data.id,
        body: {
          contentUz: contents.contentUz,
          contentRu: contents.contentRu,
          contentEn: contents.contentEn,
          mediaType: mediaType,
          mediaUrl: mediaType ? mediaUrl.trim() : null,
          inlineButtons: buttons
            .filter((row) => row.length > 0)
            .map((row) => ({ buttons: row })),
          changeNote: changeNote.trim() || undefined,
        },
      });
      toast.success('Saqlandi — yangi versiya yaratildi');
      setChangeNote('');
    } catch (err) {
      toast.error('Saqlab bo&apos;lmadi', getErrorMessage(err));
    }
  }

  async function handleToggleActive(next: boolean): Promise<void> {
    if (!template.data) return;
    try {
      await toggle.mutateAsync({ id: template.data.id, isActive: next });
      toast.success(next ? 'Yoqildi' : "O'chirildi");
    } catch (err) {
      toast.error("O'zgartirib bo&apos;lmadi", getErrorMessage(err));
    }
  }

  if (template.isPending) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (template.isError || !template.data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-destructive">
          {getErrorMessage(template.error) || 'Xabar topilmadi'}
        </CardContent>
      </Card>
    );
  }

  const t = template.data;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/bot-templates')}
        className="-ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Shablonlar ro&apos;yxati
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{t.description ?? t.key}</CardTitle>
              <CardDescription className="mt-1">
                <code className="text-xs">{t.key}</code>
                <span className="ml-2 text-xs">
                  Joriy versiya: {t.currentVersion ?? '—'}
                </span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!t.isActive ? (
                <Badge variant="secondary">O&apos;chirilgan</Badge>
              ) : null}
              <Label className="flex items-center gap-2 text-sm">
                Faol
                <Switch
                  checked={t.isActive}
                  onCheckedChange={handleToggleActive}
                  disabled={toggle.isPending}
                />
              </Label>
            </div>
          </div>
        </CardHeader>
        {t.variables.length > 0 ? (
          <CardContent className="pt-0">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Mavjud o&apos;zgaruvchilar:
            </p>
            <div className="flex flex-wrap gap-2">
              {t.variables.map((v) => (
                <span
                  key={v.name}
                  className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs"
                  title={v.description ?? ''}
                >
                  {`{${v.name}}`}
                </span>
              ))}
            </div>
          </CardContent>
        ) : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Matn</CardTitle>
            <div className="flex items-center gap-2">
              <LangTabs value={activeLang} onChange={setActiveLang} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              value={currentLangText}
              onChange={setLangText}
              rows={12}
              placeholder="Xabar matnini kiriting. Yuqoridagi tugmalar orqali formatlash mumkin."
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Formatlash uchun yuqoridagi tugmalardan foydalaning.
              O&apos;zgaruvchilarni <code>{`{userName}`}</code> shaklida
              kiriting — bot ularni avtomatik to&apos;ldiradi.
            </p>
          </CardContent>
        </Card>

        {showPreview ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ko&apos;rinishi</CardTitle>
              <CardDescription>
                Foydalanuvchi Telegram&apos;da shu ko&apos;rinishda ko&apos;radi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HtmlPreview
                html={currentLangText}
                mediaType={mediaType}
                mediaUrl={
                  mediaUrl
                    ? mediaUrl.startsWith('http')
                      ? mediaUrl
                      : `${env.BACKEND_BASE_URL}${mediaUrl}`
                    : null
                }
                buttons={buttons}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rasm / Video / Hujjat</CardTitle>
          <CardDescription>
            Ixtiyoriy — xabarga bitta media biriktiring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-w-xs">
            <Label htmlFor="media-type">Turi</Label>
            <select
              id="media-type"
              value={mediaType ?? ''}
              onChange={(e) => {
                const next =
                  e.target.value === ''
                    ? null
                    : (e.target.value as Exclude<MediaType, null>);
                setMediaType(next);
                if (next === null) setMediaUrl('');
              }}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="">Yo&apos;q</option>
              <option value="photo">Rasm</option>
              <option value="video">Video</option>
              <option value="document">Hujjat</option>
            </select>
          </div>
          {mediaType !== null ? (
            <MediaUploader
              kind={mediaType}
              urls={mediaUrl ? [mediaUrl] : []}
              onChange={(urls) => setMediaUrl(urls[0] ?? '')}
            />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <InlineButtonsEditor rows={buttons} onChange={setButtons} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div>
            <Label htmlFor="change-note">
              Bu o&apos;zgartirish haqida izoh (ixtiyoriy)
            </Label>
            <Input
              id="change-note"
              placeholder="Masalan: AI haqida qo'shimcha satr qo'shildi"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Versiyalar tarixida ko&apos;rinadi — keyinchalik nima
              o&apos;zgargani esda qolishi uchun.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={handleSave}
              disabled={update.isPending}
            >
              {update.isPending ? <Spinner /> : <Save className="h-4 w-4" />}
              Saqlash
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Versiyalar tarixi</CardTitle>
          <CardDescription>
            Eski versiyaga qaytarish uchun &ldquo;Qaytarish&rdquo; tugmasini bosing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VersionHistory templateId={t.id} />
        </CardContent>
      </Card>
    </div>
  );
}
