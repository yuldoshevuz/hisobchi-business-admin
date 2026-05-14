import { client } from '@/lib/api/client';
import type { SubscriptionStatus } from '@/features/subscriptions/api/subscriptions.api';

export type AdminUserSortField = 'createdAt' | 'updatedAt' | 'fullName';
export type SortDirection = 'asc' | 'desc';

export interface PlatformUserSummary {
  id: number;
  fullName: string;
  phoneNumber: string | null;
  email: string | null;
  telegramId: number | null;
  locale: string;
  primaryOrganizationId: number | null;
  primaryOrganizationName: string | null;
  membershipsCount: number;
  ownedOrganizationsCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PlatformUserMembership {
  memberId: number;
  organizationId: number;
  organizationName: string;
  status: string;
  joinedAt: string;
}

export interface PlatformUserSubscription {
  id: number;
  userId: number;
  planId: number;
  planCode: string;
  planName: string;
  planPriceId: number | null;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string | null;
}

export interface PlatformUserDetail extends PlatformUserSummary {
  memberships: PlatformUserMembership[];
  subscriptions: PlatformUserSubscription[];
  activeSubscription: PlatformUserSubscription | null;
}

export interface PaginatedPlatformUsers {
  data: PlatformUserSummary[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ListPlatformUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  hasTelegram?: boolean;
  hasOrganization?: boolean;
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: AdminUserSortField;
  sortDir?: SortDirection;
}

export interface GrantSubscriptionBody {
  planId: number;
  planPriceId?: number;
}

export const platformUsersApi = {
  list(query: ListPlatformUsersQuery = {}): Promise<PaginatedPlatformUsers> {
    return client
      .get<PaginatedPlatformUsers>('/platform-users', { params: query })
      .then((r) => r.data);
  },
  getById(id: number): Promise<PlatformUserDetail> {
    return client
      .get<PlatformUserDetail>(`/platform-users/${id}`)
      .then((r) => r.data);
  },
  softDelete(id: number): Promise<void> {
    return client.delete(`/platform-users/${id}`).then(() => undefined);
  },
  restore(id: number): Promise<void> {
    return client
      .post(`/platform-users/${id}/restore`)
      .then(() => undefined);
  },
  grantSubscription(
    id: number,
    body: GrantSubscriptionBody,
  ): Promise<PlatformUserSubscription> {
    return client
      .post<PlatformUserSubscription>(`/platform-users/${id}/subscriptions`, body)
      .then((r) => r.data);
  },
  revokeSubscription(id: number, subscriptionId: number): Promise<void> {
    return client
      .delete(`/platform-users/${id}/subscriptions/${subscriptionId}`)
      .then(() => undefined);
  },
};
