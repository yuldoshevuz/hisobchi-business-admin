import { AxiosError } from 'axios';

export interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string | string[];
  details?: unknown;
  timestamp: string;
  path: string;
  correlationId?: string;
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
  correlationId?: string;
}

/**
 * Centralised mapping of MessageKey → Uzbek user-facing copy. Mirrors the
 * backend `MessageKey` enum. Add the keys the admin tier sees here; for
 * tenant-specific keys we don't show in admin, fall back to the raw code.
 */
const MESSAGE_KEY_UZ: Record<string, string> = {
  // generic
  UNAUTHORIZED: 'Avval tizimga kiring',
  FORBIDDEN: 'Ruxsat berilmagan',
  NOT_FOUND: 'Topilmadi',
  VALIDATION_ERROR: "Ma'lumotlar noto'g'ri",
  FIELD_REQUIRED: 'Ushbu maydon majburiy',
  INTERNAL_SERVER_ERROR: 'Server xatosi',
  RATE_LIMITED: "Juda ko'p so'rovlar. Bir oz kuting",

  // admin tier
  INVALID_CREDENTIALS: "Telefon yoki parol noto'g'ri",
  ADMIN_LOGIN_RATE_LIMITED: "Login urinishlar limiti tugadi. Bir necha daqiqa kuting",
  ADMIN_SCOPE_REQUIRED: 'Admin tokeni kerak',
  ADMIN_ROLE_REQUIRED: 'Sizning rolingizda bu amalga ruxsat yo‘q',
  ADMIN_NOT_FOUND: 'Admin topilmadi',
  ADMIN_CANNOT_DELETE_SELF: "O'z hisobingizni o'chira olmaysiz",
  REFRESH_TOKEN_INVALID: 'Sessiya tugadi, qayta kiring',
  REFRESH_TOKEN_REVOKED: 'Sessiya bekor qilingan',
  REFRESH_SCOPE_MISMATCH: 'Token turi mos kelmaydi',

  ORGANIZATION_NOT_FOUND: 'Tashkilot topilmadi',

  // subscriptions / plans / features
  PLAN_NOT_FOUND: 'Tarif topilmadi',
  PLAN_CODE_EXISTS: 'Bunday kodli tarif allaqachon mavjud',
  PLAN_INACTIVE: 'Tarif faol emas',
  PLAN_IN_USE: "Bu tarifda aktiv obunalar bor — avval ularni o'zgartiring",
  PLAN_PRICE_NOT_FOUND: 'Narx topilmadi',
  PLAN_PRICE_MISMATCH: 'Tanlangan narx ushbu tarifga tegishli emas',
  FEATURE_NOT_FOUND: 'Funksiya topilmadi',
  FEATURE_CODE_EXISTS: 'Bunday kodli funksiya allaqachon mavjud',
  FEATURE_DISABLED: 'Bu funksiya joriy tarifda yoqilmagan',
  FEATURE_LIMIT_REACHED: 'Tarif chegarasiga yetildi',
  SUBSCRIPTION_NOT_FOUND: 'Obuna topilmadi',
  SUBSCRIPTION_REQUIRED: 'Obuna kerak',
  DEFAULT_PLAN_NOT_CONFIGURED: 'Default tarif sozlanmagan',
  DEFAULT_PLAN_CONFLICT: 'Boshqa tarif allaqachon default sifatida belgilangan',

  // password
  WEAK_PASSWORD: 'Parol kuchsiz',
  PASSWORD_TOO_SHORT: 'Parol juda qisqa',
  INVALID_CURRENT_PASSWORD: "Joriy parol noto'g'ri",
};

export function toApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;
    const code = body?.code ?? 'UNKNOWN_ERROR';
    const rawMessage = Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? error.message);
    return {
      status: error.response?.status ?? 0,
      code,
      message: MESSAGE_KEY_UZ[code] ?? rawMessage ?? 'Xatolik yuz berdi',
      details: body?.details,
      correlationId: body?.correlationId,
    };
  }
  if (error instanceof Error) {
    return {
      status: 0,
      code: 'CLIENT_ERROR',
      message: error.message,
    };
  }
  return {
    status: 0,
    code: 'UNKNOWN_ERROR',
    message: 'Xatolik yuz berdi',
  };
}

export function getErrorMessage(error: unknown): string {
  return toApiError(error).message;
}

export function getErrorCode(error: unknown): string | undefined {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;
    return body?.code;
  }
  return undefined;
}
