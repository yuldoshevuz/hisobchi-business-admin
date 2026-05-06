/**
 * Format an integer money value as a localized string. Plans store price as
 * `Int` (whole UZS), so this is a thin wrapper around `Intl.NumberFormat`.
 * For tenant-tier money (Decimal strings) use the user-frontend's helper —
 * the admin UI never displays per-tenant transaction sums.
 */
export function formatPlanPrice(price: number, currency = 'UZS'): string {
  if (price === 0) return 'Bepul';
  const formatted = new Intl.NumberFormat('uz-UZ').format(price);
  return `${formatted} ${currency}/oy`;
}
