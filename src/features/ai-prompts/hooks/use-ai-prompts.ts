import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  aiPromptsApi,
  type CreateRuleBody,
  type ListPromptsQuery,
  type PromptDetail,
  type PromptSummary,
  type PromptVersion,
  type UpdateAppliesToBody,
  type UpdatePromptBody,
} from '../api/ai-prompts.api';

export const aiPromptsKeys = {
  all: () => ['admin', 'ai-prompts'] as const,
  list: (filters: ListPromptsQuery) =>
    ['admin', 'ai-prompts', 'list', filters] as const,
  detail: (id: number) => ['admin', 'ai-prompts', 'detail', id] as const,
  versions: (id: number) => ['admin', 'ai-prompts', 'versions', id] as const,
} as const;

export function useAiPrompts(
  filters: ListPromptsQuery = {},
): UseQueryResult<PromptSummary[], Error> {
  return useQuery<PromptSummary[], Error>({
    queryKey: aiPromptsKeys.list(filters),
    queryFn: () => aiPromptsApi.list(filters),
    placeholderData: (previous) => previous,
  });
}

export function useAiPrompt(
  id: number | null,
): UseQueryResult<PromptDetail, Error> {
  return useQuery<PromptDetail, Error>({
    queryKey: aiPromptsKeys.detail(id ?? 0),
    queryFn: () => aiPromptsApi.getById(id as number),
    enabled: id !== null,
  });
}

export function useAiPromptVersions(
  id: number | null,
): UseQueryResult<PromptVersion[], Error> {
  return useQuery<PromptVersion[], Error>({
    queryKey: aiPromptsKeys.versions(id ?? 0),
    queryFn: () => aiPromptsApi.versions(id as number),
    enabled: id !== null,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>, id: number): void {
  void qc.invalidateQueries({ queryKey: aiPromptsKeys.all() });
  void qc.invalidateQueries({ queryKey: aiPromptsKeys.detail(id) });
  void qc.invalidateQueries({ queryKey: aiPromptsKeys.versions(id) });
}

export function useUpdateAiPrompt(): UseMutationResult<
  PromptDetail,
  Error,
  { id: number; body: UpdatePromptBody }
> {
  const qc = useQueryClient();
  return useMutation<
    PromptDetail,
    Error,
    { id: number; body: UpdatePromptBody }
  >({
    mutationFn: ({ id, body }) => aiPromptsApi.update(id, body),
    onSuccess: (_, { id }) => invalidate(qc, id),
  });
}

export function useToggleAiPrompt(): UseMutationResult<
  PromptDetail,
  Error,
  { id: number; isActive: boolean }
> {
  const qc = useQueryClient();
  return useMutation<PromptDetail, Error, { id: number; isActive: boolean }>({
    mutationFn: ({ id, isActive }) => aiPromptsApi.setActive(id, isActive),
    onSuccess: (_, { id }) => invalidate(qc, id),
  });
}

export function useRestoreAiPromptVersion(): UseMutationResult<
  PromptDetail,
  Error,
  { id: number; versionId: number }
> {
  const qc = useQueryClient();
  return useMutation<PromptDetail, Error, { id: number; versionId: number }>({
    mutationFn: ({ id, versionId }) =>
      aiPromptsApi.restoreVersion(id, versionId),
    onSuccess: (_, { id }) => invalidate(qc, id),
  });
}

export function useResetAiPromptToDefault(): UseMutationResult<
  PromptDetail,
  Error,
  { id: number }
> {
  const qc = useQueryClient();
  return useMutation<PromptDetail, Error, { id: number }>({
    mutationFn: ({ id }) => aiPromptsApi.resetToDefault(id),
    onSuccess: (_, { id }) => invalidate(qc, id),
  });
}

export function useCreateAiPromptRule(): UseMutationResult<
  PromptDetail,
  Error,
  CreateRuleBody
> {
  const qc = useQueryClient();
  return useMutation<PromptDetail, Error, CreateRuleBody>({
    mutationFn: (body) => aiPromptsApi.createRule(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: aiPromptsKeys.all() });
    },
  });
}

export function useUpdateAiPromptAppliesTo(): UseMutationResult<
  PromptDetail,
  Error,
  { id: number; body: UpdateAppliesToBody }
> {
  const qc = useQueryClient();
  return useMutation<
    PromptDetail,
    Error,
    { id: number; body: UpdateAppliesToBody }
  >({
    mutationFn: ({ id, body }) => aiPromptsApi.updateAppliesTo(id, body),
    onSuccess: (_, { id }) => invalidate(qc, id),
  });
}

export function useDeleteAiPrompt(): UseMutationResult<
  void,
  Error,
  { id: number }
> {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: number }>({
    mutationFn: ({ id }) => aiPromptsApi.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: aiPromptsKeys.all() });
    },
  });
}
