import { client } from '@/lib/api/client';

export type CategoryType = 'income' | 'expense' | 'product';

export const CATEGORY_TYPES: readonly CategoryType[] = [
  'income',
  'expense',
  'product',
];

export interface SystemCategory {
  id: number;
  code: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
  displayOrder: number;
  isActive: boolean;
  /** Resolved name for the locale the request asked for (Accept-Language). */
  name: string;
  /** The locale that actually produced the `name` (after fallback). */
  locale: string;
}

export interface Translation {
  systemCategoryId: number;
  locale: string;
  name: string;
}

export interface CreateSystemCategoryRequest {
  code: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  displayOrder: number;
  isActive?: boolean;
}

export interface UpdateSystemCategoryRequest {
  type?: CategoryType;
  icon?: string | null;
  color?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpsertTranslationRequest {
  name: string;
}

export const systemCategoriesApi = {
  list(): Promise<SystemCategory[]> {
    return client
      .get<SystemCategory[]>('/system-categories')
      .then((r) => r.data);
  },
  getById(id: number): Promise<SystemCategory> {
    return client
      .get<SystemCategory>(`/system-categories/${id}`)
      .then((r) => r.data);
  },
  create(body: CreateSystemCategoryRequest): Promise<SystemCategory> {
    return client
      .post<SystemCategory>('/system-categories', body)
      .then((r) => r.data);
  },
  update(
    id: number,
    body: UpdateSystemCategoryRequest,
  ): Promise<SystemCategory> {
    return client
      .patch<SystemCategory>(`/system-categories/${id}`, body)
      .then((r) => r.data);
  },
  remove(id: number): Promise<void> {
    return client
      .delete(`/system-categories/${id}`)
      .then(() => undefined);
  },
  listTranslations(id: number): Promise<Translation[]> {
    return client
      .get<Translation[]>(`/system-categories/${id}/translations`)
      .then((r) => r.data);
  },
  upsertTranslation(
    id: number,
    locale: string,
    body: UpsertTranslationRequest,
  ): Promise<Translation> {
    return client
      .put<Translation>(`/system-categories/${id}/translations/${locale}`, body)
      .then((r) => r.data);
  },
  deleteTranslation(id: number, locale: string): Promise<void> {
    return client
      .delete(`/system-categories/${id}/translations/${locale}`)
      .then(() => undefined);
  },
};
