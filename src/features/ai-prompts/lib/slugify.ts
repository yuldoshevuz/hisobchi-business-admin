/**
 * Best-effort transliteration + slugification for Uzbek (Latin/Cyrillic),
 * Russian, and English user-typed rule names. The resulting slug is used
 * as the URL-safe `shared.<slug>` key; the placeholder name is the
 * UPPER variant.
 *
 * Examples:
 *   "Tovush ohangi"  → slug "tovush_ohangi"      → placeholder "TOVUSH_OHANGI"
 *   "Тон голоса"     → slug "ton_golosa"         → placeholder "TON_GOLOSA"
 *   "No emoji rule"  → slug "no_emoji_rule"      → placeholder "NO_EMOJI_RULE"
 *   "Soliq 2026!"    → slug "soliq_2026"         → placeholder "SOLIQ_2026"
 */

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
  я: 'ya', ў: "o'", ғ: "g'", қ: 'q', ҳ: 'h',
};

const UZBEK_DIACRITICS: Record<string, string> = {
  ʻ: '', ʼ: '', '‘': '', '’': '', "'": '',
};

export function slugifyRuleName(name: string): string {
  let s = name.trim().toLowerCase();
  // Cyrillic → Latin.
  s = s.replace(/[а-яёўғқҳъь]/g, (c) => CYRILLIC_TO_LATIN[c] ?? c);
  // Uzbek apostrophes / curly quotes → drop.
  s = s.replace(/['ʻʼ‘’]/g, (c) => UZBEK_DIACRITICS[c] ?? '');
  // Whitespace and dashes → underscore.
  s = s.replace(/[\s\-]+/g, '_');
  // Anything that isn't a-z, 0-9, or _ → drop.
  s = s.replace(/[^a-z0-9_]/g, '');
  // Collapse runs of underscores and trim them at the edges.
  s = s.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  // If the slug accidentally starts with a digit, prefix it so the
  // backend regex (`^[a-z][a-z0-9_]*$`) still passes.
  if (/^[0-9]/.test(s)) s = `rule_${s}`;
  return s.slice(0, 40);
}

export function placeholderFromSlug(slug: string): string {
  return slug.toUpperCase().slice(0, 60);
}
