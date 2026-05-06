import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  systemCategoriesApi,
  type CreateSystemCategoryRequest,
  type SystemCategory,
  type Translation,
  type UpdateSystemCategoryRequest,
  type UpsertTranslationRequest,
} from '../api/system-categories.api';

export const systemCategoriesKeys = {
  all: () => ['admin', 'system-categories'] as const,
  list: () => ['admin', 'system-categories', 'list'] as const,
  detail: (id: number) =>
    ['admin', 'system-categories', 'detail', id] as const,
  translations: (id: number) =>
    ['admin', 'system-categories', 'detail', id, 'translations'] as const,
} as const;

export function useSystemCategories(): UseQueryResult<SystemCategory[], Error> {
  return useQuery<SystemCategory[], Error>({
    queryKey: systemCategoriesKeys.list(),
    queryFn: () => systemCategoriesApi.list(),
  });
}

export function useSystemCategory(
  id: number | null,
): UseQueryResult<SystemCategory, Error> {
  return useQuery<SystemCategory, Error>({
    queryKey: systemCategoriesKeys.detail(id ?? 0),
    queryFn: () => systemCategoriesApi.getById(id as number),
    enabled: id !== null,
  });
}

export function useTranslations(
  id: number | null,
): UseQueryResult<Translation[], Error> {
  return useQuery<Translation[], Error>({
    queryKey: systemCategoriesKeys.translations(id ?? 0),
    queryFn: () => systemCategoriesApi.listTranslations(id as number),
    enabled: id !== null,
  });
}

export function useCreateSystemCategory(): UseMutationResult<
  SystemCategory,
  Error,
  CreateSystemCategoryRequest
> {
  const qc = useQueryClient();
  return useMutation<SystemCategory, Error, CreateSystemCategoryRequest>({
    mutationFn: (body) => systemCategoriesApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: systemCategoriesKeys.all() });
    },
  });
}

interface UpdateVars {
  id: number;
  body: UpdateSystemCategoryRequest;
}

export function useUpdateSystemCategory(): UseMutationResult<
  SystemCategory,
  Error,
  UpdateVars
> {
  const qc = useQueryClient();
  return useMutation<SystemCategory, Error, UpdateVars>({
    mutationFn: ({ id, body }) => systemCategoriesApi.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: systemCategoriesKeys.all() });
    },
  });
}

export function useDeleteSystemCategory(): UseMutationResult<
  void,
  Error,
  number
> {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => systemCategoriesApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: systemCategoriesKeys.all() });
    },
  });
}

interface UpsertTranslationVars {
  id: number;
  locale: string;
  body: UpsertTranslationRequest;
}

export function useUpsertTranslation(): UseMutationResult<
  Translation,
  Error,
  UpsertTranslationVars
> {
  const qc = useQueryClient();
  return useMutation<Translation, Error, UpsertTranslationVars>({
    mutationFn: ({ id, locale, body }) =>
      systemCategoriesApi.upsertTranslation(id, locale, body),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({
        queryKey: systemCategoriesKeys.translations(vars.id),
      });
      void qc.invalidateQueries({ queryKey: systemCategoriesKeys.list() });
    },
  });
}

interface DeleteTranslationVars {
  id: number;
  locale: string;
}

export function useDeleteTranslation(): UseMutationResult<
  void,
  Error,
  DeleteTranslationVars
> {
  const qc = useQueryClient();
  return useMutation<void, Error, DeleteTranslationVars>({
    mutationFn: ({ id, locale }) =>
      systemCategoriesApi.deleteTranslation(id, locale),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({
        queryKey: systemCategoriesKeys.translations(vars.id),
      });
    },
  });
}
