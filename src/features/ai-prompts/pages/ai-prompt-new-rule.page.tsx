import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  Sparkles,
} from 'lucide-react';
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
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/utils';
import { useCreateAiPromptRule } from '../hooks/use-ai-prompts';
import { shortTargetLabel } from '../lib/prompt-labels';
import { placeholderFromSlug, slugifyRuleName } from '../lib/slugify';

/** Three task-aligned groups so the long list of 12 target prompts is easy to scan. */
const TARGET_GROUPS: Array<{
  title: string;
  hint?: string;
  keys: string[];
}> = [
  {
    title: 'Tranzaksiyalar',
    hint: 'Foydalanuvchi xabari bo‘yicha tranzaksiya yozadigan promptlar',
    keys: [
      'stage2.sale',
      'stage2.purchase',
      'stage2.expense',
      'stage2.income',
      'stage2.payment',
      'stage2.transfer',
      'stage2.adjustment',
    ],
  },
  {
    title: 'Maxsus amallar',
    hint: 'So‘rov, tahrirlash, bekor qilish va kontakt yaratish',
    keys: [
      'stage2.query',
      'stage2.update',
      'stage2.void',
      'stage2.create_contact',
    ],
  },
  {
    title: 'Yakuniy javob',
    hint: 'So‘rovga ma’lumotlar yig‘ilgandan keyin yuboriladigan javob',
    keys: ['followup.query'],
  },
];

const INITIAL_FORM = {
  name: '',
  description: '',
  content: '',
  appliesTo: [] as string[],
  autoInsert: true,
  customSlug: '',
  customPlaceholder: '',
};

