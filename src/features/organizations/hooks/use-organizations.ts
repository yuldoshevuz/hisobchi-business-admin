import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  organizationsApi,
  type ListOrgsQuery,
  type OrgOverview,
  type OwnerSubscriptionSnapshot,
  type PaginatedOrgs,
} from '../api/organizations.api';

export const orgsKeys = {
  all: () => ['admin', 'orgs'] as const,
  list: (filters: ListOrgsQuery) => ['admin', 'orgs', 'list', filters] as const,
  detail: (id: number) => ['admin', 'orgs', 'detail', id] as const,
  ownerSubscription: (id: number) =>
    ['admin', 'orgs', 'detail', id, 'owner-subscription'] as const,
} as const;

export function useAdminOrgs(
  filters: ListOrgsQuery,
): UseQueryResult<PaginatedOrgs, Error> {
  return useQuery<PaginatedOrgs, Error>({
    queryKey: orgsKeys.list(filters),
    queryFn: () => organizationsApi.list(filters),
    placeholderData: (previous) => previous,
  });
}

export function useAdminOrg(
  id: number | null,
): UseQueryResult<OrgOverview, Error> {
  return useQuery<OrgOverview, Error>({
    queryKey: orgsKeys.detail(id ?? 0),
    queryFn: () => organizationsApi.getById(id as number),
    enabled: id !== null,
  });
}

export function useOwnerSubscription(
  id: number | null,
): UseQueryResult<OwnerSubscriptionSnapshot, Error> {
  return useQuery<OwnerSubscriptionSnapshot, Error>({
    queryKey: orgsKeys.ownerSubscription(id ?? 0),
    queryFn: () => organizationsApi.ownerSubscription(id as number),
    enabled: id !== null,
  });
}
