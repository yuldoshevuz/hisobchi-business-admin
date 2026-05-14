import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  botTemplatesApi,
  type ListTemplatesQuery,
  type TemplateDetail,
  type TemplateSummary,
  type TemplateVersion,
  type UpdateTemplateBody,
} from '../api/bot-templates.api';

export const botTemplatesKeys = {
  all: () => ['admin', 'bot-templates'] as const,
  list: (filters: ListTemplatesQuery) =>
    ['admin', 'bot-templates', 'list', filters] as const,
  detail: (id: number) => ['admin', 'bot-templates', 'detail', id] as const,
  versions: (id: number) =>
    ['admin', 'bot-templates', 'versions', id] as const,
} as const;

export function useBotTemplates(
  filters: ListTemplatesQuery = {},
): UseQueryResult<TemplateSummary[], Error> {
  return useQuery<TemplateSummary[], Error>({
    queryKey: botTemplatesKeys.list(filters),
    queryFn: () => botTemplatesApi.list(filters),
    placeholderData: (previous) => previous,
  });
}

export function useBotTemplate(
  id: number | null,
): UseQueryResult<TemplateDetail, Error> {
  return useQuery<TemplateDetail, Error>({
    queryKey: botTemplatesKeys.detail(id ?? 0),
    queryFn: () => botTemplatesApi.getById(id as number),
    enabled: id !== null,
  });
}

export function useBotTemplateVersions(
  id: number | null,
): UseQueryResult<TemplateVersion[], Error> {
  return useQuery<TemplateVersion[], Error>({
    queryKey: botTemplatesKeys.versions(id ?? 0),
    queryFn: () => botTemplatesApi.versions(id as number),
    enabled: id !== null,
  });
}

export function useUpdateBotTemplate(): UseMutationResult<
  TemplateDetail,
  Error,
  { id: number; body: UpdateTemplateBody }
> {
  const qc = useQueryClient();
  return useMutation<
    TemplateDetail,
    Error,
    { id: number; body: UpdateTemplateBody }
  >({
    mutationFn: ({ id, body }) => botTemplatesApi.update(id, body),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: botTemplatesKeys.all() });
      void qc.invalidateQueries({ queryKey: botTemplatesKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: botTemplatesKeys.versions(id) });
    },
  });
}

export function useToggleBotTemplate(): UseMutationResult<
  TemplateDetail,
  Error,
  { id: number; isActive: boolean }
> {
  const qc = useQueryClient();
  return useMutation<
    TemplateDetail,
    Error,
    { id: number; isActive: boolean }
  >({
    mutationFn: ({ id, isActive }) => botTemplatesApi.setActive(id, isActive),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: botTemplatesKeys.all() });
      void qc.invalidateQueries({ queryKey: botTemplatesKeys.detail(id) });
    },
  });
}

export function useRestoreBotTemplateVersion(): UseMutationResult<
  TemplateDetail,
  Error,
  { id: number; versionId: number }
> {
  const qc = useQueryClient();
  return useMutation<
    TemplateDetail,
    Error,
    { id: number; versionId: number }
  >({
    mutationFn: ({ id, versionId }) =>
      botTemplatesApi.restoreVersion(id, versionId),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: botTemplatesKeys.all() });
      void qc.invalidateQueries({ queryKey: botTemplatesKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: botTemplatesKeys.versions(id) });
    },
  });
}
