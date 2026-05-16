/**
 * Human-readable labels for each prompt key — used as the card title
 * in the list and detail pages. The full `description` from the
 * registry is too long for a title; it shows as a subtitle instead.
 */
export const PROMPT_LABELS: Record<string, string> = {
  'stage1.intent_router': 'Intent router (yo‘nalish aniqlash)',
  'stage2.sale': 'Sotuv (Sale)',
  'stage2.purchase': 'Xarid (Purchase)',
  'stage2.expense': 'Xarajat (Expense)',
  'stage2.income': 'Tushum (Income)',
  'stage2.payment': "Qarz / To‘lov (Debt / Payment)",
  'stage2.transfer': "Pul o‘tkazmasi (Transfer)",
  'stage2.adjustment': 'Tuzatish (Adjustment)',
  'stage2.query.router': "So‘rov — router (mode tanlash)",
  'stage2.query.answer': "So‘rov — javob (context'dan)",
  'stage2.query.plan': "So‘rov — planner (dataRequest)",
  'stage2.update': 'Tranzaksiyani tahrirlash (Update)',
  'stage2.void': 'Tranzaksiyani bekor qilish (Void / Refund)',
  'stage2.create_contact': 'Yangi kontakt yaratish',
  'followup.query': 'Yakuniy javob (Follow-up query)',
  'shared.account_hint_rule': 'Hisob nomi qoidasi (Account hint)',
  'shared.category_hint_rule': 'Kategoriya qoidasi (Category hint)',
  'shared.pii_rule': "Maxfiy ma‘lumot (PII) qoidasi",
  'shared.multi_tx_rule': 'Bir nechta tranzaksiya qoidasi',
};

export function promptLabel(key: string): string {
  return PROMPT_LABELS[key] ?? key;
}

/** Short labels for the appliesTo multi-select (no parentheticals). */
export const SHARED_RULE_TARGET_SHORT_LABELS: Record<string, string> = {
  'stage2.sale': 'Sotuv',
  'stage2.purchase': 'Xarid',
  'stage2.expense': 'Xarajat',
  'stage2.income': 'Tushum',
  'stage2.payment': "Qarz / To‘lov",
  'stage2.transfer': "O‘tkazma",
  'stage2.adjustment': 'Tuzatish',
  'stage2.query.router': "So‘rov — router",
  'stage2.query.answer': "So‘rov — javob",
  'stage2.query.plan': "So‘rov — planner",
  'stage2.update': 'Tahrirlash',
  'stage2.void': 'Bekor qilish',
  'stage2.create_contact': 'Kontakt yaratish',
  'followup.query': 'Yakuniy javob',
};

export function shortTargetLabel(key: string): string {
  return SHARED_RULE_TARGET_SHORT_LABELS[key] ?? key;
}
