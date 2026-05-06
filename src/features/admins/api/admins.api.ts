import { client } from '@/lib/api/client';
import type { AdminRole } from '@/stores/auth.store';

export interface PlatformAdmin {
  id: number;
  userId: number;
  role: AdminRole;
  fullName: string;
  phoneNumber: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminRequest {
  phoneNumber: string;
  fullName: string;
  role: AdminRole;
  temporaryPassword: string;
}

export interface UpdateAdminRoleRequest {
  role: AdminRole;
}

export interface ResetAdminPasswordRequest {
  newTemporaryPassword: string;
}

export const adminsApi = {
  list(): Promise<PlatformAdmin[]> {
    return client.get<PlatformAdmin[]>('/users').then((r) => r.data);
  },
  getById(id: number): Promise<PlatformAdmin> {
    return client.get<PlatformAdmin>(`/users/${id}`).then((r) => r.data);
  },
  create(body: CreateAdminRequest): Promise<PlatformAdmin> {
    return client.post<PlatformAdmin>('/users', body).then((r) => r.data);
  },
  updateRole(id: number, body: UpdateAdminRoleRequest): Promise<PlatformAdmin> {
    return client
      .patch<PlatformAdmin>(`/users/${id}/role`, body)
      .then((r) => r.data);
  },
  resetPassword(id: number, body: ResetAdminPasswordRequest): Promise<void> {
    return client
      .patch(`/users/${id}/reset-password`, body)
      .then(() => undefined);
  },
  remove(id: number): Promise<void> {
    return client.delete(`/users/${id}`).then(() => undefined);
  },
};
