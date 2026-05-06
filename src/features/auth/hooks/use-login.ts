import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, type LoginRequest, type LoginResponse } from '../api/auth.api';
import { useAuthStore } from '@/stores/auth.store';

export function useLogin(): ReturnType<
  typeof useMutation<LoginResponse, Error, LoginRequest>
> {
  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: (body) => authApi.login(body),
    onSuccess: (data) => {
      useAuthStore
        .getState()
        .setSession(data.accessToken, data.refreshToken, data.admin);
    },
  });
}

export function useLogout(): () => Promise<void> {
  const qc = useQueryClient();
  return async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore — client-side clear is the source of truth either way
    } finally {
      useAuthStore.getState().clear();
      qc.clear();
    }
  };
}
