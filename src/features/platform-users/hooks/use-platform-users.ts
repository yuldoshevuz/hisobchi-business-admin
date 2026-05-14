import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  platformUsersApi,
  type GrantSubscriptionBody,
  type ListPlatformUsersQuery,
  type PaginatedPlatformUsers,
  type PlatformUserDetail,
  type PlatformUserSubscription,
} from '../api/platform-users.api';

export const platformUsersKeys = {
  all: () => ['admin', 'platform-users'] as const,
  list: (filters: ListPlatformUsersQuery) =>
    ['admin', 'platform-users', 'list', filters] as const,
  detail: (id: number) => ['admin', 'platform-users', 'detail', id] as const,
} as const;

export function usePlatformUsers(
  filters: ListPlatformUsersQuery,
): UseQueryResult<PaginatedPlatformUsers, Error> {
  return useQuery<PaginatedPlatformUsers, Error>({
    queryKey: platformUsersKeys.list(filters),
    queryFn: () => platformUsersApi.list(filters),
    placeholderData: (previous) => previous,
  });
}

export function usePlatformUser(
  id: number | null,
): UseQueryResult<PlatformUserDetail, Error> {
  return useQuery<PlatformUserDetail, Error>({
    queryKey: platformUsersKeys.detail(id ?? 0),
    queryFn: () => platformUsersApi.getById(id as number),
    enabled: id !== null,
  });
}

export function useSoftDeletePlatformUser(): UseMutationResult<
  void,
  Error,
  number
> {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => platformUsersApi.softDelete(id),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: platformUsersKeys.all() });
      void qc.invalidateQueries({
        queryKey: platformUsersKeys.detail(id),
      });
    },
  });
}

export function useRestorePlatformUser(): UseMutationResult<
  void,
  Error,
  number
> {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => platformUsersApi.restore(id),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: platformUsersKeys.all() });
      void qc.invalidateQueries({
        queryKey: platformUsersKeys.detail(id),
      });
    },
  });
}

export function useGrantSubscription(): UseMutationResult<
  PlatformUserSubscription,
  Error,
  { userId: number; body: GrantSubscriptionBody }
> {
  const qc = useQueryClient();
  return useMutation<
    PlatformUserSubscription,
    Error,
    { userId: number; body: GrantSubscriptionBody }
  >({
    mutationFn: ({ userId, body }) =>
      platformUsersApi.grantSubscription(userId, body),
    onSuccess: (_, { userId }) => {
      void qc.invalidateQueries({
        queryKey: platformUsersKeys.detail(userId),
      });
    },
  });
}

export function useRevokeSubscription(): UseMutationResult<
  void,
  Error,
  { userId: number; subscriptionId: number }
> {
  const qc = useQueryClient();
  return useMutation<
    void,
    Error,
    { userId: number; subscriptionId: number }
  >({
    mutationFn: ({ userId, subscriptionId }) =>
      platformUsersApi.revokeSubscription(userId, subscriptionId),
    onSuccess: (_, { userId }) => {
      void qc.invalidateQueries({
        queryKey: platformUsersKeys.detail(userId),
      });
    },
  });
}
