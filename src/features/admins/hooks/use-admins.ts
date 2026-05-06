import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  adminsApi,
  type CreateAdminRequest,
  type PlatformAdmin,
  type ResetAdminPasswordRequest,
  type UpdateAdminRoleRequest,
} from '../api/admins.api';

export const adminsKeys = {
  all: () => ['admin', 'admins'] as const,
  list: () => ['admin', 'admins', 'list'] as const,
  detail: (id: number) => ['admin', 'admins', 'detail', id] as const,
} as const;

export function useAdminsList(): UseQueryResult<PlatformAdmin[], Error> {
  return useQuery<PlatformAdmin[], Error>({
    queryKey: adminsKeys.list(),
    queryFn: () => adminsApi.list(),
  });
}

export function useAdmin(id: number | null): UseQueryResult<PlatformAdmin, Error> {
  return useQuery<PlatformAdmin, Error>({
    queryKey: adminsKeys.detail(id ?? 0),
    queryFn: () => adminsApi.getById(id as number),
    enabled: id !== null,
  });
}

export function useCreateAdmin(): UseMutationResult<
  PlatformAdmin,
  Error,
  CreateAdminRequest
> {
  const qc = useQueryClient();
  return useMutation<PlatformAdmin, Error, CreateAdminRequest>({
    mutationFn: (body) => adminsApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminsKeys.all() });
    },
  });
}

interface UpdateRoleVars {
  id: number;
  body: UpdateAdminRoleRequest;
}

export function useUpdateAdminRole(): UseMutationResult<
  PlatformAdmin,
  Error,
  UpdateRoleVars
> {
  const qc = useQueryClient();
  return useMutation<PlatformAdmin, Error, UpdateRoleVars>({
    mutationFn: ({ id, body }) => adminsApi.updateRole(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminsKeys.all() });
    },
  });
}

interface ResetVars {
  id: number;
  body: ResetAdminPasswordRequest;
}

export function useResetAdminPassword(): UseMutationResult<void, Error, ResetVars> {
  return useMutation<void, Error, ResetVars>({
    mutationFn: ({ id, body }) => adminsApi.resetPassword(id, body),
  });
}

export function useDeleteAdmin(): UseMutationResult<void, Error, number> {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => adminsApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminsKeys.all() });
    },
  });
}
