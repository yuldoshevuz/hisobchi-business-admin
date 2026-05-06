import type { FeatureType } from '@/features/plans/api/plans.api';

interface FeatureI18n {
  /** Short, business-friendly name shown as the primary label. */
  name: string;
  /** One-line description of what the feature actually unlocks. */
  description: string;
}

/**
 * User-facing Uzbek labels for the canonical feature catalog. Backend
 * descriptions are kept in English for API/Swagger consumers; the admin UI
 * looks up these labels by `code`.
 *
 * Codes outside this map fall back to a generic shape (code as name, no
 * description) — we never silently swallow unknown features.
 */
export const FEATURE_LABELS_UZ: Record<string, FeatureI18n> = {
  EMPLOYEES_LIMIT: {
    name: 'Xodimlar soni',
    description:
      "Tashkilotda jami xodimlar soni (egasi ham hisoblanadi). Yangi xodim qo'shilganda chegara tekshiriladi.",
  },
  ACCOUNT_LIMIT: {
    name: 'Hisoblar (kassalar) soni',
    description:
      "Bitta tashkilotda ochish mumkin bo'lgan kassa, bank va e-hamyon hisoblari soni.",
  },
  ORGANIZATION_LIMIT: {
    name: 'Tashkilotlar soni',
    description:
      'Bir foydalanuvchi yarata oladigan tashkilotlar soni (faqat egalik qiladigan).',
  },
  ADVANCED_REPORTS: {
    name: 'Kengaytirilgan hisobotlar',
    description:
      "Foyda-zarar (P&L) va Moliyaviy holat (balans) hisobotlari. Kassa hisoboti barcha tariflarda mavjud.",
  },
  MULTI_CURRENCY_SUPPORT: {
    name: "Ko'p valyutali ishlash",
    description:
      'Tashkilotning bazaviy valyutasidan tashqari valyutalarda hisob va tranzaksiyalar yuritish.',
  },
  DEBT_TRACKING: {
    name: 'Qarzlar hisoboti',
    description:
      "Mijoz va yetkazib beruvchilar bo'yicha qarzdorlik hisobotlari va per-kontakt balanslar. Qarz tranzaksiyalarini yaratish — barcha tariflarda mavjud.",
  },
  ADVANCED_TRANSACTIONS: {
    name: 'Murakkab tranzaksiyalar',
    description:
      "Balansni qo'lda to'g'irlash (sanoq farqi, shrinkage) va valyutalararo o'tkazma.",
  },
  SCHEDULED_TRANSACTIONS: {
    name: "Rejalashtirilgan to'lovlar",
    description:
      'Takrorlanadigan oylik/haftalik tranzaksiyalar va Telegram orqali avtomatik eslatmalar.',
  },
  INVENTORY_MANAGEMENT: {
    name: 'Ombor boshqaruvi',
    description:
      'Mahsulotlar qoldig’ini kuzatish, ombor harakatlari va sanoq farqlarini hisobga olish. Xizmatlar (qoldiq kuzatuvisiz mahsulotlar) cheklovsiz.',
  },
  ADVANCED_RBAC: {
    name: 'Maxsus rollar (RBAC)',
    description:
      "Tashkilot ichida o'z rollaringizni yaratish va ularga ruxsatlar to'plamini biriktirish.",
  },
  SALES_COMMISSION: {
    name: 'Sotuv komissiyalari',
    description:
      'Sotuvlar uchun xodimlarga komissiya hisoblash, hisobot va bekor qilish.',
  },
};

export function getFeatureLabel(code: string): FeatureI18n {
  return (
    FEATURE_LABELS_UZ[code] ?? {
      name: code,
      description: '',
    }
  );
}

export const FEATURE_TYPE_LABEL: Record<FeatureType, string> = {
  BOOLEAN: 'Yoq./Och.',
  LIMIT: 'Chegara',
};
