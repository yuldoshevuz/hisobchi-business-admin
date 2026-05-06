import { client, publicConfig } from '@/lib/api/client';
import type { AdminProfile } from '@/stores/auth.store';

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  admin: AdminProfile;
}

export const authApi = {
  async login(body: LoginRequest): Promise<LoginResponse> {
    const { data } = await client.post<LoginResponse>(
      '/auth/login',
      body,
      publicConfig(),
    );
    return data;
  },
  async logout(): Promise<void> {
    await client.post('/auth/logout');
  },
};
