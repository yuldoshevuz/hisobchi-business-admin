import { client } from '@/lib/api/client';

export type OrganizationStatus = 'active' | 'suspended' | 'archived';

export interface OrgSummary {
  id: number;
  name: string;
  status: OrganizationStatus;
  ownerUserId: number;
  ownerName: string;
  memberCount: number;
  createdAt: string;
}

export interface OrgOverview extends OrgSummary {
  ownerPhoneNumber: string | null;
  baseCurrency: string;
  locale: string;
  updatedAt: string;
}

export interface PaginatedOrgs {
  data: OrgSummary[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ListOrgsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrganizationStatus;
}

export interface OwnerSubscriptionSnapshot {
  subscription: {
    id: number;
    userId: number;
    planId: number;
    planPriceId: number | null;
    status: 'active' | 'expired' | 'cancelled';
    startDate: string;
    endDate: string | null;
  } | null;
  plan: {
    id: number;
    code: string;
    name: string;
    isActive: boolean;
    isDefault: boolean;
  } | null;
  /** BOOLEAN → true/false; LIMIT → number cap; null → cheksiz. */
  features: Record<string, boolean | number | null>;
}

export const organizationsApi = {
  list(query: ListOrgsQuery = {}): Promise<PaginatedOrgs> {
    return client
      .get<PaginatedOrgs>('/organizations', { params: query })
      .then((r) => r.data);
  },
  getById(id: number): Promise<OrgOverview> {
    return client.get<OrgOverview>(`/organizations/${id}`).then((r) => r.data);
  },
  ownerSubscription(id: number): Promise<OwnerSubscriptionSnapshot> {
    return client
      .get<OwnerSubscriptionSnapshot>(`/organizations/${id}/owner-subscription`)
      .then((r) => r.data);
  },
};
