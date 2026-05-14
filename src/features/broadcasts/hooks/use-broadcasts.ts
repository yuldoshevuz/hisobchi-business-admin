import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  broadcastsApi,
  type AudiencePreview,
  type BroadcastDelivery,
  type BroadcastDetail,
  type BroadcastTargeting,
  type ListBroadcastsQuery,
  type PaginatedBroadcasts,
  type UpsertBroadcastBody,
} from '../api/broadcasts.api';

export const broadcastsKeys = {
  all: () => ['admin', 'broadcasts'] as const,
  list: (q: ListBroadcastsQuery) =>
    ['admin', 'broadcasts', 'list', q] as const,
  detail: (id: number) => ['admin', 'broadcasts', 'detail', id] as const,
  deliveries: (id: number) =>
    ['admin', 'broadcasts', 'deliveries', id] as const,
};

export function useBroadcasts(
  q: ListBroadcastsQuery,
): UseQueryResult<PaginatedBroadcasts, Error> {
  return useQuery({
    queryKey: broadcastsKeys.list(q),
    queryFn: () => broadcastsApi.list(q),
    placeholderData: (previous) => previous,
  });
}

export function useBroadcast(
  id: number | null,
): UseQueryResult<BroadcastDetail, Error> {
  return useQuery({
    queryKey: broadcastsKeys.detail(id ?? 0),
    queryFn: () => broadcastsApi.getById(id as number),
    enabled: id !== null,
  });
}

export function useBroadcastDeliveries(
  id: number | null,
): UseQueryResult<BroadcastDelivery[], Error> {
  return useQuery({
    queryKey: broadcastsKeys.deliveries(id ?? 0),
    queryFn: () => broadcastsApi.deliveries(id as number),
    enabled: id !== null,
    refetchInterval: 5000,
  });
}

export function useCreateBroadcast(): UseMutationResult<
  BroadcastDetail,
  Error,
  UpsertBroadcastBody
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => broadcastsApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: broadcastsKeys.all() });
    },
  });
}

export function useUpdateBroadcast(): UseMutationResult<
  BroadcastDetail,
  Error,
  { id: number; body: UpsertBroadcastBody }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => broadcastsApi.update(id, body),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: broadcastsKeys.all() });
      void qc.invalidateQueries({ queryKey: broadcastsKeys.detail(id) });
    },
  });
}

export function useSendBroadcast(): UseMutationResult<
  BroadcastDetail,
  Error,
  number
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => broadcastsApi.send(id),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: broadcastsKeys.all() });
      void qc.invalidateQueries({ queryKey: broadcastsKeys.detail(id) });
    },
  });
}

export function useCancelBroadcast(): UseMutationResult<
  BroadcastDetail,
  Error,
  number
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => broadcastsApi.cancel(id),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: broadcastsKeys.all() });
      void qc.invalidateQueries({ queryKey: broadcastsKeys.detail(id) });
    },
  });
}

export function usePreviewAudience(): UseMutationResult<
  AudiencePreview,
  Error,
  BroadcastTargeting
> {
  return useMutation({
    mutationFn: (targeting) => broadcastsApi.previewAudience(targeting),
  });
}