export function AiPromptNewRulePage(): React.ReactElement {
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const create = useCreateAiPromptRule();

  function setField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleTarget(key: string): void {
    setForm((prev) => ({
      ...prev,
      appliesTo: prev.appliesTo.includes(key)
        ? prev.appliesTo.filter((k) => k !== key)
        : [...prev.appliesTo, key],
    }));
  }

  function selectGroup(keys: string[], all: boolean): void {
    setForm((prev) => {
      const setKeys = new Set(prev.appliesTo);
      if (all) keys.forEach((k) => setKeys.add(k));
      else keys.forEach((k) => setKeys.delete(k));
      return { ...prev, appliesTo: Array.from(setKeys) };
    });
  }

  // Auto-derive slug + placeholder from the name unless the admin
  // opened the advanced section and overrode them manually.
  const autoSlug = useMemo(() => slugifyRuleName(form.name), [form.name]);
  const slug = form.customSlug || autoSlug;
  const placeholder = form.customPlaceholder || placeholderFromSlug(slug);

  const slugValid = /^[a-z][a-z0-9_]{1,39}$/.test(slug);
  const placeholderValid = /^[A-Z][A-Z0-9_]{1,59}$/.test(placeholder);
  const valid =
    form.name.trim().length > 0 &&
    slugValid &&
    placeholderValid &&
    form.content.trim().length > 0 &&
    form.appliesTo.length > 0;

  async function handleSubmit(): Promise<void> {
    if (!valid) return;
    try {
      const created = await create.mutateAsync({
        slug,
        placeholderName: placeholder,
        description: form.description.trim() || form.name.trim(),
        content: form.content,
        appliesTo: form.appliesTo,
        autoInsertIntoPrompts: form.autoInsert,
      });
      toast.success(
        form.autoInsert
          ? `Qoida yaratildi va ${form.appliesTo.length} ta promptga qo‘shildi`
          : 'Qoida yaratildi',
      );
      navigate(`/ai-prompts/${created.id}`);
    } catch (err) {
      toast.error("Yaratib bo'lmadi", getErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/ai-prompts')}
        className="-ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        AI promptlari ro&apos;yxati
      </Button>

      <header>
        <h1 className="text-2xl font-semibold">Yangi umumiy qoida</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bir marta yozasiz — tanlangan barcha promptlarga avtomatik
          qo&apos;shiladi. Keyinchalik tahrirlash yoki o&apos;chirish
          mumkin.
        </p>
      </header>

      {/* ─── 1. Nom ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Qoidaga nom bering</CardTitle>
          <CardDescription>
            O&apos;zbekcha yoki ruschada erkin yozing — texnik kalit
            avtomatik yaratiladi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Masalan: Tovush ohangi"
            autoFocus
          />
          {form.name && slugValid ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Promptlarga{' '}
              <code className="text-xs text-foreground">
                {`{{${placeholder}}}`}
              </code>{' '}
              deb qo&apos;shiladi
            </p>
          ) : null}
          {form.name && !slugValid ? (
            <p className="mt-2 text-xs text-destructive">
              Iltimos, kamida 2 ta harf bilan boshlangan nom bering
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* ─── 2. Qoida matni ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Qoida matni</CardTitle>
          <CardDescription>
            AI ushbu yo&apos;riqnomaga rioya qiladi. Markdown ham
            ishlaydi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={form.content}
            onChange={(e) => setField('content', e.target.value)}
            spellCheck={false}
            className="min-h-[200px] w-full resize-y rounded-md border border-input bg-card p-3 font-mono text-xs leading-relaxed"
            placeholder={`# TOVUSH OHANGI

Hurmat bilan va aniq javob ber. "Sen" emas, "Siz" deb murojaat qil.
Javob 1-2 jumladan ortmasin.`}
          />
        </CardContent>
      </Card>

      {/* ─── 3. Qaysi promptlarda ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">
                3. Qaysi promptlarda amal qiladi
              </CardTitle>
              <CardDescription>
                Qoida shu promptlarning oxiriga avtomatik qo&apos;shiladi.
              </CardDescription>
            </div>
            <span className="text-xs text-muted-foreground">
              {form.appliesTo.length} ta tanlangan
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {TARGET_GROUPS.map((group) => {
            const allSelected = group.keys.every((k) =>
              form.appliesTo.includes(k),
            );
            return (
              <div key={group.title} className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">{group.title}</div>
                    {group.hint ? (
                      <div className="text-[11px] text-muted-foreground">
                        {group.hint}
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => selectGroup(group.keys, !allSelected)}
                    className="shrink-0 rounded px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10"
                  >
                    {allSelected ? 'Hech qaysi' : 'Hammasi'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {group.keys.map((key) => {
                    const checked = form.appliesTo.includes(key);
                    return (
                      <label
                        key={key}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-md border bg-card p-2 text-xs',
                          checked
                            ? 'border-primary bg-primary/5'
                            : 'border-border',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTarget(key)}
                          className="h-3.5 w-3.5 shrink-0"
                        />
                        <span className="truncate">
                          {shortTargetLabel(key)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {form.appliesTo.length === 0 ? (
            <p className="text-xs text-destructive">
              Kamida bitta promptni tanlang
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* ─── 4. Auto-insert + Advanced ────────────────────────────── */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={form.autoInsert}
              onChange={(e) => setField('autoInsert', e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <div className="flex-1">
              <div className="text-sm font-medium">
                Promptlarga avtomatik qo&apos;shilsin
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Yoqilgan bo&apos;lsa, tanlangan promptlarning oxiriga{' '}
                <code className="text-xs">
                  {`{{${placeholder || 'PLACEHOLDER'}}}`}
                </code>{' '}
                tokeni o&apos;zi qo&apos;shiladi. O&apos;chirilsa, siz
                uni promptdagi xohlagan joyga qo&apos;lda qo&apos;yasiz.
              </p>
            </div>
          </label>

          <div>
            <Label
              htmlFor="rule-description"
              className="text-xs font-medium"
            >
              Tavsif (ixtiyoriy)
            </Label>
            <Input
              id="rule-description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Keyinroq nima uchun yaratganingizni eslaysiz"
              maxLength={500}
              className="mt-1"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {advancedOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Texnik sozlamalar
            </button>
            {advancedOpen ? (
              <div className="mt-2 grid grid-cols-2 gap-3 rounded-md border bg-muted/30 p-3">
                <div>
                  <Label htmlFor="adv-slug" className="text-xs font-medium">
                    Kalit
                  </Label>
                  <div className="mt-1 flex items-center gap-1">
                    <code className="text-xs text-muted-foreground">
                      shared.
                    </code>
                    <Input
                      id="adv-slug"
                      value={form.customSlug}
                      onChange={(e) =>
                        setField('customSlug', e.target.value.toLowerCase())
                      }
                      placeholder={autoSlug || 'avtomatik'}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label
                    htmlFor="adv-placeholder"
                    className="text-xs font-medium"
                  >
                    Placeholder nomi
                  </Label>
                  <Input
                    id="adv-placeholder"
                    value={form.customPlaceholder}
                    onChange={(e) =>
                      setField(
                        'customPlaceholder',
                        e.target.value.toUpperCase(),
                      )
                    }
                    placeholder={
                      placeholderFromSlug(autoSlug) || 'AVTOMATIK'
                    }
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <p className="col-span-2 text-[11px] text-muted-foreground">
                  Ko&apos;p hollarda bularni o&apos;zgartirish shart
                  emas — nomdan avtomatik shakllanadi.
                </p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* ─── Submit row ────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => navigate('/ai-prompts')}
          disabled={create.isPending}
        >
          Bekor qilish
        </Button>
        <Button
          onClick={() => void handleSubmit()}
          disabled={!valid || create.isPending}
        >
          <Plus className="h-4 w-4" />
          {create.isPending ? 'Yaratilmoqda…' : 'Yaratish'}
        </Button>
      </div>
    </div>
  );
}
